import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";
import bcrypt from "bcrypt";

async function createNewAdmin(business_id, username, phone, password, role) {
    let connection;
    try {
        console.log("type", typeof business_id);

        if (!business_id || typeof business_id !== "string" || !username || typeof username !== "string" || !phone || typeof phone !== "string" || !password || typeof password !== "string" || !role || typeof role !== "string") {
            return StatusCode.INVALID_ARGUMENT("invalid input");
        }

        connection = await Mysql.getConnection();

        const existingBusinessSql = `SELECT * FROM admins WHERE business_id = ?`;
        const [existingBusiness] = await connection.query(existingBusinessSql, [business_id]);

        if (existingBusiness.length > 0) {
            return StatusCode.INVALID_ARGUMENT("This Business ID is already registered");
        }

        const existingPhoneSql = `SELECT * FROM admins WHERE phone = ?`;
        const [existingPhone] = await connection.query(existingPhoneSql, [phone]);

        if (existingPhone.length > 0) {
            return StatusCode.INVALID_ARGUMENT("This Phone number is already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let sql = `INSERT INTO admins (business_id, username, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;

        const [result] = await connection.query(sql, [business_id, username, phone, hashedPassword, role]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("fail create new set admin");
        }

        return StatusCode.OK("New Admin registered successfully");

    } catch (error) {
        console.error("Error new admin create:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}
async function getAllAdmins() {
    let connection;
    try {
        const sql = 'SELECT * FROM admins';
        connection = await Mysql.getConnection();
        const [admins] = await connection.query(sql);

        if (admins.length === 0) {
            return StatusCode.NOT_FOUND("adimins not found");
        }

        return StatusCode.OK("get all admins", admins);

    } catch (error) {
        console.error("Error get all admins:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getAdminById(id) {
    let connection;
    try {

        const adminId = Number(id);
        if (!adminId || typeof adminId !== 'number') {
            console.log("id==", typeof id)
            return StatusCode.INVALID_ARGUMENT("missing Id or Id must be number type")
        }

        const sql = "SELECT * FROM admins WHERE id = ?";
        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [adminId]);
        if (result.length === 0) {
            return StatusCode.NOT_FOUND("admin not found with given id");
        }

        const admin = result[0];
        return StatusCode.OK("Get admin's detail by Id", admin);

    } catch (error) {
        console.error("Error fetching admin by ID:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function updateAdmin(id, business_id, username, phone, password, role) {
    let connection;
    try {
        const adminId = Number(id);

        if (!adminId || isNaN(adminId) || typeof adminId !== 'number') {
            return StatusCode.INVALID_ARGUMENT("Missing admin id  or id must be number");
        }

        connection = await Mysql.getConnection();
        const sql1 = "SELECT id FROM admins WHERE id = ?";

        const [checkAdmin] = await connection.query(sql1, [adminId]);
        if (checkAdmin.length === 0) {
            return StatusCode.NOT_FOUND("Admin not found");
        }

        if (phone) {
            const phoneSql = "SELECT id FROM admins WHERE phone = ? AND id != ?";
            const [duplicatePhone] = await connection.query(phoneSql, [phone, adminId]);

            if (duplicatePhone.length > 0) {
                return StatusCode.INVALID_ARGUMENT("Phone number already in use by another admin");
            }
        }

        const updates = [];
        const params = [];

        if (username) {
            updates.push("username = ?");
            params.push(username);
        }
        if (business_id) {
            updates.push("business_id = ?");
            params.push(business_id);
        }
        if (phone) {
            updates.push("phone = ?");
            params.push(phone);
        }
        if (role) {
            updates.push("role = ?");
            params.push(role);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push("password = ?");
            params.push(hashedPassword);
        }

        if (updates.length === 0) {
            return StatusCode.INVALID_ARGUMENT("No fields provided to update");
        }

        const sql = `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`;
        params.push(adminId);

        const [result] = await connection.query(sql, params);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to update admin");
        }

        return StatusCode.OK("Admin updated successfully");

    } catch (error) {
        console.error("Error updating admin:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function deleteAdmin(id) {
    let connection;
    try {
        const adminId = Number(id);
        if (!adminId || isNaN(adminId) || typeof adminId !== 'number') {
            return StatusCode.INVALID_ARGUMENT("Missing admin Id or admin id must be number");
        }

        connection = await Mysql.getConnection();

        const checkSql = "SELECT id FROM admins WHERE id = ?";

        const [checkAdmin] = await connection.query(checkSql, [adminId]);
        if (checkAdmin.length === 0) {
            return StatusCode.NOT_FOUND("Admin not found");
        }

        const sql = "DELETE FROM admins WHERE id = ?";
        const [result] = await connection.query(sql, [adminId]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to delete admin");
        }

        return StatusCode.OK("Admin deleted successfully");

    } catch (error) {
        console.error("Error deleting admin:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function changeAdminPassword(id, oldPassword, newPassword) {
    let connection;
    try {
        const adminId = Number(id);
        if (!adminId || isNaN(adminId) || !oldPassword || !newPassword || typeof adminId !== 'number' || typeof oldPassword !== "string" || typeof newPassword !== "string") {
            return StatusCode.INVALID_ARGUMENT("Invalid input data for update password");
        }

        connection = await Mysql.getConnection();

        const checkAdmin = "SELECT * FROM admins WHERE id = ?";

        const [adminRows] = await connection.query(checkAdmin, [adminId]);
        if (adminRows.length === 0) {
            return StatusCode.NOT_FOUND("Admin not found");
        }

        const admin = adminRows[0];

        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) {
            return StatusCode.INVALID_ARGUMENT("Old password is incorrect");
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const sql = "UPDATE admins SET password = ? WHERE id = ?";
        const [result] = await connection.query(sql, [hashedNewPassword, adminId]);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to update password");
        }

        return StatusCode.OK("Password changed successfully");

    } catch (error) {
        console.error("Error changing password:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}


export default {
    createNewAdmin,
    getAdminById,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    changeAdminPassword
}