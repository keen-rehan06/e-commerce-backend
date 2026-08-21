import { ROLE_HIERARCHY } from "../config/permissions/permission.config.js";
import { roleModel } from "../models/role.model.js";
import { permissionModel } from "../models/permission.model.js";
import { userModel } from "../models/user.model.js";

export const assignRole = async (req, res) => {
  try {
    const { email, role } = req.body;
    const admin = req.user;
    const allowedRoles = ROLE_HIERARCHY[admin.role] || [];
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .send({ message: "User Not Found!", success: false });
    if (
      (admin.role === "ADMIN" && user.role === "ADMIN") ||
      (admin.role === "SUPER_ADMIN" && user.role === "SUPER_ADMIN")
    )
      return res
        .status(401)
        .send({ message: "You Can't modify this user!", success: false });
    if (
      admin.role === "CUSTOMER" ||
      admin.role === "DELIVERY_BOY" ||
      admin.role === "SELLER"
    )
      return res
        .status(401)
        .send({ message: "UnAuthorized Access.", success: false });
    if (admin._id().toString() === user._id().toString())
      return res
        .status(401)
        .send({ message: "You can't change your own role.", success: false });
    if (!allowedRoles.includes(role))
      return res
        .status(401)
        .send({ message: "Access denied!", success: false });
    user.role = role;
    await user.save();
    return res
      .status(200)
      .send({ message: "Roles Applied Suucessfully!", success: true });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .send({ message: "Role Applied Failed!", success: false });
  }
};
