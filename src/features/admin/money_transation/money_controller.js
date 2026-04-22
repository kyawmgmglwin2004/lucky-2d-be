import moneyService from "./money_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllTopupHistory(req, res) {
    try {
        const transactionType = "topup";
        const { status, page = 1, limit = 10, filterDate } = req.query;
        const transactions = await moneyService.getAllRequests(transactionType, status, page, limit, filterDate);
        res.status(transactions.code).json(transactions);

    } catch (error) {
        console.error("Error fetching money transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to fetch money transactions"));
    }
}

async function getAllWithdrawHistory(req, res) {
    try {
        const transactionType = "withdraw";
        const { status, page = 1, limit = 10, filterDate } = req.query;

        const transactions = await moneyService.getAllRequests(transactionType, status, page, limit, filterDate);
        res.status(transactions.code).json(transactions);

    } catch (error) {
        console.error("Error fetching money transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to fetch money transactions"));
    }
}

async function comfrimTopUpRequest(req, res) {
    try {
        const transactionType = 'topup';
        const status = req.body.status;
        const id = parseInt(req.params.id);
        const adminId = req.body.admin_id;

        const topup = await moneyService.comfrimRequest(id, status, transactionType, adminId);
        res.status(topup.code).json(topup);

    } catch (error) {
        console.error("Error fetching money transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to topup"));
    }
}

async function comfrimWithdrawRequest(req, res) {
    try {
        const transactionType = 'withdraw';
        const status = req.body.status;
        const id = parseInt(req.params.id);
        const adminId = req.body.admin_id;

        const withdraw = await moneyService.comfrimRequest(id, status, transactionType, adminId);
        res.status(withdraw.code).json(withdraw);

    } catch (error) {
        console.error("Error fetching money transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to withdraw"));
    }
}


async function updateMoneyTransactionStatus(req, res) {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!id || isNaN(id) || typeof id !== 'number' || !status || typeof status !== 'string') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid transaction ID or status"));
        }

        const result = await moneyService.updateMoneyTransactionStatus(id, status);
        res.status(result.code).json(result);
    } catch (error) {
        console.error("Error updating money transaction status:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to update money transaction status"));
    }
}

async function getTotalTopupAmountToday(req, res) {
    try {
        const transactionType = "topup";
        const status = "approved";

        const totalAmount = await moneyService.getTotalAmountToday(transactionType, status);
        res.status(totalAmount.code).json(totalAmount);
    } catch (error) {
        console.error("Error getting total amount today:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to get total amount today"));
    }
}

async function getTotalWithdrawAmountToday(req, res) {
    try {
        const transactionType = "withdraw";
        const status = "approved";

        const totalAmount = await moneyService.getTotalAmountToday(transactionType, status);
        res.status(totalAmount.code).json(totalAmount);
    } catch (error) {
        console.error("Error getting total amount today:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to get total amount today"));
    }
}

async function deleteAllTransaction(req, res) {
    try {
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Start date and end date are required"));
        }

        const result = await moneyService.deleteTransactionsByDate(startDate, endDate);
        res.status(result.code).json(result);
    } catch (error) {
        console.error("Error deleting transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to delete transactions"));
    }
}

export default {
    getAllTopupHistory,
    getAllWithdrawHistory,
    comfrimTopUpRequest,
    comfrimWithdrawRequest,
    updateMoneyTransactionStatus,
    getTotalTopupAmountToday,
    getTotalWithdrawAmountToday,
    deleteAllTransaction
}
