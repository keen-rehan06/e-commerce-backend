import { productModel } from "../models/product.model.js";
import { categoryModel } from "../models/category.model.js";
import { brandModel } from "../models/brand.model.js";
import redis from "../config/redis/redis.js";
import mongoose, { createConnection } from "mongoose";
import { v4 as uuid } from "uuid";
import cloudinary from "../services/cloudinary/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const { name, slug, description, brand, category } = req.body;
    if (!name || !slug || !description || !brand || !category || !req.file)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });
    const existingProduct = await productModel.findOne({ slug });
    if (existingProduct)
      return res.status(409).send({
        message: "Product with this slug already exists",
        success: false,
      });
    const existingBrand = await brandModel.findOne({
      $or: [
        { name: { $regex: brand, $options: "i" } },
        { slug: { $regex: brand, $options: "i" } },
      ],
    });
    if (!existingBrand)
      return res.status(404).send({ message: "Brand not found" });
    const existingCategory = await categoryModel.findOne({
      $or: [
        { name: { $regex: category, $options: "i" } },
        { slug: { $regex: category, $options: "i" } },
      ],
    });
    if (!existingCategory)
      return res
        .status(404)
        .send({ message: "Category not Found!", success: false });

    let image = {
      url: req.file.path,
      publicId: uuid(),
      alterText: `${name} Product Image.`,
    };
    const product = await productModel.create({
      name,
      slug,
      description,
      images: image,
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

    // Validate pagination
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    // Allowed sorting
    const allowedSorts = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    // Redis cache key
    const cacheKey = `products:${JSON.stringify({
      search: search?.trim() || "",
      brand: brand?.trim() || "",
      category: category?.trim() || "",
      page: pageNumber,
      limit: limitNumber,
      sort,
    })}`;

    const cachedProducts = await redis.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json({
        success: true,
        message: "Products fetched from cache",
        result: JSON.parse(cachedProducts),
      });
    }

    const sortOption = allowedSorts[sort] || allowedSorts.newest;

    // Escape regex special characters
    const escapeRegex = (value) => {
      return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    // Filter object
    const filter = {};

    // Search by product name
    if (search) {
      filter.name = {
        $regex: escapeRegex(search.trim()),
        $options: "i",
      };
    }

    // Filter by brand name OR slug
    if (brand) {
      const brandRegex = escapeRegex(brand.trim());

      const brandData = await brandModel
        .find({
          $or: [
            { name: { $regex: brandRegex, $options: "i" } },
            { slug: { $regex: brandRegex, $options: "i" } },
          ],
        })
        .select("_id")
        .lean();

      // Brand not found
      if (brandData.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No products found",
          result: {
            products: [],
            pagination: {
              currentPage: pageNumber,
              limit: limitNumber,
              totalProducts: 0,
              totalPages: 0,
              nextPage: false,
              previousPage: false,
            },
          },
        });
      }

      filter.brand = {
        $in: brandData.map((item) => item._id),
      };
    }

    // Filter by category name OR slug
    if (category) {
      const categoryRegex = escapeRegex(category.trim());

      const categoryData = await categoryModel
        .find({
          $or: [
            { name: { $regex: categoryRegex, $options: "i" } },
            { slug: { $regex: categoryRegex, $options: "i" } },
          ],
        })
        .select("_id")
        .lean();

      // Category not found
      if (categoryData.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No products found",
          result: {
            products: [],
            pagination: {
              currentPage: pageNumber,
              limit: limitNumber,
              totalProducts: 0,
              totalPages: 0,
              nextPage: false,
              previousPage: false,
            },
          },
        });
      }

      filter.category = {
        $in: categoryData.map((item) => item._id),
      };
    }

    // Pagination
    const skip = (pageNumber - 1) * limitNumber;

    // Check Redis cache

    // Get products + total count
    const [products, totalProducts] = await Promise.all([
      productModel
        .find(filter)
        .populate("brand", "name slug")
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      productModel.countDocuments(filter),
    ]);

    // Pagination details
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

    // Save result in Redis for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result), "EX", 300);

    // Response
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
        ...JSON.parse(cachedProduct),
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

    const {
      name,
      slug,
      description,
      shortDescription,
      brand,
      category,
      tags,
      status,
      isFeatured,
    } = req.body;
    if (name?.trim()) {
      product.name = name;
    }
    if (slug?.trim()) {
      product.slug = slug;
    }
    if (description?.trim()) {
      product.description = description;
    }
    if (shortDescription?.trim()) {
      product.shortDescription = shortDescription;
    }
    if (tags?.trim) {
      product.tags = tags;
    }
    if (status?.trim()) {
      product.status = status;
    }
    if (isFeatured?.trim()) {
      product.isFeatured = isFeatured;
    }
    if (brand?.trim()) {
      const brandData = await brandModel.findOne({
        $or: [
          { name: { $regex: brand, $options: "i" } },
          { slug: { $regex: brand, $options: "i" } },
        ],
      });
      if (!brandData)
        return res
          .status(404)
          .send({ message: "Brand Not found!", success: false });
      product.brand = brandData._id;
    }
    if (category?.trim()) {
      const categoryData = await categoryModel.findOne({
        $or: [
          { name: { $regex: category, $options: "i" } },
          { slug: { $regex: category, $options: "i" } },
        ],
      });
      if (!categoryData)
        return res
          .status(404)
          .send({ message: "category not found!", success: false });
      product.category = categoryData._id;
    }
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
    const cacheKey = `product:${productId}`;
    await redis.del(cacheKey);

    await redis.set(cacheKey, JSON.stringify(product), "EX", 300);
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteSingleProduct = async (req, res) => {
  try {
    const {productId} = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }
    const product = await productModel.findByIdAndDelete(productId);
    if (!product)
      return res
        .status(404)
        .send({ message: "Product not found!", success: false });
    const cacheKey = `product:${productId}`;
    await redis.del(cacheKey);
    return res
      .status(200)
      .send({ message: "Product Deleted SuccessFully!", success: true });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
