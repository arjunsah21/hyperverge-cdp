import { useState, useEffect } from 'react';
import { X, ShoppingBag, TrendingUp, Package, Calendar, Mail, Phone, MapPin, Award } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { customersAPI } from '../services/api';

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

    if (!isOpen) return null;

    return (
        <div className="customer-details-panel">
            <div className="details-header">
                <h2>Customer Details</h2>
                <button className="btn-icon" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

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

            <style>{`
        .customer-details-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 450px;
          background-color: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          z-index: 100;
          overflow-y: auto;
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          position: sticky;
          top: 0;
          background-color: var(--color-bg-secondary);
        }

        .details-header h2 {
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .details-loading {
          padding: var(--spacing-xl);
          text-align: center;
          color: var(--color-text-muted);
        }

        .details-content {
          padding: var(--spacing-lg);
        }

        .customer-profile {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .profile-avatar {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: var(--font-size-xl);
          font-weight: 600;
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-info {
          flex: 1;
        }

        .profile-info h3 {
          font-size: var(--font-size-lg);
          font-weight: 600;
          margin-bottom: var(--spacing-xs);
        }

        .customer-tier {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: 600;
          color: #1a1a2e;
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

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
        }

        .info-item svg {
          color: var(--color-text-muted);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .stat-card {
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .top-products-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .top-product-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) 0;
          font-size: var(--font-size-sm);
        }

        .product-rank {
          color: var(--color-accent-blue);
          font-weight: 600;
          width: 24px;
        }

        .product-name {
          flex: 1;
          color: var(--color-text-primary);
        }

        .product-qty, .product-value {
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .engagement-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }

        .engagement-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .engagement-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .engagement-value {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .engagement-value.positive {
          color: var(--color-accent-green);
        }

        .engagement-value.negative {
          color: var(--color-text-muted);
        }

        .orders-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          max-height: 400px;
          overflow-y: auto;
        }

        .order-item {
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
        }

        .order-item.clickable {
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .order-item.clickable:hover {
          border-color: var(--color-accent-blue);
          background-color: rgba(59, 130, 246, 0.1);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .order-id {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-accent-blue);
        }

        .order-meta {
          display: flex;
          justify-content: space-between;
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          margin-bottom: var(--spacing-xs);
        }

        .order-total {
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .order-items {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .order-item-tag {
          font-size: var(--font-size-xs);
          padding: 2px var(--spacing-xs);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-sm);
          color: var(--color-text-secondary);
        }
      `}</style>
        </div >
    );
}

export default CustomerDetailsPanel;
