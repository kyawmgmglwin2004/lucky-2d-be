import { Router } from "express";
import user from "./features/users/user_route.js";
import moneyRouter from "./features/money_transation/money_route.js";
import authRouter from "./features/admin/auth/auth_route.js";
import adminMoneyRouter from "./features/admin/money_transation/money_route.js";
import usersRouter from "./features/admin/users_managent/users_route.js";
import twoDListRouter from "./features/2d_bet/twod_list_route.js";
import adminTwoDRouter from "./features/admin/2d/two_d_route.js";
import setAdminRouter from "./features/admin/set_admin/set_admin_route.js";
import phoneRouter from "./features/admin/transcation_phone/phone_route.js";
import imageRouter from "./features/admin/slide_images/image_route.js";
import threeDBetRouter from "./features/3d-bet/threed_bet_route.js";
import adminThreeDRouter from "./features/admin/3d/three_d_route.js";
import threeDResultRouter from "./features/admin/3d_result/three_d_result_route.js";



const router = Router();



router.use("/user", user);
router.use("/money", moneyRouter);
router.use("/admin/auth", authRouter);
router.use("/admin/users", usersRouter);
router.use("/admin/money", adminMoneyRouter);
router.use("/admin/two-d", adminTwoDRouter)
router.use("/twod", twoDListRouter);
router.use("/set-admin", setAdminRouter);
router.use("/admin/phone", phoneRouter);
router.use("/admin/image", imageRouter);
router.use("/threed", threeDBetRouter);
router.use("/admin/three-d", adminThreeDRouter);
router.use("/admin/three-d-result", threeDResultRouter);


export default router;