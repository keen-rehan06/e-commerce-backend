import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema({
      name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: 2,
      maxlength: 200,
      index: true,
    },

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
     description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      maxlength: 10000,
    },

    shortDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    brand:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"brand",
        required:[true,"Brand is required!"],
        index:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"category",
        required:[true,"category is required!"],
        index:true 
    }, 
    images:[
        {
            url:{
                type:String,
                required:true,
                trim:true
            },
            publicId:{
                type:String,
                trim:true
            },
            alterText:{
                type:String,
                trim:true,
                maxlength:200
            },
        },
    ],
    tags:[
        {
            type:String,
            trim:true,
            lowercase:true
        },
    ],
    status:{
        type:String,
        enum:["draft","active","archived"],
        default:"draft",
        index:true
    },
    isFeatured:{
        type:Boolean,
        default:false,
        index:true
    },
      rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },

      count: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    totalSales: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
},{
    timestamps:true
});

productSchema.index({
    name:"text",
    description:"text",
    tags:"text"
});

productSchema.index({
    category:1,
    status:1
});

productSchema.index({
    brand:1,
    status:1,
});

export const productModel = new mongoose.model("product",productSchema);