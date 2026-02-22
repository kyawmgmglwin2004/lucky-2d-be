import { Router } from "express";
import user from "./features/users/user_route.js";

const router = Router();

// router.use("/", books);

// router.use("/orders", mail);

router.use("/user", user);

// router.use("/orderList", order)

export default router;