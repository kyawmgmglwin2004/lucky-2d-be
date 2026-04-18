import { Router } from "express";
import imageController from "./image_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import multer from "multer";
import { ROLES } from "../../../middlewear/admin_roles.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const imageRouter = Router();

imageRouter.post("/create", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), upload.single("image"), imageController.createImage);
imageRouter.post("/update/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), upload.single("image"), imageController.updateImage);
imageRouter.delete("/delete/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), imageController.deleteImage);
imageRouter.get("/get-all", imageController.getAllImages);
imageRouter.post("/create-text", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), imageController.createText);
imageRouter.post("/update-text/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), imageController.updateText);
imageRouter.delete("/delete-text/:id", authJwt.verifyAdmin([ROLES.SUPER_ADMIN, ROLES.SET_ADMIN]), imageController.deleteText);
imageRouter.get("/get-all-text", imageController.getAllText);

export default imageRouter;