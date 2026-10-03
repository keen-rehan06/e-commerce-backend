import express from "express";
import { 
    authorize, 
    isLoggedIn 
} from "../middlewares/auth.middleware.js";
import {
     createCategory,
     deleteCategory,
     getAllCategories, 
     getSingleCategory, 
     updateCategory 
    } from "../controllers/categories.controller.js";

const app = express.Router();

app.post("/api/create-category",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),createCategory);
app.get("/api/categories",isLoggedIn,getAllCategories);
app.get("/api/get-category/:id",isLoggedIn,getSingleCategory);
app.patch("/api/update-category/:id",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),updateCategory);
app.delete("/api/delete-category/:id",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),deleteCategory)
export default app;