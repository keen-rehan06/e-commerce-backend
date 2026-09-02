import {productModel} from "../models/product.model.js"
import {variantModel} from "../models/variant.model.js"
import {v2 ass uuid} from "uuid";

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
    const isProductExist = await productModel.findById(productId)
    if(!isProductExist) return res.status(404).send({
        message: "Product not found!",
        success: false
      });
      let variantImage;
    if(req.file) {
        variantImage = {
            url:req.file.path,
            publicId:uuid(),
            altText:`${req.file.filename} variant Image`
        }
    }
    const variant = await variantModel.create({
        product:productId,
        sku,
        price,
        compareAtPrice,
        costPrice,
        currency,
        isDefault,
        status,
        images:variantImage,
    })
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
