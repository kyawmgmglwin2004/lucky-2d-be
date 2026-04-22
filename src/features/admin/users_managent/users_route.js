import { Router } from "express";
import usersController from "./users_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const usersRouter = Router();

usersRouter.get("/allusers", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), usersController.getAllUsers);
usersRouter.put("/suspended/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), usersController.suspendedAndUnsuspendedUser);
usersRouter.put("/change-to-agent/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), usersController.changeToAgent);
usersRouter.get("/agent-commission", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), usersController.getAgentCommissionList);
usersRouter.put("/update-balance/:user_id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), usersController.updateUserWallet);

export default usersRouter;