import StatusCode from "../../helper/statusCode.js";
import Mysql from "../../helper/db.js";

async function betThreeD(user_id, bets, type) {
    let connection;
    try {

        if (!user_id || !type || !bets || bets.length === 0) {
            return StatusCode.INVALID_ARGUMENT("Invalid arguments or no numbers selected or bet session");
        }

        function isBettingAllowed() {
            const now = new Date(
                new Date().toLocaleString("en-US", { timeZone: "Asia/Yangon" })
            );

            const day = now.getDate();
            const hours = now.getHours();
            const minutes = now.getMinutes();

            if (day === 1 || day === 16) {
                if (hours > 14 || (hours === 14 && minutes >= 30)) {
                    return {
                        ok: false,
                        message: "ယနေ့ (1/16) သည် 2:30 PM ကျော်သွားပါပြီ။ မနက်ဖြန်မှ ထိုးနိုင်ပါသည်။"
                    };
                }
            }

            return { ok: true };
        }

        const validation = isBettingAllowed();

        if (!validation.ok) {
            return StatusCode.INVALID_ARGUMENT(validation.message);
        }

        function getSessionByDate(date) {
            const day = date.getDate();

            if (day >= 2 && day <= 16) {
                return "first round";
            } else {
                return "second round";
            }
        }
        const session = getSessionByDate(new Date());

        const seenNumbers = new Set();
        let totalBetAmount = 0;

        for (const item of bets) {
            const numStr = String(item.number);
            const amount = Number(item.amount);

            if (isNaN(amount)) {
                return StatusCode.INVALID_ARGUMENT(`Invalid amount for number ${item.number}`);
            }

            if (amount <= 0) {
                return StatusCode.INVALID_ARGUMENT(`ထိုးငွေသည် 0 ထက်ကြီးရပါမည် (Number: ${item.number})`);
            }
            if (!Number.isInteger(amount)) {
                return StatusCode.INVALID_ARGUMENT(`Amount must be integer (Number: ${item.number})`);
            }


            if (seenNumbers.has(numStr)) {
                return StatusCode.INVALID_ARGUMENT(`Duplicate number found: ${item.number}. Please remove duplicates.`);
            }

            seenNumbers.add(numStr);
            totalBetAmount += Number(item.amount);
        }

        connection = await Mysql.getConnection();

        const getBalanceSql = `SELECT balance FROM wallets WHERE user_id = ?`;
        const [walletRows] = await connection.query(getBalanceSql, [user_id]);

        if (walletRows.length === 0) {
            return StatusCode.NOT_FOUND("User wallet not found");
        }

        const currentBalance = walletRows[0].balance;

        if (totalBetAmount > currentBalance) {
            return StatusCode.INVALID_ARGUMENT(`လက်ကျန်ငွေ မလုံလောက်ပါ`);
        }

        await connection.beginTransaction();

        const numbersToCheck = bets.map(b => String(b.number));
        const placeholders = numbersToCheck.map(() => '?').join(',');

        const checkLimitSql = `SELECT numbers, amounts, status_limit_amounts FROM three_d_lists WHERE numbers IN (${placeholders})`;

        console.log("Checking Limit SQL:", checkLimitSql, numbersToCheck);

        const [limitRows] = await connection.query(checkLimitSql, numbersToCheck);
        console.log("Limit Rows:", limitRows);
        const listData = {};
        limitRows.forEach(row => {
            listData[String(row.numbers)] = {
                current: row.amounts,
                limit: row.status_limit_amount
            };
        });

        for (const item of bets) {
            const numKey = String(item.number);
            const data = listData[numKey];

            if (!data) {
                await connection.rollback();
                console.log(`Number ${numKey} not found in DB. Available keys:`, Object.keys(listData));
                return StatusCode.INVALID_ARGUMENT(`Number ${item.number} is invalid or not found.`);
            }

            if (data.current + item.amount > data.limit) {
                await connection.rollback();
                return StatusCode.INVALID_ARGUMENT(`Number ${item.number} မှာ ထိုးခွင့် ပြည့်သွားပါပြီ (Limit: ${data.limit})`);
            }
        }

        await connection.query(
            `UPDATE wallets SET balance = balance - ? WHERE user_id = ?`,
            [totalBetAmount, user_id]
        );

        const batchId = "BATCH_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

        const insertBetSql = `INSERT INTO bets (batch_id, user_id, number, amount, type, session,  bet_date) 
                              VALUES (?, ?, ?, ?, ?, ?, CURDATE())`;

        const updateListSql = `UPDATE three_d_lists SET amounts = amounts + ? WHERE numbers = ?`;

        for (const item of bets) {
            await connection.query(insertBetSql, [
                batchId,
                user_id,
                item.number,
                item.amount,
                type,
                session
            ]);

            await connection.query(updateListSql, [item.amount, item.number]);
        }

        await connection.commit();

        return StatusCode.OK("Bet placed successfully", { batch_id: batchId, total_deducted: totalBetAmount });

    } catch (error) {
        if (connection) await connection.rollback();

        console.error("Error placing bet:", error);
        return StatusCode.UNKNOWN("Database error");
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
        nl.amounts
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
                DATE_FORMAT(bet_date, '%Y-%m-%d') AS bet_date,
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

export default {
    betThreeD,
    threeDList,
    getThreeDBetHistoryByUserId
}