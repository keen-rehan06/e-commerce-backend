import { variantModel } from "../models/variant.model.js";
import { inventoryModel } from "../models/inventory.model.js";

export const createInventory = async (req, res) => {
  try {
    const variant = req.params.id;
    const { 
        quantity,
        reservedQuantity, 
        lowStockThreshold, 
        allowBackorder 
    } = req.body;
    const existingVariant = await variantModel.findById(variant);
    if(!existingVariant) return res.status(404).send({message:"Variant not found!",success:false});
    const existingInventory = await inventoryModel.findOne({variant});
    if (existingInventory) {
      return res.status(409).json({
        success: false,
        message: "Inventory already exists for this variant",
      });
    }
     const inventory = await inventoryModel.create({
      variant,
      quantity,
      reservedQuantity,
      lowStockThreshold,
      allowBackorder,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      inventory,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create inventory",
      error: error.message,
    });
  }
};
