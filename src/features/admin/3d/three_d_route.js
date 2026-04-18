import { Router } from "express";
import threeDController from "./three_d_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const adminThreeDRouter = Router();

adminThreeDRouter.put("/update-all", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), threeDController.updateAllNumberDetail);
adminThreeDRouter.put("/update-one/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), threeDController.updateNumberDetailById);
adminThreeDRouter.get("/list", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), threeDController.getTotalAmountForEachNumber);
adminThreeDRouter.get("/total-bet-amount", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), threeDController.getTotalBetAmount);
adminThreeDRouter.get("/total-payout-amount", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), threeDController.getTotalPayoutAmount);
adminThreeDRouter.get("/total-agent-commission", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), threeDController.getTotalAgentCommissions);

export default adminThreeDRouter;