import threeDBetController from "./threed_bet_controller.js";
import { Router } from "express";
import authJwt from "../../middlewear/authJwt.js";

const threeDBetRouter = Router();

threeDBetRouter.post("/bet-three-d", authJwt.verifyAnyToken, threeDBetController.betThreeD);
threeDBetRouter.get("/three-d-list", authJwt.verifyAnyToken, threeDBetController.threeDList);
threeDBetRouter.get("/three-d-bet-history/:user_id", authJwt.verifyAnyToken, threeDBetController.getThreeDBetHistoryByUserId);

export default threeDBetRouter;
