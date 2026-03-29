import { Router } from "express";
import phoneController from "./phone_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const phoneRouter = Router();

phoneRouter.use(authJwt.verifyAdmin);
phoneRouter.post("/create", phoneController.createPhone);
phoneRouter.post("/update", phoneController.updatePhone);
phoneRouter.post("/delete", phoneController.deletePhone);
phoneRouter.get("/get-all", phoneController.getAllPhone);

export default phoneRouter;