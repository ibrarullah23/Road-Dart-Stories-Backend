import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';



dotenv.config();

// express setup
const app = express();

// ===== MIDDLEWARES =====
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" })); // Enable CORS for all origins

// DB Connection
connectDB();

// -------------------- Google OAuth --------------------
import passport from "passport";
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] })); // Login, Redirect to Google for OAuth

router.get("/auth/google/callback", (req, res) => {
    const { user, accessToken, refreshToken } = req.authInfo; // Comes from Passport `done()`

    // Cookie options
    const cookieOptions = {
        httpOnly: true,
        path: '/'
    };


    res.cookie('accessToken', accessToken, cookieOptions)
        .cookie('refreshToken', refreshToken, cookieOptions)
        .status(200)
        .json({
            message: "Login Successful"
        });
});


// =========================== Routes ===========================
import businessRoutes from './routes/businessRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

app.get('/', (req, res) => res.json({ message: "✅ API is running... 3" }));
app.use('/api/businesses', businessRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contactus', contactRoutes);


// =========================== Routes ===========================


app.use((req, res, next) => {
    res.status(404).json({ message: "Route Not Found" });
});

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
