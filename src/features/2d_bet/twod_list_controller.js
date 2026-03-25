import twodListService from "./twod_list_service.js";
import StatusCode from "../../helper/statusCode.js";

async function twoDList(req , res) {
    console.log("reach=======")
    try {
        console.log("reach=======၁၁၁၁၁၁၁")
         const { category_key,  page = 1, limit = 100 } = req.query;

        if( !category_key || typeof category_key !== "string") {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("require category_key for get 2D number"));
        }

        const serviceRes = await twodListService.twoDList(category_key, page, limit);

        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d number get :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));

    }
}

async function createNewNumbersList(req, res) {
    try {   
        const { category_key, numbers } =  req.body;
        if(!category_key || typeof category_key !== "string" || !numbers || typeof numbers !== "object") {
        return StatusCode.INVALID_ARGUMENT("require category_key and numbers list for create new number list");
        }

        const serviceRes = await twodListService.createNewNumbersList(category_key, numbers);
        
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
         console.error("2d new create category", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));

    }
}

async function betTwoD(req, res) {
    try {
        const {user_id ,  bets} = req.body;
        const type = "2d"
        const serviceRes = await twodListService.betTwoD(user_id,bets , type  );

        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d bet :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function betTwoDListByUserId(req, res) {
    try {
        const userId = req.params.userId;
        console.log("=====userId", userId)
        const serviceRes = await twodListService.betTwoDListByUserId(userId);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("2d bet history by userId :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    twoDList,
    createNewNumbersList,
    betTwoD,
    betTwoDListByUserId
}