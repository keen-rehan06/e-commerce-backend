import { addressModel } from "../models/address.model.js";
import redis from "../config/redis/redis.js";

export const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      landmark,
      addressType,
      isDefault,
    } = req.body;
    const addressCount = await addressModel.countDocuments({
      user: userId,
    });
    let makeDefault = isDefault;
    if (addressCount === 0) {
      makeDefault = true;
    }
    // If new address is default, remove old default
    if (makeDefault) {
      await addressModel.updateMany(
        {
          user: userId,
          isDefault: true,
        },
        {
          $set: { isDefault: false },
        },
      );
    }
    const address = await addressModel.create({
      user: userId,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      landmark,
      addressType,
      isDefault: makeDefault,
    });
    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add address",
      error,
    });
  }
};

export const getMyAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `address:${userId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData)
      return res.status(200).send({
        message: "address fetched from redis.",
        ...JSON.parse(cacheKey),
        success: true,
      });
    const addresses = await addressModel
      .find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 });
    await redis.set(cacheKey, ...JSON.stringify, "EX", 300);
    return res
      .status(200)
      .send({ message: "address fetched from db", success: true, addresses });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to get addresses",
      error,
    });
  }
};

export const getSingleAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const cacheKey = `getsingleaddress:${addressId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData)
      return res.status(200).send({
        message: "Address fetched from cache.",
        success: true,
        ...JSON.parse(cachedData),
      });
    const address = await addressModel.findOne({
      _id: addressId,
      user: req.user.id,
    });
    if (!address)
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    await redis.set(cacheKey, ...JSON.stringify(address), "EX", 300);

    return res.status(200).json({
      success: true,
      message: "Address fetched successfully",
      address,
    });
  } catch (error) {
    console.error("Get Single Address Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
