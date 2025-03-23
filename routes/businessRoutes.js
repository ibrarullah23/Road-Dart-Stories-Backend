import express from 'express';
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  bulkCreateBusinesses
} from '../controllers/businessController.js';

const router = express.Router();

// CRUD Routes
router.post('/', createBusiness);
router.get('/', getAllBusinesses);
router.post('/bulk', bulkCreateBusinesses); 
router.get('/:id', getBusinessById);
router.patch('/:id', updateBusiness);
router.delete('/:id', deleteBusiness);

export default router;
