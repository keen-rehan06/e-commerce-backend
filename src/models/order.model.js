import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    
});

export const orderModel = new mongoose.model("order",orderSchema);