import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, Bot, Menu } from 'lucide-react';
import { useChatContext, useSidebar } from '../App';
import '../styles/components/Header.css';

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/customers': 'Customer List',
  '/orders': 'Orders Management',
  '/inventory': 'Inventory Management',
  '/segments': 'Customer Segments',
  '/flows': 'Email Flows',
  '/profile': 'My Profile',
  '/users': 'User Management',
};

function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const { isChatOpen, toggleChat } = useChatContext();
  const { isSidebarOpen, openSidebar } = useSidebar();

  return (
    <header className="header">
      {/* Mobile Hamburger - only show when sidebar is closed */}
      {!isSidebarOpen && (
        <button
          className="header-hamburger"
          onClick={openSidebar}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}

      <div className="header-title">{title}</div>

      <div className="header-actions">
        <div className="search-container header-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
          />
        </div>

        <button
          className={`ai-assistant-btn ${isChatOpen ? 'active' : ''}`}
          onClick={toggleChat}
        >
          <Bot size={18} />
          <span className="btn-text">AI Assistant</span>
        </button>

        <button className="btn-icon">
          <Bell size={18} />
        </button>

        <Link to="/profile" className="header-user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" />
        </Link>
      </div>
    </header>
  );
}

export default Header;
