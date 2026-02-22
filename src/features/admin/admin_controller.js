// import adminService from "./admin_service.js";
// import authJwt from "../../middlewear/authJwt.js";

// async function adminLogin(req, res ) {
//     try {
//         const { email, password } = req.body;
//         const serviceRes = await adminService.adminLogin(email, password);
//         console.log("Service Response:", serviceRes);
//         // serviceRes is a StatusCode object
//         if ( serviceRes.code === 200) {
//             const user = serviceRes.message;
//             // decide role and generate appropriate token
//             let token;
//             if (user.role && user.role.toLowerCase() === "admin") {
//                 token = authJwt.signAdminToken(user);
//             } else {
//                 token = authJwt.signCustomerToken(user);
//             }

//             console.log("login user:", user.userName, "role:", user.role)
//             return res.json({ code: 200, status: "OK", message: "login success", data: { user, token } });
//         }

//         // pass through service response (errors)
//         return res.json(serviceRes);

//     } catch (error) {
//          console.error("Error admin login action:", error);

//         return res
//             .status(500)
//             .json("SERVER ERROR");
//     }
// }

// async function userRegister(req, res ) {
//     try {
//         const { userName , email, password } = req.body;
//         if(!userName || !email || !password){
//             return res.json({code: 400, status: "BAD REQUEST", message: "Missing required fields"});
//         }
//         const serviceRes = await adminService.userRegister(userName, email, password);

//         // serviceRes is a StatusCode object
//         if (serviceRes && serviceRes.code === 200) {
//             return res.json({ code: 200, status: "OK", message: "user registered successfully", data: serviceRes.data });
//         }

//         // pass through service response (errors)
//         return res.json(serviceRes);

//     } catch (error) {
//          console.error("Error user register action:", error);

//         return res
//             .status(500)
//             .json("SERVER ERROR");
//     }
// }

// export default {
//     adminLogin,
//         userRegister
// }