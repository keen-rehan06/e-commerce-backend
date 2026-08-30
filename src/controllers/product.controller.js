import { productModel } from "../models/product.model.js";
import { categoryModel } from "../models/category.model.js";
import { brandModel } from "../models/brand.model.js";
import redis from "../config/redis/redis.js";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import cloudinary from "../services/cloudinary/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const { name, slug, description, brand, category } = req.body;
    if (!name || !slug || !description || !brand || !category)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });
    const existingProduct = await productModel.findOne({ slug });
    if (existingProduct)
      return res.status(409).send({
        message: "Product with this slug already exists",
        success: false,
      });
    const existingBrand = await brandModel.findOne({ brand });
    if (!existingBrand)
      return res.status(404).send({ message: "Brand not foud" });
    const existingCategory = await categoryModel.findOne({ category });
    if (!existingCategory)
      return res
        .status(404)
        .send({ message: "Category not Found!", success: false });
    const images = req.files.map((file) => ({
      url: req.file.path,
      publicId: uuid(),
      alterText: `${name} Product Image.`,
    }));
    const product = await productModel.create({
      name,
      slug,
      description,
      images,
      brand: existingBrand._id,
      category: existingCategory._id,
    });
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      brand,
      category,
      page = 1,
      limit = 10,
      sort = "newest",
    } = req.query;
    const cacheKey = `products:${JSON.stringify({
      search,
      brand,
      category,
      page,
      limit,
      sort,
    })}`;
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts)
      return res.status(200).send({
        message: "Products fetched from cache",
        success: true,
        products: JSON.parse(cachedProducts),
      });
    // filter object
    const filter = {};
    //search by product name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }
    // Filter by brand
    if (brand) filter.brand = brand;
    // Filter by category
    if (category) filter.category = category;

    // Pagination
    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    // sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }
    if (sort === "name_asc") {
      sortOption = { name: 1 };
    }

    if (sort === "name_desc") {
      sortOption = { name: -1 };
    }
    // 6. Get products + total count
    const [products, totalProducts] = await Promise.all([
      productModel
        .find(filter)
        .populate("brand", "name")
        .populate("category", "name")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber),
      productModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalProducts / limitNumber);
    const result = {
      products,
      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,
        nextPage: pageNumber < totalPages,
        previousPage: pageNumber > 1,
      },
    };
    // 8. Save in Redis
    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    // 9. Response
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      result,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const cacheKey = `product:${productId}`;
    const cachedProduct = await redis.get(cacheKey);
    if (cachedProduct)
      return res.status(200).send({
        message: "Product fetch from redis cache.",
        cachedProduct,
        success: true,
      });
    const product = await productModel
      .findById(productId)
      .populate("brand", "name")
      .populate("category", "name");
    if (!product)
      return res
        .status(404)
        .send({ message: "Product not found!", success: false });
    await redis.set(cacheKey, JSON.stringify(product), "EX", 300);
    return res
      .status(200)
      .send({ message: "Product fetch from db.", product, success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await productModel.findById(productId);
    if (!product)
      return res
        .status(404)
        .send({ message: "Product not found!", success: false });
    const allowedFields = [
      "name",
      "slug",
      "description",
      "shortDescription",
      "brand",
      "category",
      "tags",
      "status",
      "isFeatured",
    ];
    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }
    if (Object.keys(update).length === 0)
      return res
        .status(400)
        .json({ success: false, message: "No fields provided for update" });

    if (req.file) {
      const oldPublicId = product.images?.publicId;
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }
      product.images = {
        url: req.file.path,
        publicId: uuid(),
      };
    }
    await product.save();
    await redis.del(cacheKey);
    
    const updateProduct = await productModel.findByIdAndUpdate(
      productId,
      update,
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updateProduct,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
