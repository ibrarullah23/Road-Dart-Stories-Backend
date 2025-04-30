import express from 'express';
import {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  bulkCreateBusinesses,
  uploadBusinessLogo,
  uploadBusinessImage
} from '../controllers/businessController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// CRUD Routes
router.post('/', createBusiness);
router.get('/', getAllBusinesses);
router.post('/bulk', bulkCreateBusinesses);
router.get('/:id', getBusinessById);
router.patch('/:id', updateBusiness);
router.patch('/upload-logo/:id', upload.single('businessLogo'), uploadBusinessLogo);
router.patch('/upload-image/:id', upload.single('businessImg'), uploadBusinessImage);
router.delete('/:id', deleteBusiness);

export default router;
