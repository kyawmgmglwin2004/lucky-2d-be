import { Router } from "express";
import twoDController from "./two_d_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const adminTwoDRouter = Router();

adminTwoDRouter.put("/update-all", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), twoDController.updateAllNumberDetail);
adminTwoDRouter.put("/update-one/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), twoDController.updateNumberDetailById);
adminTwoDRouter.get("/list", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), twoDController.getTotalAmountForEachNumber);
adminTwoDRouter.get("/total-bet-amount", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), twoDController.getTotalBetAmount);
adminTwoDRouter.get("/total-payout-amount", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), twoDController.getTotalPayoutAmount);
adminTwoDRouter.get("/total-agent-commission", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), twoDController.getTotalAgentCommission);

export default adminTwoDRouter;