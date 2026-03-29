import { Router } from "express";
import moneyController from "./money_controller.js";
import authJwt from "../../middlewear/authJwt.js";
import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const moneyRouter = Router();

moneyRouter.get("/topup/history", authJwt.verifyAnyToken, moneyController.getTopupHistory);
moneyRouter.get("/topup/history/:id", authJwt.verifyAnyToken, moneyController.getTopupHistoryDetail);
moneyRouter.post("/topup/request", authJwt.verifyAnyToken, upload.single("image"), moneyController.topupRequest);
moneyRouter.get("/withdraw/history", authJwt.verifyAnyToken, moneyController.getWithdrawHistory);
moneyRouter.post("/withdraw/request", authJwt.verifyAnyToken, moneyController.withdrawRequest);

export default moneyRouter;

