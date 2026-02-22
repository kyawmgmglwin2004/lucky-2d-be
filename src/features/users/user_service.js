import Mysql from "../../helper/db.js";
import StatusCode from "../../helper/statusCode.js";
import bcrypt from "bcrypt";

async function userLogin(phone , password) {
  let connection;
  try {
    const sql = `SELECT * FROM users WHERE phone = ?`;
    connection = await Mysql.getConnection();
    const [rows] = await connection.query(sql, [phone]);

    if (rows.length === 0) {
      return StatusCode.NOT_FOUND("user not found");
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return StatusCode.INVALID_ARGUMENT("Password is not correct!");
    }
    console.log("User login successful:", user);

    return StatusCode.OK("login success",  user );
  } catch (error) {
    console.error("Error fetching user:", error);
    return StatusCode.UNKNOWN("Database error");
  } finally {
    if (connection) connection.release();
  }
}

async function userRegister(name , phone , password) {
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

    let sql = `INSERT INTO users (name, phone, password, created_at) VALUES (?, ?, ?, NOW())`;
    connection = await Mysql.getConnection();
    const [result] = await connection.query(sql, [name, phone, hashedPassword]);

    if (result.affectedRows === 0) {
      return StatusCode.UNKNOWN("User registration failed");
    }

    return StatusCode.OK("user registered successfully");

  } catch (error) {
    console.error("Error registering user:", error);
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


export default {
    userLogin,
    userRegister,
    getUserById
}
