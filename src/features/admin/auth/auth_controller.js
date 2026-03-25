import authJwt from "../../../middlewear/authJwt.js";
import adminService from "./auth_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function adminLogin(req, res) {
    try {
        const { phone, password, businessId } = req.body;
        console.log("Admin login request body:", req.body);
        if (!phone || isNaN(phone) || !password || !businessId || isNaN(businessId) || typeof phone !== 'string' || typeof password !== 'string' || typeof businessId !== 'string' ) {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Missing phone, password, or businessId"));
        }
        const serviceRes = await adminService.adminLogin(phone, password, businessId);

        if (serviceRes.code === 200) {
            if (!serviceRes.data) {
                return res.status(500).json({ message: "Server Error: Admin data missing." });
            }

            const admin = serviceRes.data;
            const token = authJwt.signAdminToken(admin);
            console.log("Admin login successful========:", admin);
        
            return res.status(200).json(StatusCode.OK("Login success", { admin, token }));
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error admin login action:", error);

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
    adminRegister
};