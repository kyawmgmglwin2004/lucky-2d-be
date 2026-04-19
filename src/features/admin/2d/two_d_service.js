import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";

async function updateAllNumberDetails(rate, status_limit_amount, realLimitAmount) {
    let connection;
    try {
        if (!rate || !status_limit_amount || !realLimitAmount) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }

        const sql = `
            UPDATE two_d_lists 
            SET rate = ?, status_limit_amount = ?, real_limit_amount = ?
        `;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [rate, status_limit_amount, realLimitAmount]);

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


async function updateNumberDetailById(id, rate, status_limit_amount, real_limit_amount, status) {
    let connection;
    try {
        if (!id) {
            return StatusCode.INVALID_ARGUMENT("ID is required");
        }
        if (!rate || !status_limit_amount || !real_limit_amount || status === undefined || status === null) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (rate, limit, status)");
        }

        const sql = `
            UPDATE two_d_lists 
            SET rate = ?, status_limit_amount = ?, real_limit_amount = ? , status = ? 
            WHERE id = ?
        `;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [rate, status_limit_amount, real_limit_amount, status, id]);

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
        const sql = "SELECT * FROM two_d_lists";

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql);

        if (result.length === 0) {
            return StatusCode.NOT_FOUND("Don't have in two d lists table");
        }

        return StatusCode.OK("get all tow d detail list", result);
    } catch (error) {
        console.error("Error get 2 d detail:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalBetAmount(filterDate, type, session) {
    let connection;
    try {
        if (!filterDate || !type) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (filterDate, type)");
        }

        let sql = `
            SELECT SUM(amount) as totalAmount 
            FROM bets 
            WHERE DATE(bet_date) = ? 
            AND type = ?
        `;

        const params = [filterDate, type];

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);

        const totalAmount = result[0].totalAmount ?? 0;

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

async function getTotalPayoutAmount(filterDate, session) {
    let connection;
    try {
        if (!filterDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (filterDate)");
        }

        let sql = `
            SELECT SUM(j.payout) as totalPayout
            FROM payout_logs b,
            JSON_TABLE(b.details, '$[*]' COLUMNS (
                payout INT PATH '$.payout'
            )) j
            WHERE DATE(b.result_date) = ?
           AND CHAR_LENGTH(b.number) = 2
        `;

        const params = [filterDate];

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

async function getTotalAgentCommissions(filterDate, session) {
    let connection;
    try {
        if (!filterDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (filterDate)");
        }

        let sql = `
           SELECT COALESCE(SUM(amount), 0) AS totalAgentCommission
            FROM agent_commissions
            WHERE DATE(created_at) = ?
            AND type = '2d'
        `;

        const params = [filterDate];

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
        console.error("Error get total agent commission amount:", error);
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
    getTotalAgentCommissions
};