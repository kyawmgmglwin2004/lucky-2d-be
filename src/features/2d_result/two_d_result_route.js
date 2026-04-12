import { Router } from "express";
import twoDResultController from "./two_d_result_controller.js";

const twoDResultRouter = Router();

twoDResultRouter.get("/list", twoDResultController.get2dResult);

export default twoDResultRouter;