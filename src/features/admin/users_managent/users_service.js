import StatusCode from "../../../helper/statusCode.js";
import Mysal from "../../../helper/db.js"

async function getAlluser(id, isActive, phone, page, name, limit) {
    let connection;
    try {        


        const offset = (page - 1) * limit;

        let sql = "SELECT * FROM users WHERE 1=1"; 
        let params = [];

        if (id !== undefined && id !== null && id) {
            sql += " AND id = ?";
            params.push(id);
        }

        if (isActive || isActive === 0) {
            sql += " AND is_active = ?";
            params.push(isActive);
        }

        if (phone !== undefined && phone !== null && phone) {
            sql += " AND phone LIKE ?";
            params.push(`%${phone}%`);
        }

        if (name !== undefined && name !== null && name) {
            sql += " AND name LIKE ?";
            params.push(`%${name}%`);
        }

        sql += " LIMIT ? OFFSET ?";
        params.push(parseInt(limit), parseInt(offset));

        connection = await Mysal.getConnection();
        const [rows] = await connection.query(sql, params);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("user not found");
        }

        return StatusCode.OK("all user", rows);

    } catch (error) {
        console.error("Error fetching user:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function banUpdate(id, isActive) {
    let connection;

    try {
        const sql = `SELECT * FROM users WHERE id = ?`;
        connection = await Mysal.getConnection();
        const [rows] = await connection.query(sql, id);
        if( rows.length === 0) {
            return StatusCode.NOT_FOUND("user not found for update");
        }

        const sql1 = `UPDATE users SET is_active = ? WHERE id = ? `;
        const [result] = await connection.query(sql1, [isActive, id]);

        if(result.affectedRows === 0) {
            return StatusCode.UNKNOWN("fail update user status");
        }
        return StatusCode.OK("user update successfully");
        
    } catch (error) {
         console.error("Error fetching user:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    getAlluser,
    banUpdate
}