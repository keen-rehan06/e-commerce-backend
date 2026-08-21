import { permissionModel } from "../../models/permission.model.js";
import {roleModel} from "../../models/role.model.js";
import { ROLE_HIERARCHY } from "./permission.config.js";

export const seedPermission = async(req,res) => {
    try {
        await permissionModel.deleteMany({});
        await roleModel.deleteMany({});
        const createPermission = await permissionModel.insertMany(
            ROLE_HIERARCHY.SUPER_ADMIN.map((permission) => ({name:permission})),
        )
        const getPermission = (permissionName) => {
            return createPermission.filter((permission) => permissionName.includes(permission.name)).map((permission)=> permission._id)
        }
        await roleModel.insertMany([
            {
                name:"SUPER_ADMIN",
                permissions:getPermission(ROLE_HIERARCHY.SUPER_ADMIN)
            },
            {
                name:"ADMIN",
                permissions:getPermission(ROLE_HIERARCHY.ADMIN)
            },
            {
                name:"SELLER",
                permissions:getPermission(ROLE_HIERARCHY.SELLER)
            },
            {
                name:"DELIVERY_BOY",
                permissions:getPermission(ROLE_HIERARCHY.DELIVERY_BOY)
            },
            {
                name:"CUSTOMER",
                permissions:getPermission(ROLE_HIERARCHY.CUSTOMER)
            }
        ])
        
    res
      .status(201)
      .send({ message: "Roles and Permissions Are Created Successfully.", success: true });
    } catch (error) {
        console.log(error.message);
    res
      .status(500)
      .send({ message: "Roles and Permissions Creation Failed!", success: false, error });
    }
}