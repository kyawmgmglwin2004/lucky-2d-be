import { Router } from "express";
import moneyController from "./money_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
const moneyRouter = Router();

moneyRouter.get("/topup/history", authJwt.verifyAdmin, moneyController.getAllTopupHistory);
moneyRouter.get("/withdraw/history", authJwt.verifyAdmin, moneyController.getAllWithdrawHistory);
moneyRouter.post("/topup/approved/:id",authJwt.verifyAdmin, moneyController.comfrimTopUpRequest);
moneyRouter.post("/withdraw/approved/:id",authJwt.verifyAdmin, moneyController.comfrimWithdrawRequest);

export default moneyRouter;