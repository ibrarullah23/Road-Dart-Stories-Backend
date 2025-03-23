import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();
// express setup
const app = express();
app.use(express.json());

connectDB();

// Routes
app.get('/', (req, res) => res.json({ message: 'API is running on PORT:' + process.env.PORT }));

app.listen(process.env.PORT, () => {
    console.log(`✅ Server is running on port ${process.env.PORT}`);
})

export default app;
