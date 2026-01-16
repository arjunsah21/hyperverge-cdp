import { useState, useEffect } from 'react';
import { X, Package, MapPin, User, Calendar, Hash } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ordersAPI } from '../services/api';
import Drawer from './Drawer';
import '../styles/components/OrderDetailsPanel.css';

function OrderDetailsPanel({ orderId, isOpen, onClose, onCustomerClick }) {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrderDetails(null);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const data = await ordersAPI.getById(orderId);
      setOrderDetails(data);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
      width="500px"
    >
      {loading ? (
        <div className="details-loading">Loading order details...</div>
      ) : orderDetails ? (
        <div className="details-content">
          {/* Order Info */}
          <div className="order-info-header">
            <div className="order-id-display">
              <Hash size={20} />
              <span>{orderDetails.order_id}</span>
            </div>
            <StatusBadge status={orderDetails.status} />
          </div>

          <div className="info-row">
            <Calendar size={16} />
            <span>{formatDate(orderDetails.date)}</span>
          </div>

          {/* Customer Info */}
          <div className="info-section">
            <h4><User size={16} /> Customer</h4>
            <div
              className={`customer-card ${onCustomerClick ? 'clickable' : ''}`}
              onClick={() => onCustomerClick && onCustomerClick(orderDetails.customer.id)}
            >
              <div className="customer-avatar">
                {orderDetails.customer.avatar_url ? (
                  <img src={orderDetails.customer.avatar_url} alt="" />
                ) : (
                  orderDetails.customer.initials
                )}
              </div>
              <div className="customer-info">
                <div className="customer-name">{orderDetails.customer.name}</div>
                <div className="customer-email">{orderDetails.customer.email}</div>
                {orderDetails.customer.phone && (
                  <div className="customer-phone">{orderDetails.customer.phone}</div>
                )}
              </div>
              <StatusBadge status={orderDetails.customer.status} />
            </div>
          </div>

          {/* Shipping Address */}
          {orderDetails.shipping_address && (
            <div className="info-section">
              <h4><MapPin size={16} /> Shipping Address</h4>
              <p className="shipping-address">{orderDetails.shipping_address}</p>
            </div>
          )}

          {/* Order Items */}
          <div className="info-section">
            <h4><Package size={16} /> Items ({orderDetails.items_count})</h4>
            <div className="order-items-list">
              {orderDetails.items.map((item, idx) => (
                <div key={idx} className="order-item-card">
                  <div className="item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} />
                    ) : (
                      <Package size={24} />
                    )}
                  </div>
                  <div className="item-details">
                    <div className="item-name">{item.product_name}</div>
                    <div className="item-sku">SKU: {item.sku}</div>
                    <div className="item-qty">Qty: {item.quantity}</div>
                  </div>
                  <div className="item-price">
                    <div className="item-unit-price">{formatCurrency(item.price)} each</div>
                    <div className="item-total">{formatCurrency(item.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <div className="summary-row">
              <span>Subtotal ({orderDetails.items_count} items)</span>
              <span>{formatCurrency(orderDetails.total_amount)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(orderDetails.total_amount)}</span>
            </div>
          </div>
        </div>
      ) : null}


    </Drawer>
  );
}

export default OrderDetailsPanel;
