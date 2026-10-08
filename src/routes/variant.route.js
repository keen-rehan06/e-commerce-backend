import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createVariant, getAllVariants } from "../controllers/variant.controller.js";
import { brandLogoUpload } from "../services/multer/varinatImage.multer.js"

const app = express.Router();

app.post("/api/create-variant/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),brandLogoUpload.single("images"),createVariant);
app.get("/api/variants",getAllVariants);

export default app;