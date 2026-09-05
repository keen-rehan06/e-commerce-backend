import cloudinary from "../cloudinary/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const storage = new CloudinaryStorage({
    cloudinary,
    params:{
        folder:"e-commerce/varinat",   allowed_formats: ["jpg", "jpeg", "png", "webp"],
            }
        });
        
        export const brandLogoUpload = multer({
            storage,
            limits:{
                fileSize: 2 * 1024 * 1024,
            }
        });