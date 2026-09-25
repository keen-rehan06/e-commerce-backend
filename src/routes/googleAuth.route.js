import express from "express";
import passport, { authenticate } from "passport";
import { authenticatedCheck } from "../middlewares/auth.middleware.js";
import { logout, profile } from "../controllers/auth.controller.js";

export const router = express.Router();

router.get("/google",passport.authenticate("google",{
    scope: ["profile","email"]
}),
);

router.get("/google/callback",passport.authenticate("google",{
    failureRedirect:"/",
    successRedirect:"/auth/profile",
}),
);

router.get("/profile",authenticatedCheck,profile);

router.get("/logout",logout);