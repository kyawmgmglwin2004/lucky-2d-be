import authJwt from "../../middlewear/authJwt.js";
import userService from "./user_service.js";
import StatusCodes from "../../helper/statusCode.js";
import jwt from "jsonwebtoken";
import { config } from "../../configs/config.js";

const USER_SECRET = config.USER_JWT_SECRET;

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
            const refreshToken = authJwt.signUserRefreshToken(user);
            await userService.saveRefreshToken(user.id, refreshToken);

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                // secure: true,
                // sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
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
        const requestToken = req.cookies?.refreshToken;
        if (!requestToken) {
            return res.status(401).json(StatusCodes.UNAUTHENTICATED("No Refresh Token"));
        }
        const user = await userService.findUserByRefreshToken(requestToken);
        if (!user) {
            return res.status(403).json(StatusCodes.FORBIDDEN("Invalid Refresh Token"));
        }
        jwt.verify(requestToken, USER_SECRET, (err, decoded) => {
            if (err || user.id !== decoded.id) {
                return res.status(403).json(StatusCodes.FORBIDDEN("Token verification failed"));
            }
            const newAccessToken = authJwt.signUserAccessToken(user);
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

export default {
    userLogin,
    userRegister,
    getUserById,
    userRefreshToken
}