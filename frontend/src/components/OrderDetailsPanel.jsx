import { useState, useEffect } from 'react';
import { X, Package, MapPin, User, Calendar, Hash } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { ordersAPI } from '../services/api';
import Drawer from './Drawer';

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

      <style>{`
        .details-loading {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-muted);
        }

        .order-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .order-id-display {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-lg);
        }

        .info-section {
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .info-section h4 {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .customer-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .customer-card.clickable {
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .customer-card.clickable:hover {
          border-color: var(--color-accent-blue);
          background-color: rgba(59, 130, 246, 0.1);
        }

        .customer-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          overflow: hidden;
        }

        .customer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .customer-info {
          flex: 1;
        }

        .customer-name {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .customer-email {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
        }

        .customer-phone {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .shipping-address {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          line-height: 1.5;
        }

        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .order-item-card {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .item-image {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-md);
          background-color: var(--color-bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          overflow: hidden;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-weight: 500;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .item-sku {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .item-qty {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .item-price {
          text-align: right;
        }

        .item-unit-price {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .item-total {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .order-summary {
          margin-top: var(--spacing-lg);
          padding: var(--spacing-md);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-xs) 0;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .summary-row.total {
          border-top: 1px solid var(--color-border);
          margin-top: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          font-size: var(--font-size-md);
          font-weight: 700;
          color: var(--color-text-primary);
        }
      `}</style>
    </Drawer>
  );
}

export default OrderDetailsPanel;
