import crypto from 'crypto'
import Stripe from 'stripe'
import Razorpay from 'razorpay'
import Order from '../Modals/orderModal.js'
import 'dotenv/config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) return null
    return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

// CREATE ORDER FUNCTION
export const createOrder = async (req, res) => {
    try {
        const {
            firstName, lastName, phone, email, address, city, zipCode,
            paymentMethod, subtotal, tax, total, items,
            /** 'card' = Stripe Checkout; 'upi' = Razorpay Checkout (UPI, etc.) */
            onlinePaymentMethod,
        } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Invalid or empty items array" })
        }

        const orderItems = items.map(({ item, name, price, imageUrl, quantity }) => {
            const base = item || {};
            return {
                item: {
                    name: base.name || name || 'Unknown',
                    price: Number(base.price ?? price) || 0,
                    imageUrl: base.imageUrl || imageUrl || '',
                },
                quantity: Number(quantity) || 0
            }
        });

        const shippingCost = 0;
        let newOrder;


        if (paymentMethod === 'online') {
            const mode = onlinePaymentMethod === 'upi' ? 'upi' : 'card';

            /** UPI → Razorpay Checkout (script: https://checkout.razorpay.com/v1/checkout.js) */
            if (mode === 'upi') {
                const rzp = getRazorpay();
                if (!rzp) {
                    return res.status(500).json({
                        message: 'Razorpay keys missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Backend .env (Dashboard → Test mode).',
                    });
                }

                const amountPaise = Math.round(Number(total) * 100);
                if (!Number.isFinite(amountPaise) || amountPaise < 100) {
                    return res.status(400).json({ message: 'Invalid order total (min ₹1)' });
                }

                newOrder = new Order({
                    user: req.user._id,
                    firstName, lastName, phone, email, address, city, zipCode, paymentMethod, subtotal,
                    tax, total, shipping: shippingCost, items: orderItems,
                    paymentStatus: 'pending',
                });

                await newOrder.save();

                try {
                    const receipt = `ff_${String(newOrder._id).slice(-12)}`.slice(0, 40);
                    const razorpayOrder = await rzp.orders.create({
                        amount: amountPaise,
                        currency: 'INR',
                        receipt,
                        notes: {
                            mongoOrderId: String(newOrder._id),
                            userId: String(req.user._id),
                        },
                    });

                    newOrder.razorpayOrderId = razorpayOrder.id;
                    await newOrder.save();

                    return res.status(201).json({
                        order: newOrder,
                        useRazorpay: true,
                        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
                        razorpayOrderId: razorpayOrder.id,
                        amount: amountPaise,
                        currency: 'INR',
                        appOrderId: String(newOrder._id),
                        customerName: `${firstName} ${lastName}`.trim(),
                        customerEmail: email,
                        customerPhone: phone,
                    });
                } catch (rzErr) {
                    await Order.findByIdAndDelete(newOrder._id);
                    console.error('Razorpay order create:', rzErr);
                    return res.status(500).json({
                        message: rzErr?.error?.description || rzErr?.message || 'Razorpay order failed',
                    });
                }
            }

            /** Card → Stripe Checkout (sirf card) */
            const inferredFrontendUrl =
                req.headers.origin ||
                req.headers['x-frontend-url'] ||
                process.env.FRONTEND_URL;

            if (!inferredFrontendUrl) {
                return res.status(500).json({
                    message: 'Missing frontend URL for Stripe redirect. Set FRONTEND_URL or send Origin header.'
                });
            }

            const frontendUrl = String(inferredFrontendUrl).replace(/\/+$/, '');

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',

                line_items: orderItems.map(o => ({
                    price_data: {
                        currency: 'inr',
                        product_data: { name: o.item.name },
                        unit_amount: Math.round(o.item.price * 100)
                    },
                    quantity: o.quantity
                })),
                customer_email: email,
                success_url: `${frontendUrl}/myorder/verify?success=true&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${frontendUrl}/checkout?payment_status=cancel`,
                metadata: { firstName, lastName, email, phone }
            });

            newOrder = new Order({
                user: req.user._id,
                firstName, lastName, phone, email, address, city, zipCode, paymentMethod, subtotal,
                tax, total, shipping: shippingCost, items: orderItems,
                paymentIntentId: session.payment_intent,
                sessionId: session.id,
                paymentStatus: 'pending'
            });

            await newOrder.save();
            return res.status(201).json({ order: newOrder, checkoutUrl: session.url });
        }

        //IF PAYMENT IS DONE COD
        newOrder = new Order({
            user: req.user._id,
            firstName, lastName, phone, email, address, city, zipCode, paymentMethod, subtotal,
            tax, total,
            shipping: shippingCost,
            items: orderItems,
            paymentStatus: 'succeeded'
        })

        await newOrder.save();
        return res.status(201).json({ order: newOrder, checkoutUrl: null })

    } catch (error) {
        console.error("createOrder Error:", error);
        res.status(500).json({ message: "server Error", error: error.message })
    }
};

