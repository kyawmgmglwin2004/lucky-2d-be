import twoDService from "./three_d_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function updateAllNumberDetail(req, res) {
    try {
        const { rate, status_limit_amounts, real_limit_amounts } = req.body;
        const serviceRes = await twoDService.updateAllNumberDetails(rate, status_limit_amounts, real_limit_amounts);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d update all numbers :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}


async function updateNumberDetailById(req, res) {
    try {
        const id = req.params.id;
        const { rate, status_limit_amounts, real_limit_amounts, status } = req.body;
        console.log("id : ", id);
        console.log("rate : ", rate);
        console.log("status_limit_amounts : ", status_limit_amounts);
        console.log("real_limit_amounts : ", real_limit_amounts);
        const serviceRes = await twoDService.updateNumberDetailById(id, rate, status_limit_amounts, real_limit_amounts, status);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d update numbers by id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalAmountForEachNumber(req, res) {
    try {
        const serviceRes = await twoDService.getTotalAmontForEachNumber();

        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d get detail :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalBetAmount(req, res) {
    try {
        const { startDate, endDate, session } = req.query;
        const type = "3d";
        const serviceRes = await twoDService.getTotalBetAmount(startDate, endDate, type, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d get total bet amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalPayoutAmount(req, res) {
    try {
        const { startDate, endDate, session } = req.query;
        const serviceRes = await twoDService.getTotalPayoutAmount(startDate, endDate, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d get total payout amount :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTotalAgentCommissions(req, res) {
    try {
        const { startDate, endDate, session } = req.query;
        const serviceRes = await twoDService.getTotalAgentCommissions(startDate, endDate, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d get total agent commissions :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    updateAllNumberDetail,
    updateNumberDetailById,
    getTotalAmountForEachNumber,
    getTotalBetAmount,
    getTotalPayoutAmount,
    getTotalAgentCommissions
}