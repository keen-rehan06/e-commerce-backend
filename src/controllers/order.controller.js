import { orderModel } from "../models/order.model.js";
import { addressModel } from "../models/address.model.js";
import { cartModel } from "../models/cart.model.js";
import { variantModel } from "../models/variant.model.js";
import redis from "../config/redis/redis.js";
import razorpay from "../config/payment/razorpay.payment.js";
import { productModel } from "../models/product.model.js";
import { ReplyError } from "ioredis";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      addressId, 
      paymentMethod, 
      source,
      variantId,
      quantity
     } = req.body;

    // Validate basic fields
    if (!addressId || !paymentMethod || !source)
      return res.status(400).json({
        success: false,
        message: "Address, payment method and source are required!",
      });

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
      const cartKey = `cart:${userId}`;
      const cart = await redis.get(cartKey);
      if (!cart)
        return res.status(404).send({
          success: false,
          message: "Cart is empty.",
        });
      const parsedCart = JSON.parse(cart);
      if (!parsedCart.items || parsedCart.items.length === 0) return;
      res.status(400).send({ message: "Cart is Empty!", success: false });

      // verify every cart item from DB
      for (const item of parsedCart.items) {
        const variant = await variantModel
          .findById(item.variantId)
          .populate("product");
        if (!variant)
          return res.status(404).send({
            success: false,
            message: "Variant ${item.variantId} not found.",
          });
        orderItems.push({
          product: variant.product._id,
          variant: variant._id,
          quantity: item.quantity,
          price: variant.price,
        });
      }
    } else if (source === "BUY_NOW") {
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
    } else {
      return res.status(401).send({
        success: false,
        message: "Invalid order source",
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
      paymentMethod,
      paymentStatus: "PENDING",
      orderStatus: "PENDING",
    });
    // CLEAR CART ONLY AFTER CART ORDER

    if (source === "CART") {
      await redis.del(`cart:${userId}`);
    }
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};