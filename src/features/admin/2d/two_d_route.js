import { Router } from "express";
import twoDController from "./two_d_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const adminTwoDRouter = Router();

adminTwoDRouter.put("/update-all", authJwt.verifyAdmin, twoDController.updateAllNumberDetail);
adminTwoDRouter.put("/update-one/:id", authJwt.verifyAdmin, twoDController.updateNumberDetailById);
adminTwoDRouter.get("/list", authJwt.verifyAdmin, twoDController.getTotalAmountForEachNumber);
adminTwoDRouter.get("/total-bet-amount", authJwt.verifyAdmin, twoDController.getTotalBetAmount);
adminTwoDRouter.get("/total-payout-amount", authJwt.verifyAdmin, twoDController.getTotalPayoutAmount);
adminTwoDRouter.get("/total-agent-commission", authJwt.verifyAdmin, twoDController.getTotalAgentCommission);

export default adminTwoDRouter;