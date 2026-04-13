import authJwt from "../../../middlewear/authJwt.js";
import adminService from "./auth_service.js";
import StatusCode from "../../../helper/statusCode.js";
import jwt from "jsonwebtoken";
import { config } from "../../../configs/config.js";

const ADM_SECRET = config.ADM_JWT_SECRET;

async function adminLogin(req, res) {
    try {
        const { phone, password, businessId } = req.body;
        console.log("Admin login request body:", req.body);
        if (!phone || isNaN(phone) || !password || !businessId || isNaN(businessId) || typeof phone !== 'string' || typeof password !== 'string' || typeof businessId !== 'string') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Missing phone, password, or businessId"));
        }

        const serviceRes = await adminService.adminLogin(phone, password, businessId);

        if (serviceRes.code === 200) {
            if (!serviceRes.data) {
                return res.status(500).json({ message: "Server Error: Admin data missing." });
            }

            const admin = serviceRes.data;
            const accessToken = authJwt.signAdminAccessToken(admin);
            const adminRefreshToken = authJwt.signAdminRefreshToken(admin);
            console.log("Admin login successful========:", admin);
            console.log("Access Token========:", accessToken);
            console.log("Refresh Token========:", adminRefreshToken);
            await adminService.saveRefreshToken(admin.id, adminRefreshToken);

            res.cookie('adminRefreshToken', adminRefreshToken, {
                httpOnly: true,
                secure: true, // true only if HTTPS
                sameSite: "None", // or "None" (cross-origin)
                domain: "zay2d3d.com",
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            return res.status(200).json(StatusCode.OK("Login success", { admin, accessToken }));
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        console.error("Error admin login action:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function adminRefreshToken(req, res) {
    try {
        const requestToken = req.cookies?.adminRefreshToken;

        if (!requestToken) {
            return res.status(401).json(StatusCode.UNAUTHENTICATED("No Refresh Token"));
        }

        const admin = await adminService.findAdminByRefreshToken(requestToken);
        if (!admin) {
            return res.status(401).json(StatusCode.UNAUTHENTICATED("Invalid Refresh Token"));
        }
        jwt.verify(requestToken, ADM_SECRET, (err, decoded) => {
            if (err || admin.data.id !== decoded.id) {
                return res.status(401).json(StatusCode.UNAUTHENTICATED("Token verification failed"));
            }
            const adminData = admin.data;
            const newAccessToken = authJwt.signAdminAccessToken(adminData);

            return res.status(200).json(StatusCode.OK("Token Refreshed", { accessToken: newAccessToken }));
        });

    } catch (error) {
        console.error("Refresh Token Error:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}


async function adminRegister(req, res) {
    try {
        const { userName, phone, password, businessId } = req.body;
        if (!userName || !phone || !password || !businessId || isNaN(businessId) || typeof businessId !== 'string' || isNaN(password) || typeof password !== 'string') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Missing required fields"));
        }
        const serviceRes = await adminService.adminRegister(userName, phone, password, businessId);

        if (serviceRes && serviceRes.code === 200) {
            return res.status(200).json(StatusCode.OK("Admin registered successfully"));
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        console.error("Error admin register action:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

export default {
    adminLogin,
    adminRegister,
    adminRefreshToken
};