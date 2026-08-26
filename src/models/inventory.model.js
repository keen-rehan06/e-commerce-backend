import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
   variant:{
     type: mongoose.Schema.Types.ObjectId,
      ref: "variant",
      required: [true, "Variant is required"],
      unique: true,
      index: true,
   },
   quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Quantity cannot be negative"],
    },
    reservedQuantity:{
      type:Number,
      required:true,
      default:0,
      min:[0,"Reserved quantity can not be negative"],
    },
    lowStockThreshold:{
      type:Number,
      default:5,
      min:0
    },
    allowBackorder:{
      type:Boolean,
      default:false
    },
},{
   timestamps:true
}
);

inventorySchema.virtual("availableQuantity").get(function(){
   return Math.max(this.quantity - this.reservedQuantity,0);
});

inventorySchema.set("toJSON",{
   virtuals:true,
});

inventorySchema.set("toObject",{
   virtuals:true,
});

export const inventoryModel = new mongoose.model("inventroy",inventorySchema)