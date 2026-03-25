import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";
import bcrypt from "bcrypt";

async function adminLogin(phone, password, businessId) {
    let connection;
    try {
        if (!phone || !password || !businessId) {
            return StatusCode.INVALID_ARGUMENT("Missing phone, password, or businessId");
        }

        const sql = `SELECT * FROM admins WHERE phone = ? AND business_id = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [phone, businessId]);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Admin not found");
        }

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return StatusCode.INVALID_ARGUMENT("Password is not correct!");
        }
        console.log("Admin login successful:", admin);

        return StatusCode.OK("Login success", admin);
    } catch (error) {
        console.error("Error fetching admin:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function adminRegister(userName, phone, password, businessId) {
    let connection;
    try {
        if (!userName || !phone || !password || !businessId) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields");
        }
        const existingAdminSql = `SELECT * FROM admins WHERE phone = ? AND business_id = ?`;

        connection = await Mysql.getConnection();
        const [existingAdmins] = await connection.query(existingAdminSql, [phone, businessId]);

        if (existingAdmins.length > 0) {
            return StatusCode.INVALID_ARGUMENT("Phone number already registered for this business");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO admins (username, phone, password, business_id, created_at) VALUES (?, ?, ?, ?, NOW())`;
        const [result] = await connection.query(sql, [userName, phone, hashedPassword, businessId]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Admin registration failed");         
        }

        return StatusCode.OK("Admin registered successfully");
    } catch (error) {
        console.error("Error registering admin:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    adminLogin,
    adminRegister,
};
