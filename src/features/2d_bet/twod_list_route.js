import twoDListController from "./twod_list_controller.js";
import { Router } from "express";
import authJwt from "../../middlewear/authJwt.js";

const twoDListRouter = Router();

twoDListRouter.get("/two-d-numbers-list", authJwt.verifyAnyToken, twoDListController.twoDList);
twoDListRouter.post("/create-new-category", authJwt.verifyAnyToken, twoDListController.createNewNumbersList);
twoDListRouter.post("/bet-two-d", authJwt.verifyAnyToken, twoDListController.betTwoD);
twoDListRouter.get("/bet-history/:userId", authJwt.verifyAnyToken, twoDListController.betTwoDListByUserId);

export default twoDListRouter;