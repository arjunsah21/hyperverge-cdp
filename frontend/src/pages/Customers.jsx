import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Plus } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { customersAPI } from '../services/api';

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('total_spend');
    const perPage = 10;

    useEffect(() => {
        fetchCustomers();
    }, [currentPage, search, sortBy]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customersAPI.getAll({
                page: currentPage,
                per_page: perPage,
                search: search || undefined,
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
        }).format(value);
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
                <button className="btn btn-primary">
                    <Plus size={18} />
                    New Customer
                </button>
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
                <button className="btn btn-secondary">
                    <Filter size={18} />
                    Filter
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>SORT BY:</span>
                    <select className="select" value={sortBy} onChange={handleSortChange}>
                        <option value="total_spend">Highest Spend</option>
                        <option value="total_orders">Most Orders</option>
                        <option value="name">Name</option>
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
                                    <div className="cell-customer">
                                        <div className="avatar">
                                            {customer.avatar_url ? (
                                                <img src={customer.avatar_url} alt={customer.name} />
                                            ) : (
                                                customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)
                                            )}
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{customer.name}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--color-text-secondary)' }}>{customer.email}</td>
                                <td><StatusBadge status={customer.status} /></td>
                                <td>{customer.total_orders}</td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(customer.total_spend)}</td>
                                <td>
                                    <button className="action-btn">
                                        <MoreHorizontal size={18} />
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
        </div>
    );
}

export default Customers;
