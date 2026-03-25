import { Router } from "express";
import setAdminController from "./set_admin_controller.js"
import authJwt from "../../../middlewear/authJwt.js";

const setAdminRouter = Router();

setAdminRouter.post("/create-set-admin", authJwt.verifyAdmin, setAdminController.createNewAdmin );
setAdminRouter.get("/get-admin/:id", authJwt.verifyAdmin, setAdminController.getAdminById );
setAdminRouter.get("/get-all-admin", authJwt.verifyAdmin, setAdminController.getAllAdmins);
setAdminRouter.put("/update-admin/:id", authJwt.verifyAdmin, setAdminController.updateAdmin);
setAdminRouter.delete("/delete-admin/:id", authJwt.verifyAdmin, setAdminController.deleteAdmin);
setAdminRouter.put("/change-psw-admin/:id", authJwt.verifyAdmin, setAdminController.changeAdminPassword);

export default setAdminRouter;