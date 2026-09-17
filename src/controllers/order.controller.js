import { orderModel } from "../models/order.model.js";
import { addressModel } from "../models/address.model.js";
import { cartModel } from "../models/cart.model.js";
import { variantModel } from "../models/variant.model.js";
import redis from "../config/redis/redis.js";
import razorpay from "../config/payment/razorpay.payment.js";
import { productModel } from "../models/product.model.js";

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
    if(!addressId || !paymentMethod || !source)
  } catch (error) {
    
  }
} 