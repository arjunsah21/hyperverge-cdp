import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, X, ShoppingBag, TrendingUp, Package, Calendar, Mail, Phone, MapPin, Award } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { customersAPI } from '../services/api';

const TIER_COLORS = {
    Diamond: '#b9f2ff',
    Platinum: '#e5e4e2',
    Gold: '#ffd700',
    Silver: '#c0c0c0',
    Bronze: '#cd7f32'
};

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('total_spend');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const perPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, search, sortBy, statusFilter]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customersAPI.getAll({
                page: currentPage,
                per_page: perPage,
                search: search || undefined,
                status: statusFilter || undefined,
                sort_by: sortBy,
                sort_order: 'desc'
            });
            setCustomers(data.customers || []);
            setTotalItems(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCustomer = async (customer) => {
        setSelectedCustomer(customer);
        setDetailsLoading(true);
        try {
            const data = await customersAPI.getDetails(customer.id);
            setCustomerDetails(data);
        } catch (error) {
            console.error('Failed to fetch customer details:', error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleCloseDetails = () => {
        setSelectedCustomer(null);
        setCustomerDetails(null);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setCurrentPage(1);
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

    const totalPages = Math.ceil(totalItems / perPage);

    return (
        <div className="customers-page">
            <div className="page-header-actions">
                <div className="page-header">
                    <div className="page-breadcrumb">
                        <span>Admin</span>
                        <span>›</span>
                        <span>Customers</span>
                    </div>
                    <h1 className="page-title">Customers</h1>
                    <p className="page-subtitle">Manage and monitor your store's customer engagement.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="search-container" style={{ maxWidth: '400px', flex: 1 }}>
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search customers by name or email..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                <div className="filter-dropdown">
                    <Filter size={16} />
                    <select
                        className="select"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="VIP">VIP</option>
                        <option value="ACTIVE">Active</option>
                        <option value="REGULAR">Regular</option>
                        <option value="NEW">New</option>
                        <option value="CHURNED">Churned</option>
                    </select>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>SORT BY:</span>
                    <select className="select" value={sortBy} onChange={handleSortChange}>
                        <option value="total_spend">Highest Spend</option>
                        <option value="total_orders">Most Orders</option>
                        <option value="created_at">Newest</option>
                    </select>
                </div>
            </div>

            {/* Data Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Orders</th>
                            <th>Total Spend</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index}>
                                    <td><div className="skeleton" style={{ height: '20px', width: '150px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '180px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '40px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '100px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '30px' }} /></td>
                                </tr>
                            ))
                        ) : customers.map((customer) => (
                            <tr key={customer.id}>
                                <td>
                                    <div className="cell-customer" onClick={() => handleViewCustomer(customer)} style={{ cursor: 'pointer' }}>
                                        <div className="avatar">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt={customer.name} />
                                            ) : (
                                                (customer.name || customer.email).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 500, color: 'var(--color-accent-blue)' }}>{customer.name || customer.email}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)' }}>{customer.email}</td>
                                <td><StatusBadge status={customer.status} /></td>
                                <td>{customer.total_orders}</td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(customer.total_spend)}</td>
                                <td>
                                    <button className="btn-icon" onClick={() => setEditingCustomer(customer)} title="Edit Customer">
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    perPage={perPage}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Customer Details Panel */}
            {selectedCustomer && (
                <div className="customer-details-panel">
                    <div className="details-header">
                        <h2>Customer Details</h2>
                        <button className="btn-icon" onClick={handleCloseDetails}>
                            <X size={20} />
                        </button>
                    </div>

                    {detailsLoading ? (
                        <div className="details-loading">Loading customer details...</div>
                    ) : customerDetails ? (
                        <div className="details-content">
                            {/* Customer Info */}
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
                                        <div key={order.id} className="order-item">
                                            <div className="order-header">
                                                <span className="order-id">{order.order_id}</span>
                                                <StatusBadge status={order.status} />
                                            </div>
                                            <div className="order-meta">
                                                <span>{formatDate(order.date)}</span>
                                                <span className="order-total">{formatCurrency(order.total_amount)}</span>
                                            </div>
                                            <div className="order-items">
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
                </div>
            )}

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <EditCustomerModal
                    customer={editingCustomer}
                    onClose={() => setEditingCustomer(null)}
                    onSaved={() => {
                        setEditingCustomer(null);
                        fetchCustomers();
                    }}
                />
            )}

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
        }

        .order-item {
          padding: var(--spacing-sm);
          background-color: var(--color-bg-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
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

        .cell-customer:hover span {
          text-decoration: underline;
        }
      `}</style>
        </div>
    );
}

// Edit Customer Modal Component
function EditCustomerModal({ customer, onClose, onSaved }) {
    const [formData, setFormData] = useState({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        city: customer.city || '',
        state: customer.state || '',
        status: customer.status || 'REGULAR',
        email_opt_in: customer.email_opt_in ?? true,
        sms_opt_in: customer.sms_opt_in ?? false,
        source: customer.source || '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await customersAPI.update(customer.id, formData);
            onSaved();
        } catch (error) {
            console.error('Failed to update customer:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="edit-modal-overlay" onClick={onClose}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                    <h2>Edit Customer</h2>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-modal-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => handleChange('first_name', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => handleChange('last_name', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="VIP">VIP</option>
                                <option value="ACTIVE">Active</option>
                                <option value="REGULAR">Regular</option>
                                <option value="NEW">New</option>
                                <option value="CHURNED">Churned</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => handleChange('state', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Acquisition Source</label>
                        <select
                            value={formData.source}
                            onChange={(e) => handleChange('source', e.target.value)}
                        >
                            <option value="">Select source...</option>
                            <option value="organic">Organic</option>
                            <option value="paid_search">Paid Search</option>
                            <option value="social">Social</option>
                            <option value="referral">Referral</option>
                            <option value="email">Email</option>
                            <option value="direct">Direct</option>
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.email_opt_in}
                                    onChange={(e) => handleChange('email_opt_in', e.target.checked)}
                                />
                                Email Marketing Opt-in
                            </label>
                        </div>
                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.sms_opt_in}
                                    onChange={(e) => handleChange('sms_opt_in', e.target.checked)}
                                />
                                SMS Marketing Opt-in
                            </label>
                        </div>
                    </div>

                    <div className="edit-modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                <style>{`
          .edit-modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 200;
          }

          .edit-modal {
            background-color: var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--color-border);
          }

          .edit-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--color-border);
          }

          .edit-modal-header h2 {
            font-size: var(--font-size-lg);
            font-weight: 600;
          }

          .edit-modal-form {
            padding: var(--spacing-lg);
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--spacing-md);
          }

          .form-group {
            margin-bottom: var(--spacing-md);
          }

          .form-group label {
            display: block;
            font-size: var(--font-size-sm);
            font-weight: 500;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .form-group input,
          .form-group select {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background-color: var(--color-bg-tertiary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
          }

          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            cursor: pointer;
          }

          .checkbox-group input {
            width: auto;
          }

          .edit-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-md);
            padding-top: var(--spacing-md);
            border-top: 1px solid var(--color-border);
          }
        `}</style>
            </div>
        </div>
    );
}

export default Customers;
