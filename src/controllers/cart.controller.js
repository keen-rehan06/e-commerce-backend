import { variantModel } from "../models/variant.model.js";
import { inventoryModel } from "../models/inventory.model.js";
import { cartModel } from "../models/cart.model.js";
import redis from "../config/redis/redis.js";

export const addToCart = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    if (!quantity || quantity < 1) {
      return res.status(401).send({
        success: false,
        message: "Quantity must be at least 1",
      });
    }
    const variant = await variantModel.findById(variantId);
    if (!variant)
      return res
        .status(404)
        .send({ message: "variant not found!", success: false });
    const inventory = await inventoryModel.findOne({
      variant: variantId,
    });
    if (!inventory)
      return res
        .status(404)
        .send({ message: "Inventory not found!", success: false });

    const availableQuantity = inventory.quantity - inventory.reservedQuantity;

    if (availableQuantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }
    let cart = await cartModel.findOne({
      user: userId,
    });
    if (!cart) {
      cart = await cartModel.create({
        user: userId,
        items: [
          {
            product: variant.product,
            variant: variantId,
            quantity,
          },
        ],
      });
      return res.status(201).json({
        success: true,
        message: "Product added to cart",
        cart,
      });
    }
    const existingItem = cart.items.find(
      (item) => item.variant.toString() === variantId,
    );
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        product: variant.product,
        variant: variantId,
        quantity,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const getMyCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `cart:${userId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData)
      return res.status(200).send({
        message: "cart fetched from cache.",
        success: true,
        ...JSON.parse(cachedData),
      });
    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product")
      .populate(`items.variant`);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    await redis.set(cacheKey, JSON.stringify(cart), "EX", 300);
    return res
      .status(200)
      .send({ success: true, message: "Cart fetched successfully", cart });
  } catch (error) {
    console.log(error.message);
     return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const updateMyCart = async (req,res) => {
  try {
    const {variantId} = req.params;
    const { quantity } = req.body;
    const userId = req.user.id;
    const cacheKey = `cart:${userId}`;
    if(!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }
    const cart = await cartModel.findOne({
      user: userId,
    });

     if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    const cartItem = cart.items.find((item) => item.variant.toString() === variantId);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }
    
    const inventory = inventoryModel.findOne({
      variant:variantId,
    });

    if(!inventory) 
       return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
      const availableQuantity = inventory.quantity - inventory.reservedQuantity;

      if(quantity > availableQuantity) return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
      await redis.del(cacheKey);
      cartItem.quantity = quantity;
      await cart.save();
      return res.status(200).send({
        success:true,
        message:"cart item updated successsully!",
        cart
      })
      
      } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      success: false,
      error,
    });
  }
}

export const removeCartItem = async (req,res) => {
  try {
    const {variantId} = req.params.id;
    const userId = req.user.id;
    const cart = await cartModel.findOne({
      user:userId
    });
    if(!cart) return res.status(404).send({message:"Message not found!",success:false})

   // Item cart me hai ya nahi check karo
   const itemExists = cart.items.some(
    (item) => item.variant.toString() === variantId
   )
    if(!itemExists) return res.status(404).send({message:"Item not found in cart!",success:false});

    cart.items = cart.items.filter((item) => item.variant.toString() !== variantId);
     await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export const clearCart = async (req,res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `cart:${userId}`;
    const cart = await cartModel.findOne({
      user:userId
    });
    if(!cart) return res.status(404).send({
      message:"cart not found!",
      successs:false
    });
    cart.items = [];
    await cart.save();
    await redis.del(cacheKey);
    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.log(error.message);
      return res.status(500).json({
      message: "cart cleared failed!",
      success: false,
    });
  }
}