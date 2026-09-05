import { productModel } from "../models/product.model.js";
import { variantModel } from "../models/variant.model.js";
import { v2 as uuid } from "uuid";
import redis from "../config/redis/redis.js";

export const createVariant = async (req, res) => {
  try {
    const productId = req.params.id;
    const {
      sku,
      price,
      compareAtPrice,
      costPrice,
      currency,
      images,
      isDefault,
      status,
    } = req.body;
    if (!sku || price === undefined)
      return res.status(400).send({
        message: "SKU and price are required!",
        success: false,
      });
    const isProductExist = await productModel.findById(productId);
    if (!isProductExist)
      return res.status(404).send({
        message: "Product not found!",
        success: false,
      });
    let variantImage;
    if (req.file) {
      variantImage = {
        url: req.file.path,
        publicId: uuid(),
        altText: `${req.file.filename} variant Image`,
      };
    }
    const variant = await variantModel.create({
      product: productId,
      sku,
      price,
      compareAtPrice,
      costPrice,
      currency,
      isDefault,
      status,
      images: variantImage,
    });
    return res.status(201).send({
      message: "Variant created successfully!",
      success: true,
      variant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: "Error while creating variant!",
      success: false,
      error: error.message,
    });
  }
};

export const getAllVariants = async (req, res) => {
  try {
    const { page = 1, limit = 10, product, sku } = req.query;
    const skip = (page - 1) * limit;
    const cacheKey = `variants:${page}:${limit}:${product || ""}:${sku || ""}`;
    const cachedVariants = await redis.get(cacheKey);
    if (cachedVariants)
      return res.status(200).send({
        message: "Varient fetched from cache",
        success: true,
        variants: JSON.parse(cachedVariants),
      });

    // filter
    const filter = {};
    if (product) {
      filter.product = product;
    }

    if (sku) {
      filter.sku = { $regex: sku, $options: "i" };
    }
    const variants = await variantModel
      .find(filter)
      .populate("product")
      .skip(skip)
      .limit(Number(limit).sort({ createdAt: -1 }));
    const totalVariants = await variantModel.countDocuments(filter);
    await redis.set(cacheKey, JSON.stringify(variants), "EX", 300);
    return res.status(200).send({
      success: true,
      message: "All variants fetched successfully",
      totalVariants,
      currentPage: Number(page),
      totalPages: Math.ceil(totalVariants / limit),
      variants,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error while fetching variants",
      error: error.message,
    });
  }
};

export const getSingleVariant = async (req, res) => {
  try {
    const variantId = req.params.id;
    const cacheKey = `variant:${variantId}`;
    const cachedData = await redis.get(cacheKey);
    if (cacheKey)
      return res.status(200).send({
        message: "variant fetched from cahced.",
        success: true,
        data: JSON.parse(cachedData),
      });
    const variant = await variantModel.findById(variantId).populate("product");
    if (!variant)
      return res
        .status(404)
        .send({ message: "variant not found!", success: false });
    //  Redis me store karo
    await redis.set(cacheKey, JSON.stringify(variant), "EX", 300);

    //  Response
    return res.status(200).json({
      message: "Variant fetched successfully",
      success: true,
      variant,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const updateSingleVarinat = async (req, res) => {
  try {
    const variantId = req.params.id;
    const {
      sku,
      price,
      compareAtPrice,
      costPrice,
      currency,
      images,
      isDefault,
      status,
    } = req.body;
    const variant = await 
  } catch (error) {}
};
