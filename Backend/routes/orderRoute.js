import express from 'express';
import { confirmPayment, createOrder, getAllOrders, getOrderById, getOrders, updateAnyOrder, UpdateOrder, verifyRazorpayPayment } from '../Controllers/oredrController.js';
import authMiddleware from '../middleware/auth.js';

const orderRoute = express.Router();

orderRoute.get('/getall', getAllOrders)
orderRoute.put('/getall/:id', updateAnyOrder)

//PROTECT REST OF ROUTES USINING MIDDLEWARE
orderRoute.use(authMiddleware)

orderRoute.post('/', createOrder)
orderRoute.post('/razorpay-verify', verifyRazorpayPayment)
orderRoute.get('/', getOrders)
orderRoute.get('/confirm', confirmPayment)
orderRoute.get('/:id', getOrderById)
orderRoute.put('/:id', UpdateOrder)

export default orderRoute;