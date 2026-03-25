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

        if(result.affectedRows === 0) {
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


async function updateNumberDetailById(id, rate, status_limit_amount, real_limit_limit) {
    let connection;
    try {
        if (!id) {
            return StatusCode.INVALID_ARGUMENT("ID is required");
        }
        if (!rate || !status_limit_amount || !real_limit_limit) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (rate, limit)");
        }

        const sql = `
            UPDATE two_d_lists 
            SET rate = ?, status_limit_amount = ?, real_limit_amount = ? 
            WHERE id = ?
        `;
        
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [rate, status_limit_amount, real_limit_limit, id]);

        if (result.affectedRows === 0) {
            return StatusCode.NOT_FOUND("Number detail not found with this ID");
        }

        return StatusCode.OK("Number detail updated successfully", );

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

        if(result.length === 0) {
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

export default {
    updateAllNumberDetails,
    updateNumberDetailById,
    getTotalAmontForEachNumber,
};