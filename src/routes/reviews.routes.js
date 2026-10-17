import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import {
  createReview,
  getProductReviews,
} from "../controllers/reviews.controller.js";

const app = express.Router();

app.post("/api/create-review/:productId", isLoggedIn, createReview);
app.get("/api/get-review/:productId", isLoggedIn, getProductReviews);
app.patch("/api/update-review/:reviewId",isLoggedIn,updateReview);
// app.delete("")

export default app;
