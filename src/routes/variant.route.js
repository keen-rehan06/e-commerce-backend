import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createVariant, getAllVariants,getSingleVariant } from "../controllers/variant.controller.js";
import { brandLogoUpload } from "../services/multer/varinatImage.multer.js"

const app = express.Router();

app.post("/api/create-variant/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),brandLogoUpload.single("images"),createVariant);
app.get("/api/variants",getAllVariants);
app.get("/api/variant/:variantId",getSingleVariant)

export default app;