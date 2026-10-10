import { createInventory } from "../controllers/inventory.controller.js";
import { isLoggedIn,authorize } from "../middlewares/auth.middleware.js" 
import express from "express";

const app = express.Router();

app.post("/api/create-inventory/:variant",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),createInventory);

export default app;