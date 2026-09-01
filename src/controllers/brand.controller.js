import { brandModel } from "../models/brand.model.js";
import redis from "../config/redis/redis.js";
import cloudinary from "../services/cloudinary/cloudinary.js";
import { v2 as uuid } from "uuid";

export const createBrand = async (req, res) => {
  try {
    const { name, slug, description, logo } = req.body;
    if (!name || !slug)
      return res
        .status(401)
        .send({ message: "name and slug is required!", success: false });
    const isBrandExist = await brandModel.findOne({
      $or: [{ name }, { slug }],
    });
    if (isBrandExist)
      return res
        .status(409)
        .send({ message: "Brand already exist!", success: false });
    let brandLogo;
    if (req.file) {
      brandLogo = {
        url: req.file.path,
        publicId: uuid(),
      };
    }
    const brand = await brandModel.create({
      name,
      slug,
      description,
      logo: brandLogo,
    });
    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllBrand = async (req, res) => {
  try {
    const {
      search = "",
      isActive,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;

    // pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Filter
    const filter = {};

    // Search
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }
    // Redis cache key
    const cacheKey = `brands:${search}:${isActive}:${pageNumber}:${limitNumber}:${sort}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData)
      return res.status(200).send({
        message: "Data fetched from redis.",
        source: "redis",
        success: true,
        data: JSON.parse(cacheData),
      });
    const brands = await brandModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNumber);

    // Total brands
    const totalBrands = await brandModel.countDocuments(filter);
    const result = {
      brands,
      pagination: {
        totalBrands,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalBrands / limitNumber),
        limit: limitNumber,   
      },
    };

    await redis.set(cacheKey,JSON.stringify(result),"EX",300);
    return res.status(200).send({success:true,source:"database",data:result})
  } catch (error) {
    console.log(error.message);
    return res.status(500).send({message:"Server Error.",success:true,error});
  }
};

export const getSingleBrand = async (req,res) => {
  try {
    const brandId = req.params.id;
    
  } catch (error) {
    
  }
}