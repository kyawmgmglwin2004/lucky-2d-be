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
  limits: {
    fileSize: 5 * 1024 * 1024, 
  } 
});

const moneyRouter = Router();

moneyRouter.get("/topup/history", authJwt.verifyAdmin, moneyController.getTopupHistory);
moneyRouter.get("/topup/history/:id", authJwt.verifyAdmin, moneyController.getTopupHistoryDetail);
moneyRouter.post("/topup/request", authJwt.verifyAdmin, upload.single("image"), moneyController.topupRequest);
moneyRouter.get("/withdraw/history", authJwt.verifyAdmin, moneyController.getWithdrawHistory);
moneyRouter.post("/withdraw/request", authJwt.verifyAdmin, moneyController.withdrawRequest);

export default moneyRouter;

