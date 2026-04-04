import { Router } from "express";
import imageController from "./image_controller.js";
import authJwt from "../../../middlewear/authJwt.js";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const imageRouter = Router();

imageRouter.post("/create", authJwt.verifyAnyToken, upload.single("image"), imageController.createImage);
imageRouter.post("/update/:id", authJwt.verifyAnyToken, upload.single("image"), imageController.updateImage);
imageRouter.delete("/delete/:id", authJwt.verifyAnyToken, imageController.deleteImage);
imageRouter.get("/get-all", imageController.getAllImages);

export default imageRouter;