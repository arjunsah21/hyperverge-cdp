import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../App';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Settings,
  Zap,
  Filter,
  Mail,
  Sun,
  Moon
} from 'lucide-react';


import '../styles/components/Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/segments', icon: Filter, label: 'Segments' },
  { path: '/flows', icon: Mail, label: 'Email Flows' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/customers', icon: Users, label: 'Customers' },
];

function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">HyperVerge</span>
            <span className="sidebar-logo-subtitle">CDP Dashboard</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="sidebar-nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>

        <button onClick={toggleTheme} className="sidebar-nav-item" style={{ width: '100%', cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Alex Rivera</span>
            <span className="sidebar-user-role">Administrator</span>
          </div>
        </div>
      </div>


    </aside>
  );
}

export default Sidebar;
