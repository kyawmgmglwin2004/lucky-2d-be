import Mysql from "../../../helper/db.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllImages() {
    let connection;
    try {
        const sql = `SELECT * FROM slide_images`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Images not found");
        }
        return StatusCode.OK("Images retrieved successfully", rows);
    } catch (error) {
        console.error("Error fetching images:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function createImage(image_url) {
    let connection;
    try {
        const sql = `INSERT INTO slide_images (images) VALUES (?)`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [image_url]);
        if (rows.affectedRows === 0) {
            return StatusCode.UNKNOWN("Image created failed");
        }
        return StatusCode.OK("Image created successfully");
    } catch (error) {
        console.error("Error creating image:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function updateImage(id, image_url) {
    let connection;
    try {
        const sql = `UPDATE slide_images SET images = ? WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [image_url, id]);
        return StatusCode.OK("Image updated successfully", rows);
    } catch (error) {
        console.error("Error updating image:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function deleteImage(id) {
    let connection;
    try {
        const sql = `DELETE FROM slide_images WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [id]);
        return StatusCode.OK("Image deleted successfully", rows);
    } catch (error) {
        console.error("Error deleting image:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

export default {
    getAllImages,
    createImage,
    updateImage,
    deleteImage
}