import threedBetService from "./threed_bet_service.js";
import StatusCode from "../../helper/statusCode.js";


async function betThreeD(req, res) {
    try {
        const { user_id, bets, session } = req.body;
        const type = "3d";
        const serviceRes = await threedBetService.betThreeD(user_id, bets, type, session);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d bet :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}


async function threeDList(req, res) {
    try {
        const { category_key } = req.query;
        if (!category_key || typeof category_key !== "string") {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("require category_key for get 3D number"));
        }
        const serviceRes = await threedBetService.threeDList(category_key);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d list :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getThreeDBetHistoryByUserId(req, res) {
    try {
        const { user_id } = req.params;
        const { page = 1, limit = 10, filterdate = null, session = null } = req.query;
        const type = "3d";
        const serviceRes = await threedBetService.getThreeDBetHistoryByUserId(user_id, page, limit, filterdate, session, type);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d bet history :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getWinnerList(req, res) {
    try {
        const { page, limit, filterdate } = req.query;
        const type = "3d";
        const serviceRes = await threedBetService.getWinnerList(page, limit, filterdate, type);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("3d winner list :", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    betThreeD,
    threeDList,
    getThreeDBetHistoryByUserId,
    getWinnerList
}