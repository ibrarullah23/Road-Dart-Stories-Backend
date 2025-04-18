import Review from "../models/Review.js";


// Create a new review
export const createReview = async (req, res, next) => {
    try {
        const { businessId, rating, img, text } = req.body;
        const userId = req.user.id;

        const review = await Review.create({ userId, businessId, rating, img, text });

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

        const filter = req.params.businessId ? { businessId: req.params.businessId } : {};

        const sortOption = sort === 'rating'
            ? { rating: -1, createdAt: -1 } // sort by rating, then newest first
            : { createdAt: -1 };            // default sort: newest reviews first

        const totalItems = await Review.countDocuments(filter);
        const reviews = await Review.find(filter)
            .populate('userId', 'username email')
            .populate('businessId', 'name totalRatings averageRating')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);


        // 🔥 Find the current user's submitted review if logged in
        let submittedReview ;
        if (req.user && req.user.id) {
            submittedReview = await Review.findOne({
                userId: req.user.id,
                ...filter,
            })
            .select('rating text img createdAt')
        }

        res.status(200).json({
            success: true,
            data: reviews,
            totalItems,
            submittedReview,
            totalPages: Math.ceil(totalItems / limit),
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
