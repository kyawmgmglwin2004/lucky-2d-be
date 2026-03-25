import moneyService from "./money_service.js";
import StatusCode from "../../helper/statusCode.js";

async function getTopupHistory(req, res) {
    try {
        const userId = req.user.id; 
        const transactionType = "topup";

        if (!userId || isNaN(userId) || typeof userId !== 'number') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid user ID"));
        }

        const serviceRes = await moneyService.getTopupHistory(userId, transactionType);

        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error getting top-up history:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getTopupHistoryDetail(req, res) {
    try {
        const id = parseInt(req.params.id);
        const transactionType = "topup";

        if (!id || isNaN(id) || typeof id !== 'number') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid top-up history detail ID"));
        }

        const serviceRes = await moneyService.getTopupHistoryDetail(id, transactionType);

        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error getting top-up history detail:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function topupRequest(req, res) {
    try {
        const userId = req.user.id; 
        const { amount, paymentMethod , slipId} = req.body;
        const imageFile = req.file;
        const transactionType = "topup";
        const status = "pending";
        const numericAmount = parseFloat(amount); 
        const numericSlipId = parseInt(slipId);


        console.log("Top-up request data:", { userId, amount, transactionType, paymentMethod, status, slipId });

        if (!userId || isNaN(userId) || typeof userId !== 'number' || !numericAmount || isNaN(numericAmount) || typeof numericAmount !== 'number' || !paymentMethod || typeof paymentMethod !== 'string' || !imageFile || !numericSlipId || isNaN(numericSlipId) || typeof numericSlipId !== 'number' ) {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid top-up request data"));
        }

        if(numericAmount <= 0) {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Amount must be greater than zero"));
        }

            const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const serviceRes = await moneyService.topupRequest(userId, numericAmount, transactionType, paymentMethod, status, imageUrl, numericSlipId);

        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error processing top-up request:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function getWithdrawHistory(req, res) {
    try {
        const userId = req.user.id; 
        const transactionType = "withdraw";

        if (!userId || isNaN(userId) || typeof userId !== 'number') {
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid user ID"));
        }

        const serviceRes = await moneyService.getWithDrawHistory(userId, transactionType);

        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error getting withdrawal history:", error);

        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));
    }
}

async function withdrawRequest(req, res) {
    console.log("Received withdraw request with body:", req.body, req.user.id);
    try {
        const userId = parseInt(req.user.id); 
        
        // 1. ဒီနေရာမှာ Key နာမည်တွေ ပြောင်းပေးထားပါတယ်
        const { amount, payment_method, password, bankAccountName, bankAccountNumber } = req.body;
        
        const transactionType = "withdraw";
        const status = "pending";
        const numericAmount = parseFloat(amount);

        // 2. bankAccount ဆိုတာကို ဖြုတ်ပစ်ပြီး တိုက်ရိုက် ယူသုံးထားပါတယ်
        // const bankAccountName = req.body.bankAccount; // <--- ဒီလို မရေးတော့ပါနှင့်

        console.log("Checking variables:", { userId, password, numericAmount, payment_method, bankAccountName, bankAccountNumber });

        // 3. Validation Check
        if (
            !userId || isNaN(userId) || 
            !password || typeof password !== 'string' || 
            !numericAmount || isNaN(numericAmount) || numericAmount <= 0 || 
            !payment_method || typeof payment_method !== 'string' || // paymentMethod မှာ payment_method လို့ ပြောင်း
            !bankAccountName || typeof bankAccountName !== 'string' || // အခု မှန်ကန်ပါပြီ
            !bankAccountNumber || typeof bankAccountNumber !== 'string'
        ) {
            console.log("Validation Failed: Missing or wrong type data");
            return res.status(400).json(StatusCode.INVALID_ARGUMENT("Invalid withdrawal request data"));
        }
        
        // 4. Service ကို ပေးပို့တဲ့ နေရာမှာလည်း payment_method ကို ပေးပို့ရပါမယ်
        const serviceRes = await moneyService.withdrawRequest(userId, password, numericAmount, transactionType, payment_method, status, bankAccountName, bankAccountNumber);

        if (serviceRes.code === 200) {
            return res.status(200).json(serviceRes);
        }

        return res.status(serviceRes.code).json(serviceRes);

    } catch (error) {
         console.error("Error processing withdrawal request:", error);
        return res.status(500).json(StatusCode.UNKNOWN("SERVER ERROR"));        
    }
}



export default {
    getTopupHistory,
    getTopupHistoryDetail,
    topupRequest,
    getWithdrawHistory,
    withdrawRequest
}   
