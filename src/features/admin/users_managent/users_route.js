import { Router } from "express";
import usersController from "./users_controller.js";
import authJwt from "../../../middlewear/authJwt.js";

const usersRouter = Router();

usersRouter.get("/allusers", authJwt.verifyAdmin, usersController.getAllUsers);
usersRouter.put("/suspended/:id", authJwt.verifyAdmin, usersController.suspendedAndUnsuspendedUser);
usersRouter.put("/change-to-agent/:id", authJwt.verifyAdmin, usersController.changeToAgent);
usersRouter.get("/agent-commission", authJwt.verifyAdmin, usersController.getAgentCommissionList);

export default usersRouter;