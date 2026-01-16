import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Filter,
    Download,
    MoreVertical,
    Package,
    AlertTriangle,
    AlertCircle,
    Sparkles
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { inventoryAPI } from '../services/api';

const STOCK_FILTERS = ['All Items', 'Low Stock', 'Out of Stock'];

function Inventory() {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Items');
    const perPage = 10;

    useEffect(() => {
        fetchData();
    }, [currentPage, search, activeFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Determine status filter
            let statusFilter;
            if (activeFilter === 'Low Stock') statusFilter = 'LOW_STOCK';
            else if (activeFilter === 'Out of Stock') statusFilter = 'OUT_OF_STOCK';

            const [productsData, statsData] = await Promise.all([
                inventoryAPI.getAll({
                    page: currentPage,
                    per_page: perPage,
                    search: search || undefined,
                    status: statusFilter,
                    sort_by: 'created_at',
                    sort_order: 'desc'
                }),
                inventoryAPI.getStats()
            ]);

            setProducts(productsData.products || []);
            setTotalItems(productsData.total || 0);
            setStats(statsData);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const getStockBarClass = (status) => {
        switch (status) {
            case 'IN_STOCK': return 'healthy';
            case 'LOW_STOCK': return 'low';
            case 'OUT_OF_STOCK': return 'out';
            default: return 'healthy';
        }
    };

    const getStockPercentage = (level, status) => {
        if (status === 'OUT_OF_STOCK') return 0;
        if (status === 'LOW_STOCK') return Math.min(30, (level / 20) * 100);
        return Math.min(100, (level / 200) * 100);
    };

    const getPredictedNeedClass = (need) => {
        if (!need) return 'healthy';
        if (need.includes('Order Now')) return 'urgent';
        if (need.includes('Restock')) return 'restock';
        return 'healthy';
    };

    const totalPages = Math.ceil(totalItems / perPage);

    return (
        <div className="inventory-page">
            {/* Stats Cards */}
            <div className="metric-cards-grid">
                <MetricCard
                    icon={Package}
                    label="Total SKUs"
                    value={(stats?.total_skus || 0).toLocaleString()}
                    change={stats?.skus_change || 0}
                />
                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="metric-card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                            <AlertTriangle size={20} style={{ color: 'var(--color-accent-yellow)' }} />
                        </div>
                    </div>
                    <div className="metric-card-label">Low Stock Alerts</div>
                    <div className="metric-card-value">{stats?.low_stock_alerts || 0}</div>
                    <div className="metric-card-comparison">Action required soon</div>
                </div>
                <div className="metric-card">
                    <div className="metric-card-header">
                        <div className="metric-card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                            <AlertCircle size={20} style={{ color: 'var(--color-accent-red)' }} />
                        </div>
                    </div>
                    <div className="metric-card-label">Out of Stock</div>
                    <div className="metric-card-value" style={{ color: 'var(--color-accent-red)' }}>
                        {stats?.out_of_stock || 0}
                    </div>
                    <div className="metric-card-comparison" style={{ color: 'var(--color-accent-red)' }}>
                        Critical status
                    </div>
                </div>
                <MetricCard
                    icon={Package}
                    label="Inventory Value"
                    value={formatCurrency(stats?.inventory_value || 0)}
                />
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
                <div className="filter-tabs">
                    {STOCK_FILTERS.map((filter) => (
                        <button
                            key={filter}
                            className={`filter-tab ${activeFilter === filter ? 'active' : ''}`}
                            onClick={() => handleFilterChange(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="search-container" style={{ maxWidth: '300px' }}>
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by SKU, product name..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn-icon">
                        <Filter size={18} />
                    </button>
                    <button className="btn-icon">
                        <Download size={18} />
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Stock Level</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Predicted Need</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index}>
                                    <td><div className="skeleton" style={{ height: '20px', width: '150px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '100px' }} /></td>
                                    <td><div className="skeleton" style={{ height: '20px', width: '30px' }} /></td>
                                </tr>
                            ))
                        ) : products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div className="cell-product">
                                        <div className="product-image">
                                            <Package size={20} style={{ color: 'var(--color-text-muted)' }} />
                                        </div>
                                        <span style={{ fontWeight: 500 }}>{product.name}</span>
                                    </div>
                                </td>
                                <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                                    {product.sku}
                                </td>
                                <td>
                                    <div className="stock-level">
                                        <span className="stock-level-text">{product.stock_level} units</span>
                                        <div className="stock-level-bar">
                                            <div
                                                className={`stock-level-bar-fill ${getStockBarClass(product.status)}`}
                                                style={{ width: `${getStockPercentage(product.stock_level, product.status)}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td style={{ fontWeight: 500 }}>
                                    {formatCurrency(product.price)}
                                </td>
                                <td>
                                    <StatusBadge status={product.status} />
                                </td>
                                <td>
                                    <div className={`predicted-need ${getPredictedNeedClass(product.predicted_need)}`}>
                                        <Sparkles size={14} />
                                        <span>{product.predicted_need || 'Healthy'}</span>
                                    </div>
                                </td>
                                <td>
                                    <button className="action-btn">
                                        <MoreVertical size={18} />
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

export default Inventory;
