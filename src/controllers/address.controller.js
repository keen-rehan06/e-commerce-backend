import { addressModel } from "../models/address.model.js";
import redis from "../config/redis/redis.js";

export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
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
    console.log(error.message);
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
        data: JSON.parse(cacheKey),
        success: true,
      });
    const addresses = await addressModel
      .find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 });
    await redis.set(cacheKey, JSON.stringify, "EX", 300);
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
    const { addressId } = req.params;
    const cacheKey = `getsingleaddress:${addressId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData)
      return res.status(200).send({
        message: "Address fetched from cache.",
        success: true,
        data: JSON.parse(cachedData),
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
    await redis.set(cacheKey, JSON.stringify(address), "EX", 300);

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

export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const cacheKey = `getsingleaddress:${addressId}`;
    const address = await addressModel.findOne({
      _id: addressId,
      user: req.user.id,
    });
    if (!address)
      return res
        .status(404)
        .send({ message: "Address not found!", success: false });
    await redis.del(cacheKey);
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
    if (isDefault === true && address.isDefault !== true) {
      await addressModel.updateMany(
        {
          user: req.user.id,
          _id: { $ne: addressId },
          isDefault: true,
        },
        {
          $set: { isDefault: false },
        },
      );
    }

    // Update only provided fields
    if (fullName?.trim()) address.fullName = fullName;
    if (phone?.trim()) address.phone = phone;
    if (addressLine1?.trim()) address.addressLine1 = addressLine1;
    if (addressLine2?.trim()) address.addressLine2 = addressLine2;
    if (city?.trim()) address.city = city;
    if (state?.trim()) address.state = state;
    if (postalCode?.trim()) address.postalCode = postalCode;
    if (country?.trim()) address.country = country;
    if (landmark?.trim()) address.landmark = landmark;
    if (addressType?.trim()) address.addressType = addressType;
    if (isDefault !== undefined) address.isDefault = isDefault;

    const updatedAddress = await address.save();
    return res.status(200).send({
      message: "Address updated successfully!",
      success: true,
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Update Address Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const {addressId} = req.params;
    const cacheKey = `getsingleaddress:${addressId}`;
    const address = await addressModel.findOneAndDelete({
      _id: addressId,
      user: req.user.id,
    });
    if (!address)
      return res
        .status(404)
        .send({ message: "Address not found!", success: false });
    await redis.del(cacheKey);
    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};
