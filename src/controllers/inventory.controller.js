import { variantModel } from "../models/variant.model.js";
import { inventoryModel } from "../models/inventory.model.js";
import redis from "../config/redis/redis.js";

export const createInventory = async (req, res) => {
  try {
    const variant = req.params.id;
    const { quantity, reservedQuantity, lowStockThreshold, allowBackorder } =
      req.body;
    const existingVariant = await variantModel.findById(variant);
    if (!existingVariant)
      return res
        .status(404)
        .send({ message: "Variant not found!", success: false });
    const existingInventory = await inventoryModel.findOne({ variant });
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

export const getAllInventory = async (req, res) => {
  try {
    const {
      variant,
      allowBackorder,
      lowstock,
      page = 1,
      limit = 10,
      sort = "-createdAt",
    } = req.query;
    const filter = {};
    if (variant) {
      filter.variant = variant;
    }
    if (allowBackorder !== undefined) {
      filter.allowBackorder = allowBackorder === "true";
    }
    if (lowstock === "true") {
      filter.$expr = {
        $lte: [
          {
            $subtract: ["$quantity", "$reservedQuantity"]
          },
          "$lowStockThreshold"
        ]
      };
    }
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    const cacheKey = `inventory:${variant || "all"}:${allowBackorder || "all"}:${lowstock || "all"}:${pageNumber}:${limitNumber}:${sort}`;
    const cachedInventory = await redis.get(cacheKey);
    if (cachedInventory) {
      return res.status(200).send({
        message: "Inventory fetched from cache.",
        success: true,
        ...JSON.parse(cachedInventory)
      });
    }
    const [inventory, total] = await Promise.all([
      inventoryModel
        .find(filter)
        .populate("variant")
        .sort(sort)
        .skip(skip)
        .limit(limitNumber),

      inventoryModel.countDocuments(filter),
    ]);
    if (inventory.length === 0) {
      return res.status(404).send({
        message: "No Inventory found.",
        success: false
      })
    }

    const response = {
      inventory,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber);
      }
    }
    // Save in Redis for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), "EX", 300);

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      ...response,
    });
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
}

export const getSingleInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const cacheKey = `inventory:${inventoryId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).send({
        message: "Inventory fetched from cache",
        inventroy: JSON.parse(cachedData)
        , success: true
      });
    }
    const inventory = await inventoryModel.findById(inventoryId).populate("variant")

    if (!variant) return res.status(404).send(404).send({ message: "inventroy not found", success: false });
    // Store in Redis
    await redis.set(
      cacheKey,
      JSON.stringify(inventory),
      "EX",
      300
    );

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      inventory,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error,
    });
  }
}

export const updateInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const cacheKey = `inventory:${inventoryId}`;
    const inventory = await inventoryModel.findById(inventoryId);
    if (!inventory) return res.status(404).send({ message: 'Inventory not found!', success: false });
    await redis.del(cacheKey);
    const {
      quantity,
      reservedQuantity,
      lowStockThreshold,
      allowBackorder
    } = req.body;
    if (quantity !== undefined) inventory.quantity = quantity;
    if (reservedQuantity !== undefined) inventory.reservedQuantity = reservedQuantity;
    if (lowStockThreshold !== undefined) inventory.lowStockThreshold = lowStockThreshold;
    if (allowBackorder !== undefined) inventory.allowBackorder = allowBackorder;
    await inventory.save();

    await redis.set(cacheKey, JSON.stringify(inventory), "EX", 300);
    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      inventory,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory",
      error,
    });
  }
}

export const deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const cacheKey = `inventory:${inventoryId}`;
    const inventory = await inventoryModel.findByIdAndDelete(inventoryId);
    if (!inventory) return res.status(404).send({ message: "Inventory not found!", success: false });
    await redis.del(cacheKey);
    return res.status(200).send({ message: "Inventory Deleted.", success: true })
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to update inventory",
      error,
    });
  }
}

export const reserveInventory = async ({ variantId, quantity }) => {
  try {
    const inventory = await inventoryModel.findOneAndUpdate({
      variant: variantId,
      $expr: {
        $gte: [
          {
            $subtract: ["$quantity", "$reservedQuantity"]
          },
          quantity
        ]
      }
    },
      {
        $inc: {
          reservedQuantity: quantity
        }
      },
      {
        new: true,
      }
    );
    if (!inventory) {
      throw new Error("Insufficient stock");
    }
    return inventory
  } catch (error) {
    console.log(error)
    console.log(error.message);
    throw new Error("Something went wrong");
  }
}

export const releaseInventory = async ({ variantId, quantity }) => {
  try {
    const inventory = await inventoryModel.findOneAndUpdate(
      {
        variant: variantId,
        reservedQunatity: { $gte: quantity }
      },
      {
        $inc: {
          reservedQuantity: -quantity
        }
      },
      {
        new: true
      }
    );
    if (!inventory) throw new Error("Inventory reservation not found");
    return inventory;
  } catch (error) {
    console.log(error)
    console.log(error.message);
    throw new Error("Something went wrong!");
  }
}

export const commitInventory = async ({ variantId, quantity }) => {
  const inventory = await inventoryModel.findOneAndUpdate(
    {
      variant: variantId,
      reservedQuantity: { $gte: quantity },
      quantity: { $gte: quantity },
    },
    {
       $inc: {
        quantity: -quantity,
        reservedQuantity: -quantity,
      },
    },
    {
      new:true
    }
  );
  if(!inventory) throw new Error("Unable to commit inventory");
  return inventory;
}