import statusManagementService from "./status_management_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getStatus(req, res) {
    try {
        const type = "2d";
        const serviceRes = await statusManagementService.getStatus(type);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error fetching status:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updateStatus(req, res) {
    try {
        const id = req.params.id;
        const { status, open_time, close_time } = req.body;
        const serviceRes = await statusManagementService.updateStatus(id, status, open_time, close_time);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getStatusForThreeD(req, res) {
    try {
        const type = "3d";
        const serviceRes = await statusManagementService.getStatusForThreeD(type);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error fetching status:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updateStatusForThreeD(req, res) {
    try {
        const id = req.params.id;
        const { status, monthly_open_time, monthly_close_time } = req.body;
        console.log("monthlyOpenTime", monthly_open_time);
        console.log("monthlyCloseTime", monthly_close_time);
        console.log("status", status);
        console.log("id", id);
        const serviceRes = await statusManagementService.updateStatusForThreeD(id, status, monthly_open_time, monthly_close_time);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    getStatus,
    updateStatus,
    getStatusForThreeD,
    updateStatusForThreeD
}