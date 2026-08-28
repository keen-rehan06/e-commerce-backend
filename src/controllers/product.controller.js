import { productModel } from "../models/product.model.js";
import { categoryModel } from "../models/category.model.js";
import { brandModel } from "../models/brand.model.js";
import redis from "../config/redis/redis.js" 

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
    const product = await productModel.create({
      name,
      slug,
      description,
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
    const {search,brand,category,page}
  } catch (error) {
    console.error("Get All Products Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
