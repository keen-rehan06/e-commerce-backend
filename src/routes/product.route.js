import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createProduct, deleteSingleProduct, getAllProducts, getSingleProduct, updateSingleProduct } from "../controllers/product.controller.js";
import {productsImageupload} from "../services/multer/productImage.multer.js"

const app = express.Router();

app.post("/api/create-product",isLoggedIn,authorize("SUPER_ADMIN","ADMIN","SELLER"),productsImageupload.single("images"),createProduct);
app.get("/api/products",getAllProducts);
app.get("/api/product/:productId",getSingleProduct);
app.patch("/api/update-product/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN","SELLER"),updateSingleProduct);
app.delete("/api/delete-product/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN","SELLER"),deleteSingleProduct);

export default app;