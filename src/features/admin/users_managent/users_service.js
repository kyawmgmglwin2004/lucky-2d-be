import StatusCode from "../../../helper/statusCode.js";
import Mysal from "../../../helper/db.js"


async function getAlluser(id, isActive, phone, page, name, limit) {
    let connection;

    try {
        const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
        const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (currentPage - 1) * itemsPerPage;

        let whereConditions = ['1=1'];
        let params = [];

        if (id) {
            whereConditions.push("u.id = ?");
            params.push(id);
        }

        if (isActive || isActive === 0) {
            whereConditions.push("u.is_active = ?");
            params.push(isActive);
        }

        if (phone) {
            whereConditions.push("u.phone LIKE ?");
            params.push(`%${phone}%`);
        }

        if (name) {
            whereConditions.push("u.name LIKE ?");
            params.push(`%${name}%`);
        }

        const whereClause = "WHERE " + whereConditions.join(" AND ");

        connection = await Mysal.getConnection();

        const sql = `
    SELECT 
        u.id,
        u.name,
        u.phone,
        u.is_active,
        u.created_at,
        w.balance AS balance,
        COUNT(*) OVER() AS totalRecords
    FROM users u
    LEFT JOIN wallets w ON w.user_id = u.id
    ${whereClause}
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?
`;

        const finalParams = [...params, itemsPerPage, offset];

        const [rows] = await connection.query(sql, finalParams);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("user not found");
        }

        const totalRecords = rows[0].totalRecords;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        const cleanData = rows.map(({ totalRecords, ...rest }) => rest);

        const responseData = {
            data: cleanData,
            pagination: {
                currentPage,
                totalPages,
                totalRecords,
                itemsPerPage
            }
        };

        return StatusCode.OK("all user", responseData);

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
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("user not found for update");
        }

        const sql1 = `UPDATE users SET is_active = ? WHERE id = ? `;
        const [result] = await connection.query(sql1, [isActive, id]);

        if (result.affectedRows === 0) {
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