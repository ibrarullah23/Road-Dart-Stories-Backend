import mongoose from 'mongoose';
import Business from '../models/Business.js';

// Create new business
export const createBusiness = async (req, res) => {
  try {
    const business = new Business(req.body);
    await business.save();
    res.status(201).json(business);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const bulkCreateBusinesses = async (req, res) => {
  try {
    const businesses = req.body; // Expecting an array of business objects
    const result = await Business.insertMany(businesses);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all businesses
export const getAllBusinesses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
      category,
      priceCategory,
      city,
      state,
      country,
      bordtype,
      agelimit,
      // rating,
      search,
      sort = 'createdAt_desc',
    } = req.query;
    const ratingFilter = req.query.rating ? parseFloat(req.query.rating) : null;
    const rating = isNaN(ratingFilter) ? null : ratingFilter;
    const matchStage = {};


    const buildRegex = (value) => ({ $regex: new RegExp(`^${value}$`, 'i') });

    if (category) matchStage.category = buildRegex(category);
    if (priceCategory) matchStage['price.category'] = priceCategory;
    if (city) matchStage['location.city'] = buildRegex(city);
    if (state) matchStage['location.state'] = buildRegex(state);
    if (country) matchStage['location.country'] = buildRegex(country);
    if (bordtype) matchStage.bordtype = buildRegex(bordtype);
    if (agelimit) matchStage.agelimit = { $lte: parseInt(agelimit) };

    // // Filters
    // if (category) matchStage.category = category;
    // if (priceCategory) matchStage['price.category'] = priceCategory;
    // if (city) matchStage['location.city'] = city;
    // if (state) matchStage['location.state'] = state;
    // if (country) matchStage['location.country'] = country;
    // if (bordtype) matchStage.bordtype = bordtype;
    // if (agelimit) matchStage.agelimit = { $lte: parseInt(agelimit) };


    // Add search
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { shortDis: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting handling
    const sortOptions = {
      createdAt_desc: { createdAt: -1 },
      createdAt_asc: { createdAt: 1 },
      rating_desc: { averageRating: -1 },
      rating_asc: { averageRating: 1 },
    };
    const selectedSort = sortOptions[sort] || { createdAt: -1 };


    const businesses = await Business.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'business',
          as: 'reviews',
        }
      },
      {
        $addFields: {
          totalRatings: { $size: '$reviews' },
          averageRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $avg: '$reviews.rating' },
              0
            ]
          }
        }
      },
      {
        $project: {
          reviews: 0, // remove review docs
        }
      },
      // Apply rating filter AFTER calculating averageRating
      ...(rating ? [{ $match: { averageRating: { $gte: parseFloat(rating) } } }] : []),
      {
        $facet: {
          // metadata: [{ $count: 'total' }],
          data: [
            { $sort: selectedSort },
            { $skip: skip },
            { $limit: limit }
          ],

          totalCount: [
            { $count: 'count' },
          ],
        }
      }
    ]);



    const totalItems = businesses[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    const data = businesses[0].data;

    res.status(200).json({
      data,
      totalItems,
      totalPages,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get business by ID
export const getBusinessById = async (req, res) => {
  try {
    // const business = await Business.findById(req.params.id);


    // if (!business) return res.status(404).json({ message: 'Business not found' });

    // // average rating and total ratings using aggregation
    // const reviewsAggregation = await Review.aggregate([
    //   { $match: { businessId: business._id } },
    //   { $group: { _id: null, avgRating: { $avg: '$rating' }, totalRatings: { $sum: 1 } } }
    // ]);

    // const averageRating = reviewsAggregation.length > 0 ? reviewsAggregation[0].avgRating : 0;
    // const totalRatings = reviewsAggregation.length > 0 ? reviewsAggregation[0].totalRatings : 0;

    // business.averageRating = averageRating.toFixed(1);
    // business.totalRatings = totalRatings;
    // res.status(200).json(business);


    const businessData = await Business.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } }, // Match the business
      {
        $lookup: {
          from: 'reviews', // collection name in db (MUST BE plural and lowercase usually)
          localField: '_id',
          foreignField: 'business',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
          totalRatings: { $size: "$reviews" }
        }
      },
      {
        $project: {
          reviews: 0 // don't send reviews array unless you want
        }
      }
    ]);

    if (!businessData.length) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json(businessData[0]); // Send the first (and only) business object
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Update business by ID
export const updateBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.status(200).json(business);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete business by ID
export const deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndDelete(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.status(200).json({ message: 'Business deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
