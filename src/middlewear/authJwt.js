import jwt from "jsonwebtoken";
import StatusCode from "../helper/statusCode.js";
import { config } from "../configs/config.js";
import Mysql from "../helper/db.js"


const User_SECRET = config.JWT_SECRET;
const ADM_SECRET = config.ADM_JWT_SECRET;

function signAdminAccessToken(admin) {
  const payload = {
    id: admin.id,
    userName: admin.userName,
    email: admin.phone,
    businessId: admin.business_id,
    role: admin.role,
  };

  const signOptions = {
    expiresIn: "10m",
  };

  return jwt.sign(payload, ADM_SECRET, signOptions);
}

function signAdminRefreshToken(admin) {
  const payload = {
    id: admin.id,
    userName: admin.userName,
    email: admin.phone,
    businessId: admin.business_id,
    role: "admin",
  };

  const signOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(payload, ADM_SECRET, signOptions);
}


function signUserAccessToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: "user",
  };

  const signOptions = {
    expiresIn: "10m",
  };

  return jwt.sign(payload, User_SECRET, signOptions);
}


function signUserRefreshToken(user) {
  const payload = {
    id: user.id,
  };

  const signOptions = {
    expiresIn: "7d",
  };

  return jwt.sign(payload, User_SECRET, signOptions);
}

function _extractToken(req) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

function verifyToken() {
  return async (req, res, next) => {
    const token = _extractToken(req);

    if (!token) {
      return res.status(401).json(
        StatusCode.UNAUTHENTICATED("No token provided")
      );
    }

    let decoded;

    // 🔹 1. Verify token (user or admin)
    try {
      decoded = jwt.verify(token, User_SECRET);
    } catch (err) {
      try {
        decoded = jwt.verify(token, ADM_SECRET);
      } catch (err2) {
        return res.status(401).json(
          StatusCode.UNAUTHENTICATED("Invalid or expired token")
        );
      }
    }

    let connection;

    try {
      connection = await Mysql.getConnection();

      // 🔹 2. If USER → check ban status
      if (decoded.role === "user") {
        const [rows] = await connection.query(
          "SELECT is_active FROM users WHERE id = ?",
          [decoded.id]
        );

        if (rows.length === 0) {
          return res.status(404).json(
            StatusCode.NOT_FOUND("User not found")
          );
        }

        // 🚫 BAN CHECK
        if (rows[0].is_active === 0) {
          return res.status(403).json(
            StatusCode.UNAUTHENTICATED("Account has been banned")
          );
        }

        req.user = decoded;
      }

      // 🔹 3. If ADMIN → just pass
      else if (decoded.role === "admin") {
        req.admin = decoded;
      }

      next();

    } catch (error) {
      console.error("Verify token error:", error);
      return res.status(500).json(
        StatusCode.UNKNOWN("Database error")
      );
    } finally {
      if (connection) connection.release();
    }
  };
}

export function verifyAdmin(allowedRoles = []) {
  return (req, res, next) => {
    const token = _extractToken(req);

    if (!token) {
      return res.status(401).json(
        StatusCode.UNAUTHENTICATED("No token provided")
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(token, ADM_SECRET);
    } catch (err) {
      return res.status(401).json(
        StatusCode.UNAUTHENTICATED("Invalid or expired token")
      );
    }

    if (!decoded.role) {
      return res.status(403).json(
        StatusCode.UNAUTHENTICATED("Not an admin")
      );
    }

    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json(
        StatusCode.PERMISSION_DENIED("သင့်အတွက်ခွင့်ပြုချက်မရှိပါ")
      );
    }

    req.admin = decoded;
    next();
  };
}


const verifyAnyToken = verifyToken();
// const verifyAdmin = verifyAdminToken();

export default {
  signAdminAccessToken,
  signAdminRefreshToken,
  signUserAccessToken,
  signUserRefreshToken,
  verifyAnyToken,
  verifyAdmin
};