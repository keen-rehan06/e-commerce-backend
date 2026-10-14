import express from "express";
import {isLoggedIn} from "../middlewares/auth.middleware.js";
import {addToCart} from "../controllers/cart.controller.js"

const app = express.Router();

app.post("/api/add-to-cart",isLoggedIn,addToCart);

export default app;