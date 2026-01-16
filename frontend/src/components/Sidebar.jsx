import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Package,
    Settings,
    Zap
} from 'lucide-react';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
];

function Sidebar() {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Zap size={20} />
                    </div>
                    <div className="sidebar-logo-text">
                        <span className="sidebar-logo-title">HyperVerge</span>
                        <span className="sidebar-logo-subtitle">E-commerce Admin</span>
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

            <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background-color: var(--color-bg-secondary);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
        }

        .sidebar-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .sidebar-logo-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-cyan));
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .sidebar-logo-text {
          display: flex;
          flex-direction: column;
        }

        .sidebar-logo-title {
          font-size: var(--font-size-base);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .sidebar-logo-subtitle {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
          text-decoration: none;
        }

        .sidebar-nav-item:hover {
          color: var(--color-text-primary);
          background-color: var(--color-bg-tertiary);
        }

        .sidebar-nav-item.active {
          color: white;
          background-color: var(--color-accent-blue);
        }

        .sidebar-footer {
          padding: var(--spacing-md);
          border-top: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border-radius: var(--radius-md);
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          overflow: hidden;
          background-color: var(--color-bg-primary);
        }

        .sidebar-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .sidebar-user-info {
          display: flex;
          flex-direction: column;
        }

        .sidebar-user-name {
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .sidebar-user-role {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }
      `}</style>
        </aside>
    );
}

export default Sidebar;
