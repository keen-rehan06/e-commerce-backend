import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
     product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },

    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "variant",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
});

const cartSchema = new mongoose.Schema({
     user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },

    items: [cartItemSchema],
},{timestamps:true});

export const cartModel = new mongoose.model("cart",cartSchema);