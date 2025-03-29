import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import businessRoutes from './routes/businessRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';


dotenv.config();

// express setup
const app = express();

// ===== MIDDLEWARES =====
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

// Routes
app.get('/', (req, res) => res.json({ message: "✅ API is running... 3" }));
app.use('/api/businesses', businessRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contactus', contactRoutes);


app.use((req, res, next) => {
    res.status(404).json({ message: "Route Not Found" });
});

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
