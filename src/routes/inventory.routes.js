import { isLoggedIn } from "../middlewares/auth.middleware.js" 
import express from "express";

const app = express.Router();

app.post("/api/create-inventory",isLoggedIn)

export default app;