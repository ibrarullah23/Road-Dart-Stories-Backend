import businessRoutes from './routes/businessRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';

import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import "./config/passport.js";
import Stripe from 'stripe';

dotenv.config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// express setup
const app = express();

// ===== MIDDLEWARES =====
app.use(cookieParser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = [
    "http://localhost:3000", // Local frontend
    process.env.ALLOWED_ORIGIN  // Production frontend
];


app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow request
        } else {
            callback(new Error("Not allowed by CORS")); // Block request
        }
    },
    credentials: true, // Allow cookies to be sent
}));

// DB Connection
connectDB();



app.use(passport.initialize());


// =========================== Routes ===========================

app.get('/', (req, res) => res.json({ message: "✅ API is running... 3" }));
app.use('/api/businesses', businessRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contactus', contactRoutes);


// =========================== Routes ===========================



app.post('/checkout-session', async (req, res) => {
    const { plan, email } = req.body;  // Get the selected plan and email from the frontend

    // Set up the priceId for the selected plan

    const priceMap = {
        basic: 'price_1JxyzY2eZvKYlo2ClL5XXX',
        business: 'price_1JxyzY2eZvKYlo2ClL5YYY',
        enterprise: 'price_1JxyzY2eZvKYlo2ClL5ZZZ',
    };
    const priceId = priceMap[plan];
    if (!priceId) {
        return res.status(400).json({ error: 'Invalid plan selected' });
    }

    try {
        // Create a Checkout session with Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],  // Specify allowed payment methods
            line_items: [
                {
                    price: priceId,  // Price ID for the selected plan
                    quantity: 1,  // Only one unit of the plan selected
                },
            ],
            mode: 'subscription',  // Use 'subscription' mode for recurring payments
            customer_email: email,  // Optionally pre-fill the email field for the user
            success_url: `${process.env.ALLOWED_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,  // Redirect on success
            cancel_url: `${process.env.ALLOWED_ORIGIN}/cancel`,  // Redirect on cancel
        });

        // Send back the session ID to the frontend for Stripe Checkout redirection
        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send(error.message);
    }
});








app.use((req, res, next) => {
    res.status(404).json({ message: "Route Not Found" });
});

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
