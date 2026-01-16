import { TrendingUp, TrendingDown } from 'lucide-react';

function MetricCard({
    icon: Icon,
    label,
    value,
    change,
    changeLabel,
    comparison
}) {
    const isPositive = change >= 0;

    return (
        <div className="metric-card">
            <div className="metric-card-header">
                <div className="metric-card-icon">
                    {Icon && <Icon size={20} />}
                </div>
                {change !== undefined && (
                    <div className={`metric-card-change ${isPositive ? '' : 'negative'}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{isPositive ? '+' : ''}{change}%</span>
                    </div>
                )}
            </div>
            <div className="metric-card-label">{label}</div>
            <div className="metric-card-value">{value}</div>
            {comparison && (
                <div className="metric-card-comparison">{comparison}</div>
            )}
        </div>
    );
}

export default MetricCard;
