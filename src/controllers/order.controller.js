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
    const { addressId, paymentMethod } = req.body;
    if (!addressId || !paymentMethod)
      return res.status(400).send({
        message: "Address and payment method are required!",
        success: false,
      });

      if(!["RAZORPAY","COD"].includes(paymentMethod))   
         return res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
    
    const address = await addressModel.findOne({
      _id: addressId,
      user: userId,
    });
    if (!address)
      return res
        .status(404)
        .send({ message: "Address not found!", success: false });
    const cart = await cartModel.findOne({
      user: userId,
    });
    if (!cart || cart.items.length === 0)
      return res
        .status(401)
        .send({ message: "Cart is empty!", success: false });

    const variantsIds = cart.items.map((item) => item.variant);

    const variants = await variantModel.find({
      _id: { $in: variantsIds },
    });

    // Create order items and calculate total
    const orderItems = [];
    let totalAmount = 0;
    for (const cartItem of cart.items) {
      const variant = variants.find(
        (item) => item._id.toString() === cartItem.variant.toString(),
      );
      if (!variant)
        return res.status(404).send({
          message: `Variant not found: ${cartItem.variant}`,
          success: false,
        });
      const price = variant.price;
      const subtotal = price * cartItem.quantity;
      orderItems.push({
        product: cartItem.product,
        variant: cartItem.variant,
        quantity: cartItem.quantity,
        price,
        subtotal,
      });
      totalAmount += subtotal;
    }
    // create order
    const order = await orderModel.create({
      user: userId,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      totalAmount,
      paymentMethod,
    });

    if (paymentMethod === "RAZORPAY") {
      const razorPayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });
      order.razorpayOrderId = razorPayOrder.id;
      await order.save();
      // clear cart
      cart.items = [];
      await cart.save();

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
        payment: {
          id: razorPayOrder.id,
          amount: razorPayOrder.amount,
          currency: razorPayOrder.currency,
        },
      });
    }

    if (paymentMethod === "COD") {
      cart.items = [];
      await cart.save();
      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order,
      });
    }
  
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};