import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createOrder, getMyAllOrder } from "../controllers/order.controller.js";

const app = express.Router();

app.post("/api/create-order/:variantId",isLoggedIn,createOrder);
app.get("/api/all-orders",isLoggedIn,getMyAllOrder);


export default app;