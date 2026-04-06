import twoDService from "./three_d_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function updateAllNumberDetail(req, res) {
    try {
        const { rate, status_limit_amount, real_limit_amount } = req.body;
        const serviceRes = await twoDService.updateAllNumberDetails(rate, status_limit_amount, real_limit_amount);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d update all numbers :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}


async function updateNumberDetailById(req, res) {
    try {
        const id = req.params.id;
        const { rate, status_limit_amount, real_limit_amount } = req.body;
        const serviceRes = await twoDService.updateNumberDetailById(id, rate, status_limit_amount, real_limit_amount);
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

export default {
    updateAllNumberDetail,
    updateNumberDetailById,
    getTotalAmountForEachNumber
}