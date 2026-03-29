import React, { useEffect, useState } from 'react'
import { layoutClasses, tableClasses, statusStyles, paymentMethodDetails, iconMap } from '../assets/dummyadmin'
import axios from 'axios';
import { FiBox, FiUser } from 'react-icons/fi';

const Order = () => {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/api/orders/getall',
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );

        const formatted = response.data.map(order => ({
          ...order,
          address: order.address ?? order.shippingAddress?.address ?? '',
          city: order.city ?? order.shippingAddress?.city ?? '',
          zipCode: order.zipCode ?? order.shippingAddress?.zipCode ?? '',
          phone: order.phone ?? '',
          items: order.items?.map(e => ({
            _id: e._id,
            item: e.item,
            quantity: e.quantity
          })) || [],
          createdAt: new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        setOrders(formatted);
        setError(null);
      }
      catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders.');
      }
      finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);


  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:4000/api/orders/getall/${orderId}`,
        { status: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status')
    }
  }

  if (error) return (
    <div className={`${layoutClasses.page} flex items-center justify-center`}>
      <div className="text-red-400 text-xl font-semibold">{error}</div>
    </div>
  )

  return (
    <div className={`${layoutClasses.page} p-4 sm:p-6`}>
      <div className="mx-auto max-w-7xl w-full">
        <div className={`${layoutClasses.card} p-4 sm:p-6`}>

          <h2 className={`${layoutClasses.heading} mb-6 text-center sm:text-left`}>
            Orders Management
          </h2>

          <div className="w-full overflow-x-auto rounded-xl border border-amber-500/10">
            <table className={`${tableClasses.table} min-w-[900px]`}>

              <thead className={`${tableClasses.headerRow}`}>
                <tr>
                  {['Order ID', 'Customer', 'Address', 'Items', 'Total Items', 'Price', 'Payment', 'Status'].map(h => (
                    <th
                      key={h}
                      className={`${tableClasses.headerCell} whitespace-nowrap ${h === 'Total Items' ? 'text-center' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>

                {orders.map(order => {

                  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

                  const totalPrice =
                    order.total ??
                    order.items.reduce((s, i) => s + i.item.price * i.quantity, 0);

                  const payMethod =
                    paymentMethodDetails[order.paymentMethod?.toLowerCase()] ||
                    paymentMethodDetails.default;

                  const payStatusStyle =
                    statusStyles[order.paymentStatus] ||
                    statusStyles.processing;

                  const stat =
                    statusStyles[order.status] ||
                    statusStyles.processing;

                  return (

                    <tr
                      key={order._id}
                      className={`${tableClasses.row} hover:bg-amber-500/5 transition`}
                    >

                      <td className={`${tableClasses.cellBase} font-mono text-sm text-amber-100`}>
                        #{order._id.slice(-8)}
                      </td>


                      {/* Customer */}
                      <td className={`${tableClasses.cellBase}`}>
                        <div className="flex items-start gap-3">

                          <FiUser className="text-amber-400 mt-1 shrink-0" />

                          <div className="space-y-0.5">

                            <p className="text-amber-100 font-medium">
                              {order.user?.name || order.firstName + ' ' + order.lastName}
                            </p>

                            <p className="text-xs text-amber-400/70">
                              {order.user?.phone || order.phone}
                            </p>

                            <p className="text-xs text-amber-400/70 break-all">
                              {order.user?.email || order.email}
                            </p>

                          </div>

                        </div>
                      </td>


                      {/* Address */}
                      <td className={`${tableClasses.cellBase}`}>
                        <div className="text-amber-100/80 text-sm max-w-[220px] break-words">
                          {order.address}, {order.city} - {order.zipCode}
                        </div>
                      </td>


                      {/* Items */}
                      <td className={`${tableClasses.cellBase}`}>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">

                          {order.items.map((itm, idx) => (

                            <div
                              key={idx}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-500/5 transition"
                            >

                              <img
                                src={`http://localhost:4000${itm.item.imageUrl}`}
                                alt={itm.item.name}
                                className="w-10 h-10 object-cover rounded-md border border-amber-500/20"
                              />

                              <div className="flex-1 min-w-0">

                                <span className="text-amber-100 text-sm truncate block">
                                  {itm.item.name}
                                </span>

                                <div className="flex items-center gap-2 text-xs text-amber-400/70">

                                  <span>₹{itm.item.price.toFixed(2)}</span>

                                  <span>•</span>

                                  <span>x{itm.quantity}</span>

                                </div>

                              </div>

                            </div>

                          ))}

                        </div>
                      </td>


                      {/* Total Items */}
                      <td className={`${tableClasses.cellBase} text-center`}>
                        <div className="flex items-center justify-center gap-1">

                          <FiBox className="text-amber-400" />

                          <span className="text-amber-300 font-semibold">
                            {totalItems}
                          </span>

                        </div>
                      </td>


                      {/* Price */}
                      <td className={`${tableClasses.cellBase} text-amber-300 font-semibold whitespace-nowrap`}>
                        ₹{totalPrice.toFixed(2)}
                      </td>


                      {/* Payment */}
                      <td className={`${tableClasses.cellBase}`}>
                        <div className="flex flex-col gap-2">

                          <div className={`${payMethod.class} px-3 py-1 rounded-lg border text-xs font-medium w-fit`}>
                            {payMethod.label}
                          </div>

                          <div className={`${payStatusStyle.color} flex items-center gap-2 text-xs font-medium`}>
                            {iconMap[payStatusStyle.icon]}
                            {payStatusStyle.label}
                          </div>

                        </div>
                      </td>


                      {/* Status */}
                      <td className={`${tableClasses.cellBase}`}>
                        <div className="flex items-center gap-2">

                          <span className={`${stat.color}`}>
                            {iconMap[stat.icon]}
                          </span>

                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`px-3 py-1 rounded-lg ${stat.bg} ${stat.color} border border-amber-500/20 text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/40`}
                          >

                            {Object.entries(statusStyles)
                              .filter(([k]) => k !== 'succeeded')
                              .map(([key, sty]) => (

                                <option
                                  value={key}
                                  key={key}
                                  className={`${sty.bg} ${sty.color}`}
                                >
                                  {sty.label}
                                </option>

                              ))}

                          </select>

                        </div>
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>
          </div>


          {orders.length === 0 && !loading &&
            <div className="text-center text-amber-100/60 py-12 text-lg">
              No orders found.
            </div>
          }

        </div>
      </div>
    </div>
  )
}

export default Order
