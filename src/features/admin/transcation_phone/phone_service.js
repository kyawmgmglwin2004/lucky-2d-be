import Mysql from "../../../helper/db.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllPhone() {
    let connection;
    try {
        const sql = `SELECT * FROM transcation_phone`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Phone numbers not found");
        }
        return StatusCode.OK("All phone numbers", rows);
    } catch (error) {
        console.error("Error fetching phone numbers:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function createPhone(phone_number, account_name, type) {
    let connection;
    try {
        if (!phone_number || typeof phone_number !== "string" || !account_name || typeof account_name !== "string" || !type || typeof type !== "string") {
            return StatusCode.INVALID_ARGUMENT("Missing phone number, account name, or type");
        }
        const sql = `INSERT INTO transcation_phone (phone_number, account_name, type) VALUES (?, ?, ?)`;
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [phone_number, account_name, type]);
        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Phone number creation failed");
        }
        return StatusCode.OK("Phone number created successfully");
    } catch (error) {
        console.error("Error creating phone number:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function updatePhone(id, phone_number, account_name, type) {
    let connection;
    try {
        if (!id || typeof id !== "number" || !phone_number || typeof phone_number !== "string" || !account_name || typeof account_name !== "string" || !type || typeof type !== "string") {
            return StatusCode.INVALID_ARGUMENT("Missing phone number, account name, or type");
        }
        const sql = `UPDATE transcation_phone SET phone_number = ?, account_name = ?, type = ? WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [phone_number, account_name, type, id]);
        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Phone number update failed");
        }
        return StatusCode.OK("Phone number updated successfully");
    } catch (error) {
        console.error("Error updating phone number:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function deletePhone(id) {
    let connection;
    try {
        if (!id) {
            return StatusCode.INVALID_ARGUMENT("Missing phone number id");
        }
        const sql = `DELETE FROM transcation_phone WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [id]);
        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Phone number deletion failed");
        }
        return StatusCode.OK("Phone number deleted successfully");
    } catch (error) {
        console.error("Error deleting phone number:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    getAllPhone,
    createPhone,
    deletePhone
}