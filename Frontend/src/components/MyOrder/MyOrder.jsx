import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { FiArrowLeft, FiBox, FiCheckCircle, FiClock, FiMapPin, FiTruck, FiUser } from "react-icons/fi"
import axios from 'axios'

const MyOrder = () => {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/orders', {
                    params: { email: user?.email },
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`
                    }
                })

                const formattedOrders = response.data.map(order => ({
                    ...order,
                    items: order.items?.map(entry => ({
                        _id: entry._id,
                        item: {
                            ...entry.item,
                            imageUrl: entry.item.imageUrl,
                        },
                        quantity: entry.quantity
                    })) || [],
                    createdAt: new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    paymentStatus: order.paymentStatus?.toLowerCase() || 'pending'
                }));
                setOrders(formattedOrders)
                setError(null)
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.response?.data?.message || 'Failed to load orders. Please try again later')
            }
            finally {
                setLoading(false)
            }
        }
        fetchOrders();
    }, [user?.email])


    const statusStyles = {
        processing: {
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            icon: <FiClock className="text-lg" />,
            label: 'Processing'
        },
        outForDelivery: {
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            icon: <FiTruck className="text-lg" />,
            label: 'Out for Delivery'
        },
        delivered: {
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            icon: <FiCheckCircle className="text-lg" />,
            label: 'Delivered'
        },
        pending: {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            icon: <FiClock className="text-lg" />,
            label: 'Payment Pending'
        },
        succeeded: {
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            icon: <FiCheckCircle className="text-lg" />,
            label: 'Completed'
        }
    };

    const getPaymentMethodDetails = (method) => {
        switch (method?.toLowerCase()) {
            case 'cod':
                return {
                    label: 'Cash on Delivery',
                    class: 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/30'
                };
            case 'card':
                return {
                    label: 'Card Payment',
                    class: 'bg-blue-500/10 text-blue-400 border border-blue-400/30'
                };
            case 'upi':
                return {
                    label: 'UPI Payment',
                    class: 'bg-purple-500/10 text-purple-400 border border-purple-400/30'
                };
            default:
                return {
                    label: 'Online Payment',
                    class: 'bg-green-500/10 text-green-400 border border-green-400/30'
                };
        }
    };

    if (error) return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a120b] via-[#2a1e14] to-[#3e2b1d] flex items-center justify-center text-red-400 text-xl gap-4">
            <p>{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition"
            >
                <FiArrowLeft className="text-xl" />
                <span>Try Again</span>
            </button>
        </div>
    )


    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a120b] via-[#2a1e14] to-[#3e2b1d] py-12 px-4 sm:px-6 lg:px-8">

            <div className="mx-auto max-w-7xl">

                <div className="flex justify-between items-center mb-8">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition font-semibold"
                    >
                        <FiArrowLeft className="text-xl" />
                        Back to Home
                    </Link>

                    <span className="text-amber-400/70 text-sm bg-[#3a2b2b]/40 px-3 py-1 rounded-lg border border-amber-500/20">
                        {user?.email}
                    </span>
                </div>


                <div className="bg-[#4b3b3b]/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-amber-500/20">

                    <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent text-center">
                        Order History
                    </h2>


                    <div className="overflow-x-auto rounded-xl border border-amber-500/10">

                        <table className="w-full text-sm">

                            <thead className="bg-[#3a2b2b]/70 text-amber-400 uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 text-left">Order ID</th>
                                    <th className="p-4 text-left">Customer</th>
                                    <th className="p-4 text-left">Address</th>
                                    <th className="p-4 text-left">Items</th>
                                    <th className="p-4 text-center">Total</th>
                                    <th className="p-4 text-left">Price</th>
                                    <th className="p-4 text-left">Payment</th>
                                    <th className="p-4 text-left">Status</th>
                                </tr>
                            </thead>


                            <tbody>

                                {orders.map((order) => {

                                    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

                                    const totalPrice = order.total ??
                                        order.items.reduce(
                                            (sum, item) => sum + (item.item.price * item.quantity),
                                            0
                                        );

                                    const paymentMethod = getPaymentMethodDetails(order.paymentMethod);

                                    const status = statusStyles[order.status] || statusStyles.processing;

                                    const paymentStatus = statusStyles[order.paymentStatus] || statusStyles.pending;


                                    return (
                                        <tr
                                            key={order._id}
                                            className="border-b border-amber-500/10 hover:bg-[#3a2b2b]/40 transition duration-200"
                                        >

                                            <td className="p-4 text-amber-100 font-mono">
                                                #{order._id?.slice(-8)}
                                            </td>


                                            <td className="p-4">

                                                <div className="flex items-center gap-3">

                                                    <FiUser className="text-amber-400" />

                                                    <div>
                                                        <p className="text-amber-100 font-medium">
                                                            {order.firstName} {order.lastName}
                                                        </p>
                                                        <p className="text-xs text-amber-400/60">
                                                            {order.phone}
                                                        </p>
                                                    </div>

                                                </div>

                                            </td>


                                            <td className="p-4">

                                                <div className="flex items-center gap-2 text-amber-100/80">

                                                    <FiMapPin className="text-amber-400" />

                                                    <span className="text-sm">
                                                        {order.address}, {order.city} - {order.ZipCode}
                                                    </span>

                                                </div>

                                            </td>


                                            <td className="p-4">

                                                <div className="space-y-2 max-h-52 overflow-y-auto pr-2">

                                                    {order.items.map((item, index) => (

                                                        <div
                                                            key={`${order._id}-${index}`}
                                                            className="flex items-center gap-3 bg-[#3a2b2b]/50 hover:bg-[#3a2b2b]/70 transition p-2 rounded-lg"
                                                        >

                                                            <img
                                                                src={`http://localhost:4000${item.item.imageUrl}`}
                                                                alt={item.item.name}
                                                                className="w-10 h-10 rounded-lg object-cover border border-amber-500/20"
                                                            />

                                                            <div className="flex-1">

                                                                <p className="text-amber-100 text-sm truncate">
                                                                    {item.item.name}
                                                                </p>

                                                                <div className="text-xs text-amber-400/60 flex gap-2">
                                                                    ₹{item.item.price}
                                                                    <span>•</span>
                                                                    x{item.quantity}
                                                                </div>

                                                            </div>

                                                        </div>

                                                    ))}

                                                </div>

                                            </td>


                                            <td className="p-4 text-center">

                                                <div className="flex justify-center items-center gap-1 text-amber-300 font-semibold">
                                                    <FiBox />
                                                    {totalItems}
                                                </div>

                                            </td>


                                            <td className="p-4 text-amber-300 font-semibold">
                                                ₹{totalPrice.toFixed(2)}
                                            </td>


                                            <td className="p-4 space-y-2">

                                                <div className={`px-3 py-1 rounded-lg text-xs font-medium ${paymentMethod.class}`}>
                                                    {paymentMethod.label}
                                                </div>

                                                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium ${paymentStatus.bg} ${paymentStatus.color}`}>
                                                    {paymentStatus.icon}
                                                    {paymentStatus.label}
                                                </div>

                                            </td>


                                            <td className="p-4">

                                                <div className="flex items-center gap-2 font-medium">

                                                    <span className={status.color}>
                                                        {status.icon}
                                                    </span>

                                                    <span className={`px-3 py-1 rounded-lg text-xs ${status.bg} ${status.color}`}>
                                                        {status.label}
                                                    </span>

                                                </div>

                                            </td>

                                        </tr>
                                    )

                                })}

                            </tbody>

                        </table>
                    </div>

                    {
                        orders.length === 0 && (
                            <div className="text-center py-12 text-amber-100/60 text-xl">
                                No Orders Found
                            </div>
                        )
                    }
                </div>

            </div>

        </div>
    )
}

export default MyOrder
