import { categoryModel } from "../models/category.model";

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
    const allCategories = await categoryModel.find();
    if (allCategories.length == 0)
      return res
        .status(404)
        .send({ message: "Sorry! No Categories were found!", success: false });
    return res.status(200).send({
      message: "All Categories are here.",
      allCategories,
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
    const category = await categoryModel.findById(categoryId);
    if (!category)
      return res
        .status(401)
        .send({ message: "No Category found!", success: false});
        return res.status(200).send({data:category,success:true});
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Internal Server Error.", success: false, error });
  }
};

export const updateCategory = async (req,res) => {
  try {
    
  } catch (error) {
    
  }
}