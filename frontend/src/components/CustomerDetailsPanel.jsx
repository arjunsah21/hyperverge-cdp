import { useState, useEffect } from 'react';
import { X, ShoppingBag, TrendingUp, Package, Calendar, Mail, Phone, MapPin, Award } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { customersAPI } from '../services/api';
import Drawer from './Drawer';
import '../styles/components/CustomerDetailsPanel.css';

const TIER_COLORS = {
  Diamond: '#b9f2ff',
  Platinum: '#e5e4e2',
  Gold: '#ffd700',
  Silver: '#c0c0c0',
  Bronze: '#cd7f32'
};

function CustomerDetailsPanel({ customerId, isOpen, onClose, onOrderClick }) {
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    } else {
      setCustomerDetails(null);
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const data = await customersAPI.getDetails(customerId);
      setCustomerDetails(data);
    } catch (error) {
      console.error('Failed to fetch customer details:', error);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Details"
      width="500px"
    >
      {loading ? (
        <div className="details-loading">Loading customer details...</div>
      ) : customerDetails ? (
        <div className="details-content">
          {/* Customer Profile */}
          <div className="customer-profile">
            <div className="profile-avatar">
              {customerDetails.customer.avatar_url ? (
                <img src={customerDetails.customer.avatar_url} alt="" />
              ) : (
                (customerDetails.customer.name || 'C')[0].toUpperCase()
              )}
            </div>
            <div className="profile-info">
              <h3>{customerDetails.customer.name || customerDetails.customer.email}</h3>
              <StatusBadge status={customerDetails.customer.status} />
            </div>
            <div className="customer-tier" style={{ backgroundColor: TIER_COLORS[customerDetails.insights.tier] }}>
              <Award size={16} />
              {customerDetails.insights.tier}
            </div>
          </div>

          {/* Contact Info */}
          <div className="info-section">
            <h4>Contact Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <Mail size={14} />
                <span>{customerDetails.customer.email}</span>
              </div>
              {customerDetails.customer.phone && (
                <div className="info-item">
                  <Phone size={14} />
                  <span>{customerDetails.customer.phone}</span>
                </div>
              )}
              {customerDetails.customer.state && (
                <div className="info-item">
                  <MapPin size={14} />
                  <span>{customerDetails.customer.city}, {customerDetails.customer.state}</span>
                </div>
              )}
              <div className="info-item">
                <Calendar size={14} />
                <span>Customer since {formatDate(customerDetails.customer.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{formatCurrency(customerDetails.customer.total_spend)}</span>
              <span className="stat-label">Total Spend</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{customerDetails.customer.total_orders}</span>
              <span className="stat-label">Orders</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{formatCurrency(customerDetails.customer.average_order_value)}</span>
              <span className="stat-label">Avg Order</span>
            </div>
          </div>

          {/* Top Products by Quantity */}
          {customerDetails.insights.top_products_by_quantity?.length > 0 && (
            <div className="info-section">
              <h4><Package size={16} /> Top Products (by quantity)</h4>
              <div className="top-products-list">
                {customerDetails.insights.top_products_by_quantity.map((product, idx) => (
                  <div key={idx} className="top-product-item">
                    <span className="product-rank">#{idx + 1}</span>
                    <span className="product-name">{product.name}</span>
                    <span className="product-qty">{product.quantity} units</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products by Value */}
          {customerDetails.insights.top_products_by_value?.length > 0 && (
            <div className="info-section">
              <h4><TrendingUp size={16} /> Top Products (by value)</h4>
              <div className="top-products-list">
                {customerDetails.insights.top_products_by_value.map((product, idx) => (
                  <div key={idx} className="top-product-item">
                    <span className="product-rank">#{idx + 1}</span>
                    <span className="product-name">{product.name}</span>
                    <span className="product-value">{formatCurrency(product.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Metrics */}
          <div className="info-section">
            <h4>Engagement</h4>
            <div className="engagement-grid">
              <div className="engagement-item">
                <span className="engagement-label">Last Order</span>
                <span className="engagement-value">
                  {customerDetails.insights.engagement.days_since_last_order !== null
                    ? `${customerDetails.insights.engagement.days_since_last_order} days ago`
                    : 'Never'}
                </span>
              </div>
              <div className="engagement-item">
                <span className="engagement-label">Order Frequency</span>
                <span className="engagement-value">{customerDetails.insights.engagement.order_frequency}/month</span>
              </div>
              <div className="engagement-item">
                <span className="engagement-label">Email Subscribed</span>
                <span className={`engagement-value ${customerDetails.insights.engagement.email_engaged ? 'positive' : 'negative'}`}>
                  {customerDetails.insights.engagement.email_engaged ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="engagement-item">
                <span className="engagement-label">SMS Subscribed</span>
                <span className={`engagement-value ${customerDetails.insights.engagement.sms_engaged ? 'positive' : 'negative'}`}>
                  {customerDetails.insights.engagement.sms_engaged ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="info-section">
            <h4><ShoppingBag size={16} /> Order History ({customerDetails.orders.length})</h4>
            <div className="orders-list">
              {customerDetails.orders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${onOrderClick ? 'clickable' : ''}`}
                  onClick={() => onOrderClick && onOrderClick(order.id)}
                >
                  <div className="order-header">
                    <span className="order-id">{order.order_id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="order-meta">
                    <span>{formatDate(order.date)}</span>
                    <span className="order-total">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="order-items-list">
                    {order.items.map((item, idx) => (
                      <span key={idx} className="order-item-tag">
                        {item.product_name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}


    </Drawer>
  );
}

export default CustomerDetailsPanel;
