import { cookieOptions } from '../constants/cookieOptions.js';
import User from '../models/User.js';
import { cleanFields, generateAccessToken, generateRefreshToken } from '../utils/helper.js';
import mongoose from 'mongoose';

// Get all users with pagination
export const getAllUsers = async (req, res) => {
    try {
        const { fields = '', page = 1, limit = 10 } = req.query;
        const projection = cleanFields(fields) + ' -password -__v';
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
        const { id } = req.params;
        // const user = await User.findById(req.params.id).select('-password -__v');
        const user = await User.findOne({
            $or: [
                { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
                { username: id }
            ]
        }).select('-password -__v');

        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update User
export const updateUser = async (req, res) => {
    try {
        const {
            firstname,
            lastname,
            gender,
            dob,
            state,
            city,
            country,
            zipcode,
            password,
            username,
            socials,
            profileImg
        } = req.body;
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }


        Object.assign(user, {
            firstname,
            lastname,
            gender,
            dob,
            password,
            address: {
                state: state || user.address.state,
                city: city || user.address.city,
                country: country || user.address.country,
                zipcode: zipcode || user.address.zipcode,
            },
            username,
            // socials,
            profileImg
        });
        if (socials) {
            user.socials = {
                ...user.socials, // existing socials
                ...socials       // new socials
            };
        }

        await user.save();

        if (username) {
            const token = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            user.refreshToken = refreshToken;

            await user.save();
            res.cookie('token', token, cookieOptions)
                .cookie('refreshToken', refreshToken, cookieOptions);
        }


        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.__v;
        delete userObj.refreshToken;

        // const user = await User.findByIdAndUpdate(req.params.id, {
        //     firstname,
        //     lastname,
        //     gender,
        //     dob,
        //     email,
        //     password,
        //     username,
        //     address,
        //     socials,
        //     profileImg
        // }, { new: true, runValidators: true }).select('-password -__v');
        // if (!user) return res.status(404).json({ message: 'User not found' });


        res.status(200).json({ message: 'User updated successfully', data: userObj });
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
