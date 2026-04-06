import { Router } from "express";
import threeDController from "./three_d_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const adminThreeDRouter = Router();

adminThreeDRouter.put("/update-all", authJwt.verifyAdmin, threeDController.updateAllNumberDetail);
adminThreeDRouter.put("/update-one/:id", authJwt.verifyAdmin, threeDController.updateNumberDetailById);
adminThreeDRouter.get("/list", authJwt.verifyAdmin, threeDController.getTotalAmountForEachNumber);

export default adminThreeDRouter;