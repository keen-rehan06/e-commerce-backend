import express from "express";
import { seedPermission } from "../config/permissions/seedPermissions.config.js";

const app = express.Router();

app.get("/api/permission",seedPermission);

export default app;