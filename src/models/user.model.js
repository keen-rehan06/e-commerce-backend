import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isVerfied: {
      type: Boolean,
      default: false,
    },
    isLoggedIn: {
      type: Boolean,
      default: false,
    },
    profileImage: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
          default:null
        },
        publicId: {
          type: String,
          trim: true,
          default:null
        },
        alterText: {
          type: String,
          trim: true,
          maxlength: 200,
          default:null
        },
      },
    ],
    order: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    cartProduct: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "cartProduct",
      },
    ],
    role: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "role",
      },
    ],
    purchaseHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchase",
      },
    ],
  },
  { timestamps: true },
);

export const userModel = new mongoose.model("user", userSchema);
