import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema({
     name:{
        type:String,
        required:true,
        unique:true,
        uppercase:true,
        trim:true
    },
},{timestamps:true});

export const permissionModel = new mongoose.model("permission",permissionSchema);