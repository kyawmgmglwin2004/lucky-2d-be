import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";

async function getAllRequests(transactionType, status) {
  let connection;
  try {
    if (!transactionType) {
      return StatusCode.INVALID_ARGUMENT("transactionType is required");
    }

    let sql = `
      SELECT 
        mt.*, 
        u.name AS user_name,
        a.username AS approved_by_name

      FROM money_transactions mt

      JOIN users u 
        ON mt.user_id = u.id

      LEFT JOIN admins a 
  ON mt.approved_by = a.id

WHERE LOWER(mt.transaction_type) = LOWER(?)
    `;

    const params = [transactionType];

    if (status) {
      sql += ` AND mt.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY mt.created_at DESC`;

    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, params);

    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("No requests found for this transaction type");
    }

    return StatusCode.OK("Requests retrieved successfully", rows);

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
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
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

export default {
  getAllRequests,
  comfrimRequest,
  updateTopupRequestStatus,
  getTotalAmountToday
}