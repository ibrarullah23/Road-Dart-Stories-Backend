import User from '../models/User.js';

// // Create User
// export const createUser = async (req, res) => {
//     try {
//         const user = new User(req.body);
//         await user.save();
//         res.status(201).json(user);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// };

// Get all users with pagination
export const getAllUsers = async (req, res) => {
    try {
        const { fields = '', page = 1, limit = 10 } = req.query;
        const projection = cleanFields(fields);
        const skip = (page - 1) * limit;

        const users = await User.find().select(projection).skip(skip).limit(limit);
        const totalItems = await User.countDocuments();
        const totalPages = Math.ceil(totalItems / limit);

        res.status(200).json({
            data: users,
            totalItems,
            totalPages,
            page,
            limit,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Get Single User
export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update User
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete User
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
