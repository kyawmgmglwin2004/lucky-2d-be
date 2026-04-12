import Mysql from "../../../helper/db.js";
import StatusCode from "../../../helper/statusCode.js";
import fs from "fs";
import path from "path";

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
        connection = await Mysql.getConnection();

        const [rows] = await connection.query(
            "SELECT images FROM slide_images WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Image not found");
        }

        const oldImage = rows[0].images;

        if (oldImage) {
            const fullPath = path.join(process.cwd(), oldImage);

            if (fs.existsSync(fullPath)) {
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error("Error deleting old image:", err);
                    }
                });
            }
        }

        const [result] = await connection.query(
            "UPDATE slide_images SET images = ? WHERE id = ?",
            [image_url, id]
        );

        return StatusCode.OK("Image updated successfully", result);
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
    console.log("ID : ", id);
    try {
        connection = await Mysql.getConnection();

        const [rows] = await connection.query(
            "SELECT images FROM slide_images WHERE id = ?",
            [id]
        );

        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Image not found");
        }

        const imagePath = rows[0].images;
        if (imagePath) {
            const fullPath = path.join(process.cwd(), imagePath);

            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await connection.query(
            "DELETE FROM slide_images WHERE id = ?",
            [id]
        );

        return StatusCode.OK("Image deleted successfully");
    } catch (error) {
        console.error("Error deleting image:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function createText(text) {
    let connection;
    try {
        if (!text) {
            return StatusCode.INVALID_ARGUMENT("Text is required");
        }
        const sql = `INSERT INTO slide_texts (text) VALUES (?)`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [text]);
        if (rows.affectedRows === 0) {
            return StatusCode.UNKNOWN("Text created failed");
        }
        return StatusCode.OK("Text created successfully");
    } catch (error) {
        console.error("Error creating text:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function updateText(id, text) {
    let connection;
    try {
        if (!text || !id) {
            return StatusCode.INVALID_ARGUMENT("Text or id are required");
        }
        const sql = `UPDATE slide_texts SET text = ? WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [text, id]);
        if (rows.affectedRows === 0) {
            return StatusCode.UNKNOWN("Text updated failed");
        }
        return StatusCode.OK("Text updated successfully");
    } catch (error) {
        console.error("Error updating text:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function deleteText(id) {
    let connection;
    try {
        if (!id) {
            return StatusCode.INVALID_ARGUMENT("Id is required");
        }
        const sql = `DELETE FROM slide_texts WHERE id = ?`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql, [id]);
        if (rows.affectedRows === 0) {
            return StatusCode.UNKNOWN("Text deleted failed");
        }
        return StatusCode.OK("Text deleted successfully");
    } catch (error) {
        console.error("Error deleting text:", error);
        return StatusCode.UNKNOWN("SERVER ERROR");
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function getAllText() {
    let connection;
    try {
        const sql = `SELECT * FROM slide_texts`;
        connection = await Mysql.getConnection();
        const [rows] = await connection.query(sql);
        if (rows.length === 0) {
            return StatusCode.NOT_FOUND("Text not found");
        }
        return StatusCode.OK("Text retrieved successfully", rows);
    } catch (error) {
        console.error("Error fetching text:", error);
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
    deleteImage,
    createText,
    updateText,
    deleteText,
    getAllText
}