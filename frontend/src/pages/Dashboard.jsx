import { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    ShoppingCart,
    Package,
    MapPin
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { dashboardAPI } from '../services/api';
import '../styles/pages/Dashboard.css';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsData = await dashboardAPI.getStats();
                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="skeleton" style={{ height: '200px', marginBottom: '20px' }} />
                <div className="skeleton" style={{ height: '300px' }} />
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">Welcome back, here's what's happening today.</p>
            </div>

            {/* Main Metrics - 6 Cards */}
            <div className="dashboard-cards-grid">
                {/* Card 1: Total Customers */}
                <MetricCard
                    icon={Users}
                    label="Total Customers"
                    value={formatNumber(stats?.total_customers || 0)}
                    change={stats?.customers_change || 0}
                    comparison={`Compared to last month (${formatNumber(stats?.customers_last_month || 0)})`}
                />

                {/* Card 2: 30 Days Revenue */}
                <MetricCard
                    icon={DollarSign}
                    label="30 Days Revenue"
                    value={formatCurrency(stats?.total_revenue || 0)}
                    change={stats?.revenue_change || 0}
                    comparison="Compared to previous 30 days"
                />

                {/* Card 3: Top Selling Product */}
                <div className="top-product-card">
                    <div className="card-title">TOP SELLING PRODUCT</div>
                    <div className="top-product-header">
                        <div className="top-product-image">
                            <Package size={24} />
                        </div>
                        <div className="top-product-info">
                            <div className="top-product-name">{stats?.top_product?.name || 'N/A'}</div>
                            <div className="top-product-stats" style={{ color: 'var(--color-accent-green)' }}>
                                {formatNumber(stats?.top_product?.units_sold || 0)} Units Sold
                            </div>
                            <div className="top-product-price">
                                {formatCurrency(stats?.top_product?.price || 0)} / unit
                            </div>
                        </div>
                    </div>
                    <a href="/inventory" className="text-sm" style={{ color: 'var(--color-accent-blue)' }}>View Analytics</a>
                </div>

                {/* Card 4: Top Ordering Region */}
                <div className="card dashboard-card">
                    <div className="card-header">
                        <span className="card-title">TOP ORDERING REGION</span>
                        <span style={{ color: 'var(--color-accent-blue)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                            {stats?.top_regions?.[0]?.name?.toUpperCase() || 'N/A'}
                        </span>
                    </div>
                    <div className="region-stats">
                        {stats?.top_regions?.map((region) => (
                            <div key={region.name} className="region-stat-item">
                                <div className="region-stat-header">
                                    <span className="region-stat-name">{region.name}</span>
                                    <span className="region-stat-percentage">{region.percentage}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${region.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card 5: Average Order Value */}
                <div className="card dashboard-card">
                    <span className="card-title">AVERAGE ORDER VALUE</span>
                    <div className="metric-card-value" style={{ marginTop: 'var(--spacing-md)' }}>
                        {formatCurrency(stats?.average_order_value || 0)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        <TrendingUp size={16} style={{ color: stats?.aov_change >= 0 ? 'var(--color-accent-green)' : 'var(--color-accent-red)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            {stats?.aov_change >= 0 ? 'Trending up' : 'Trending down'} by ${Math.abs(stats?.aov_change || 0)} this month
                        </span>
                    </div>
                </div>

                {/* Card 6: Customer Retention */}
                <div className="card dashboard-card">
                    <span className="card-title">CUSTOMER RETENTION</span>
                    <div className="donut-chart-container" style={{ marginTop: 'var(--spacing-md)' }}>
                        <div className="donut-chart">
                            <svg width="100" height="100" viewBox="0 0 100 100">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="var(--color-bg-tertiary)"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="var(--color-accent-blue)"
                                    strokeWidth="12"
                                    strokeDasharray={`${(stats?.customer_retention || 0) * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="donut-chart-value">{stats?.customer_retention || 0}%</div>
                        </div>
                        <div className="donut-chart-legend">
                            <div className="donut-chart-legend-item">
                                <span className="donut-chart-legend-label">RETURNING</span>
                                <span className="donut-chart-legend-value">{formatNumber(stats?.returning_customers || 0)}</span>
                            </div>
                            <div className="donut-chart-legend-item">
                                <span className="donut-chart-legend-label">NEW</span>
                                <span className="donut-chart-legend-value">{formatNumber(stats?.new_customers || 0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default Dashboard;
