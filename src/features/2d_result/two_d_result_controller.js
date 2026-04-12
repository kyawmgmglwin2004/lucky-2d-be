import twoDResultService from "./two_d_result_service.js";
import StatusCode from "../../helper/statusCode.js";

async function get2dResult(req, res) {
    try {
        const { page, limit, filterDate } = req.query;
        console.log("page", page);
        console.log("limit", limit);
        console.log("filterDate", filterDate);
        const serviceRes = await twoDResultService.get2dResult(page, limit, filterDate);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error getting 2d result:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    get2dResult
}