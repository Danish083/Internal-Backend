import { Router } from "express";
import {
  userSignUp,
  UserSignIn,
  getUserProfile,
  userLogout,
  forgotPassword,
} from "./controller/controller.js";
import { verifyToken } from "./middleware/auth.js";

const userRoute = Router();

userRoute.post("/signup", userSignUp);
userRoute.post("/signin", UserSignIn);
userRoute.get("/profile", verifyToken, getUserProfile);
userRoute.get("/me", verifyToken, getUserProfile);
userRoute.post("/logout", userLogout);
userRoute.post("/forgot-password", forgotPassword);

export default userRoute;
