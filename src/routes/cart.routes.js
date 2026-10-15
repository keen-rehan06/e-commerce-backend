import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  addToCart,
  clearCart,
  getMyCart,
  removeCartItem,
  updateMyCart,
} from "../controllers/cart.controller.js";

const app = express.Router();

app.post("/api/add-to-cart/:variantId", isLoggedIn, addToCart);
app.get("/api/cart", isLoggedIn, getMyCart);
app.patch("/api/update-cart/:variantId", isLoggedIn, updateMyCart);
app.delete("/api/remove-cart/:variantId",isLoggedIn,removeCartItem);
app.delete("/api/clear-cart",isLoggedIn,clearCart);

export default app;
