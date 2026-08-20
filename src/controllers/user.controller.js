import { userModel } from "../models/user.model.js";
import redis from "ioredis";
import bcrypt from "bcrypt";
import { generateToken } from "../config/tokens.config.js";
import { verifyEmail } from "../config/verifyEmail.config.js";

export const createUser = async (req,res) => {
    try{
     const ip = req.ip;
      const key =  `registr:${ip}`;
      const attempts = await redis.incr(key);
      if(attempts === 1){
        await redis.expire(key,300);
      }  
      if(attempts > 5)return res.status(429).json({
        message: "Too many attempts"
    });
      const {name,username,email,password} = req.body;
      const hashPassword = await bcrypt.hash(password,10);
      const createUser = await userModel.create({
        name,
        username,
        email,
        password:hashPassword
      });
      const token = generateToken(user);
      verifyEmail(token,email);
      const newCreatedUser = await userModel.findById(user.id).select("-password");
      return res
      .status(201)
      .cookie("token",token)
      .send({message:"User Created SuccessFully!",success:false});
    }
    catch(error){
        console.log(error.message);
    return res.status(500).send({ message: "User Register Failed!", error });
    }
}

export const verifyUser = async(req,res) =>{ 
  try {
      let token = req.cookies.token;
      if(!token) return res.status(401).send({message:"Token is not found!",success:false});
      const decoded = jwt.verify(token,process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if(!user) return res.status(404).send({message:"User not found!",success:false})
      user.isVerified = true;
    await user.save();
    return res.status(200).send({message:"User Verifed!",success:true});
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({message:"Internal Server Error.",success:false});
}}

export const loginUser = async(req,res) => {
  try{
    const {email,password} = req.body; 
  }
  catch(error){}
}