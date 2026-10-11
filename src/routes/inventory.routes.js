import { createInventory,getAllInventory, getSingleInventory } from "../controllers/inventory.controller.js";
import { isLoggedIn,authorize } from "../middlewares/auth.middleware.js" 
import express from "express";

const app = express.Router();

app.post("/api/create-inventory/:variantId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),createInventory);
app.get("/api/get-inventories",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),getAllInventory);
app.get("/api/get-inventory/:inventoryId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),getSingleInventory)

export default app;