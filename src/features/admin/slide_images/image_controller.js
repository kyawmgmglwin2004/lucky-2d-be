import imageService from "./image_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllImages(req, res) {
    try {
        const serviceRes = await imageService.getAllImages();
        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error getting all images:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function createImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Image is required"));
        }
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
        const serviceRes = await imageService.createImage(image_url);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Image created successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error creating image:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updateImage(req, res) {
    try {
        const { id, image_url } = req.body;
        const serviceRes = await imageService.updateImage(id, image_url);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Image updated successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error updating image:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function deleteImage(req, res) {
    try {
        const { id } = req.body;
        const serviceRes = await imageService.deleteImage(id);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Image deleted successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error deleting image:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    getAllImages,
    createImage,
    updateImage,
    deleteImage
}