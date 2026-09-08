import { variantModel } from "../models/variant.model.js";
import { cartModel } from "../models/cart.model.js";

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
