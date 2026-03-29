import moneyService from "./money_service.js";
import StatusCode from "../../../helper/statusCode.js";

async function getAllTopupHistory(req, res) {
    try {
        const transactionType = "topup";
        const status = req.query.status;

        const transactions = await moneyService.getAllRequests(transactionType, status);
        res.status(transactions.code).json(transactions);

    } catch (error) {
        console.error("Error fetching money transactions:", error);
        res.status(500).json(StatusCode.UNKNOWN("Failed to fetch money transactions"));
    }
}

async function getAllWithdrawHistory(req, res) {
    try {
        const transactionType = "withdraw";
        const status = req.query.status;

        const transactions = await moneyService.getAllRequests(transactionType, status);
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
        console.log("======", id, status)

        const topup = await moneyService.comfrimRequest(id, status, transactionType);
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
        console.log("======", id, status)

        const withdraw = await moneyService.comfrimRequest(id, status, transactionType);
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

export default {
    getAllTopupHistory,
    getAllWithdrawHistory,
    comfrimTopUpRequest,
    comfrimWithdrawRequest,
    updateMoneyTransactionStatus
}
