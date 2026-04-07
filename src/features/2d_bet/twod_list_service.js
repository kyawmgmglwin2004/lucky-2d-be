import StatusCode from "../../helper/statusCode.js";
import Mysql from "../../helper/db.js";

async function twoDList(category_key, page, limit) {
    let connection;
    try {
        console.log("reach service");

        const offset = (page - 1) * limit;

        let sql = `
            SELECT 
                t.id,
                t.category_key,
                jt.number,
                nl.rate,
                nl.amounts
            FROM two_d_master_sets t
            JOIN JSON_TABLE(
                t.numbers,   
                '$[*]' COLUMNS (
                    number VARCHAR(2) PATH '$'
                )
            ) AS jt
            LEFT JOIN two_d_lists nl 
                ON nl.numbers = jt.number
            WHERE 1=1
        `;

        let params = [];

        if (category_key) {
            sql += " AND t.category_key = ?";
            params.push(category_key);
        }

        sql += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, params);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("No 2D sets found");
        }

        return StatusCode.OK("All 2D sets with number details", rows);

    } catch (error) {
        console.error("Error fetching 2D sets:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function createNewNumbersList(category_key, numbers) {
    let connection;
    try {

        const numbersJson = Array.isArray(numbers) ? JSON.stringify(numbers) : numbers;

        const sql = "INSERT INTO two_d_master_sets (category_key,  numbers) VALUES (?, ?)";

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [category_key, numbersJson]);

        return StatusCode.OK("2D set created successfully", { id: result.insertId });

    } catch (error) {
        console.error("Error creating 2D set:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function betTwoD(user_id, bets, type, session) {
    console.log(user_id, bets, type);
    let connection;
    try {

        if (!user_id || !type || !bets || bets.length === 0 || !session || typeof session !== "string") {
            return StatusCode.INVALID_ARGUMENT("Invalid arguments or no numbers selected or bet session");
        }
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

        const checkLimitSql = `SELECT numbers, amounts, status_limit_amount FROM two_d_lists WHERE numbers IN (${placeholders})`;

        console.log("Checking Limit SQL:", checkLimitSql, numbersToCheck);

        const [limitRows] = await connection.query(checkLimitSql, numbersToCheck);

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

        const updateListSql = `UPDATE two_d_lists SET amounts = amounts + ? WHERE numbers = ?`;

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

async function betTwoDListByUserId(userId, page = 1, limit = 10, filterDate = null) {
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

        if (filterDate) {
            whereConditions.push('DATE(bet_date) = ?');
            queryParams.push(filterDate);
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
            return StatusCode.NOT_FOUND("2d bets list not found for this user");
        }

        const responseData = {
            data: result,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalRecords: totalRecords,
                itemsPerPage: itemsPerPage,
                filterDate: filterDate || "All"
            }
        };

        return StatusCode.OK("2d bet history", responseData);

    } catch (error) {
        console.error("Error get 2d bet history:", error);
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
    twoDList,
    createNewNumbersList,
    betTwoD,
    betTwoDListByUserId,
    getWinnerList
};