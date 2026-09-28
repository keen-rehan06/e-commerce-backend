import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createBrand } from "../controllers/brand.controller.js";
import brandLogoUpload from "../services/multer/brandLogo.multer.js";
const app = express();

app.post("/api/create-brand",isLoggedIn,authorize("BRAND_CREATE"),brandLogoUpload.single("logo"),createBrand);

export default app;