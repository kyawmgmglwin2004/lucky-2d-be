// import Mysql from "../../helper/db.js";
// import StatusCode from "../../helper/statusCode.js";
// import bcrypt from "bcrypt";

// async function adminLogin(email, password) {
//   let connection;
//   try {
//     const sql = `SELECT * FROM users WHERE email = ?`;
//     connection = await Mysql.getConnection();
//     const [rows] = await connection.query(sql, [email]);

//     if (rows.length === 0) {
//       return StatusCode.NOT_FOUND("user not found");
//     }

//     const user = rows[0];
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return StatusCode.INVALID_ARGUMENT("Password is not correct!");
//     }

//     return StatusCode.OK("login success", user);
//   } catch (error) {
//     console.error("Error fetching user:", error);
//     return StatusCode.UNKNOWN("Database error");
//   } finally {
//     if (connection) connection.release();
//   }
// }

// async function userRegister(userName , email , password) {
//   let connection;
//   try {
//     if (!userName || !email || !password) {
//       return StatusCode.INVALID_ARGUMENT("Missing required fields");
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     let sql = `INSERT INTO users (userName, email, password, created_at) VALUES (?, ?, ?, NOW())`;
//     connection = await Mysql.getConnection();
//     const [result] = await connection.query(sql, [userName, email, hashedPassword]);
//     if (result.affectedRows === 0) {
//       return StatusCode.UNKNOWN("User registration failed");
//     }
//     return StatusCode.OK("user registered successfully");
//   } catch (error) {
//     console.error("Error registering user:", error);
//     return StatusCode.UNKNOWN("Database error");
//   } finally {
//     if (connection) connection.release();
//   }
// }
// export default {
//     adminLogin,
//     userRegister
// }
