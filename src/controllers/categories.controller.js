import { categoryModel } from "../models/category.model.js";
import redis from "../config/redis/redis.js";

export const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name || !slug)
      return res
        .status(401)
        .send({ message: "All fields are required!", success: false });
    const isExistCategory = await categoryModel.findOne({
      $or: [{ name }, { slug }],
    });
    if (isExistCategory)
      return res
        .status(401)
        .send({ message: "Category is already exist!", success: false });
    const createCategory = await categoryModel.create({
      name,
      slug,
    });
    return res
      .status(200)
      .send({ message: "Category Created.", createCategory });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const cacheKey = "categories:all";
    const cachedCategories = await redis.get(cacheKey);
    if (cachedCategories)
      return res.status(200).json({
        success: true,
        source: "redis",
        categories: JSON.parse(cachedCategories),
      });
    const allCategories = await categoryModel.find();
    if (allCategories.length == 0)
      return res
        .status(404)
        .send({ message: "Sorry! No Categories were found!", success: false });
    await redis.set(cacheKey, JSON.stringify(allCategories), "EX", 300);
    return res.status(200).send({
      message: "All Categories are here.",
      source: "mongodb",
      categories: allCategories,
      success: true,
    });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const getSingleCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const cacheKey = `categories:${categoryId}`;
    const cachedCategories = await redis.get(cacheKey);
    if (cachedCategories)
      return res
        .status(200)
        .json({
          category: JSON.parse(cachedCategories),
          source: "redis",
          success: true,
        });
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return res
        .status(401)
        .send({ message: "No Category found!", success: false });
    await redis.set(cacheKey, JSON.stringify(category), "EX", 600);
    return res.status(200).send({ data: category, success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;
    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return res
        .status(401)
        .send({ message: "Category not found!", success: false });
    if (name !== undefined && slug !== undefined) {
      category.name = name;
      category.slug = slug;
    } else if (name !== undefined) category.name = name;
    else category.slug = slug;
    await category.save();
    return res
      .status(200)
      .send({ message: "Category Updated SuccessFully!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return res
        .status(404)
        .send({ message: "category not found!", success: false });
    await categoryModel.deleteOne(categoryId);
    return res
      .status(200)
      .send({ message: "category deleted successfully!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal server error", success: false });
  }
};
