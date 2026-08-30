import multer from "multer";
import {CloudinaryStorage} from "multer-storage-cloudinary";
import { cloudinary } from "../services/cloudinary/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"e-commerce/products",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
    }
});

export const productsImageupload = multer({
    storage,
    limits:{
        fileSize: 2 * 1024 * 1024,
    }
}); 