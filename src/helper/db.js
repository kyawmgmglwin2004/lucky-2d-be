// helpers/database_helper.js
import mysql from "mysql2/promise";
import {config} from "../configs/config.js";

// Create a promise-based connection pool
const pool = mysql.createPool({
  connectionLimit: 50,
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  multipleStatements: true,
  queueLimit: 0
});

try {
  const connection = await pool.getConnection();
  console.log("Database connected successfully!");
  connection.release();
} catch (err) {
  console.error(" Database connection failed:", err.message);
}

export default pool;
