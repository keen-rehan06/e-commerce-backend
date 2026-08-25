import mongoose from "express";

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Brand name is required"],
    trim: true,
    minlength: 2,
    maxlength: 100,
    unique: true,
    index: true,
  },
  slug: {
    type: String,
    required: [true, "Brand slug is required"],
    trim: true,
    lowercase: true,
    unique: true,
    index: true,
  },
  description:{
    type:String,
    trim:true,
    maxlength:1000,
  },
  logo:{
    url:{
      type:String,
      trim:true,
    },
    publicId:{
      type:String,
      trim:true,
    },
  },
  isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  });

  export const brandModel = new mongoose.model("brand",brandSchema)