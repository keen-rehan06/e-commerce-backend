import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { addToWishlist } from "../controllers/wishlist.controller.js";

const app = express.Router();

app.post("/api/add-to-wishlist/:productId",isLoggedIn,addToWishlist);
app.get("/api/get-wishlist")

export default app;