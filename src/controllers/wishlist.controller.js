import { productModel } from "../models/product.model.js";
import { wishlistModel } from "../models/wishlist.model.js";
import redis from "../config/redis/redis.js";

export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const product = await productModel.findById(productId);
    if (!product)
      return res.status(404).send({
        message: "Product not found!",
        success: false,
      });
    let wishlist = await wishlistModel.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await wishlistModel.create({
        user: userId,
        product: [productId],
      });
      return res.status(201).json({
        success: true,
        message: "Product added to wishlist",
        wishlist,
      });
    }
    if (wishlist.product.includes(productId)) {
      return res.status(400).send({
        success: false,
        message: "Product already exist in wishlist",
      });
    }
    wishlist.product.push(productId);
    await wishlist.save();
    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `wishlist:${userId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData)
      return res.status(200).send({
        message: "data fetched from cache.",
        data: JSON.parse(cachedData),
        success: true,
      });
    const wishList = await wishlistModel
      .findOne({ user: userId })
      .populate("product");
    if (!wishList)
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    await redis.set(cacheKey, JSON.stringify(wishList), "EX", 300);
    return res.status(200).json({
      success: true,
      message: "Wishlist fetched successfully",
      wishList,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const removeFromWishList = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const cacheKey = `wishlist:${userId}`;
    const wishlist = await wishlistModel.findOneAndDelete({
      $or: [{ user: userId }, { product: productId }],
    });
    if (!wishlist)
      return res
        .status(404)
        .send({ message: "Wishlist not found.", success: false });

    await redis.del(cacheKey);
    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.log(error);
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Product Failed to removed from wishlist",
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `wishlist:${userId}`;
    const wishlist = await wishlistModel.findOneAndDelete({
       user: userId 
    });
    if (!wishlist)
      return res
        .status(404)
        .send({ message: "wishlist not found!", success: false });
    await redis.del(cacheKey);
    return res
      .status(200)
      .send({ message: "wishlist cleared successfully!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "wishlist failed to cleared!", success: false, error });
  }
};