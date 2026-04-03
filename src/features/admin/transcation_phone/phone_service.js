import Mysql from "../../../helper/db.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllPhone() {
    let connection;
    try {
        const sql = `SELECT * FROM transaction_phones`;
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

async function createPhone(phone_numbers, acc_name, type) {
    let connection;
    try {
        console.log("phone_number", phone_numbers);

        if (!phone_numbers || typeof phone_numbers !== "string" || !acc_name || typeof acc_name !== "string" || !type || typeof type !== "string") {
            return StatusCode.INVALID_ARGUMENT("Missing phone number, account name, or type");
        }

        const sql1 = `SELECT * FROM transaction_phones WHERE phone_numbers = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql1, [phone_numbers]);
        if (rows.length > 0) {
            return StatusCode.INVALID_ARGUMENT("Phone number already exists");
        }

        const sql2 = `SELECT * FROM transaction_phones WHERE type = ?`;
        connection = await Mysql.getConnection();
        const [rows2] = await connection.query(sql2, [type]);
        if (rows2.length > 0) {
            return StatusCode.INVALID_ARGUMENT("Type already exists");
        }

        const sql = `INSERT INTO transaction_phones (phone_numbers, acc_name, type , created_at) VALUES (?, ?, ?, NOW())`;
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [phone_numbers, acc_name, type]);
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

async function updatePhone(id, phone_numbers, acc_name, type) {
    let connection;

    try {
        if (!id || typeof id !== "number") {
            return StatusCode.INVALID_ARGUMENT("Invalid ID");
        }

        const fields = [];
        const values = [];

        if (phone_numbers && typeof phone_numbers === "string") {
            fields.push("phone_numbers = ?");
            values.push(phone_numbers);
        }

        if (acc_name && typeof acc_name === "string") {
            fields.push("acc_name = ?");
            values.push(acc_name);
        }

        if (type && typeof type === "string") {
            fields.push("type = ?");
            values.push(type);
        }

        if (fields.length === 0) {
            return StatusCode.INVALID_ARGUMENT("No fields to update");
        }

        fields.push("updated_at = NOW()");

        connection = await Mysql.getConnection();

        if (phone_numbers) {
            const [rows] = await connection.query(
                "SELECT id FROM transaction_phones WHERE phone_numbers = ? AND id != ?",
                [phone_numbers, id]
            );

            if (rows.length > 0) {
                return StatusCode.INVALID_ARGUMENT("Phone number already exists");
            }
        }

        if (type) {
            const [rows] = await connection.query(
                "SELECT id FROM transaction_phones WHERE type = ? AND id != ?",
                [type, id]
            );

            if (rows.length > 0) {
                return StatusCode.INVALID_ARGUMENT("Type already exists");
            }
        }

        values.push(id);
        const sql = `UPDATE transaction_phones SET ${fields.join(", ")} WHERE id = ?`;

        const [result] = await connection.query(sql, values);

        if (result.affectedRows === 0) {
            return StatusCode.NOT_FOUND("Phone not found");
        }

        return StatusCode.OK("Updated successfully");

    } catch (error) {
        console.error("Error updating phone:", error);
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
        console.log("id", id);
        const sql1 = "SELECT * FROM transaction_phones WHERE id = ?";
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql1, [id]);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Phone number not found");
        }

        const sql = `DELETE FROM transaction_phones WHERE id = ?`;
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
    deletePhone,
    updatePhone
}