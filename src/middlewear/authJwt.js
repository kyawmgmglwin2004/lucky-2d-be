import jwt from "jsonwebtoken";
import StatusCode from "../helper/statusCode.js";
import { config } from "../configs/config.js";


const User_SECRET = config.JWT_SECRET;
const ADM_SECRET = config.ADM_JWT_SECRET;

function signAdminAccessToken(admin) {
  const payload = {
    id: admin.id,
    userName: admin.userName,
    email: admin.phone,
    businessId: admin.business_id,
    role: "admin",
  };

  const signOptions = {
    expiresIn: "1m",
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
    expiresIn: "1m",
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
  return (req, res, next) => {

    const token = _extractToken(req);

    if (!token) {
      return res.status(401).json(StatusCode.UNAUTHENTICATED("No token provided"));
    }

    let decoded;

    try {
      decoded = jwt.verify(token, User_SECRET);
    } catch (err) {

      try {
        decoded = jwt.verify(token, ADM_SECRET);
      } catch (err2) {
        return res.status(401).json(StatusCode.UNAUTHENTICATED("Invalid or expired token"));
      }

    }

    if (decoded.role === "admin") {
      req.admin = decoded;
    } else {
      req.user = decoded;
    }

    next();
  };
}

function verifyAdminToken() {
  return (req, res, next) => {

    console.log("reach")
    const token = _extractToken(req);


    if (!token) {
      return res.status(401).json(StatusCode.UNAUTHENTICATED("No token provided"));
    }

    let decoded;

    try {
      decoded = jwt.verify(token, ADM_SECRET);
    } catch (err) {
      return res.status(401).json(StatusCode.UNAUTHENTICATED("Invalid or expired Admin Token"));
    }

    if (decoded.role !== "admin") {
      return res.status(403).json(StatusCode.FORBIDDEN("Access Denied: Admins only"));
    }

    req.admin = decoded;
    next();
  };
}


const verifyAnyToken = verifyToken();
const verifyAdmin = verifyAdminToken();

export default {
  signAdminAccessToken,
  signAdminRefreshToken,
  signUserAccessToken,
  signUserRefreshToken,
  verifyAnyToken,
  verifyAdmin
};