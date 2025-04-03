import User from '../models/User.js';
import bcrypt from "bcryptjs";
import { generateAccessToken } from '../utils/helper.js';
import { generateRefreshToken } from './../utils/helper';
import { cookieOptions } from '../config/cookieOptions.js';


export const signup = async (req, res) => {
    try {
        const { firstname, lastname, email, password, username } = req.body;

        // Check if email exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        // Create User (password hashing handled in model pre-save)
        const user = new User({ firstname, lastname, email, password, username });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: {
                message: "Server error",
                details: err.message
            }
        });
    }
};


export const loginUser = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Please provide identifier and password." });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier },
                { username: identifier }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "User Not Found!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Wrong Password!" });
        }


        // Generate JWT tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res
            .cookie('accessToken', accessToken, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
            .status(200)
            .json({
                message: "Login Successful",
                data: user,
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: {
                message: "Server error",
                details: err.message
            }
        });
    }
};




export const logout = (req, res) => {
    // For token-based auth, logout is handled on frontend (token removal)
    res.status(200).json({ message: "Logged out successfully" });
};
