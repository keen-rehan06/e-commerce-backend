import Razorpay from "razorpay";
import { configDotenv } from "dotenv";
configDotenv({path:".env"});

export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

//  default razorpay;