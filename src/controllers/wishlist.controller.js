import {productModel} from "../models/product.model.js"
import {wishlistModel} from "../models/wishlist.model.js"

export const addToWishlist = async (req,res) => {
    try {
    const productId = req.params.id;
    const userId = req.user.id;
    const product = await productModel.findById(productId);
    if(!product) return res.status(404).send({
        message:"Product not found!",
        success:false,
    });
    let wishlist = await wishlistModel.findOne({user:userId});
    
    if(!wishlist) {
        wishlist = await wishlistModel.create({
            user:userId,
            products: [productId],
        });
        return res.status(201).json({
        success: true,
        message: "Product added to wishlist",
        wishlist,
      });
    }
    if(wishlist.products.includes(productId)) {
        return res.status(400).send({
            success:false,
            message:"Product already exist in wishlist",
        })
    }
    wishlist.products.push(productId);
    await wishlist.save();
    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist,
    });
    } catch (error) {
        console.log(error.message);
       return res.status(500).json({
      success: false,
      error,
    }); 
    }
}

export const getMyWishlist = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
} 