import express from "express";
import { registerUser, loginUser, verifyUser, getProfile, deleteAccount } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);   // registrácia s email verification
router.post("/login", loginUser);         // login (len overení používatelia)
router.get("/verify", verifyUser);        // link z emailu na overenie účtu

// Protected route example
router.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: "Protected profile data", user: req.user });
});
router.get("/me", authenticateToken, getProfile);
router.delete("/me", authenticateToken, deleteAccount); // <--- nový endpoint

export default router;
