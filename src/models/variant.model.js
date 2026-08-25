import mongoose from "mongoose";
import { productModel } from "./product.model";

const variantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: [true, "Price is required."],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
      default: null,
    },
    costPrice: {
      type: Number,
      min: [0, "Cost price cannot be negative"],
      default: null,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },

        publicId: {
          type: String,
          trim: true,
        },

        altText: {
          type: String,
          trim: true,
          maxlength: 200,
        },
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

variantSchema.index({
    product:1,
    status:1
});

export const variantModel = new mongoose.model("variant", variantSchema);
