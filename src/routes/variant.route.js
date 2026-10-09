import express from "express";
import {
     authorize,
     isLoggedIn
     } from "../middlewares/auth.middleware.js";
import {
     createVariant, 
     deleteVariant, 
     getAllVariants,
     getSingleVariant, 
     updateSingleVarinat 
    } from "../controllers/variant.controller.js";
import { VarinatLogoUpload } from "../services/multer/varinatImage.multer.js"

const app = express.Router();

app.post("/api/create-variant/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),VarinatLogoUpload.single("images"),createVariant);
app.get("/api/variants",getAllVariants);
app.get("/api/variant/:variantId",getSingleVariant)
app.patch("/api/update-variant/:variantId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),VarinatLogoUpload.single("images"),updateSingleVarinat);
app.delete("/api/delete-variant/:variantId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),deleteVariant)

export default app;