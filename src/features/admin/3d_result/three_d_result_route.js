import { Router } from "express";
import authJwt from "../../../middlewear/authJwt.js";
import threeDResultController from "./three_d_result_controller.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const threeDResultRouter = Router();

threeDResultRouter.post("/create", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), threeDResultController.create3DResult);
threeDResultRouter.get("/list", authJwt.verifyAnyToken, threeDResultController.get3DResult);

export default threeDResultRouter;