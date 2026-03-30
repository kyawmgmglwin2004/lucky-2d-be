import StatusCode from "../../helper/statusCode.js";
import Mysql from "../../helper/db.js";

async function autoPayout(winningNumber, session, resultDate) {
    let connection;
    try {
        if (!winningNumber || !session || !resultDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        connection = await Mysql.getConnection();
        await connection.beginTransaction();

        // 1. Get Rate
        const sql = `SELECT rate FROM two_d_lists WHERE numbers = ? LIMIT 1`;
        const [rateResult] = await connection.query(sql, [winningNumber]);

        if (!rateResult || rateResult.length === 0) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("Winning number not found");
        }

        const rate = rateResult[0].rate;

        const sql1 = `SELECT id, user_id, amount 
             FROM bets 
             WHERE number = ? 
             AND session = ? 
             AND DATE(bet_date) = ? 
             AND is_paid = 0`;

        const [bets] = await connection.query(sql1, [winningNumber, session, resultDate]);

        if (!bets || bets.length === 0) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("No winning bets");
        }

        const payoutDetails = [];

        for (const bet of bets) {
            const payout = bet.amount * rate;

            await connection.query(
                `UPDATE wallets SET balance = balance + ? WHERE user_id = ?`,
                [payout, bet.user_id]
            );

            await connection.query(
                `UPDATE bets SET is_paid = 1 WHERE id = ?`,
                [bet.id]
            );

            payoutDetails.push({
                betId: bet.id,
                userId: bet.user_id,
                amount: bet.amount,
                payout: payout,
                rate: rate
            });
        }

        await connection.commit();


        return StatusCode.OK(`Auto payout completed for number ${winningNumber}`, {
            totalPaid: bets.length,
            details: payoutDetails
        });

    } catch (error) {
        console.error("Error in auto payout:", error);
        if (connection) await connection.rollback();
        return StatusCode.UNKNOWN("Database error during auto payout");
    } finally {
        if (connection) connection.release();
    }
}


async function recordPayoutLog(winningNumber, session, resultDate, totalPaid, details) {

    let connection;
    try {
        connection = await Mysql.getConnection();

        const detailsJson = details ? JSON.stringify(details) : null;

        let sql = `INSERT INTO payout_logs (number, session, result_date, total_paid, details) 
             VALUES (?, ?, ?, ?, ?)`;

        const [insertLogs] = await connection.query(sql, [winningNumber, session, resultDate, totalPaid, detailsJson]);

        if (insertLogs.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to record payout log");
        }

        return StatusCode.OK("Payout log recorded successfully");

    } catch (error) {
        console.error("Error recording payout log:", error);
        return StatusCode.UNKNOWN("Database error during payout log recording");
    } finally {
        if (connection) connection.release();
    }
}

async function runAutoPayoutService(winningNumber, session, resultDate) {
    try {
        const alreadyProcessed = await isResultProcessed(winningNumber, session, resultDate);

        if (alreadyProcessed) {
            return StatusCode.OK("Result already processed");
        }

        const payoutResult = await autoPayout(winningNumber, session, resultDate);

        if (payoutResult.code !== 200) {
            return StatusCode.UNKNOWN(`Auto payout failed: ${payoutResult.message}`);
        }

        await recordPayoutLog(
            winningNumber,
            session,
            resultDate,
            payoutResult.data.totalPaid,
            payoutResult.data.details
        );

        return StatusCode.OK(
            `Auto payout completed for ${winningNumber} (${session})`,
            { totalPaid: payoutResult.data.totalPaid }
        );

    } catch (err) {
        console.error("Error in runAutoPayoutService:", err);
        return StatusCode.UNKNOWN("Server error during auto payout");
    }
}

async function isResultProcessed(winningNumber, session, resultDate) {
    let connection;
    try {
        connection = await Mysql.getConnection();

        let sql = `SELECT id FROM payout_logs 
             WHERE number = ? AND session = ? AND result_date = ?`;

        const [rows] = await connection.query(sql, [winningNumber, session, resultDate]);

        return rows.length > 0;
    } catch (error) {
        console.error("Error checking result processed:", error);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

export default {
    autoPayout,
    isResultProcessed,
    recordPayoutLog,
    runAutoPayoutService
};