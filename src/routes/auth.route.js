import express from "express";
import {
  createUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  verifyUser,
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const app = express.Router();

app.post("/api/create-user", createUser);
app.get("/api/verifyuser", verifyUser); 
app.post("/api/login-user", loginUser);
app.post("/api/logout-user",isLoggedIn,logoutUser);
app.post("/api/refresh-access-token",refreshAccessToken)

export default app;
