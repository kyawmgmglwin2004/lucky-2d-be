import { Router } from "express";
import authJwt from "../../../middlewear/authJwt.js";
import threeDResultController from "./three_d_result_controller.js";

const threeDResultRouter = Router();

threeDResultRouter.post("/create", authJwt.verifyAdmin, threeDResultController.create3DResult);
threeDResultRouter.get("/list", authJwt.verifyAnyToken, threeDResultController.get3DResult);

export default threeDResultRouter;