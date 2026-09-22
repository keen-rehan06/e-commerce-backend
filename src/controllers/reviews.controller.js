import { reviewModel } from "../models/reviews.model.js";
import { productModel } from "../models/product.model.js";
import { orderModel } from "../models/order.model.js";
import redis from "../config/redis/redis.js";

export const createReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const { orderId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!orderId || !rating || !comment)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });

    const product = await productModel.findById(productId);
    if (!product)
      return res
        .status(404)
        .send({ message: "Product not found!", success: false });
    const order = await orderModel.findOne({
      _id: orderId,
      user: userId,
      orderStatus: "DELIVERED",
    });
    if (!order)
      return res.status(404).send({
        message: "You can review only delivered orders",
        success: false,
      });
    const purchasedProduct = order.items.some(
      (item) => item.product.toString() === productId,
    );
    if (!purchasedProduct)
      return res.status(401).send({
        message: "You have not purchased this product",
        success: false,
      });

    const alreadyReviewed = await reviewModel.findOne({
      user: userId,
      product: productId,
    });

    if (alreadyReviewed)
      return res.status(401).send({
        message: "You have already reviewed this product",
        success: false,
      });

    const review = await reviewModel.create({
      user: userId,
      product: productId,
      order: orderId,
      rating,
      comment,
    });
    return res.status(201).send({
      message: "review created successfully!",
      success: true,
      review,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error,
    });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const cacheKey = `reviews:${productId}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData)
      return res.status(200).send({
        message: "Reviews fetched successfully!",
        success: true,
        source: "redis",
        reviews: JSON.parse(cacheData),
      });
    const product = await productModel.findById(productId);
    if (!product)
      return res
        .status(404)
        .send({ message: "product not found!", success: false });

    const reviews = await reviewModel
      .find({ product: productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    if (reviews.length < 1)
      return res.status(200).send({ message: "No reviews!", success: true });

    await redis.set(cacheKey, ...JSON.stringify(reviews), "EX", 300);
    return res.status(200).send({
      message: "reviews fetched successfully!",
      success: true,
      reviewsLength: reviews.length,
      reviews,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error,
    });
  }
};
