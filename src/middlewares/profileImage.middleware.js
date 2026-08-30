import multer from "multer";
import cloudinary from "../services/cloudinary/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"e-commerce/profile",
        allowed_formats:["jpg", "jpeg", "png", "webp"],
    }
});

export const profileImageUpload = multer({
    storage,
    limits:{
        fileSize: 2 * 1024 * 1024,
    }
});