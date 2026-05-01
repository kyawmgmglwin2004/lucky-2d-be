import StatusCode from "../../helper/statusCode.js";
import Mysql from "../../helper/db.js";
import { DateTime } from "luxon";


async function betThreeD(user_id, bets, type) {
    let connection;

    const safeQuery = async (conn, sql, params, errorMsg) => {
        const [result] = await conn.query(sql, params);
        if (!result || result.affectedRows === 0) {
            throw new Error(errorMsg);
        }
        return result;
    };

    try {
        if (!user_id || !type || !bets || bets.length === 0) {
            return StatusCode.INVALID_ARGUMENT("Invalid arguments");
        }

        let totalBetAmount = 0;
        const seenNumbers = new Set();

        for (const item of bets) {
            const numStr = String(item.number);
            const amount = Number(item.amount);

            if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
                return StatusCode.INVALID_ARGUMENT(`Invalid amount ${item.number}`);
            }

            if (seenNumbers.has(numStr)) {
                return StatusCode.INVALID_ARGUMENT(`Duplicate number ${item.number}`);
            }

            seenNumbers.add(numStr);
            totalBetAmount += amount;
        }

        connection = await Mysql.getConnection();

        const [walletRows] = await connection.query(
            `SELECT balance FROM wallets WHERE user_id = ?`,
            [user_id]
        );

        if (walletRows.length === 0) {
            return StatusCode.NOT_FOUND("Wallet not found");
        }

        if (totalBetAmount > walletRows[0].balance) {
            return StatusCode.INVALID_ARGUMENT("Balance not enough");
        }

        const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Yangon" })
        );

        const currentMonth = now.getMonth() + 1;

        const session = (now.getDate() >= 1 && now.getDate() <= 16)
            ? "first round"
            : "second round";

        const [statusRows] = await connection.query(
            `SELECT * FROM time_status WHERE type = ? AND month = ? AND session = ?`,
            [type, currentMonth, session]
        );

        if (statusRows.length === 0) {
            return StatusCode.NOT_FOUND("3D not open");
        }

        const status = statusRows[0];

        console.log("status", status.status);
        console.log(("open_time", status.monthly_open_time));
        console.log("close_time", status.monthly_close_time)

        if (status.status !== 1 ||
            now < new Date(status.monthly_open_time) ||
            now > new Date(status.monthly_close_time)
        ) {
            return StatusCode.INVALID_ARGUMENT("Betting closed");
        }

        const [userRows] = await connection.query(
            `SELECT id, refer_code FROM users WHERE id = ?`,
            [user_id]
        );

        const user = userRows[0];
        let agent = null;

        if (user.refer_code) {
            const [agentRows] = await connection.query(
                `SELECT id, three_d_percent FROM users WHERE agent_code = ?`,
                [user.refer_code]
            );

            if (agentRows.length > 0 && agentRows[0].id !== user_id) {
                agent = agentRows[0];
            } else {
                return StatusCode.INVALID_ARGUMENT("Invalid agent");
            }
        }

        await connection.beginTransaction();

        const numbers = bets.map(b => String(b.number));
        const placeholders = numbers.map(() => '?').join(',');

        const [limitRows] = await connection.query(
            `SELECT numbers, first_amounts, second_amounts, status, real_limit_amounts 
             FROM three_d_lists 
             WHERE numbers IN (${placeholders}) FOR UPDATE`,
            numbers
        );

        const listData = {};
        limitRows.forEach(row => {
            listData[row.numbers] = row;
        });

        for (const item of bets) {
            const data = listData[String(item.number)];

            if (!data) throw new Error(`Number ${item.number} invalid`);
            if (data.status === 0) throw new Error(`Number ${item.number} closed`);
            const currentAmount = session === "first round"
                ? data.first_amounts
                : data.second_amounts;

            if (currentAmount + item.amount > data.real_limit_amounts) {
                throw new Error(`Number ${item.number} limit exceeded`);
            }
        }

        await safeQuery(
            connection,
            `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
            [totalBetAmount, user_id],
            "Wallet deduct failed"
        );

        const batchId = "BATCH_" + Date.now();

        for (const item of bets) {
            await safeQuery(
                connection,
                `INSERT INTO bets (batch_id, user_id, number, amount, type, session, bet_date)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [batchId, user_id, item.number, item.amount, type, session],
                "Bet insert failed"
            );

            const column = session === "first round" ? "first_amounts" : "second_amounts";

            await safeQuery(
                connection,
                `UPDATE three_d_lists SET ${column} = ${column} + ? WHERE numbers = ?`,
                [item.amount, item.number],
                "List update failed"
            );
        }

        if (agent) {
            if (!agent.three_d_percent || agent.three_d_percent <= 0) {
                throw new Error("Invalid agent percent");
            }

            const percent = Number(agent.three_d_percent);
            const commission = (totalBetAmount * percent) / 100;

            await safeQuery(
                connection,
                `INSERT INTO agent_commissions 
                (agent_id, user_id, batch_id, amount, type, session,  three_d_percent, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [agent.id, user_id, batchId, commission, "3d", session, percent],
                "Commission insert failed"
            );

            await safeQuery(
                connection,
                `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
                [commission, agent.id],
                "Agent wallet update failed"
            );
        }

        await connection.commit();

        return StatusCode.OK("Bet success", {
            batch_id: batchId,
            total: totalBetAmount
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Error placing bet:", error);
        return StatusCode.UNKNOWN(error.message);
    } finally {
        if (connection) connection.release();
    }
}
async function threeDList(category_key) {
    let connection;
    try {
        let sql = `
    SELECT 
        t.id,
        t.category_key,
        jt.number,
        nl.rate,
        nl.first_amounts,
        nl.second_amounts,
        nl.status
    FROM three_d_master_sets t
    JOIN JSON_TABLE(
        t.numbers,   
        '$[*]' COLUMNS (
            number VARCHAR(3) PATH '$'
        )
    ) AS jt
    LEFT JOIN three_d_lists nl 
        ON nl.numbers = jt.number COLLATE utf8mb4_unicode_ci
    WHERE 1=1
`;
        let params = [];

        if (category_key) {
            sql += " AND t.category_key = ?";
            params.push(category_key);
        }

        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, params);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("No 2D sets found");
        }

        return StatusCode.OK("All 2D sets with number details", rows);
    } catch (error) {
        console.error("Error fetching 3D sets:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getThreeDBetHistoryByUserId(userId, page, limit, filterdate = null, session, type) {
    let connection;
    try {
        if (!userId) {
            return StatusCode.INVALID_ARGUMENT("Invalid or missing userId");
        }

        const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
        const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (currentPage - 1) * itemsPerPage;

        connection = await Mysql.getConnection();


        let whereConditions = ['user_id = ?'];
        let queryParams = [userId];

        if (session != null && session != "" && session != undefined) {
            whereConditions.push('session = ?');
            queryParams.push(session);
        }

        if (type != null && type != "" && type != undefined) {
            whereConditions.push('type = ?');
            queryParams.push(type);
        }

        if (filterdate) {
            whereConditions.push('DATE(bet_date) = ?');
            queryParams.push(filterdate);
        }

        const whereClause = whereConditions.join(' AND ');

        const countSql = `SELECT COUNT(*) as total FROM bets WHERE ${whereClause}`;
        const [countResult] = await connection.query(countSql, queryParams);
        const totalRecords = countResult[0].total;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        const sql = `
            SELECT 
                id,
                user_id,
                batch_id,
                number,
                type,
                amount,
                DATE_FORMAT(bet_date, '%Y-%m-%d %H:%i:%s') AS bet_date,
                session,
                is_paid
            FROM bets 
            WHERE ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(itemsPerPage, offset);

        const [result] = await connection.query(sql, queryParams);

        if (result.length === 0) {
            return StatusCode.NOT_FOUND("3d bets list not found for this user");
        }

        const responseData = {
            data: result,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalRecords: totalRecords,
                itemsPerPage: itemsPerPage,
                filterdate: filterdate || "All"
            }
        };

        return StatusCode.OK("3d bet history", responseData);

    } catch (error) {
        console.error("Error get 3d bet history:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getWinnerList(page = 1, limit = 10, filterdate = null, type) {
    let connection;

    try {
        const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
        const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (currentPage - 1) * itemsPerPage;

        connection = await Mysql.getConnection();

        let whereConditions = ['b.is_paid = 1', 'b.type = ?'];
        let queryParams = [type];

        if (filterdate) {
            whereConditions.push('DATE(b.bet_date) = ?');
            queryParams.push(filterdate);
        }

        const whereClause = "WHERE " + whereConditions.join(' AND ');

        const sql = `
            SELECT 
                b.id,
                b.user_id,
                u.name AS user_name,
                u.phone AS phone,
                b.batch_id,
                b.number,
                b.type,
                b.amount,
                DATE_FORMAT(b.bet_date, '%Y-%m-%d') AS bet_date,
                b.session,
                b.is_paid,
                COUNT(*) OVER() AS totalRecords
            FROM bets b
            LEFT JOIN users u ON b.user_id = u.id
            ${whereClause}
            ORDER BY b.id DESC
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...queryParams, itemsPerPage, offset];
        const [rows] = await connection.query(sql, finalParams);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("2d winner list not found");
        }

        const totalRecords = rows[0].totalRecords;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        const cleanData = rows.map(({ totalRecords, ...rest }) => rest);

        const responseData = {
            data: cleanData,
            pagination: {
                currentPage,
                totalPages,
                totalRecords,
                itemsPerPage,
                filterDate: filterdate || "All"
            }
        };

        return StatusCode.OK("2d winner list", responseData);

    } catch (error) {
        console.error("Error get 2d winner list:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    betThreeD,
    threeDList,
    getThreeDBetHistoryByUserId,
    getWinnerList
}