import { orderModel } from "../models/order.model.js";
import { addressModel } from "../models/address.model.js";
import { cartModel } from "../models/cart.model.js";
import { variantModel } from "../models/variant.model.js";
import redis from "../config/redis/redis.js";
import razorpay from "../config/payment/razorpay.payment.js";
import { productModel } from "../models/product.model.js";
import { createPaymentOrder } from "./payment.controller.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, paymentMethod, source, quantity } = req.body;
    const variantId = req.params.id;
    // Validate basic fields
    if (!addressId || !paymentMethod || !source)
      return res.status(400).json({
        success: false,
        message: "Address, payment method and source are required!",
      });

    if (!["COD", "RAZORPAY"].includes(paymentMethod)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid payment method." });
    }

    if (!["CART", "BUY_NOW"].includes(source)) {
      return res
        .status(400)
        .send({ success: false, message: "Invalid order source." });
    }

    const address = await addressModel.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address)
      return res.status(404).json({
        success: false,
        message: "Address not found!",
      });

    let orderItems = [];

    // CART ORDER
    if (source === "CART") {
      const cart = await cartModel.findOne({
        user: userId,
      });

      if (!cart || !cart.items || cart.items.length === 0)
        return res.status(404).json({
          success: false,
          message: "Cart is empty!",
        });

      // verify every cart item from DB
      for (const item of cart.items) {
        const variant = await variantModel
          .findById(item.variantId)
          .populate("product");
        if (!variant)
          return res.status(404).send({
            success: false,
            message: `Variant ${item.variantId} not found.`,
          });
        orderItems.push({
          product: variant.product._id,
          variant: variant._id,
          quantity: item.quantity,
          price: variant.price,
        });
      }
    }
    // BUY NOW ORDER
    if (source === "BUY_NOW") {
      if (!variantId || !quantity || quantity < 1)
        return res.status(400).send({
          success: false,
          message: "Variant and valid quantity are required!",
        });

      const variant = await variantModel
        .findById(variantId)
        .populate("product");

      if (!variant)
        return res
          .status(404)
          .send({ success: false, message: "variant not found!" });

      orderItems.push({
        product: variant.product._id,
        variant: variant._id,
        quantity,
        price: variant.price,
      });
    }

    // CALCULATE TOTAL
    const totalAmount = orderItems.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // CREATE ORDER
    const order = await orderModel.create({
      user: userId,
      address: addressId,
      items: orderItems,
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      orderStatus: "CONFIRMED",
    });

    // COD (CASH ON DELIVERY)
    if (paymentMethod === "COD") {
      // CLEAR CART ONLY AFTER CART ORDER
      await cartModel.deleteOne({ user: userId });
      return res.status(201).json({
        success: true,
        message: "COD Order created successfully",
        order,
      });
    }
    if (paymentMethod === "RAZORPAY") {
      const razorpayOrder = await createPaymentOrder({
        userId,
        amount: totalAmount,
        receipt: order._id.toString(),
      });

      // SAVE RAZORPAY ORDER ID

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).send({
        success: true,
        message: "Razorpay order created successfully",
        orderId: order._id,
        razorpay: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
    }
  } catch (error) {
    console.error("Create Order Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};
