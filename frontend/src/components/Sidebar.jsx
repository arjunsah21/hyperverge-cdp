import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Moon,
  LogOut,
  User
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Convert relative URL to absolute for display if needed, or use proxy
  const avatarSrc = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `http://localhost:8000${user.avatar_url}`)
    : `https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=random`

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
        {user?.role === 'SUPER_ADMIN' && (
          <NavLink to="/users" className={`sidebar-nav-item ${location.pathname === '/users' ? 'active' : ''}`}>
            <Users size={20} />
            <span>Manage Users</span>
          </NavLink>
        )}

        <NavLink to="/profile" className={`sidebar-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
          <User size={20} />
          <span>My Profile</span>
        </NavLink>

        <button onClick={toggleTheme} className="sidebar-nav-item" style={{ width: '100%', cursor: 'pointer' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            <img src={avatarSrc} alt="User" />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.first_name} {user?.last_name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: 'auto' }}>
            <LogOut size={16} />
          </button>
        </div>
      </div>


    </aside>
  );
}

export default Sidebar;
