import { useLocation } from 'react-router-dom';
import { Search, Bell, Bot } from 'lucide-react';
import { useChatContext } from '../App';
import '../styles/components/Header.css';

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/customers': 'Customer List',
  '/orders': 'Orders Management',
  '/inventory': 'Inventory Management',
  '/segments': 'Customer Segments',
  '/flows': 'Email Flows',
};

function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';
  const { isChatOpen, toggleChat } = useChatContext();

  return (
    <header className="header">
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
          <span>AI Assistant</span>
        </button>

        <button className="btn-icon">
          <Bell size={18} />
        </button>

        <div className="header-user-avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User" />
        </div>
      </div>


    </header>
  );
}

export default Header;
