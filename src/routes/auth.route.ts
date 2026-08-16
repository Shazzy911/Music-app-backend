import express from "express";
import {
  registerUser,
  logInUser,
  logOutUser,
  syncOAuthUser,
  getMe,
} from "../controller/auth.controller";

const router = express.Router();

// Specify HTTP methods for each route
router.post("/register", registerUser);
router.post("/login", logInUser);
router.post("/logout", logOutUser);
router.post("/oauth", syncOAuthUser);
router.get("/me", getMe);
export default router;
