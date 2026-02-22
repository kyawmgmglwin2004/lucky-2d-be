import { Router } from "express";
import adminController from "./user_controller.js";
import authJwt from "../../middlewear/authJwt.js";

const adminRouter = Router();

adminRouter.post("/login", adminController.userLogin);
adminRouter.post("/register", adminController.userRegister);
adminRouter.get("/me", authJwt.verifyAnyToken, adminController.getUserById);



export default adminRouter;