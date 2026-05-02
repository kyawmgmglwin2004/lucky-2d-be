import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";
import threeDService from "../3d/three_d_service.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

async function create3DResult(result_numbers, month, result_round) {
    let connection;
    try {
        const result_date = dayjs()
            .tz("Asia/Yangon")
            .format("YYYY-MM-DD");

        if (!result_numbers || typeof result_numbers !== "string" || !result_round || typeof result_round !== "string" || !result_date || !month) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        function generateRoundNumbers(num) {
            const str = num.toString().padStart(3, '0');

            if (str.length !== 3) return [];

            const digits = str.split('');
            const permutations = new Set();

            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    for (let k = 0; k < 3; k++) {
                        if (i !== j && j !== k && i !== k) {
                            const val = digits[i] + digits[j] + digits[k];
                            permutations.add(val);
                        }
                    }
                }
            }

            permutations.delete(str);

            const plusOne = (Number(str) + 1).toString().padStart(3, '0');
            const minusOne = (Number(str) - 1).toString().padStart(3, '0');

            permutations.add(plusOne);
            permutations.add(minusOne);

            return Array.from(permutations);
        }

        connection = await Mysql.getConnection();

        const sql1 = `SELECT * FROM three_d_results WHERE result_date = ? AND result_round = ? AND month = ?`;
        const [rows] = await connection.query(sql1, [result_date, result_round, month]);
        if (rows.length > 0) {
            return StatusCode.INVALID_ARGUMENT("3D result already exists");
        }

        const roundNumbers = generateRoundNumbers(result_numbers);

        const sql = `INSERT INTO three_d_results
                    (result_numbers, month, result_date, result_round, round_numbers)
                    VALUES (?, ?, ?, ?, ?)`;
        const [result] = await connection.query(sql, [result_numbers, month, result_date, result_round, JSON.stringify(roundNumbers)]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("3D result creation failed");
        }

        runAutoPayoutService(result_numbers, roundNumbers, result_round, month, result_date)
            .then(res => console.log("Payout success:", res.message))
            .catch(err => console.error("Payout error:", err));

        return StatusCode.OK("Result created. Payout processing...", { id: result.insertId });

    } catch (error) {
        console.error("Error creating 3D result:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function get3DResult(page = 1, limit = 10, filterDate = null) {
    let connection;

    try {
        const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
        const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (currentPage - 1) * itemsPerPage;

        connection = await Mysql.getConnection();

        let whereConditions = [];
        let queryParams = [];

        if (filterDate) {
            whereConditions.push('DATE(result_date) = ?');
            queryParams.push(filterDate);
        }

        const whereClause = whereConditions.length > 0
            ? "WHERE " + whereConditions.join(" AND ")
            : "";

        const sql = `
            SELECT 
                id,
                result_numbers,
                result_round,
                round_numbers,
                DATE_FORMAT(result_date, '%Y-%m-%d') AS result_date,
                COUNT(*) OVER() AS totalRecords
            FROM three_d_results
            ${whereClause}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...queryParams, itemsPerPage, offset];
        const [rows] = await connection.query(sql, finalParams);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("3D results not found");
        }

        const totalRecords = rows[0].totalRecords;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        const cleanData = rows.map(({ totalRecords, ...rest }) => rest);

        const responseData = {
            data: cleanData,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalRecords: totalRecords,
                itemsPerPage: itemsPerPage,
                filterDate: filterDate || "All"
            }
        };

        return StatusCode.OK("3D result fetched successfully", responseData);

    } catch (error) {
        console.error("Error fetching 3D result:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function isResultProcessed(winningNumber, session, resultDate) {
    let connection;
    try {
        if (!winningNumber || !session || !resultDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }
        console.log("winningNumber : ", winningNumber);
        console.log("session : ", session);
        console.log("resultDate : ", resultDate);
        connection = await Mysql.getConnection();
        let sql = `SELECT id FROM payout_logs WHERE number = ? AND session = ? AND result_date = ?`;
        const [rows] = await connection.query(sql, [winningNumber, session, resultDate]);
        return rows.length > 0;
    } catch (error) {
        console.error("Error checking if result is processed:", error);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

async function autoPayout(resultNumber, roundNumbers, session, month, resultDate) {
    let connection;
    try {
        if (!resultNumber || !session || !month) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        connection = await Mysql.getConnection();
        await connection.beginTransaction();

        const payoutDetails = [];
        let totalPaidCount = 0;

        const [mainRateResult] = await connection.query(
            `SELECT rate FROM three_d_lists WHERE numbers = ? LIMIT 1`,
            [resultNumber]
        );

        if (!mainRateResult.length) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("Don't have this number in three d lists");
        }
        const mainRate = mainRateResult[0].rate;

        const [statusRows] = await connection.query(
            `
                SELECT monthly_open_time, monthly_close_time
                FROM time_status
                WHERE type='3d'
                AND month = ?
                AND session = ?
                LIMIT 1
                `,
            [month, session]
        );
        if (!statusRows.length) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("Time status not found");
        }

        const openTime = statusRows[0].monthly_open_time;
        const closeTime = statusRows[0].monthly_close_time;

        const [mainBets] = await connection.query(
            `
                SELECT id,user_id,amount
                FROM bets
                WHERE number = ?
                AND session = ?
                AND bet_date >= ?
                AND bet_date < ?
                AND is_paid = 0
                `,
            [resultNumber, session, openTime, closeTime]
        );

        for (const bet of mainBets) {
            const payout = bet.amount * mainRate;
            await connection.query(`UPDATE wallets SET balance = balance + ? WHERE user_id = ?`, [payout, bet.user_id]);
            await connection.query(`UPDATE bets SET is_paid = 1 WHERE id = ?`, [bet.id]);
            payoutDetails.push({ betId: bet.id, userId: bet.user_id, number: resultNumber, amount: bet.amount, payout, rate: mainRate });
            totalPaidCount++;
        }

        if (roundNumbers && roundNumbers.length > 0) {
            for (const roundNum of roundNumbers) {
                const [roundRateResult] = await connection.query(
                    `SELECT round_rate FROM three_d_lists WHERE numbers = ? LIMIT 1`,
                    [roundNum]
                );

                if (!roundRateResult.length || !roundRateResult[0].round_rate) {
                    await connection.rollback();
                    return StatusCode.NOT_FOUND("Don't have this number in three d lists");
                }
                const roundRate = roundRateResult[0].round_rate;
                console.log("roundRate : ", roundRate);

                const [roundBets] = await connection.query(
                    `SELECT id, user_id, 
                    amount FROM bets 
                    WHERE number = ? 
                    AND session = ? 
                    AND bet_date >= ?
                    AND bet_date < ?
                    AND is_paid = 0`,
                    [roundNum, session, openTime, closeTime]
                );

                console.log("roundBets : ", roundBets);

                for (const bet of roundBets) {
                    const payout = bet.amount * roundRate;
                    await connection.query(`UPDATE wallets SET balance = balance + ? WHERE user_id = ?`, [payout, bet.user_id]);
                    await connection.query(`UPDATE bets SET is_paid = 1 WHERE id = ?`, [bet.id]);
                    // only store in details, not in main payout_logs.number
                    payoutDetails.push({ betId: bet.id, userId: bet.user_id, number: roundNum, amount: bet.amount, payout, rate: roundRate });
                    totalPaidCount++;
                }
            }
        }

        await connection.commit();

        return StatusCode.OK(`Auto payout completed for ${resultNumber} (${session})`, {
            totalPaid: totalPaidCount,
            details: payoutDetails
        });

    } catch (err) {
        console.error("Error in auto payout:", err);
        if (connection) await connection.rollback();
        return StatusCode.UNKNOWN("Database error during auto payout");
    } finally {
        if (connection) connection.release();
    }
}

async function recordPayoutLog(mainNumber, session, resultDate, totalPaid, details) {
    let connection;
    try {
        if (!mainNumber || !session || !resultDate || totalPaid == null || details == null) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        connection = await Mysql.getConnection();
        const detailsJson = details ? JSON.stringify(details) : null;
        const sql = `
            INSERT INTO payout_logs (number, session, result_date, total_paid, details) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await connection.query(sql, [mainNumber, session, resultDate, totalPaid, detailsJson]);
        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to record payout log");
        }
        return StatusCode.OK("Payout log recorded successfully");
    } catch (error) {
        console.error("Error recording payout log:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function runAutoPayoutService(winningNumber, roundNumbers, session, month, resultDate) {
    try {
        const alreadyProcessed = await isResultProcessed(winningNumber, session, resultDate);
        if (alreadyProcessed) {
            return StatusCode.OK("Result alreay processed");
        }

        const payoutResult = await autoPayout(winningNumber, roundNumbers, session, month, resultDate);
        if (payoutResult.code !== 200) {
            return StatusCode.UNKNOWN("Auto payout failed: " + payoutResult.message);
        }

        const recordResult = await recordPayoutLog(winningNumber, session, resultDate, payoutResult.data.totalPaid, payoutResult.data.details);

        if (recordResult.code !== 200) {
            console.log("Record payout log failed : ", recordResult);
            throw new Error("Record payout log failed");
        }

        const resetResult = await threeDService.resetAllNumberCurrentAmount(session);

        if (resetResult.code !== 200) {
            throw new Error("Reset failed after payout");
        }

        return StatusCode.OK(`Auto payout completed for ${winningNumber} (${session})`, { totalPaid: payoutResult.data.totalPaid });

    } catch (error) {
        console.error("Error in auto payout service:", error);
        return StatusCode.UNKNOWN("Database error");
    }

}

export default {
    create3DResult,
    get3DResult,
    runAutoPayoutService
}