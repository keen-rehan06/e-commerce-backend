import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    image: {
      url: {
        type: String,
        trim: true,
      },

      publicId: {
        type: String,
        trim: true,
      },
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index(
  {
    slug: 1,
    parentCategory: 1,
  },
  {
    unique: true,
  },
);

export const categoryModel = new mongoose.model("category", categorySchema);
