import { orderModel } from "../models/order.model.js";
import { addressModel } from "../models/address.model.js";
import { cartModel } from "../models/cart.model.js";
import { variantModel } from "../models/variant.model.js";
import redis from "../config/redis/redis.js";
import { createPaymentOrder } from "./payment.controller.js";
import { razorpay } from "../config/payment/razorpay.payment.js";
import {
  commitInventory,
  releaseInventory,
  reserveInventory,
} from "./inventory.controller.js";

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

      for (const item of orderItems) {
        await reserveInventory({
          variantId: item.variant,
          quantity: item.quantity,
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
      paymentMethod,
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

export const getMyOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `${userId}:allOrders`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).send({
        message: "Orders fetched from cache",
        orders: JSON.parse(cacheData),
        success: true,
      });
    }
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      orderModel
        .find({ user: userId })
        .populate("items.product")
        .populate("items.variant")
        .populate("address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      orderModel.createDocuments({ user: userId }),
    ]);

    await redis.set(cacheKey, ...JOSN.stringify(orders), "EX", 300);

    return res.status(200).send({
      message: "Orders fetched from db successfully!",
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    console.error("Get My Orders Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const cacheKey = `order:${userId}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).send({
        message: "Orders fetch successfully!",
        source: "redis",
        ...JSON.parse(cacheData),
        success: true,
      });
    }
    const order = await orderModel
      .findOne({
        _id: orderId,
        user: userId,
      })
      .populate("items.product")
      .populate("items.variant")
      .populate("address");

    if (!order)
      return res.status(404).send({
        message: "Order not found!",
        success: false,
      });
    await redis.set(cacheKey, ...JOSN.stringify(order), "EX", 300);

    return res.status(200).send({
      message: "Order fetched successfully!",
      source: "db",
      success: true,
      order,
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "failed to fetched order", success: false, error });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await orderModel.findOne({
      _id: orderId,
      user: userId,
    });

    if (!order)
      return res.status(404).send({
        message: "Order not found!",
        success: false,
      });

    if (order.orderStatus === "CANCELLED") {
      return res
        .status(401)
        .send({ message: "Order is already cancelled.", success: false });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(401).send({
        message: "Delivered order can not be cancelled",
        success: false,
      });
    }

    for (const items of order.items) {
      await releaseInventory({
        variantId: items.variant,
        quantity: items.quantity,
      });
    }

    if (order.paymentMethod === "RAZORPAY" && order.paymentStatus === "PAID") {
      if (!order.razorpayPaymentId)
        return res
          .status(404)
          .send({ message: "Razorpay Payment Id not found!", success: false });

      const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(order.totalAmount * 100),
      });
      order.paymentStatus = "REFUNDED";
      order.refundId = refund.id;
      order.refundedAt = new Date();
    }

    order.orderStatus = "CANCELLED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error,
    });
  }
};

//  get allorders fro vendor or admin
export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.orderStatus = req.query.status.toString();
    }

    const [orders, totalOrders] = await Promise.all([
      orderModel
        .find(filter)
        .populate("user", "name email")
        .populate("items.variant")
        .populate("items.product")
        .populate("address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      orderModel.createDocuments(filter),
    ]);
    return res.status(200).send({
      message: "Orders fetched successfully!",
      success: true,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit,
      },
    });
  } catch (error) {
    console.error("Get All Orders Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error,
    });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params;
    const allowedStatuses = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
    if (!status)
      return res.status(401).send({
        message: "Order status is required!",
        success: false,
      });

    const newStatus = status.toUppercase();

    if (!allowedStatuses.includes(newStatus))
      return res.status(400).send({
        message: "Invalid order status",
        success: false,
      });

    const order = await orderModel.findById(orderId);
    if (!order)
      return res.status(404).send({
        message: "Order not found!",
        sucess: false,
      });

    if (order.orderStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled order status cannot be changed",
      });
    }

    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: "Delivered order status cannot be changed",
      });
    }
    if (newStatus === "DELIVERED") {
      for (const item of order.items) {
        await commitInventory({
          variantId: item.variant,
          quantity: item.quantity,
        });
      }
    }

    const statusFlow = {
      CONFIRMED: ["PROCCESSING"],
      PROCCESSING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
    };

    if (!statusFlow[order.orderStatus]?.includes(newStatus)) {
      return res.status(400).send({
        message: `Cannot change order status from ${order.orderStatus} to ${newStatus}`,
        success: false,
      });
    }

    order.orderStatus = newStatus;
    await order.save();

    return res.send({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Update Order Status Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error,
    });
  }
};
