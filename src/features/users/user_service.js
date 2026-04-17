import Mysql from "../../helper/db.js";
import StatusCode from "../../helper/statusCode.js";
import bcrypt from "bcrypt";

async function userLogin(phone, password) {
  let connection;
  try {

    if (!phone || !password) {
      return StatusCode.INVALID_ARGUMENT("Missing required fields");
    }

    const sql = `SELECT * FROM users WHERE phone = ?`;
    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [phone]);

    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("user not found");
    }

    const user = rows[0];
    console.log("===", user.is_active);

    if (user.is_active === 0) {
      return StatusCode.UNAUTHENTICATED("Admin have been ban this user");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return StatusCode.INVALID_ARGUMENT("Password is not correct!");
    }
    console.log("User login successful:", user);

    return StatusCode.OK("login success", user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}


async function saveRefreshToken(userId, refreshToken) {
  let connection;
  try {
    if (!userId || !refreshToken) {
      return StatusCode.INVALID_ARGUMENT("Missing required fields");
    }

    const sql = `UPDATE users SET refresh_token = ? WHERE id = ?`;

    connection = await Mysql.getConnection();
    const [result] = await connection.query(sql, [refreshToken, userId]);
    if (result.affectedRows === 0) {
      return StatusCode.UNKNOWN("Refresh token save failed");
    }

    return StatusCode.OK("Refresh token saved successfully");

  } catch (error) {
    console.error("Error saving refresh token:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function findUserByRefreshToken(refreshToken) {
  let connection;
  try {
    if (!refreshToken) {
      return StatusCode.INVALID_ARGUMENT("Missing refreshToken");
    }

    const sql = `SELECT * FROM users WHERE refresh_token = ?`;

    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [refreshToken]);
    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("User not found");
    }

    const user = rows[0];
    return StatusCode.OK("User found", user);

  } catch (error) {
    console.error("Error finding user:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function userRegister(name, phone, password) {
  let connection;
  try {
    if (!name || !phone || !password) {
      return StatusCode.INVALID_ARGUMENT("Missing required fields");
    }
    const existingUserSql = `SELECT * FROM users WHERE phone = ?`;

    connection = await Mysql.getConnection();
    const [existingUsers] = await connection.query(existingUserSql, [phone]);

    if (existingUsers.length > 0) {
      return StatusCode.INVALID_ARGUMENT("Phone number already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    let sql = `INSERT INTO users (name, phone, password, created_at) VALUES (?, ?, ?, ?)`;

    const [result] = await connection.query(sql, [name, phone, hashedPassword, createdAt]);

    if (result.affectedRows === 0) {
      return StatusCode.UNKNOWN("User registration failed");
    }

    const walletSql = 'INSERT INTO wallets (user_id, balance) VALUES (?, 100000)';

    const [walletResult] = await connection.query(walletSql, [result.insertId]);

    if (walletResult.affectedRows === 0) {
      return StatusCode.UNKNOWN("Wallet creation failed");
    }

    await connection.commit();


    return StatusCode.OK("user registered successfully");

  } catch (error) {
    console.error("Error registering user:", error);
    if (connection) await connection.rollback();
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function getUserById(userId) {
  let connection;
  try {
    const sql = `
        SELECT 
            u.id, 
            u.name, 
            u.phone,
            u.refer_code,
            u.role, 
            u.created_at,
            COALESCE(w.balance, 0) AS amount
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        WHERE u.id = ?
    `;

    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [userId]);

    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("User not found");
    }

    const user = rows[0];
    return StatusCode.OK("User retrieved successfully", user);

  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function getBalance(userId) {
  let connection;
  try {
    if (!userId || typeof userId !== "number") {
      return StatusCode.INVALID_ARGUMENT("Invalid user ID");
    }

    const sql = `SELECT balance FROM wallets WHERE user_id = ?`;
    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [userId]);
    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("User not found");
    }
    const balance = rows[0].balance;
    return StatusCode.OK("Balance retrieved successfully", balance);
  } catch (error) {
    console.error("Error fetching balance:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function addReferCode(userId, referCode) {
  let connection;
  try {
    if (!userId || !referCode) {
      return StatusCode.INVALID_ARGUMENT("Missing required fields");
    }
    const sql = `SELECT id FROM users WHERE id = ?`;
    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [userId]);
    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("User မရှိပါ");
    }

    const sql2 = `SELECT agent_code  FROM users WHERE agent_code = ?`;
    const [rows2] = await connection.query(sql2, [referCode]);
    if (rows2.length === 0) {
      return StatusCode.NOT_FOUND("Agent code မမှန်ပါ");
    }

    const sql1 = `UPDATE users SET refer_code = ? WHERE id = ?`;
    const [result] = await connection.query(sql1, [referCode, userId]);
    if (result.affectedRows === 0) {
      return StatusCode.UNKNOWN("Refer code save failed");
    }

    return StatusCode.OK("Refer code saved successfully");
  } catch (error) {
    console.error("Error adding refer code:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}


export default {
  userLogin,
  userRegister,
  getUserById,
  saveRefreshToken,
  findUserByRefreshToken,
  getBalance,
  addReferCode
}
