import Mysql from "../../../helper/db.js";
import StatusCode from "../../../helper/statusCode.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

async function getStatus(type) {
    let connection;
    try {
        const sql = `SELECT * FROM time_status WHERE type = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [type]);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Status not found");
        }
        return StatusCode.OK("Status retrieved successfully", rows);
    } catch (error) {
        console.error("Error fetching status:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function updateStatus(id, status, openTime, closeTime) {
    let connection;
    try {
        if (!id || typeof status !== 'number' || !openTime || !closeTime) {
            return StatusCode.INVALID_ARGUMENT("Id, status, openTime and closeTime are required");

        }

        connection = await Mysql.getConnection();

        const sql1 = "SELECT * FROM time_status WHERE id = ?";
        const [rows1] = await connection.query(sql1, [id]);
        if (rows1.length === 0) {
            return StatusCode.NOT_FOUND("Status not found");
        }
        const sql2 = "UPDATE time_status SET status = ?, open_time = ?, close_time = ? WHERE id = ?";
        const [rows2] = await connection.query(sql2, [status, openTime, closeTime, id]);
        if (rows2.affectedRows === 0) {
            return StatusCode.UNKNOWN("Status updated failed");
        }
        return StatusCode.OK("Status updated successfully");

    } catch (error) {
        console.error("Error updating status:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }

}

async function getStatusForThreeD(type) {
    let connection;

    try {
        const sql = `SELECT * FROM time_status WHERE type = ?`;
        connection = await Mysql.getConnection();

        const [rows] = await connection.query(sql, [type]);

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Status not found");
        }

        const formatted = rows.map(item => ({
            ...item,
            monthly_open_time: item.monthly_open_time
                ? dayjs.tz(
                    item.monthly_open_time,
                    "YYYY-MM-DD HH:mm:ss",
                    "Asia/Yangon"
                ).format("M/D/YYYY, h:mm:ss A")
                : null,

            monthly_close_time: item.monthly_close_time
                ? dayjs.tz(
                    item.monthly_close_time,
                    "YYYY-MM-DD HH:mm:ss",
                    "Asia/Yangon"
                ).format("M/D/YYYY, h:mm:ss A")
                : null
        }));

        return StatusCode.OK("Status retrieved successfully", formatted);

    } catch (error) {
        console.error(error);
        return StatusCode.UNKNOWN("SERVER ERROR");

    } finally {
        if (connection) connection.release();
    }
}

async function updateStatusForThreeD(id, status, monthlyOpenTime, monthlyCloseTime) {
    let connection;
    try {
        if (!id || typeof status !== 'number' || !monthlyOpenTime || !monthlyCloseTime) {
            return StatusCode.INVALID_ARGUMENT("Id, status, monthlyOpenTime and monthlyCloseTime are required");
        }

        const openTime = dayjs.tz(
            monthlyOpenTime,
            "M/D/YYYY, h:mm:ss A",
            "Asia/Yangon"
        ).format("YYYY-MM-DD HH:mm:ss");

        const closeTime = dayjs.tz(
            monthlyCloseTime,
            "M/D/YYYY, h:mm:ss A",
            "Asia/Yangon"
        ).format("YYYY-MM-DD HH:mm:ss");

        connection = await Mysql.getConnection();

        const sql1 = "SELECT * FROM time_status WHERE id = ?";
        const [rows1] = await connection.query(sql1, [id]);

        if (rows1.length === 0) {
            return StatusCode.NOT_FOUND("Status not found");
        }

        const sql2 = `
            UPDATE time_status 
            SET status = ?, monthly_open_time = ?, monthly_close_time = ? 
            WHERE id = ?
        `;

        const [rows2] = await connection.query(sql2, [
            status,
            openTime,
            closeTime,
            id
        ]);

        if (rows2.affectedRows === 0) {
            return StatusCode.UNKNOWN("Status updated failed");
        }

        return StatusCode.OK("Status updated successfully");

    } catch (error) {
        console.error("Error updating status:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export default {
    getStatus,
    updateStatus,
    getStatusForThreeD,
    updateStatusForThreeD
}