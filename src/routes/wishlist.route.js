import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { addToWishlist, clearWishlist, getMyWishlist, removeFromWishList } from "../controllers/wishlist.controller.js";

const app = express.Router();

app.post("/api/add-to-wishlist/:productId",isLoggedIn,addToWishlist);
app.get("/api/get-wishlist",isLoggedIn,getMyWishlist);
app.delete("/api/remove-wishlist/:productId",isLoggedIn,removeFromWishList);
app.delete("/api/clear-wishlist",isLoggedIn,clearWishlist);

export default app;