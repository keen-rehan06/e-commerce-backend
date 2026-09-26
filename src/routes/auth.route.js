import express from "express";
import {
  createUser,
  loginUser,
  verifyUser,
} from "../controllers/auth.controller.js";

const app = express.Router();

app.post("/api/create-user", createUser);
app.get("/api/verifyuser", verifyUser);
app.post("/api/login-user", loginUser);
app.post("/api/logout-user",loginUser);

export default app;
