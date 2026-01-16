import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Edit2, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import CustomerDetailsPanel from '../components/CustomerDetailsPanel';
import OrderDetailsPanel from '../components/OrderDetailsPanel';
import Drawer from '../components/Drawer';
import { customersAPI } from '../services/api';
import '../styles/pages/Customers.css';

function Customers() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('total_spend');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const perPage = 10;

    // Check for customer query param to auto-open details
    useEffect(() => {
        const customerId = searchParams.get('customer');
        if (customerId) {
            setSelectedCustomerId(parseInt(customerId));
            setSearchParams({});
        }
    }, [searchParams]);

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
                                    <div
                                        className="cell-customer"
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="avatar">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt={customer.name} />
                                            ) : (
                                                (customer.name || customer.email).split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 500, color: 'var(--color-accent-blue)' }}>
                                            {customer.name || customer.email}
                                        </span>
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
            <CustomerDetailsPanel
                customerId={selectedCustomerId}
                isOpen={!!selectedCustomerId}
                onClose={() => setSelectedCustomerId(null)}
                onOrderClick={(orderId) => {
                    setSelectedCustomerId(null);
                    setSelectedOrderId(orderId);
                }}
            />

            {/* Order Details Panel */}
            <OrderDetailsPanel
                orderId={selectedOrderId}
                isOpen={!!selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
                onCustomerClick={(customerId) => {
                    setSelectedOrderId(null);
                    setSelectedCustomerId(customerId);
                }}
            />

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
        <Drawer
            isOpen={true}
            onClose={onClose}
            title="Edit Customer"
            width="500px"
        >
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


        </Drawer>
    );
}

export default Customers;
