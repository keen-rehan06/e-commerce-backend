import express from "express";
import { createUser } from "../controllers/auth.controller.js";

export const app = express.Router();

app.post("/api/create-user",createUser);