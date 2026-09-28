import express from "express";
import {
  changePassword,
  confirmOtp,
  createUser,
  forgotPassword,
  getProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateProfile,
  verifyUser,
} from "../controllers/auth.controller.js";
import { changingPasswordToken, isLoggedIn } from "../middlewares/auth.middleware.js";
import {profileImageUpload} from "../services/multer/profileImage.multer.js";

const app = express.Router();

app.post("/api/create-user", createUser);
app.get("/api/verifyuser", verifyUser); 
app.post("/api/login-user", loginUser);
app.post("/api/logout-user",isLoggedIn,logoutUser);
app.post("/api/refresh-access-token",refreshAccessToken)
app.post("/api/forgot-password",forgotPassword)
app.post("/api/confirm-otp",changingPasswordToken,confirmOtp)
app.patch("/api/change-password",changingPasswordToken,changePassword);
app.get("/api/get-profile",isLoggedIn,getProfile)
app.patch("/api/update-profile",isLoggedIn,profileImageUpload.single("profileImage"),updateProfile);

export default app;