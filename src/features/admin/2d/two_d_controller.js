import twoDService from "./two_d_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function updateAllNumberDetail(req, res) {
    try {
        const { rate, status_limit_amount, real_limit_amount } = req.body;
        const serviceRes = await twoDService.updateAllNumberDetails(rate, status_limit_amount, real_limit_amount);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d update all numbers :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}


async function updateNumberDetailById(req, res) {
    try {
        const id = req.params.id;
        const { rate, status_limit_amount, real_limit_amount, status } = req.body;
        const serviceRes = await twoDService.updateNumberDetailById(id, rate, status_limit_amount, real_limit_amount, status);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d update numbers by id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalAmountForEachNumber(req, res) {
    try {
        const serviceRes = await twoDService.getTotalAmontForEachNumber();

        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get detail :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalBetAmount(req, res) {
    try {
        const { filterDate, session } = req.query;
        const type = "2d"
        const serviceRes = await twoDService.getTotalBetAmount(filterDate, type, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get total bet amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalPayoutAmount(req, res) {
    try {
        const { filterDate, session } = req.query;
        const serviceRes = await twoDService.getTotalPayoutAmount(filterDate, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get total payout amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalAgentCommission(req, res) {
    try {
        const { filterDate, session } = req.query;
        const serviceRes = await twoDService.getTotalAgentCommissions(filterDate, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d get total agent commission :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    updateAllNumberDetail,
    updateNumberDetailById,
    getTotalAmountForEachNumber,
    getTotalBetAmount,
    getTotalPayoutAmount,
    getTotalAgentCommission
}