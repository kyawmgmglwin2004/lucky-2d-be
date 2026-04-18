import { Router } from "express";
import phoneController from "./phone_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const phoneRouter = Router();

phoneRouter.post("/create", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), phoneController.createPhone);
phoneRouter.post("/update/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), phoneController.updatePhone);
phoneRouter.delete("/delete/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), phoneController.deletePhone);
phoneRouter.get("/get-all", authJwt.verifyAnyToken, phoneController.getAllPhone);

export default phoneRouter;