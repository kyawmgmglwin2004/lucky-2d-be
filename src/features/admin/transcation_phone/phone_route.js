import { Router } from "express";
import phoneController from "./phone_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const phoneRouter = Router();

phoneRouter.post("/create", authJwt.verifyAdmin, phoneController.createPhone);
phoneRouter.post("/update/:id", authJwt.verifyAdmin, phoneController.updatePhone);
phoneRouter.delete("/delete/:id", authJwt.verifyAdmin, phoneController.deletePhone);
phoneRouter.get("/get-all", authJwt.verifyAdmin, phoneController.getAllPhone);

export default phoneRouter;