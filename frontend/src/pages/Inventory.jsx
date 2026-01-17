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
    Sparkles,
    X,
    RotateCcw,
    Edit,
    Trash2
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import Drawer from '../components/Drawer';
import ProductDrawer from '../components/ProductDrawer';
import { inventoryAPI } from '../services/api';
import '../styles/pages/Inventory.css';

const STOCK_FILTERS = ['All Items', 'Low Stock', 'Out of Stock'];

const PREDICTED_NEEDS = [
    { value: '', label: 'All' },
    { value: 'Restock Soon', label: 'Restock Soon' },
    { value: 'Order Now', label: 'Order Now' },
    { value: 'Healthy', label: 'Healthy' }
];

function Inventory() {
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('All Items');

    // Advanced Filters State
    const [showFilterDrawer, setShowFilterDrawer] = useState(false);
    const [filters, setFilters] = useState({
        min_price: '',
        max_price: '',
        predicted_need: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        min_price: '',
        max_price: '',
        predicted_need: ''
    });

    // Product Drawer State
    const [showProductDrawer, setShowProductDrawer] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const perPage = 10;

    useEffect(() => {
        fetchData();
    }, [currentPage, search, activeFilter, appliedFilters]);

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
                    min_price: appliedFilters.min_price || undefined,
                    max_price: appliedFilters.max_price || undefined,
                    predicted_need: appliedFilters.predicted_need || undefined,
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

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setShowProductDrawer(true);
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setShowProductDrawer(true);
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await inventoryAPI.delete(id);
                fetchData(); // Refresh list
            } catch (error) {
                console.error('Failed to delete product:', error);
                alert('Failed to delete product');
            }
        }
    };

    const handleProductSave = (savedProduct) => {
        fetchData(); // Refresh list
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const applyAdvancedFilters = () => {
        setAppliedFilters(filters);
        setShowFilterDrawer(false);
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ min_price: '', max_price: '', predicted_need: '' });
        setAppliedFilters({ min_price: '', max_price: '', predicted_need: '' });
        setShowFilterDrawer(false);
        setCurrentPage(1);
    };

    const handleDownload = async () => {
        try {
            // Fetch all products with current filters
            let statusFilter;
            if (activeFilter === 'Low Stock') statusFilter = 'LOW_STOCK';
            else if (activeFilter === 'Out of Stock') statusFilter = 'OUT_OF_STOCK';

            const data = await inventoryAPI.getAll({
                page: 1,
                per_page: 10000, // Fetch up to 10000 items
                search: search || undefined,
                status: statusFilter,
                min_price: appliedFilters.min_price || undefined,
                max_price: appliedFilters.max_price || undefined,
                predicted_need: appliedFilters.predicted_need || undefined,
            });

            if (!data.products || data.products.length === 0) {
                alert('No products to download');
                return;
            }

            // Convert to CSV
            const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock Level', 'Status', 'Predicted Need', 'Created At'];
            const csvRows = [headers.join(',')];

            data.products.forEach(p => {
                const row = [
                    p.id,
                    `"${p.name.replace(/"/g, '""')}"`, // Escape quotes
                    p.sku,
                    p.category || '',
                    p.price,
                    p.stock_level,
                    p.status,
                    p.predicted_need || '',
                    p.created_at
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download inventory');
        }
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
                <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by SKU, product name..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>

                <div className="inventory-actions">
                    <button
                        className={`btn-icon ${Object.values(appliedFilters).some(v => v) ? 'active' : ''}`}
                        onClick={() => setShowFilterDrawer(true)}
                        title="Advanced Filters"
                        style={Object.values(appliedFilters).some(v => v) ? { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-accent-blue)' } : {}}
                    >
                        <Filter size={18} />
                    </button>
                    <button className="btn-icon" onClick={handleDownload} title="Export CSV">
                        <Download size={18} />
                    </button>
                    <button className="btn btn-primary" onClick={handleAddProduct}>
                        <Plus size={18} />
                        <span className="btn-text">Add Product</span>
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
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleEditProduct(product)}
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            title="Delete"
                                            style={{ color: 'var(--color-accent-red)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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

            {/* Filter Drawer */}
            <Drawer
                isOpen={showFilterDrawer}
                onClose={() => setShowFilterDrawer(false)}
                title="Filter Inventory"
                width="400px"
                actions={
                    <>
                        <button className="btn btn-secondary" onClick={resetFilters}>
                            <RotateCcw size={16} /> Reset
                        </button>
                        <button className="btn btn-primary" onClick={applyAdvancedFilters}>
                            Apply Filters
                        </button>
                    </>
                }
            >
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Price Range</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.min_price}
                                    onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.max_price}
                                    onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Predicted Need</label>
                        <select
                            value={filters.predicted_need}
                            onChange={(e) => setFilters({ ...filters, predicted_need: e.target.value })}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}
                        >
                            {PREDICTED_NEEDS.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Filter by AI-predicted inventory needs
                        </p>
                    </div>
                </div>
            </Drawer>

            {/* Product Drawer */}
            <ProductDrawer
                isOpen={showProductDrawer}
                onClose={() => setShowProductDrawer(false)}
                checkProduct={selectedProduct}
                onSave={handleProductSave}
            />
        </div >
    );
}

export default Inventory;
