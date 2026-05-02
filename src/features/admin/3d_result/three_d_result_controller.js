import three_d_result_service from "./three_d_result_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function create3DResult(req, res) {
    try {
        const { result_numbers, month, result_round } = req.body;
        const serviceRes = await three_d_result_service.create3DResult(result_numbers, month, result_round);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error creating 3D result:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function get3DResult(req, res) {
    try {
        const { page, limit, filterdate } = req.query;
        const serviceRes = await three_d_result_service.get3DResult(page, limit, filterdate);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error getting 3D result:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    create3DResult,
    get3DResult
}