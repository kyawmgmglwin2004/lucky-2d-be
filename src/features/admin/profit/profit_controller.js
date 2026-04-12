import StatusCode from "../../../helper/statusCode.js";
import profitService from "./profit_service.js";

async function getTotalBetAmount(req, res) {
    try {
        const { filterDate, session } = req.query;
        const type = "2d"
        const serviceRes = await profitService.getTotalBetAmount(filterDate, type, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get total bet amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalPayoutAmount(req, res) {
    try {
        const { filterDate, session } = req.query;
        const serviceRes = await profitService.getTotalPayoutAmount(filterDate, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get total payout amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    getTotalBetAmount,
    getTotalPayoutAmount
}