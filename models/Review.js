import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  businessId: {
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
    type: String
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ userId: 1, businessId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
