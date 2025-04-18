import express from 'express';
import { authMiddleware } from './../middlewares/authMiddleware.js';
import { createReview, getAllReviews, deleteReview } from '../controllers/reviewsController.js';

const router = express.Router();

router.post('/', authMiddleware, createReview);
router.get('/:business', authMiddleware, getAllReviews);
router.get('/', getAllReviews);
router.delete('/:id', authMiddleware, deleteReview);

export default router;
