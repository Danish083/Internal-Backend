import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "abcdefgh";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log("Token received in verifyToken:", token);
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No token provided" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
  } catch (error) {
    console.error("Unexpected error in verifyToken:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Commented out Firebase code
// import { getAdminAuthInstance } from "../dbConnection/connection.js";

// export const verifyFirebaseToken = async (req, res, next) => {
//   try {
//     const auth = getAdminAuthInstance();
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "Unauthorized - No token provided" });
//     }

//     const idToken = authHeader.split("Bearer ")[1];
//     const decodedToken = await auth.verifyIdToken(idToken);

//     req.user = decodedToken;
//     next();
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return res.status(401).json({ message: "Unauthorized - Invalid token" });
//   }
// };
