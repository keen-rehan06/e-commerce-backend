import { productModel } from "../models/product.model.js";
import { wishlistModel } from "../models/wishlist.model.js";
import redis from "../config/redis/redis.js";

export const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
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
        products: [productId],
      });
      return res.status(201).json({
        success: true,
        message: "Product added to wishlist",
        wishlist,
      });
    }
    if (wishlist.products.includes(productId)) {
      return res.status(400).send({
        success: false,
        message: "Product already exist in wishlist",
      });
    }
    wishlist.products.push(productId);
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
        ...JSON.parse(cachedData),
        success: true,
      });
    const wishList = await wishlistModel
      .findOne({ user: userId })
      .populate("products");
    if (!wishList)
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    await redis.set(cacheKey, ...JSON.stringify(wishList), "EX", 300);
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
    const productId = req.params.id;
    const userId = req.user.id;
    const cacheKey = `wishlist:${userId}`;
    const wishlist = await wishlistModel.findOne({ user: userId });
    if (!wishlist)
      return res
        .status(404)
        .send({ message: "Wishlist not found.", success: false });
    if (!wishlist.products.includes(productId))
      return res
        .status(401)
        .send({ message: "Product not found in wishlist", success: false });
    wishlist.products.pull(productId);
    await wishlist.save();
    await redis.del(cacheKey);
    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Product Failed to removed from wishlist",
    });
  }
};
