import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import bodyParser from 'body-parser';
import businessRoutes from './routes/businessRoutes.js';

dotenv.config();
// express setup
const app = express();

// ===== MIDDLEWARES =====
app.use(express.json()); // Parse JSON bodies
// app.use(cors()); // Enable CORS for all origins
app.use(cors({
  origin: "*"  // Allow all origins for now, or specify your frontend URL
}));
app.use(bodyParser.json()); // Parse JSON body
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded body

connectDB();

// Routes
app.get('/', (req, res) => res.json({ message: "API is running on PORT: "+ process.env.PORT }));
app.use('/api/businesses', businessRoutes);

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
