import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createBrand, getAllBrand, getSingleBrand } from "../controllers/brand.controller.js";
import brandLogoUpload from "../services/multer/brandLogo.multer.js";
const app = express();

app.post("/api/create-brand",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),brandLogoUpload.single("logo"),createBrand);
app.get("/api/brands",getAllBrand);
app.get("/api/brand/:id",getSingleBrand);

export default app;