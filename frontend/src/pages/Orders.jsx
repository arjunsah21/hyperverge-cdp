import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import CustomerDetailsPanel from '../components/CustomerDetailsPanel';
import OrderDetailsPanel from '../components/OrderDetailsPanel';
import { ordersAPI } from '../services/api';
import '../styles/pages/Orders.css';

const ORDER_STATUSES = ['All Orders', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All Orders');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const perPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage, search, activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const statusFilter = activeTab !== 'All Orders' ? activeTab : undefined;
      const data = await ordersAPI.getAll({
        page: currentPage,
        per_page: perPage,
        search: search || undefined,
        status: statusFilter,
        sort_by: 'date',
        sort_order: 'desc'
      });
      setOrders(data.orders || []);
      setTotalItems(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleCustomerClick = (customerId) => {
    // Close order panel and open customer panel
    setSelectedOrderId(null);
    setSelectedCustomerId(customerId);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1 className="page-title">Recent Orders</h1>
        <p className="page-subtitle">Track and manage incoming customer purchases across all channels.</p>
      </div>

      {/* Tabs and Search */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {ORDER_STATUSES.map((status) => (
            <button
              key={status}
              className={`filter-tab ${activeTab === status ? 'active' : ''}`}
              onClick={() => handleTabChange(status)}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search orders..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton" style={{ height: '20px', width: '100px' }} /></td>
                  <td><div className="skeleton" style={{ height: '20px', width: '100px' }} /></td>
                  <td><div className="skeleton" style={{ height: '20px', width: '150px' }} /></td>
                  <td><div className="skeleton" style={{ height: '20px', width: '80px' }} /></td>
                  <td><div className="skeleton" style={{ height: '20px', width: '100px' }} /></td>
                </tr>
              ))
            ) : orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span
                    className="order-id-link"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    #{order.order_id}
                  </span>
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {formatDate(order.date)}
                </td>
                <td>
                  <div className="cell-customer">
                    <div className="avatar" style={{
                      backgroundColor: 'var(--color-accent-blue)',
                      color: 'white',
                      fontSize: 'var(--font-size-xs)'
                    }}>
                      {order.customer_initials}
                    </div>
                    <span>{order.customer_name}</span>
                  </div>
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td style={{ fontWeight: 600 }}>
                  {formatCurrency(order.total_amount)}
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

      {/* Order Details Panel (reusable component) */}
      <OrderDetailsPanel
        orderId={selectedOrderId}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onCustomerClick={handleCustomerClick}
      />

      {/* Customer Details Panel (reusable component) */}
      <CustomerDetailsPanel
        customerId={selectedCustomerId}
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        onOrderClick={(orderId) => {
          setSelectedCustomerId(null);
          setSelectedOrderId(orderId);
        }}
      />


    </div>
  );
}

export default Orders;
