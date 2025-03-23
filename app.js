import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
// express setup
const app = express();
app.use(express.json());

connectDB();

// Routes
app.get('/', (req, res) => res.send('Welcome to ES6 Vercel Backend!'));
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
