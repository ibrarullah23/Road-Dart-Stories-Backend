import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "./models/User.js"; // Import your user model
import { generateAccessToken } from "../utils/helper.js";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Extract first and last name from displayName
                const [firstName, ...lastNameParts] = profile.displayName.split(" ");
                const lastName = lastNameParts.join(" ") || null; // Handle cases with no last name

                let user = await User.findOne({ email: profile.emails[0].value });

                if (!user) {
                    user = await User.create({
                        firstName,
                        lastName,
                        email: profile.emails[0].value,
                        password: null, // No password since using OAuth
                        dob: null, // If not available
                        refreshToken: "",
                    });
                }

                // Generate JWT tokens
                const accessToken = generateAccessToken(user);
                const refreshToken = generateRefreshToken(user);

                // Store refresh token in the database
                user.refreshToken = refreshToken;
                await user.save();

                done(null, { user, accessToken, refreshToken });
            } catch (error) {
                done(error, null);
            }
        }
    )
);
