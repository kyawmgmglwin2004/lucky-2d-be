import StatusCode from "../../../helper/statusCode.js";
import Mysql from "../../../helper/db.js";

async function getTotalPayoutAmount(filterDate, session) {
    let connection;
    try {
        if (!filterDate) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (filterDate)");
        }

        let sql = `
            SELECT SUM(j.payout) as totalPayout
            FROM payout_logs b,
            JSON_TABLE(b.details, '$[*]' COLUMNS (
                payout INT PATH '$.payout'
            )) j
            WHERE b.result_date = ?
           AND CHAR_LENGTH(b.number) = 2
        `;

        const params = [filterDate];

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);
        console.log("result. ==", result)

        const totalAmount = result[0].totalPayout;

        if (!totalAmount) {
            return StatusCode.NOT_FOUND("Don't have in payout logs table");
        }

        return StatusCode.OK("get total payout amount", {
            totalAmount
        });

    } catch (error) {
        console.error("Error get total payout amount:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

async function getTotalBetAmount(filterDate, type, session) {
    let connection;
    try {
        if (!filterDate || !type) {
            return StatusCode.INVALID_ARGUMENT("Missing required fields (filterDate, type)");
        }

        let sql = `
            SELECT SUM(amount) as totalAmount 
            FROM bets 
            WHERE type = ?
        `;

        const params = [type];

        if (type === "2d") {
            sql += " AND bet_date = ?";
            params.push(filterDate);
        }

        else if (type === "3d") {
            const [year, month] = filterDate.split("-");

            sql += " AND YEAR(bet_date) = ? AND MONTH(bet_date) = ?";
            params.push(year, month);
        }

        if (session && session !== "all") {
            sql += " AND session = ?";
            params.push(session);
        }

        connection = await Mysql.getConnection();
        const [result] = await connection.query(sql, params);

        const totalAmount = result[0].totalAmount || 0;

        return StatusCode.OK("get total bet amount", {
            totalAmount
        });

    } catch (error) {
        console.error("Error get total bet:", error);
        return StatusCode.UNKNOWN("Database error");
    } finally {
        if (connection) connection.release();
    }
}

export default {
    getTotalPayoutAmount,
    getTotalBetAmount
}