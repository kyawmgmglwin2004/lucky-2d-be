import { Router } from "express";
import moneyController from "./money_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";
const moneyRouter = Router();

moneyRouter.get("/topup/history", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), moneyController.getAllTopupHistory);
moneyRouter.get("/withdraw/history", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), moneyController.getAllWithdrawHistory);
moneyRouter.post("/topup/approved/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), moneyController.comfrimTopUpRequest);
moneyRouter.post("/withdraw/approved/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), moneyController.comfrimWithdrawRequest);
moneyRouter.get("/total/topup", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), moneyController.getTotalTopupAmountToday);
moneyRouter.get("/total/withdraw", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), moneyController.getTotalWithdrawAmountToday);
moneyRouter.delete("/transaction/delete-all", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), moneyController.deleteAllTransaction);

export default moneyRouter;