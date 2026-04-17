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
        u.role,
        u.agent_code,
        u.refer_code,
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

async function changeToAgent(id, role, agentCode, twoDpercent, threeDpercent) {
    let connection;
    try {
        const userId = Number(id);
        if (!userId || isNaN(userId) || typeof userId !== 'number') {
            return StatusCode.INVALID_ARGUMENT("Missing user id or user id must be number");
        }

        connection = await Mysal.getConnection();
        const sql = `SELECT id FROM users WHERE id = ?`;
        const [rows] = await connection.query(sql, userId);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("user not found for update");
        }

        if (agentCode && typeof agentCode === "string") {
            const sql1 = `SELECT agent_code FROM users WHERE agent_code = ?`;
            const [rows1] = await connection.query(sql1, agentCode);
            if (rows1.length > 0) {
                return StatusCode.INVALID_ARGUMENT("agent code already exists");
            }
        }

        const updates = [];
        const params = [];

        if (role) {
            updates.push("role = ?");
            params.push(role);
        }
        if (agentCode) {
            updates.push("agent_code = ?");
            params.push(agentCode);
        }
        if (twoDpercent) {
            updates.push("two_d_percent = ?");
            params.push(twoDpercent);
        }
        if (threeDpercent) {
            updates.push("three_d_percent = ?");
            params.push(threeDpercent);
        }

        if (updates.length === 0) {
            return StatusCode.INVALID_ARGUMENT("No fields provided to update");
        }

        const sql2 = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        params.push(userId);

        const [result] = await connection.query(sql2, params);

        if (result.affectedRows === 0) {
            return StatusCode.UNKNOWN("Failed to update user");
        }

        return StatusCode.OK("User updated successfully");

    } catch (error) {
        console.error("Error fetching user:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getAgentCommissionList(agentId, page, limit, filterDate = null) {
    let connection;
    try {
        const agntId = Number(agentId);
        if (!agntId || typeof agntId !== "number") {
            return StatusCode.INVALID_ARGUMENT("agent id is required");
        }

        const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
        const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const offset = (currentPage - 1) * itemsPerPage;

        let whereConditions = ['ac.agent_id = ?'];
        let params = [agntId];

        if (filterDate != null && filterDate != "" && filterDate != undefined) {
            whereConditions.push("ac.created_at >= ? AND ac.created_at < DATE_ADD(?, INTERVAL 1 DAY)");
            params.push(filterDate, filterDate);
        }

        const whereClause = "WHERE " + whereConditions.join(" AND ");

        connection = await Mysal.getConnection();

        const sql = `
            SELECT 
                ac.id,
                ac.agent_id,
                ac.user_id,
                u.name AS name,
                ac.amount,
                ac.type,
                ac.session,
                ac.two_d_percent,
                ac.three_d_percent,
                ac.created_at,
                COUNT(*) OVER() AS totalRecords
            FROM agent_commissions ac
            LEFT JOIN users u ON u.id = ac.user_id
            ${whereClause}
            ORDER BY ac.id DESC
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...params, itemsPerPage, offset];

        const [rows] = await connection.query(sql, finalParams);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("agent commission not found");
        }

        const totalRecords = rows[0].totalRecords;
        const totalPages = Math.ceil(totalRecords / itemsPerPage);

        const cleanData = rows.map(({ totalRecords, ...rest }) => rest);

        const responseData = {
            data: cleanData,
            pagination: {
                currentPage: currentPage,
                totalPages: totalPages,
                totalRecords: totalRecords,
                itemsPerPage: itemsPerPage,
                filterDate: filterDate || "All",

            }
        };

        return StatusCode.OK("agent commission list", responseData);

    } catch (error) {
        console.error("Error fetching agent commission:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    getAlluser,
    banUpdate,
    changeToAgent,
    getAgentCommissionList
}