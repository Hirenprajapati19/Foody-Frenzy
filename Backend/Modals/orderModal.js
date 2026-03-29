import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    item: {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        imageUrl: { type: String, required: true }
    },
    quantity: { type: Number, required: true, min: 1 }
}, { _id: true });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    email: { type: String, required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, required: true },

    address: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },

    //ORDER ITEMS
    items: [orderItemSchema],

    //PAYMENT METHOD
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'online', 'card', 'upi'],
        index: true
    },
    paymentIntentId: { type: String },
    sessionId: { type: String, index: true },
    /** Razorpay order id (order_xxx) — UPI / netbanking etc. via Razorpay Checkout */
    razorpayOrderId: { type: String, index: true },
    transactionId: { type: String },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending',
        index: true
    },

    //ORDER CALCULATION
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },

    //ORDER TRACKING
    status: {
        type: String,
        enum: ['processing', 'outForDelivery', 'delivered'],
        default: 'processing',
        index: true
    },
    expectedDelivery: Date,
    deliveredAt: Date,

    // TIMESTAMPS
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
})

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, paymentStatus: 1 });

orderSchema.pre('save', function () {
    this.updatedAt = new Date();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;


