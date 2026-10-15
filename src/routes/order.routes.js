import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createOrder } from "../controllers/order.controller.js";

const app = express.Router();

app.post("/api/create-order/:variantId",isLoggedIn,createOrder);

export default app;