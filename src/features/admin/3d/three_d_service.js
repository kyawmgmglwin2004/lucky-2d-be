import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";

async function updateAllNumberDetails(rate, status_limit_amounts, real_limit_amounts) {
    let connection;
    try {
        if (!rate || !status_limit_amounts || !real_limit_amounts) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        const sql = `
            UPDATE three_d_lists 
            SET rate = ?, status_limit_amounts = ?, real_limit_amounts = ?
        `;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [rate, status_limit_amounts, real_limit_amounts]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("set number detail error")
        }

        return StatusCode.OK("All number details updated successfully",);

    } catch (error) {
        console.error("Error updating all number details:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function updateNumberDetailById(id, rate, status_limit_amounts, real_limit_amounts, status) {
    let connection;
    try {
        if (!id) {
            return StatusCode.INVALID_ARGUMENT("ID is required");
        }
        if (!rate || !status_limit_amounts || !real_limit_amounts || status === undefined || status === null) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (rate, limit, status)");
        }

        const sql = `
            UPDATE three_d_lists 
            SET rate = ?, status_limit_amounts = ?, real_limit_amounts = ? , status = ? 
            WHERE id = ?
        `;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [rate, status_limit_amounts, real_limit_amounts, status, id]);

        if (result.affectedRows === 0) {
            return StatusCode.NOT_FOUND("Number detail not found with this ID");
        }

        return StatusCode.OK("Number detail updated successfully",);

    } catch (error) {
        console.error("Error updating number detail by ID:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalAmontForEachNumber() {
    let connection;
    try {
        const sql = "SELECT * FROM three_d_lists";

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql);

        if (result.length === 0) {
            return StatusCode.NOT_FOUND("Don't have in two d lists table");
        }

        return StatusCode.OK("get all three d detail list", result);
    } catch (error) {
        console.error("Error get 3 d detail:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalBetAmount(startDate, endDate, type, session) {
    let connection;
    try {
        if (!startDate || !endDate || !type) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (startDate, endDate, type)");
        }

        // let sql = `
        //     SELECT SUM(amount) as totalAmount 
        //     FROM bets 
        //     WHERE DATE(bet_date) = ? 
        //     AND type = ?
        // `;

        let sql = `
            SELECT SUM(amount) as totalAmount 
            FROM bets 
            WHERE bet_date >= ? 
            AND bet_date < DATE_ADD(?, INTERVAL 1 DAY)
            AND type = ?
        `;

        const params = [startDate, endDate, type];

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);

        const totalAmount = result[0].totalAmount || 0;

        return StatusCode.OK("get total bet amount", {
            totalAmount
        });

    } catch (error) {
        console.error("Error get 2D detail:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalPayoutAmount(startDate, endDate, session) {
    let connection;
    try {
        if (!startDate || !endDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (startDate, endDate)");
        }

        // let sql = `
        //     SELECT SUM(j.payout) as totalPayout
        //     FROM payout_logs b,
        //     JSON_TABLE(b.details, '$[*]' COLUMNS (
        //         payout INT PATH '$.payout'
        //     )) j
        //     WHERE DATE(b.result_date) = ?
        //    AND CHAR_LENGTH(b.number) = 3
        // `;

        let sql = `
            SELECT SUM(j.payout) as totalPayout
            FROM payout_logs b,
            JSON_TABLE(b.details, '$[*]' COLUMNS (
                payout INT PATH '$.payout'
            )) j
            WHERE b.result_date >= ?
            AND b.result_date < DATE_ADD(?, INTERVAL 1 DAY)
            AND CHAR_LENGTH(b.number) = 3
        `;

        const params = [startDate, endDate];

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);
        console.log("result. payout ==", result)

        const totalAmount = result[0].totalPayout ?? 0;

        return StatusCode.OK("get total payout amount", {
            totalAmount
        });

    } catch (error) {
        console.error("Error get total payout amount:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalAgentCommissions(startDate, endDate, session) {
    let connection;
    try {
        if (!startDate || !endDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (startDate, endDate)");
        }

        // let sql = `
        //    SELECT COALESCE(SUM(amount), 0) AS totalAgentCommission
        //     FROM agent_commissions
        //     WHERE DATE(created_at) = ?
        //     AND type = '3d'
        // `;

        let sql = `
          SELECT COALESCE(SUM(amount), 0) AS totalAgentCommission
            FROM agent_commissions
            WHERE created_at >= ?
            AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
            AND type = '3d'
        `;

        const params = [startDate, endDate];

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);
        console.log("result. ==", result)

        const totalAmount = result[0].totalAgentCommission ?? 0;

        return StatusCode.OK("get total agent commission amount", {
            totalAmount
        });

    } catch (error) {
        console.error("Error get total agent commission:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}


async function resetAllNumberCurrentAmount(session) {
    let connection;
    try {

        if (!session || typeof session !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid session");
        }

        const column = session === "first round"
            ? "first_amounts"
            : "second_amounts";
        if (!session || typeof session !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid session");
        }

        const sql = `
            UPDATE three_d_lists 
            SET ${column} = 0
        `;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql);

        if (result.affectedRows === 0) {
            return StatusCode.NOT_FOUND("No number details found to reset");
        }

        return StatusCode.OK("All number current amounts reset successfully");

    } catch (error) {
        console.error("Error resetting all number current amounts:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    updateAllNumberDetails,
    updateNumberDetailById,
    getTotalAmontForEachNumber,
    getTotalBetAmount,
    getTotalPayoutAmount,
    getTotalAgentCommissions,
    resetAllNumberCurrentAmount
}