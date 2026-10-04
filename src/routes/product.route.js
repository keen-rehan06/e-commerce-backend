import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createProduct } from "../controllers/product.controller.js";
import {productsImageupload} from "../services/multer/productImage.multer.js"

const app = express.Router();

app.post("/api/create-product",isLoggedIn,authorize("SUPER_ADMIN","ADMIN","SELLER"),productsImageupload.single("images"),createProduct);

export default app;