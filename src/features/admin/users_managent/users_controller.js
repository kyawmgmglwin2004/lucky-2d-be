import usersService from "./users_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllUsers(req, res) {
    try {
        const isActive = parseInt(req.query.is_active);

        const { id, phone, name, page = 1, limit = 10 } = req.query;
        
        const users = await usersService.getAlluser(id, isActive, phone, page, name, limit);

        return res.status(users.code).json(users);
    } catch (error) {
        console.log("Error get user list", error);
        return res.status(500).json("server error")
    }
}

async function suspendedAndUnsuspendedUser(req, res) {
    try {
        const id = req.params.id;
        const isActive  = req.body.isActive;
        console.log("========", id, isActive)
        // if(!id || isNaN(id) || id !== 'number' || !isActive || typeof isActive !== 'number') {
        //     return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid  ID or status"));
        // }

        const result = await usersService.banUpdate(id, isActive);
        return res.status(result.code).json(result);

    } catch (error) {
         console.error("Error updating users status:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to update users status"));
    }
}


export default {
    getAllUsers,
    suspendedAndUnsuspendedUser,
}