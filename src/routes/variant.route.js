import express from "express";
import { authorize, isLoggedIn } from "../middlewares/auth.middleware.js";
import { createVariant } from "../controllers/variant.controller.js";

const app = express.Router();

app.post("/api/create-variant/:productId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),createVariant);

export default app;