// routes/authRoutes.js
import express from 'express';
import { signup, logout, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', loginUser);
router.post('/logout', logout); // Optional, just for consistency

export default router;
