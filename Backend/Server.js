import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import { connectDB } from './Config/db.js';

import path from 'path';
import { fileURLToPath } from 'url';
import userRouter from './routes/userRoute.js';
import itemRouter from './routes/itemRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRoute from './routes/OrderRoute.js';

const app = express();
const port = process.env.PORT || 4000;

const __fiename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__fiename)

//DB CONNECTION
connectDB();

//MIDDLEWARE
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not Allowed by CORS'));
        }
    },
    credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ================= ROUTES =================
app.use('/api/user', userRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/items', itemRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders',orderRoute)

app.get('/', (req, res) => {
    res.send('API WORKING')
})

// ================= SERVER =================
app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})