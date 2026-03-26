import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";

async function autoPayout(winningNumber, session, resultDate) {
    let connection;
    try {
        if (!winningNumber || !session || !resultDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (winningNumber, session, resultDate)");
        }

        connection = await Mysql.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // 1. Get payout rate
        const [rateResult] = await connection.query(
            "SELECT rate FROM two_d_lists WHERE numbers = ? LIMIT 1",
            [winningNumber]
        );

        if (!rateResult || rateResult.length === 0) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("Winning number not found in two_d_lists");
        }

        const rate = rateResult[0].rate;

        const [bets] = await connection.query(
            `SELECT id, user_id, amount 
             FROM bets 
             WHERE number = ? 
             AND session = ? 
             AND bet_date = ? 
             AND is_paid = 0`,
            [winningNumber, session, resultDate]
        );

        if (!bets || bets.length === 0) {
            await connection.rollback();
            return StatusCode.NOT_FOUND("No winning bets for this number/session/date");
        }

        for (const bet of bets) {
            const payout = bet.amount * rate;

            await connection.query(
                `UPDATE wallets 
                 SET balance = balance + ? 
                 WHERE user_id = ?`,
                [payout, bet.user_id]
            );

            await connection.query(
                `UPDATE bets 
                 SET is_paid = 1 
                 WHERE id = ?`,
                [bet.id]
            );
        }

        await connection.commit();

        return StatusCode.OK(`Auto payout completed for number ${winningNumber}`, { totalPaid: bets.length });

    } catch (error) {
        console.error("Error in auto payout:", error);
        if (connection) await connection.rollback();
        return StatusCode.UNKNOWN("Database error during auto payout");
    } finally {
        if (connection) connection.release();
    }
}

async function isResultProcessed(winningNumber, session, resultDate) {
    let connection;
    try {
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(
            `SELECT id FROM payout_logs 
             WHERE number = ? AND session = ? AND result_date = ?`,
            [winningNumber, session, resultDate]
        );
        return rows.length > 0;
    } catch (error) {
        console.error("Error checking result processed:", error);
        return false;
    } finally {
        if (connection) connection.release();
    }
}

async function recordPayoutLog(winningNumber, session, resultDate, totalPaid) {
    let connection;
    try {
        connection = await Mysql.getConnection();
        await connection.query(
            `INSERT INTO payout_logs (number, session, result_date, total_paid) 
             VALUES (?, ?, ?, ?)`,
            [winningNumber, session, resultDate, totalPaid]
        );
    } catch (error) {
        console.error("Error recording payout log:", error);
    } finally {
        if (connection) connection.release();
    }
}

export default {
    autoPayout,
    isResultProcessed,
    recordPayoutLog,
};