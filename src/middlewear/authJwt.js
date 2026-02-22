import jwt from "jsonwebtoken";
import StatusCode from "../helper/statusCode.js";
import { config } from "../configs/config.js";

// 1. Secret Key ကို သတ်မှတ်ခြင်း
// လုံခြုံရေးအရ Admin နှင့် User အတွက် Key သီးသန့်သုံးသင့်ပါတယ်။ 
// လောလောဆယ်တော့ Admin Key ကိုပဲ အသုံးပြုထားပါမယ်။
const User_SECRET = config.JWT_SECRET ;
const ADM_SECRET = config.ADM_JWT_SECRET ;

// 2. Admin Token Sign လုပ်ခြင်း
function signAdminToken(admin, options = {}) {
  const payload = {
    id: admin.id,
    userName: admin.userName,
    email: admin.email,
    role: "admin", // Role ကို သတ်မှတ်ထားပါသည်
  };

  const signOptions = {
    expiresIn: options.expiresIn || config.JWT_EXPIRES_IN, // အချိန်ကန့်သတ်ချက်
  };

  return jwt.sign(payload, ADM_SECRET, signOptions);
}

// 3. Customer (User) Token Sign လုပ်ခြင်း
function signCustomerToken(user, options = {}) {
  const payload = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: "customer", // User ဖြစ်ကြောင်း Role ထည့်ထားပါသည်
  };

  const signOptions = {
    expiresIn: options.expiresIn || "24h", // User တွေအတွက် ပိုရှည်ထားလှောက်
  };

  // လုံခြုံရေးအရ USER_SECRET သီးသန့်သုံးသင့်ပါတယ်။ လောလောဆယ်တော့ SECRET ကိုပဲ သုံးထားပါမယ်။
  return jwt.sign(payload, User_SECRET, signOptions);
}

// 4. Header ထဲက Token ကို ဖြတ်ယူခြင်း (Helper Function)
function _extractToken(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) return null;
  
  // "Bearer <token>" ပုံစံ စစ်ဆေးခြင်း
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  
  return parts[1];
}

// 5. Verify Token Middleware
function verifyToken() {
  return (req, res, next) => {
    try {
      const token = _extractToken(req);
      console.log("Extracted Token:", token);

      if (!token) {
        return res.status(401).json(StatusCode.UNAUTHENTICATED("No token provided"));
      }

      let decoded;
      try {
        decoded = jwt.verify(token, User_SECRET);
      } catch (err) {
        console.error("JWT Verify Error:", err);
        return res.status(401).json(StatusCode.UNAUTHENTICATED("Invalid or expired token"));
      }

      if (!decoded) {
        return res.status(401).json(StatusCode.UNAUTHENTICATED("Invalid token payload"));
      }

      if (decoded.role === "admin") {
        req.admin = decoded; 
      } else {
        req.user = decoded; 
      }

      next(); 
      
    } catch (error) {
      console.error("authJwt middleware error:", error);
      return res.status(500).json(StatusCode.UNKNOWN("Authentication error"));
    }
  };
}

// Verify Function ကို ခေါ်သုံးရလွယ်အောင် Export
const verifyAnyToken = verifyToken();

export default {
  signAdminToken,
  signCustomerToken,
  verifyAnyToken,
};