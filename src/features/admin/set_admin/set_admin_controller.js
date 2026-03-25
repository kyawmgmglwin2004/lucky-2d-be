import StatusCode from "../../../helper/statusCode.js";
import setAdminService from "./set_admin_service.js"

async function createNewAdmin(req, res) {
    try {
        console.log("req", req.body)
        const {business_id, username, phone, password, role} = req.body;

        const serviceRes = await setAdminService.createNewAdmin(business_id, username, phone, password, role);

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        
        console.error("create new admin :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getAllAdmins(req, res) {
    try {

        console.log("call this");
        const serverRes = await setAdminService.getAllAdmins();
        return res.status(serverRes.code).json(serverRes);

    } catch (error) {

        console.error("get all admin :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getAdminById(req, res) {
    try {
        const id = req.params.id;
        console.log("id", id)

        const serviceRes = await setAdminService.getAdminById(id);

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {

        console.error("get admin by Id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function updateAdmin(req, res) {
    try {
        const id = req.params.id;
        const { business_id, username, phone, password, role} = req.body;

        const serviceRes = await setAdminService.updateAdmin(id, business_id, username, phone, password, role);

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {

        console.error("update  admin by Id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));

    }
}

async function deleteAdmin(req, res) {
    try {
        const id = req.params.id;
        
        const serviceRes = await setAdminService.deleteAdmin(id);

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {

        console.error("delete  admin by Id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function changeAdminPassword(req, res) {
    try {
        const id = req.params.id;
        const {oldPassword , newPassword} = req.body;

        const serviceRes = await setAdminService.changeAdminPassword(id, oldPassword, newPassword);

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
        
         console.error("update  password by Id :", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));

    }
}

export default {
    createNewAdmin,
    getAdminById,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    changeAdminPassword
}