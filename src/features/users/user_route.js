import { Router } from "express";
import userController from "./user_controller.js";
import authJwt from "../../middlewear/authJwt.js";

const userRouter = Router();

userRouter.post("/login", userController.userLogin);
userRouter.post("/register", userController.userRegister);
userRouter.get("/me", authJwt.verifyAnyToken, userController.getUserById);
userRouter.post("/refresh-token", userController.userRefreshToken);
userRouter.get("/get-balance", authJwt.verifyAnyToken, userController.getBalance);

export default userRouter;