import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getMyAllOrder,
  getSingleOrder,
  cancelOrder
} from "../controllers/order.controller.js";

const app = express.Router();

app.post("/api/create-order/:variantId", isLoggedIn, createOrder);
app.get("/api/all-orders", isLoggedIn, getMyAllOrder);
app.get("/api/all-orders/:orderId", isLoggedIn, getSingleOrder);
app.post("/api/cancel-order/:orderId",isLoggedIn,cancelOrder)

export default app;
