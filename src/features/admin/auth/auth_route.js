import { Router } from "express";
import authController from "./auth_controller.js";
// import authJwt from "../../middlewear/authJwt.js";

const authRouter = Router();

authRouter.post("/login", authController.adminLogin);
authRouter.post("/register", authController.adminRegister);
authRouter.post("/refresh-token", authController.adminRefreshToken);

export default authRouter;