import StatusCode from "../../helper/statusCode.js";
import Mysql from "../../helper/db.js";
import bcrypt from 'bcrypt';

async function getTopupHistory(userId, transactionType) {
    let connection;
    try {

        if (!userId || isNaN(userId) || typeof userId !== 'number' || !transactionType || typeof transactionType !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid user ID or transaction type");
        }
        const sql = `SELECT * FROM money_transactions WHERE user_id = ? AND transaction_type = ? ORDER BY created_at DESC`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [userId, transactionType]);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("No top-up history found for this user");
        }

        return StatusCode.OK("Top-up history retrieved successfully", rows);

    } catch (error) {
        console.error("Error fetching top-up history:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTopupHistoryDetail(id, transactionType) {
    let connection;
    try {

        if (!id || isNaN(id) || typeof id !== 'number' || !transactionType || typeof transactionType !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid top-up history detail ID or transaction type");
        }

        const sql = `SELECT * FROM money_transactions WHERE id = ? AND transaction_type = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [id, transactionType]);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Top-up history detail not found");
        }

        return StatusCode.OK("Top-up history detail retrieved successfully", rows[0]);

    } catch (error) {
        console.error("Error fetching top-up history detail:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }

}

async function topupRequest(userId, amount, transactionType, paymentMethod, status, imageUrl, slipId) {
    let connection;
    console.log("Top-up request data:", typeof userId, typeof amount, typeof transactionType, typeof paymentMethod, typeof status, typeof imageUrl, typeof slipId);
    try {
        if (!userId || isNaN(userId) || typeof userId !== 'number' || !amount || typeof amount !== 'number' || !transactionType || typeof transactionType !== 'string' || !paymentMethod || typeof paymentMethod !== 'string' || !status || typeof status !== 'string' || !imageUrl || typeof imageUrl !== 'string' || !slipId || typeof slipId !== 'number') {
            return StatusCode.INVALID_ARGUMENT("Invalid top-up request data");
        }

        console.log("Top-up request data:", { userId, amount, transactionType, paymentMethod, status, imageUrl, slipId });

        const sql = `INSERT INTO money_transactions (user_id, amount, transaction_type, payment_method, status, slip_image, slip_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, [userId, amount, transactionType, paymentMethod, status, imageUrl, slipId]);

        if (result.affectedRows === 0) {
            return StatusCode.INVALID_ARGUMENT("Failed to submit top-up request");
        }

        return StatusCode.OK("Top-up request submitted successfully");

    } catch (error) {
        console.error("Error submitting top-up request:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getWithDrawHistory(userId, transcationType) {
    let connection;
    try {

        if (!userId || isNaN(userId) || typeof userId !== 'number' || !transcationType || typeof transcationType !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid user ID or transaction type");
        }

        const sql = `SELECT * FROM money_transactions WHERE user_id = ? AND transaction_type = ? ORDER BY created_at DESC`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [userId, transcationType]);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("No withdraw history found for this user");
        }

        return StatusCode.OK("Withdraw history retrieved successfully", rows);

    } catch (error) {
        console.error("Error fetching withdraw history:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function withdrawRequest(userId, password, amount, transactionType, paymentMethod, status, bankAccountName, bankAccountNumber) {
    let connection;
    console.log("reached OKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOKOK");

    console.log("Received withdraw request data:", { userId, amount, transactionType });

    try {
        if (!userId || isNaN(userId) || typeof userId !== 'number' ||
            !password || typeof password !== 'string' ||
            !amount || isNaN(amount) || typeof amount !== 'number' ||
            !transactionType || typeof transactionType !== 'string' ||
            !paymentMethod || typeof paymentMethod !== 'string' ||
            !status || typeof status !== 'string' ||
            !bankAccountName || typeof bankAccountName !== 'string' ||
            !bankAccountNumber || typeof bankAccountNumber !== 'string') {
            return StatusCode.INVALID_ARGUMENT("Invalid withdraw request data");
        }

        connection = await Mysql.getConnection();

        const pswSql = 'SELECT password FROM users WHERE id = ?';
        const [pswRows] = await connection.query(pswSql, [userId]);

        if (pswRows.length === 0) {
            return StatusCode.NOT_FOUND("User not found");
        }

        const storedHashedPassword = pswRows[0].password;


        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);

        if (!isPasswordValid) {
            return StatusCode.PERMISSION_DENIED("Password မှားနေပါတယ်");
        }

        const amountSql = 'SELECT balance FROM wallets WHERE user_id = ?';

        const [amountRows] = await connection.query(amountSql, [userId]);

        if (amountRows.length === 0) {
            return StatusCode.NOT_FOUND("Wallet not found for user");
        }

        const currentBalance = amountRows[0].balance;

        if (currentBalance < amount) {
            return StatusCode.INVALID_ARGUMENT("Insufficient balance");
        }

        const pendingSql = `
            SELECT SUM(amount) as total_pending 
            FROM money_transactions 
            WHERE user_id = ? 
            AND status = 'pending' AND transaction_type = 'withdraw'
        `;
        const [pendingRows] = await connection.query(pendingSql, [userId]);

        const totalPending = Number(pendingRows[0].total_pending) || 0;
        const numericAmount = Number(amount);
        const numericBalance = Number(currentBalance);
        // 2. Check if (pending + new amount) > balance
        console.log(typeof totalPending, totalPending);
        console.log(typeof amount, amount);
        console.log(typeof currentBalance, currentBalance);
        if ((totalPending + numericAmount) > numericBalance) {
            return StatusCode.INVALID_ARGUMENT("လက်ရှိငွေထုတ်ရန်မလုံလောက်ပါ");
        }

        const sql = `INSERT INTO money_transactions (user_id, amount, transaction_type, payment_method, status, bank_account_name, bank_account_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

        const [result] = await connection.query(sql, [userId, amount, transactionType, paymentMethod, status, bankAccountName, bankAccountNumber]);

        if (result.affectedRows === 0) {
            return StatusCode.INVALID_ARGUMENT("Failed to submit withdraw request");
        }

        return StatusCode.OK("Withdraw request submitted successfully");

    } catch (error) {
        console.error("Error submitting withdraw request:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        // 7. Release connection once at the end
        if (connection) connection.release();
    }
}

export default {
    getTopupHistory,
    getTopupHistoryDetail,
    topupRequest,
    getWithDrawHistory,
    withdrawRequest
}