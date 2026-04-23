import usersService from "./users_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllUsers(req, res) {
    try {
        const isActive = parseInt(req.query.is_active);

        const { id, phone, name, role, page = 1, limit = 10 } = req.query;

        const users = await usersService.getAlluser(id, isActive, phone, role, page, name, limit);

        return res.status(users.code).json(users);
    } catch (error) {
        console.log("Error get user list", error);
        return res.status(500).json("server error")
    }
}

async function suspendedAndUnsuspendedUser(req, res) {
    try {
        const id = req.params.id;
        const isActive = req.body.isActive;

        const result = await usersService.banUpdate(id, isActive);
        return res.status(result.code).json(result);

    } catch (error) {
        console.error("Error updating users status:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to update users status"));
    }
}

async function changeToAgent(req, res) {
    try {
        const id = req.params.id;
        const { role, agentCode, twoDpercent, threeDpercent } = req.body;

        const result = await usersService.changeToAgent(id, role, agentCode, twoDpercent, threeDpercent);
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Error changing user to agent:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to change user to agent"));
    }
}

async function getAgentCommissionList(req, res) {
    try {
        const { agentId, page = 1, limit = 10, filterDate } = req.query;

        const users = await usersService.getAgentCommissionList(agentId, page, limit, filterDate);

        return res.status(users.code).json(users);
    } catch (error) {
        console.log("Error get agent commission list", error);
        return res.status(500).json("server error")
    }
}

async function updateUserWallet(req, res) {
    try {
        const user_id = req.params.user_id;
        const { amount } = req.body;

        const result = await usersService.updateUserWallet(user_id, amount);
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Error updating user wallet:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to update user wallet"));
    }
}

async function getAlluserTotalBalence(req, res) {
    try {
        const result = await usersService.getAlluserTotalBalence();
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Error getting all user total balence:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to get all user total balence"));
    }
}

async function getAllAgentTotalCommission(req, res) {
    try {
        const result = await usersService.getAllAgentTotalCommission();
        return res.status(result.code).json(result);
    } catch (error) {
        console.error("Error getting all agent total commission:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to get all agent total commission"));
    }
}

export default {
    getAllUsers,
    suspendedAndUnsuspendedUser,
    changeToAgent,
    getAgentCommissionList,
    updateUserWallet,
    getAlluserTotalBalence,
    getAllAgentTotalCommission
}