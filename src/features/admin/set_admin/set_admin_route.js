import { Router } from "express";
import setAdminController from "./set_admin_controller.js"
import authJwt from "../../../middlewear/authJwt.js";
import { ROLES } from "../../../middlewear/admin_roles.js";

const setAdminRouter = Router();

setAdminRouter.post("/create-set-admin", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), setAdminController.createNewAdmin);
setAdminRouter.get("/get-admin/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), setAdminController.getAdminById);
setAdminRouter.get("/get-all-admin", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN, ROLES.VIEWER_ADMIN]), setAdminController.getAllAdmins);
setAdminRouter.put("/update-admin/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), setAdminController.updateAdmin);
setAdminRouter.delete("/delete-admin/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), setAdminController.deleteAdmin);
setAdminRouter.put("/change-psw-admin/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN]), setAdminController.changeAdminPassword);

export default setAdminRouter;