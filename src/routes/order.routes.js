import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getMyAllOrder,
  getSingleOrder,
  cancelOrder,
  getAllOrders,
  updateOrder
} from "../controllers/order.controller.js";

const app = express.Router();

app.post("/api/create-order/:variantId", isLoggedIn, createOrder);
app.get("/api/all-orders", isLoggedIn, getMyAllOrder);
app.get("/api/all-orders/:orderId", isLoggedIn, getSingleOrder);
app.post("/api/cancel-order/:orderId",isLoggedIn,cancelOrder)
//ADMIN,SELLER
app.get("/api/admin/get-orders",isLoggedIn,authorize("ADMIN","SUPER_ADMIN"),getAllOrders);
app.patch("/api/admin/update-order/:orderId",isLoggedIn,authorize("ADMIN","SUPER_ADMIN"),updateOrder);

export default app;
