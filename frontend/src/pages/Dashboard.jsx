import { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    Package,
    ShoppingCart,
    Sparkles
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { dashboardAPI } from '../services/api';

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, insightsData] = await Promise.all([
                    dashboardAPI.getStats(),
                    dashboardAPI.getInsights()
                ]);
                setStats(statsData);
                setInsights(insightsData.insights || []);
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

            {/* Main Metrics */}
            <div className="metric-cards-grid">
                <MetricCard
                    icon={Users}
                    label="Total Customers"
                    value={formatNumber(stats?.total_customers || 0)}
                    change={stats?.customers_change || 0}
                    comparison={`Compared to last month (${formatNumber(stats?.customers_last_month || 0)})`}
                />
                <MetricCard
                    icon={DollarSign}
                    label="30 Days Revenue"
                    value={formatCurrency(stats?.total_revenue || 0)}
                    change={stats?.revenue_change || 0}
                />
                <div className="top-product-card">
                    <div className="card-title">Top Selling Product</div>
                    <div className="top-product-header">
                        <div className="top-product-image">
                            <Package size={24} />
                        </div>
                        <div className="top-product-info">
                            <div className="top-product-name">{stats?.top_product?.name || 'Hyper Buds Pro'}</div>
                            <div className="top-product-stats">{formatNumber(stats?.top_product?.units_sold || 0)} Units Sold</div>
                            <div className="top-product-price">{formatCurrency(stats?.top_product?.price || 0)} / unit</div>
                        </div>
                    </div>
                    <a href="#" className="text-sm" style={{ color: 'var(--color-accent-blue)' }}>View Analytics</a>
                </div>
            </div>

            {/* Secondary Metrics Row */}
            <div className="dashboard-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                {/* Top Ordering Region */}
                <div className="card grid-col-4">
                    <div className="card-header">
                        <span className="card-title">Top Ordering Region</span>
                        <span style={{ color: 'var(--color-accent-blue)', fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>NORTH AMERICA</span>
                    </div>
                    <div className="region-stats">
                        {stats?.top_regions?.map((region, index) => (
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

                {/* Average Order Value */}
                <div className="card grid-col-4">
                    <span className="card-title">Average Order Value</span>
                    <div className="metric-card-value" style={{ marginTop: 'var(--spacing-md)' }}>
                        {formatCurrency(stats?.average_order_value || 0)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-sm)' }}>
                        <TrendingUp size={16} style={{ color: 'var(--color-accent-green)' }} />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            Trending up by ${stats?.aov_change || 0} this week
                        </span>
                    </div>
                </div>

                {/* Customer Retention */}
                <div className="card grid-col-4">
                    <span className="card-title">Customer Retention</span>
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
                                    strokeDasharray={`${(stats?.customer_retention || 68) * 2.51} 251`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="donut-chart-value">{stats?.customer_retention || 68}%</div>
                        </div>
                        <div className="donut-chart-legend">
                            <div className="donut-chart-legend-item">
                                <span className="donut-chart-legend-label">RETURNING</span>
                                <span className="donut-chart-legend-value">{(stats?.returning_customers / 1000).toFixed(1)}k</span>
                            </div>
                            <div className="donut-chart-legend-item">
                                <span className="donut-chart-legend-label">NEW</span>
                                <span className="donut-chart-legend-value">{(stats?.new_customers / 1000).toFixed(1)}k</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Intelligence Feed */}
            <div className="card">
                <div className="card-header">
                    <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        HyperVerge Intelligence Feed
                    </span>
                    <a href="#" style={{ color: 'var(--color-accent-blue)', fontSize: 'var(--font-size-sm)' }}>
                        View All Insights →
                    </a>
                </div>
                <div className="intelligence-feed">
                    {insights.map((insight) => (
                        <div key={insight.id} className={`insight-card ${insight.type}`}>
                            <div className="insight-icon">
                                {insight.type === 'positive' ? <TrendingUp size={20} /> :
                                    insight.type === 'warning' ? <AlertTriangle size={20} /> :
                                        <Sparkles size={20} />}
                            </div>
                            <div className="insight-content">
                                <div className="insight-title">{insight.title}</div>
                                <div className="insight-description">{insight.description}</div>
                            </div>
                            <div className="insight-time">{insight.time_ago}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
