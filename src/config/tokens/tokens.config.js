import jwt from "jsonwebtoken";

export const generateToken = (user) => {
    return jwt.sign({id:user._id}, process.env.JWT_SECRET,
        {expiresIn:"10m"});
}

export const generateAccessToken = (user) => {
    return jwt.sign({id:user._id,role:user.role},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"10m"});
}

export const generateRefreshToken = (user) => {
    return jwt.sign({id:user._id,role:user.role},process.env.REFRESH_TOKEN_SECRET,{expiresIn:"7d"})
}