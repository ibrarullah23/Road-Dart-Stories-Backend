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
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN, // Specify frontend URL , * for all origins
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
