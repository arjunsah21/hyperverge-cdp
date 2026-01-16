function StatusBadge({ status }) {
    const statusLower = status?.toLowerCase().replace(/_/g, '-').replace(' ', '-');

    const getDisplayText = () => {
        switch (statusLower) {
            case 'vip': return 'VIP';
            case 'active': return 'Active';
            case 'regular': return 'Regular';
            case 'new': return 'New';
            case 'pending': return 'Pending';
            case 'shipped': return 'Shipped';
            case 'cancelled': return 'Cancelled';
            case 'in-stock': return 'In Stock';
            case 'low-stock': return 'Low Stock';
            case 'out-of-stock': return 'Out of Stock';
            default: return status;
        }
    };

    return (
        <span className={`status-badge ${statusLower}`}>
            {getDisplayText()}
        </span>
    );
}

export default StatusBadge;
