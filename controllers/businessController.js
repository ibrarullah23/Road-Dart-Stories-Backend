import mongoose from 'mongoose';
import Business from '../models/Business.js';
import { deleteImage, uploadToCloudinary } from './../services/cloudinary.js';
import _ from 'lodash';
import Review from '../models/Review.js';

export const createBusiness = async (req, res) => {
  try {
    const businessData = {
      ...req.body,
      userId: req.user.id,
    };

    const { images, logo } = req.body.media || {};
    _.unset(businessData, 'media');

    const business = await Business.create(businessData);

    const uploadedImages = [];
    let logoUrl;

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadToCloudinary(
          images[i],
          `business_images/${business._id}_${Date.now()}`
        );
        uploadedImages.push(imageUrl);
      }
    }

    if (logo) {
      logoUrl = await uploadToCloudinary(
        logo,
        `business_logos/${business._id}`
      );
    }

    business.media = {
      images: uploadedImages,
      logo: logoUrl,
      video: req.body.video || undefined,
    };

    await business.save();
    res.status(201).json(business);
  } catch (err) {
    console.error('Error creating business:', err);
    res.status(500).json({ message: 'Failed to create business', error: err });
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
      user,
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
    if (user) matchStage.userId = new mongoose.Types.ObjectId(user);

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
        { shortDis: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

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
              { $avg: '$reviews.ratings.overallRating' },
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
          averageRating: { $ifNull: [{ $avg: "$reviews.ratings.overallRating" }, 0] },
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
    const business = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.status(200).json({
      success: true,
      message: 'Business updated successfully',
      data: business
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete business by ID
export const deleteBusiness = async (req, res) => {
  try {
    const business = await Business.findByIdAndDelete(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    await Review.deleteMany({ business: business._id });
    res.status(200).json({ message: 'Business deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Upload business logo
export const uploadBusinessLogo = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const businessId = req.params.id;

    const business = await Business.findById(businessId);

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // if (req.user.id !== business.userid.toString()) {
    //   return res.status(403).json({ message: 'Unauthorized to update this business' });
    // }

    const public_id = `business_logo/logo_${businessId}`;
    const imageUrl = await uploadToCloudinary(file.buffer, public_id);

    console.log('Logo URL:', imageUrl);

    const updatedBusiness = await Business.findByIdAndUpdate(
      businessId,
      { 'media.logo': imageUrl },
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    res.status(200).json({ message: 'Logo uploaded successfully', logo: updatedBusiness.media.logo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Upload a single business image
export const uploadBusinessImage = async (req, res) => {
  try {
    const files = req.files?.images;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const businessId = req.params.id;

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // if (req.user.id !== business.userid.toString()) {
    //   return res.status(403).json({ message: 'Unauthorized' });
    // }

    const uploadedImageUrls = [];

    for (const file of files) {
      const timestamp = Date.now();
      const public_id = `business_images/image_${businessId}_${timestamp}`;
      const imageUrl = await uploadToCloudinary(file.buffer, public_id);
      uploadedImageUrls.push(imageUrl);
    }

    // Add all new image URLs to media.images array
    business.media.images.push(...uploadedImageUrls);
    await business.save();

    res.status(200).json({
      message: 'Business image uploaded successfully',
      images: business.media.images
    });
  } catch (error) {
    console.error('Upload business image error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Upload multiple business images
export const uploadBusinessMedia = async (req, res, next) => {

  try {

    const businessId = req.params.id;
    const { images, businessLogo, businessCover } = req.files || {};

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    if (!images && !businessLogo && !businessCover) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedImages = [];
    let logoUrl;

    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadToCloudinary(
          images[i].buffer,
          `business_images/${businessId}_${Date.now()}`
        );
        uploadedImages.push(imageUrl);
      }
      business.media.images = uploadedImages;
    }

    if (businessLogo && businessLogo.length > 0) {
      logoUrl = await uploadToCloudinary(
        businessLogo[0].buffer,
        `business_logos/${businessId}`
      );
      business.media.logo = logoUrl;
    }
    
    let coverUrl;
    if (businessCover && businessCover.length > 0) {
      coverUrl = await uploadToCloudinary(
        businessCover[0].buffer,
        `business_cover/${businessId}`
      );
      business.media.cover = coverUrl;
    }

    // business.media = {
    //   images: uploadedImages.length ? uploadedImages : business.media.images,
    //   logo: logoUrl || business.media.logo,
    //   // video: req.body.video || undefined,
    // };

    await business.save();

    res.status(200).json({
      success: true,
      message: 'Business media uploaded successfully',
      media: business.media
    });

  } catch (error) {
    next(error);
  }
}




export const deleteBusinessMedia = async (req, res, next) => {
  try {
    const businessId = req.params.id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'Media URL is required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    let updated = false;

    if (business.media.images.includes(url)) {
      business.media.images = business.media.images.filter(img => img !== url);
      updated = true;
    }

    if (business.media.logo === url) {
      business.media.logo = undefined;
      updated = true;
    }

    if (business.media.cover === url) {
      business.media.cover = undefined;
      updated = true;
    }

    if (!updated) {
      return res.status(404).json({ message: 'URL not found in business media' });
    }

    // Delete from Cloudinary using your function
    const deleteResult = await deleteImage(url);

    if (!deleteResult.success) {
      // Optionally: log or send failure message, but still update DB
      console.warn(deleteResult.message);
    }

    await business.save();

    return res.status(200).json({
      success: true,
      message: 'Media deleted successfully',
      media: business.media,
    });

  } catch (error) {
    next(error);
  }
};





// Create or Update Promotion
export const upsertPromotion = async (req, res) => {
  try {
    const { title, description } = req.body;

    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { promotion: { title, description } },
      { new: true, runValidators: true }
    );

    if (!business) return res.status(404).json({ message: 'Business not found' });

    res.status(200).json({
      success: true,
      message: 'Promotion created/updated successfully',
      data: business.promotion
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Promotion
export const deletePromotion = async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { $unset: { promotion: "" } },
      { new: true }
    );

    if (!business) return res.status(404).json({ message: 'Business not found' });

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};