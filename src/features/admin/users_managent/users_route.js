import { Router } from "express";
import usersController from "./users_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const usersRouter = Router();

usersRouter.get("/allusers", authJwt.verifyAdmin, usersController.getAllUsers);
usersRouter.put("/suspended/:id", authJwt.verifyAdmin, usersController.suspendedAndUnsuspendedUser);

export default usersRouter;