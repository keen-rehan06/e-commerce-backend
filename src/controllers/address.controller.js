import { addressModel } from "../models/address.model.js";

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
