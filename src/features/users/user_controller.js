import authJwt from "../../middlewear/authJwt.js";
import userService from "./user_service.js";
import StatusCodes from "../../helper/statusCode.js";
import jwt from "jsonwebtoken";
import { config } from "../../configs/config.js";

const USER_SECRET = config.JWT_SECRET;

async function userLogin(req, res) {
    try {
        const { phone, password } = req.body;
        const serviceRes = await userService.userLogin(phone, password);
        if (serviceRes.code === 200) {

            if (!serviceRes.data) {
                return res.status(500).json({ message: "Server Error: User data missing." });
            }

            console.log("login user:", serviceRes.data);
            const user = serviceRes.data;
            const accessToken = authJwt.signUserAccessToken(user);
            const userRefreshToken = authJwt.signUserRefreshToken(user);
            await userService.saveRefreshToken(user.id, userRefreshToken);

            res.cookie("userRefreshToken", userRefreshToken, {
                httpOnly: true,
                secure: true, // true only if HTTPS
                sameSite: "None", // or "None" (cross-origin)
                domain: "zay2d3d.com",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days   
            });

            return res.status(200).json(StatusCodes.OK("login success", { user, accessToken }));
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        console.error("Error user login action:", error);

        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}

async function userRefreshToken(req, res) {
    try {
        const requestToken = req.cookies?.userRefreshToken;
        if (!requestToken) {
            return res.status(401).json(StatusCodes.UNAUTHENTICATED("No Refresh Token"));
        }
        const user = await userService.findUserByRefreshToken(requestToken);
        if (!user) {
            return res.status(401).json(StatusCodes.UNAUTHENTICATED("Invalid Refresh Token"));
        }
        console.log("user : ", user);
        console.log("secret : ", USER_SECRET);
        jwt.verify(requestToken, USER_SECRET, (err, decoded) => {
            if (err || user.data.id !== decoded.id) {

                console.log("Token verification failed", err, decoded, user.data.id);

                return res.status(401).json(StatusCodes.UNAUTHENTICATED("Token verification failed"));
            }
            const userData = user.data;
            const newAccessToken = authJwt.signUserAccessToken(userData);
            return res.status(200).json(StatusCodes.OK("Token Refreshed", { accessToken: newAccessToken }));
        });
    } catch (error) {
        console.error("Refresh Token Error:", error);
        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}

async function userRegister(req, res) {
    try {
        const { name, phone, password } = req.body;
        if (!name || !phone || !password) {
            return res.status(400).json(StatusCodes.INVALID_ARGUMENT("Missing required fields"));
        }
        const serviceRes = await userService.userRegister(name, phone, password);

        if (serviceRes && serviceRes.code === 200) {
            return res.status(200).json(StatusCodes.OK("user registered successfully", serviceRes.data));
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        console.error("Error user register action:", error);

        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}

async function getUserById(req, res) {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(400).json(StatusCodes.INVALID_ARGUMENT("User ID is required"));
        }

        const serviceRes = await userService.getUserById(userId);

        if (serviceRes.code === 200) {
            return res.status(200).json(StatusCodes.OK("User profile retrieved successfully", serviceRes.data));
        }

        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}

async function getBalance(req, res) {
    try {
        const userId = req.user.id;
        if (!userId) {
            return res.status(400).json(StatusCodes.INVALID_ARGUMENT("User ID is required"));
        }
        const serviceRes = await userService.getBalance(userId);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error fetching balance:", error);
        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}

async function addReferCode(req, res) {
    try {
        const userId = req.user.id;
        const referCode = req.body.refer_code;
        const serviceRes = await userService.addReferCode(userId, referCode);
        return res.status(serviceRes.code).json(serviceRes);
    } catch (error) {
        console.error("Error adding refer code:", error);
        return res.status(500).json(StatusCodes.UNKNOWN("SERVER ERROR"));
    }
}


export default {
    userLogin,
    userRegister,
    getUserById,
    userRefreshToken,
    getBalance,
    addReferCode
}