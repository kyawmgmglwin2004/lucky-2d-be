import phoneService from "./phone_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function createPhone(req, res) {
    try {
        const { phone_number, account_name, type } = req.body;
        const serviceRes = await phoneService.createPhone(phone_number, account_name, type);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Phone number created successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error creating phone number:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updatePhone(req, res) {
    try {
        const { id, phone_number, account_name, type } = req.body;
        const serviceRes = await phoneService.updatePhone(id, phone_number, account_name, type);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Phone number updated successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error updating phone number:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function deletePhone(req, res) {
    try {
        const { id } = req.body;
        if (!id || typeof id !== "number") {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Missing phone number id"));
        }
        const serviceRes = await phoneService.deletePhone(id);
        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Phone number deleted successfully"));
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error deleting phone number:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getAllPhone(req, res) {
    try {
        const serviceRes = await phoneService.getAllPhone();
        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        } else {
            return res.status(serviceRes.code).json(serviceRes);
        }
    } catch (error) {
        console.error("Error getting all phone numbers:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    createPhone,
    updatePhone,
    deletePhone,
    getAllPhone
};