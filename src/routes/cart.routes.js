import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  getMyCart,
  updateMyCart,
} from "../controllers/cart.controller.js";

const app = express.Router();

app.post("/api/add-to-cart/:variantId", isLoggedIn, addToCart);
app.get("/api/cart", isLoggedIn, getMyCart);
app.patch("/api/update-cart/:variantId", isLoggedIn, updateMyCart);

export default app;
