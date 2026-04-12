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
        const { id } = req.params;
        const image_url = req.file ? `/uploads/${req.file.filename}` : null;
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
        const { id } = req.params;
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

async function createText(req, res) {
    try {
        const { text } = req.body;
        const serviceRes = await imageService.createText(text);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Text created successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error creating text:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updateText(req, res) {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const serviceRes = await imageService.updateText(id, text);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Text updated successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error updating text:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function deleteText(req, res) {
    try {
        const { id } = req.params;
        const serviceRes = await imageService.deleteText(id);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Text deleted successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error deleting text:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getAllText(req, res) {
    try {
        const serviceRes = await imageService.getAllText();
        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error getting all text:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
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