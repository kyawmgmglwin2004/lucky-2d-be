import { Router } from "express";
import statusManagementController from "./status_management_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const statusManagementRouter = Router();

statusManagementRouter.get("/get-status", authJwt.verifyAnyToken, statusManagementController.getStatus);
statusManagementRouter.put("/update-status/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), statusManagementController.updateStatus);
statusManagementRouter.get("/get-status-3d", authJwt.verifyAnyToken, statusManagementController.getStatusForThreeD);
statusManagementRouter.put("/update-status-3d/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), statusManagementController.updateStatusForThreeD);
statusManagementRouter.get("/current-status", authJwt.verifyAnyToken, statusManagementController.getCurrentThreeDStatus);
export default statusManagementRouter;  