import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        uppercase:true,
        trim:true
    },
    permissions:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"permission"
        }
    ]
},{timestamps:true});

export const roleModel = new mongoose.model("role",roleSchema)