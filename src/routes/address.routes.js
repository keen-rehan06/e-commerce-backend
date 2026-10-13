import express from "express";
import { isLoggedIn } from "../middlewares/auth.middleware.js"
import { addAddress,getMyAddress,getSingleAddress } from "../controllers/address.controller.js";

const app = express.Router();

app.post("/api/create-address",isLoggedIn,addAddress);
app.get("/api/get-all-address",isLoggedIn,getMyAddress);
app.get("/api/get-address/:addressId",isLoggedIn,getSingleAddress);
app.patch("/api/update-address/:id",isLoggedIn,update)

export default app;