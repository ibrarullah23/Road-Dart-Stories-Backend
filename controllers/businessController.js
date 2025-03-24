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

    const businesses = await Business.find().skip(skip).limit(limit);
    const totalItems = await Business.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      data: businesses,
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
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ message: 'Business not found' });
    res.status(200).json(business);
  } catch (err) {
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
