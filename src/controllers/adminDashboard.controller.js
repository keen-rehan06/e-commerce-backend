import redis from "../config/redis/redis";
import { userModel } from "../models/user.model.js";
import { orderModel } from "../models/order.model.js";
import { productModel } from "../models/product.model.js";
import { reviewModel } from "../models/reviews.model.js";

export const adminDashboard = async (req, res) => {
  try {
    const cacheKey = "admin:dashboard";
    const cacheData = await redis.get(cacheKey);
    if (cacheData)
      return res
        .status(200)
        .send({ success: true, source: "redis", data: JSON.parse(cacheData) });

    // Get dashboard data from MongoDB
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalReviews,

      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,

      revenueResult,
    ] = await Promise.all([
      orderModel
        .find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .select("_id user totalAmount status paymentStatus createdAt")
        .populate("user", "name email"),

      userModel.countDocuments(),
      productModel.countDocuments(),
      orderModel.countDocuments(),
      reviewModel.countDocuments(),

      orderModel.countDocuments({ status: "PENDING" }),
      orderModel.countDocuments({ status: "PROCESSING" }),
      orderModel.countDocuments({ status: "SHIPPED" }),
      orderModel.countDocuments({ status: "DELIVERED" }),
      orderModel.countDocuments({ status: "CANCELLED" }),

      orderModel.aggregate([
        {
          $match: {
            status: "DELIVERED",
            paymentStatus: "PAID",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const dashboardData = {
      users: {
        total: totalUsers,
      },
      products: {
        total: totalProducts,
      },
      ordes: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        recent: recentOrders,
      },
      reviews: {
        total: totalReviews,
      },
      revenue: {
        total: totalRevenue,
      },
    };

    await redis.set(cacheKey, JSON.stringify(dashboardData), "EX", 300);
    return res.status(200).json({
      success: true,
      source: "mongodb",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard",
      error,
    });
  }
};
