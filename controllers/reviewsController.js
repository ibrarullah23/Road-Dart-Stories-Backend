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

        const sortOption = sort === 'rating'
            ? { rating: -1, createdAt: -1 } // sort by rating, then newest first
            : { createdAt: -1 };            // default sort: newest reviews first

        const totalItems = await Review.countDocuments();
        const reviews = await Review.find()
            .populate('userId', 'username email')
            .populate('businessId', 'name')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            data: reviews,
            totalItems,
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
