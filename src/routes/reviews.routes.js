import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import { createReview } from "../controllers/reviews.controller.js";

const app = express.Router();

app.post("/api/create-review/:productId",isLoggedIn,createReview);

export default app;