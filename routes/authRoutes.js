// routes/authRoutes.js
import express from 'express';
import { signup, logout, loginUser } from '../controllers/authController.js';
import passport from "passport";
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', loginUser);
router.post('/logout', authMiddleware, logout);


// -------------------- Google OAuth --------------------
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] })); // Login, Redirect to Google for OAuth
router.get("/google/callback",);

export default router;
