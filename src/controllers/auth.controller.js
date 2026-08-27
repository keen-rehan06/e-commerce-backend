import { userModel } from "../models/user.model.js";
import {roleModel} from "../models/role.model.js"
import { verifyEmail } from "../config/verifyEmail.config.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "../config/tokens.config.js";
import bcrypt from "bcrypt";
import redis from "../config/redis/redis.js";
import crypto from "crypto";

export const createUser = async (req, res) => {
  try {
    const ip = req.ip;
    const key = `register:${ip}`;
    const attempts = await redis.incr(key);
    if (attempts === 1) {
      await redis.expire(key, 300);
    }
    if (attempts > 5)
      return res.status(429).json({
        message: "Too many attempts",
      });
    const { name, username, email, password } = req.body;
    const hashPassword = await bcrypt.hash(password, 10);
    const role = await roleModel.findOne({
      name:"CUSTOMER"
    })
    const createUser = await userModel.create({
      name,
      username,
      email,
      password: hashPassword,
      role:role._id
    });
    const token = generateToken(user);
    verifyEmail(token, email);
    const newCreatedUser = await userModel
      .findById(createUser._id)
      .select("-password");
    return res
      .status(201)
      .cookie("token", token)
      .send({ message: "User Created SuccessFully!", success: false,data:newCreatedUser });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: "User Register Failed!", error });
  }
};

export const verifyUser = async (req, res) => {
  try {
    let token = req.cookies.token;
    if (!token)
      return res
        .status(401)
        .send({ message: "Token is not found!", success: false });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user)
      return res
        .status(404)
        .send({ message: "User not found!", success: false });
    user.isVerified = true;
    await user.save();
    return res
      .status(200)
      .clearCookie("token")
      .send({ message: "User Verifed!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .send({ message: "Invalid Email or Password.", success: false });
    if (!user.isVerified)
      return res
        .status(401)
        .send({ message: "User is not verified!", success: false });
    const sessionKey = `session:${user._id}`;
    const created = await redis.set(
      sessionKey,
      JSON.stringify({
        userId: user._id.toString(),
        role: user.role,
      }),
      "EX",
      7 * 24 * 60 * 60,
      "NX",
    );
    if (created == "OK") {
      console.log("session created.");
    } else {
      console.log("session already exist.");
    }
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    await redis.set(
      `refreshToken:${refreshTokenHash}`,
      user._id.toString(),
      "EX",
      7 * 24 * 60 * 60,
      "NX",
    );
    const newUser = await userModel.findById(user._id).select("-password");
    return res
      .status(200)
      .cookies("accessToken", accessToken)
      .cookies("refreshToken", refreshToken)
      .send({
        message: "User loggedIn successFully!",
        success: true,
        data: newUser,
      });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({ message: "Server Error", error });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const user = req.user.id;
    const sessionKey = `session:${user}`;
    await redis.del(sessionKey);
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const refreshTokenHash = crypto
        .createHash("sha256")
        .update(refreshToken)
        .digest("hex");

      await redis.del(`refreshToken:${refreshTokenHash}`);
    }
    await userModel.findByIdAndUpdate(user, { isLoggedIn: false });
    return res
      .status(200)
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .send({ message: "User Logged Out!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "User Logged Out Failed!", success: false, error });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken)
      return res.status(401).send({
        message: "refreshToken is missing. Please Login!",
        success: false,
      });
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user)
      return res
        .status(404)
        .send({ message: "User Not Found", success: false });
    const hashRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const redisRefreshToken = await redis.get(
      `refreshToken:${hashRefreshToken}`,
    );
    if (hashRefreshToken !== redisRefreshToken)
      return res
        .status(401)
        .send({ message: "Invalid refresh Token!", success: false });
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
    await redis.del(`refreshToken:${hashRefreshToken}`);
    await redis.set(
      `refreshToken:${newRefreshToken}`,
      decoded.id,
      "EX",
      7 * 24 * 60 * 60,
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      })
      .send({
        message: "Regenerated RefreshToken SuccessFully!",
        success: true,
      });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      message: "Failed to generate RefreshToken",
      success: false,
      error,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(401)
        .send({ message: "Email is required!", success: false });
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .send({ message: "User Not Found!", success: false });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const token = generateToken(user);
    await redis.set(
      `otp:${user._id}`,
      JSON.stringify({ userId: user._id, otp: otp }),
      "EX",
      otpExpiry,
    );
    sendOtpMail(otp, email, token);
    return res
      .status(200)
      .cookie("token", token)
      .send({ message: "Otp Send SuccessFully", success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({
      message: error,
      success: false,
    });
  }
};

export const confirmOtp = async (req, res) => {
  try {
    const { userotp } = req.body;
    if (!userotp)
      return res
        .status(401)
        .send({ message: "Otp is required!", success: false });
    const tokenUserId = req.user.id;
    const user = await userModel.findById(tokenUserId);
    if (!user)
      return res
        .status(404)
        .send({ message: "User not Found", success: false });
    const redisOtp = await redis.get(`otp:${user._id}`);
    const { userId, otp } = JSON.parse(redisOtp);
    if (userotp !== otp)
      return res.status(401).send({ message: "Invalid Otp!", success: false });
    if (otp < 6)
      return res
        .status(401)
        .send({ message: "OTP Must be 6 number.", success: false });
    await redis.del(`otp:${user._id}`);
    return res.status(200).send({ message: `OTP Verified!`, success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(401).send({ message: error, success: false });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { passsword, confirmPassword } = req.body;
    if (!passsword || !confirmPassword)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });
    if (password.length < 6 || password.length > 12)
      return res
        .status(401)
        .send({
          message: "Password must be minimum 6 characters or maximum 12.",
        });
    if (password !== confirmPassword)
      return res
        .status(401)
        .send({ message: "Password is not match", success: false });
    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .send({ message: "User Not Found!", success: false });
    const hashPassword = await bcrypt.hash(passsword, 10);
    user.password = password;
    await user.save();
    return res
      .status(200)
      .clearCookie("token")
      .send({ message: "Password Reset SuccessFully!", data: newUser });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Password Reseting Failed!", success: false, error });
  }
};

export const profile = async (req, res) => {
  res.send({name:req.user.displayName,image:req.user.photos[0].value});
};

export const logout = async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send({
        message: "Logout failed",
        success: false,
      });
    }
    res.redirect("/");
  });
};