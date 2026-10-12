import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js"
import { addAddress } from "../controllers/address.controller.js";

const app = express.Router();

app.post("/api/create-address",isLoggedIn,addAddress)

export default app;