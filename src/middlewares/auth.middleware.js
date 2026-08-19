import { userModel } from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const checksUserRegister = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res
        .status(401)
        .send({ message: "All Fileds are required!", success: false });
    const existingUser = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser)
      return res
        .status(401)
        .send({ message: "User already exist.", success: false });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res
        .status(401)
        .send({ message: "Invalid Email format.", success: false });
    if (
      typeof name !== "string" ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    )
      return res
        .status(401)
        .send({ message: "All field Must be String.", success: false });
    if (password.length < 6)
      return res.status(401).send({
        message: "Password must be at least 6 characters long!",
        success: false,
      });
    if (password.length > 12)
      return res
        .status(401)
        .send({ message: "Too long password!", success: false });
    next();
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const checksLoginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .send({ message: "User not Found!", success: false });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res
        .status(401)
        .send({ message: "Invalid Email Format.", success: false });
    if (typeof email !== "string" || typeof password !== "string")
      return res
        .status(401)
        .send({ message: "All field must be string.", success: false });
        const comparePassword = await bcrypt.compare(password,user.password);
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: "Internal Server Error.", error });
  }
};

export const isLoggedIn = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorizarion;
  if(req.cookies.accessToken){
    token = req.cookies.accessToken;
  }else if(authHeader && authHeader.startsWith("Bearer ")){
    token = authHeader.split(" ")[1];
  }
  if(!token) return res.status(404).send({message:"Please! Login First.",success:false});
  try {
    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    if(!decoded) return res.status(401).send({message:"Invalid or Expired Token",success:false});
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({message:"Internal Server Error",success:false,error});
  }
};
