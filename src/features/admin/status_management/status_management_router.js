import { Router } from "express";
import statusManagementController from "./status_management_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const statusManagementRouter = Router();

statusManagementRouter.get("/get-status", authJwt.verifyAdmin, statusManagementController.getStatus);
statusManagementRouter.put("/update-status/:id", authJwt.verifyAdmin, statusManagementController.updateStatus);
statusManagementRouter.get("/get-status-3d", authJwt.verifyAdmin, statusManagementController.getStatusForThreeD);
statusManagementRouter.put("/update-status-3d/:id", authJwt.verifyAdmin, statusManagementController.updateStatusForThreeD);

export default statusManagementRouter;  