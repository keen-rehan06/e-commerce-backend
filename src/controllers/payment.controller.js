import razorpay from "../config/payment/razorpay.payment.js";
import { orderModel } from "../models/order.model.js";
import { paymentModel } from "../models/payment.model.js";
import crypto from "crypto";

export const createPaymentOrder = async ({userId, amount,receipt}) => {
  try {
    if (!amount || amount <= 0)
  throw new Error("Valid amount is required")
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    const payment = await paymentModel.create({
      user: userId,
      amount,
      currency: "INR",
      status: "PENDING",
      razorpayOrderId: razorpayOrder.id,
    });
    return {
      success: true,
      message: "Payment order created successfully",
      data: {
        paymentId: payment._id,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    };
  } catch (error) {
    console.error("Create Payment Order Error:", error);
    throw new Error("Failed to create payment orde")
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment details are required",
      });
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSigniture = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");
    if (expectedSigniture !== razorpay_signature)
      return res
        .status(400)
        .send({ message: "Invaid payment signiture!", success: false });
    
      const order = await orderModel.findOne({
      razorpayOrderId: razorpay_order_id,
      user:req.user._id
    });

    if(!order) return res.status(404).send({
       message:"orders not found!",
       success:false
    });
       order.paymentStatus = "PAID"
       order.razorpayPaymentId = razorpay_payment_id;
       await order.save();

    const payment = await paymentModel.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment)
      return res
        .status(404)
        .send({ message: "Payment record not found!", success: false });
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "SUCCESS";
    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error,
    });
  }
};

export const razorpayWebhooks = async (req, res) => {
  try {
    const webhookSigniture = req.headers["x-razorpay-signature"];

    if (!webhookSigniture)
      return res
        .status(400)
        .send({ message: "webhook signature missing!", success: false });
    const expectedSigniture = crypto
    .createHmac("sha256",process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest("hex")
    if (expectedSigniture !== webhookSigniture)
      return res
        .status(400)
        .send({ message: "Invalid webhook signature", success: false });
    const event = JSON.parse(req.body.toString());
    if (event.event === "payment.captured") {
      const razorpayPayment = event.payload.payment.entity;
      await paymentModel.findOneAndUpdate(
        {
          razorpayOrderId: razorpayPayment.order_id,
        },
        {
          razorpayPaymentId: razorpayPayment.id,
          status: "SUCCESS",
        },
      );

      await orderModel.findOneAndUpdate(
        {
          razorpayOrderId:razorpayPayment.order_id,
        },
        {
          paymentStatus:"PAID"
        }
      )
    }
    if (event.event === "payment.failed") {
      const razorpayPayment = event.payload.payment.entity;

      await paymentModel.findOneAndUpdate(
        {
          razorpayOrderId: razorpayPayment.order_id,
        },
        {
          razorpayPaymentId: razorpayPayment.id,
          status: "FAILED",
        },
      );

      await orderModel.findOneAndUpdate(
        {
          razorpayOrderId:razorpayPayment.order_id,
        },
        {
          paymentStatus:"FAILED"
        }
      )
    }
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error,
    });
  }
};