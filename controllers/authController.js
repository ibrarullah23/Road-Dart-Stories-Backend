import User from '../models/User.js';
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from '../utils/helper.js';
import { cookieOptions } from '../constants/cookieOptions.js';
import _ from 'lodash';
import sendMail from '../config/mail.js';
import { WELCOME } from '../constants/emailTemplets.js';
import Stripe from 'stripe';



export const signup = async (req, res) => {
    try {
        const { firstname, lastname, email, password, username } = req.body;

        // Check if email exists
        // const existingUser = await User.findOne({ email });
        // if (existingUser) return res.status(400).json({ message: "Email already exists" });
        if (!password)
            return res.status(400).json({ message: "Password is required" });

        // Create User (password hashing handled in model pre-save)
        const user = new User({ firstname, lastname, email, password, username });
        await user.save();

        res.status(201).json({ message: "User registered successfully" });

        sendMail(WELCOME(req.body.email, req.body.firstname))
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            error: {
                message: error.message,
            }
        });
    }
};

export const googleAuth = async (req, res) => {
    try {
        const user = req.user; // Comes from Passport `done()`
        const { token, refreshToken, isNewUser } = req.authInfo; // Comes from Passport `done()`

        // const sanitizedUser = _.omit(user.toObject(), ['password', 'refreshToken']);

        if (isNewUser)
            sendMail(WELCOME(user.email, user.firstname))

        res.cookie('token', token, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
        // .status(200)
        // .json({
        //     message: "Login Successful via Google",
        //     data: sanitizedUser,
        // });
        res.redirect(`${process.env.ALLOWED_ORIGIN}?login=success&googleSignup=${isNewUser}`);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: {
                message: "Server error",
                details: error.message
            }
        });
    }
}


export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let subscription;

        if (user.stripeSubscriptionId) {


            // 2. Fetch subscription from Stripe
            const subscription = await Stripe.subscriptions.retrieve(user.stripeSubscriptionId);

            // 3. Parse and return the details
            const currentPlan = subscription.items.data[0].price.nickname || subscription.items.data[0].price.id;
            const currentPeriodEnd = new Date(subscription.current_period_end * 1000); // UNIX timestamp → Date
            const cancelAtPeriodEnd = !subscription.cancel_at_period_end;

            subscription = {
                plan: currentPlan,
                currentPeriodEnd,
                status: subscription.status,
            }
        }

        res.status(200).json({ data: { user, subscription } });
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
        const token = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        // Save refreshToken in the user document
        user.refreshToken = refreshToken;
        await user.save();

        const sanitizedUser = _.omit(user.toObject(), ['password', 'refreshToken']);

        res
            .cookie('token', token, cookieOptions)
            .cookie('refreshToken', refreshToken, cookieOptions)
            .status(200)
            .json({
                message: "Login Successful",
                data: sanitizedUser,
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




export const logout = async (req, res) => {
    // For token-based auth, logout is handled on frontend (token removal)
    await User.findByIdAndUpdate(req.user.id, { $unset: { refreshToken: "" } });
    // Clear cookies
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.status(200).json({ message: "Logged out successfully" });
};
