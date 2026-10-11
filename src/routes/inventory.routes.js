import { 
    createInventory,
    getAllInventory,
    getSingleInventory, 
    updateInventory,
    deleteInventory 
 } from "../controllers/inventory.controller.js";
import { isLoggedIn,authorize } from "../middlewares/auth.middleware.js" 
import express from "express";

const app = express.Router();

app.post("/api/create-inventory/:variantId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),createInventory);
app.get("/api/get-inventories",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),getAllInventory);
app.get("/api/get-inventory/:inventoryId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),getSingleInventory);
app.patch("/api/update-inventory/:inventoryId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),updateInventory);
app.delete("/api/delete-inventory:inventoryId",isLoggedIn,authorize("SUPER_ADMIN","ADMIN"),deleteInventory);

export default app;