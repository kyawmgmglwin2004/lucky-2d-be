import mysql from "mysql2/promise";
import { config } from "../configs/config.js";

const pool = mysql.createPool({
  connectionLimit: 50,
  host: config.DB_HOST,
  port: config.DB_PORT,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  multipleStatements: true,
  queueLimit: 0,
  dateStrings: true
});

export const getConnection = async () => {
  const conn = await pool.getConnection();

  try {
    await conn.query(`SET time_zone = '${config.TIME_ZONE}'`);
  } catch (err) {
    console.error("Failed to set timezone:", err.message);
  }

  return conn;
};

(async () => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.query("SELECT NOW() as now");
    console.log("Database connected successfully! NOW():", rows[0].now);
    conn.release();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

export default pool;