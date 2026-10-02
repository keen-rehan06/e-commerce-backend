import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createProduct } from "../controllers/product.controller.js";

const app = express.Router();

app.post("/api/create-product",isLoggedIn,authorize("SUPER_ADMIN","ADMIN","SELLER"),productsImageupload.single("image"),createProduct);

export default app;