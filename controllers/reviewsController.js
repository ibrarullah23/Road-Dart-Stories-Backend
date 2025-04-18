import mongoose from "mongoose";
import Review from "../models/Review.js";


// Create a new review
export const createReview = async (req, res, next) => {
    try {
        const { business, rating, img, text } = req.body;
        const user = req.user.id;

        const review = await Review.create({ user, business, rating, img, text });

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            data: review
        });
    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this business.'
            });
        }

        next(error);
    }
};

// Get all reviews (paginated, sorted by best rating)
export const getAllReviews = async (req, res, next) => {
    try {
        let { page = 1, limit = 10, sort } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const filter = req.params.business ? { business: req.params.business } : {};

        const sortOption = sort === 'rating'
            ? { rating: -1, createdAt: -1 } // sort by rating, then newest first
            : { createdAt: -1 };            // default sort: newest reviews first

        // const totalReviews = await Review.countDocuments(filter);
        
        const stats = await Review.aggregate([
            { $match: { business: new mongoose.Types.ObjectId(req.params.business ) } },
            { $group: { _id: null, totalReviews: { $sum: 1 }, averageRating: { $avg: "$rating" } } }
          ]);
      
          const { totalReviews, averageRating } = stats.length > 0 ? stats[0] : { totalReviews: 0, averageRating: 0 };



        const reviews = await Review.find(filter)
            .populate('user', 'username email')
            .populate('business', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);


        // 🔥 Find the current user's submitted review if logged in
        let submittedReview ;
        if (req.user && req.user.id) {
            submittedReview = await Review.findOne({
                user: req.user.id,
                ...filter,
            })
            .select('rating text img createdAt')
        }

        res.status(200).json({
            success: true,
            data: reviews,
            totalReviews,
            averageRating,
            submittedReview,
            totalPages: Math.ceil(totalReviews / limit),
            page,
            limit,
        });
    } catch (error) {
        next(error);
    }
};

// Delete a review
export const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
