import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";
import fs from "fs/promises";
import path from "path";

async function getAllRequests(transactionType, status, page, limit, filterDate) {
  let connection;
  try {
    if (!transactionType) {
      return StatusCode.INVALID_ARGUMENT("transactionType is required");
    }

    const currentPage = parseInt(page) > 0 ? parseInt(page) : 1;
    const itemsPerPage = parseInt(limit) > 0 ? parseInt(limit) : 10;
    const offset = (currentPage - 1) * itemsPerPage;

    let whereConditions = ["1=1"];
    let params = [];

    if (transactionType) {
      whereConditions.push(`LOWER(mt.transaction_type) = LOWER(?)`);
      params.push(transactionType);
    }

    if (status) {
      whereConditions.push(`mt.status = ?`);
      params.push(status);
    }

    if (filterDate) {
      whereConditions.push(`DATE(mt.created_at) = ?`);
      params.push(filterDate);
    }

    const whereClause = "WHERE " + whereConditions.join(" AND ");

    let sql = `
      SELECT 
        mt.*, 
        u.name AS user_name,
        a.username AS approved_by_name,
        COUNT(*) OVER() AS totalRecords

      FROM money_transactions mt

      JOIN users u 
        ON mt.user_id = u.id

      LEFT JOIN admins a 
        ON mt.approved_by = a.id

      ${whereClause}

      ORDER BY mt.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const finalParams = [...params, itemsPerPage, offset];

    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, finalParams);

    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("No requests found for this transaction type");
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

    return StatusCode.OK("Requests retrieved successfully", responseData);

  } catch (error) {
    console.error("Error fetching requests:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function comfrimRequest(id, status, transactionType, adminId) {
  let connection;
  try {
    if (!id || isNaN(id) || typeof id !== 'number' || !adminId || isNaN(adminId) || typeof adminId !== 'number' || !status || typeof status !== 'string' || !transactionType || typeof transactionType !== 'string') {
      return StatusCode.INVALID_ARGUMENT("Invalid top-up request ID or status");
    }

    connection = await Mysql.getConnection();
    await connection.beginTransaction();

    const sql = `SELECT * FROM money_transactions WHERE id = ? FOR UPDATE`;
    const [result] = await connection.query(sql, [id]);

    if (result.length == 0) {
      throw new Error("Transaction not found");
    }

    const transaction = result[0];
    const amount = transaction.amount;
    const userId = transaction.user_id;

    const sql1 = `UPDATE money_transactions SET status = ? , approved_by = ? WHERE id = ?`;
    await connection.query(sql1, [status, adminId, id]);

    const sql2 = `UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND (balance + ?) >= 0`;

    if (status.toLowerCase() === 'approved') {
      let finalAmount = amount;

      if (transactionType.toLowerCase() === 'withdraw') {
        finalAmount = -amount;
      }

      const [walletResult] = await connection.query(sql2, [finalAmount, userId, finalAmount]);

      if (walletResult.affectedRows === 0) {
        throw new Error("Insufficient balance or wallet not found");
      }
    }

    await connection.commit();
    return StatusCode.OK("Transaction successful");

  } catch (error) {
    if (connection) await connection.rollback();
    console.error(error);
    return StatusCode.UNKNOWN(error.message);
  } finally {
    if (connection) connection.release();
  }
}

async function updateTopupRequestStatus(id, status) {
  let connection;
  try {
    if (!id || isNaN(id) || typeof id !== 'number' || !status || typeof status !== 'string') {
      return StatusCode.INVALID_ARGUMENT("Invalid top-up request ID or status");
    }
    const sql = `UPDATE money_transactions SET status = ? WHERE id = ? AND transaction_type = 'topup'`;
    connection = await Mysql.getConnection();
    const [result] = await connection.query(sql, [status, id]);

    if (result.affectedRows === 0) {
      return StatusCode.NOT_FOUND("Top-up request not found or status unchanged");
    }

    return StatusCode.OK("Top-up request status updated successfully");

  } catch (error) {
    console.error("Error updating top-up request status:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function getTotalAmountToday(transactionType, status) {
  let connection;
  try {
    const sql = `
     SELECT SUM(amount) AS total_amount
  FROM money_transactions
  WHERE created_at >= CURDATE()
  AND created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  AND transaction_type = ?
  AND status = ?
    `;

    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [transactionType, status]);
    console.log("rows. payout ==", rows)

    const totalAmount = rows[0].total_amount ?? 0;

    return StatusCode.OK("Total amount calculated successfully", {
      total_amount: totalAmount
    });

  } catch (error) {
    console.error("Error getting total amount today:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function deleteTransactionsByDate(startDate, endDate) {
  let connection;

  try {
    connection = await Mysql.getConnection();

    const [rows] = await connection.query(
      `SELECT slip_image FROM money_transactions 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    for (const row of rows) {
      if (row.slip_image) {
        try {
          const filePath = path.join(process.cwd(), row.slip_image);
          await fs.unlink(filePath);
        } catch (err) {
          console.log("File delete error:", err.message);
        }
      }
    }

    const [result] = await connection.query(
      `DELETE FROM money_transactions 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    if (result.affectedRows === 0) {
      return StatusCode.NOT_FOUND("Transaction မရှိပါ");
    }

    return StatusCode.OK("Transaction အောင်မြင်စွာ ဖျက်ပြီးပါပြီ");

  } catch (error) {
    console.error("Error deleting transactions:", error);
    return StatusCode.UNKNOWN("Database error");

  } finally {
    if (connection) connection.release();
  }
}
export default {
  getAllRequests,
  comfrimRequest,
  updateTopupRequestStatus,
  getTotalAmountToday,
  deleteTransactionsByDate
}