import mongoose from 'mongoose';
import { validateURL } from '../utils/helper.js';

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  img: {
    type: String,
    validate: {
      validator: validateURL,
      message: 'Invalid URL format for img'
    }
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// reviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
