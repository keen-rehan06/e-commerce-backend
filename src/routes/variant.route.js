import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createVariant } from "../controllers/variant.controller.js";
import { brandLogoUpload } from "../services/multer/varinatImage.multer.js"

const app = express.Router();

app.post("/api/create-variant/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),brandLogoUpload.single("images"),createVariant);

export default app;