/** Razorpay success handler — signature verify karke order paid mark */
export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: 'Missing Razorpay payment fields' });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return res.status(500).json({ message: 'Razorpay not configured' });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
        if (expected !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid payment signature' });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            razorpayOrderId: razorpay_order_id,
            paymentStatus: 'pending',
        });
        if (!order) {
            return res.status(404).json({ message: 'Order not found or already paid' });
        }

        order.paymentStatus = 'succeeded';
        order.transactionId = razorpay_payment_id;
        await order.save();

        return res.json({ order });
    } catch (err) {
        console.error('verifyRazorpayPayment', err);
        return res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// CONFIRM PAYMENT (Stripe Checkout)
export const confirmPayment = async (req, res) => {
    try {
        const { session_id } = req.query
        if (!session_id) return res.status(400).json({ message: 'Session_id required' });

        const session = await stripe.checkout.sessions.retrieve(session_id)
        if (session.payment_status === 'paid') {
            const order = await Order.findOneAndUpdate(
                { sessionId: session_id },
                { paymentStatus: 'succeeded' },
                { new: true }
            );
            if (!order) return res.status(404).json({ message: 'Order not found' })
            return res.json(order)
        }
        return res.status(400).json({ message: 'Payment not completed' })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message })
    }
}



// GET ORDER
export const getOrders = async (req, res) => {
    try {
        const filter = { user: req.user._id }; // order belong to that particular user
        const rawOrders = await Order.find(filter).sort({ createdAt: -1 }).lean()

        // FORMAT
        const formatted = rawOrders.map(o => ({
            ...o,
            items: o.items.map(i => ({
                _id: i._id,
                item: i.item,
                quantity: i.quantity
            })),
            createdAt: o.createdAt,
            paymentStatus: o.paymentStatus
        }));

        res.json(formatted)
    }
    catch (error) {
        console.error("createOrder Error:", error);
        res.status(500).json({ message: "server Error", error: error.message })
    }
}

// ADMIN ROUTE GET ALL ORDERS
export const getAllOrders = async (req, res) => {
    try {
        const raw = await Order
            .find({})
            .sort({ createdAt: -1 })
            .lean()

        const formatted = raw.map(o => ({
            _id: o._id,
            user: o.user,
            firstName: o.firstName,
            lastName: o.lastName,
            email: o.email,
            phone: o.phone,
            address: o.address ?? o.shippingAddress?.address ?? '',
            city: o.city ?? o.shippingAddress?.city ?? '',
            zipCode: o.zipCode ?? o.shippingAddress?.zipCode ?? '',

            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            status: o.status,
            createdAt: o.createdAt,

            items: o.items.map(i => ({
                _id: i._id,
                item: i.item,
                quantity: i.quantity
            }))
        }));
        res.json(formatted)

    } catch (error) {
        console.error("getAllOrders Error:", error);
        res.status(500).json({ message: "server Error", error: error.message })
    }
}


// UPDATE ORDER WITHOUT TOKEN FOR ADMIN
export const updateAnyOrder = async (req, res) => {
    try {
        const updated = await Order.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Order not found' })
        }

        res.json(updated)
    }
    catch (error) {
        console.error("updateAnyOrder Error:", error);
        res.status(500).json({ message: "server Error", error: error.message })
    }
}


//GET ORDER BY ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!order.user.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access Denied' })
        }

        if (req.query.email && order.email !== req.query.email) {
            return res.status(403).json({ message: 'Access Denied' })
        }

        res.json(order)
    }
    catch (error) {
        console.error('hetOrderById Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message })
    }
}

// UPDATE BY ID

export const UpdateOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (!order.user.equals(req.user._id)) {
            return res.status(403).json({ message: 'Access Denied' })
        }

        if (req.body.email && order.email !== req.body.email) {
            return res.status(403).json({ message: 'Access Denied' })
        }

        const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated)

    }
    catch (error) {
        console.error('hetOrderById Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message })
    }
}


