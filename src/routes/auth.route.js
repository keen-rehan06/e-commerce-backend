import express from "express";
import { createUser } from "../controllers/auth.controller.js";

const app = express.Router();

app.post("/api/create-user",createUser);

export default app;