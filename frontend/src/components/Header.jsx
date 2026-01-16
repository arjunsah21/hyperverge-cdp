import { useLocation } from 'react-router-dom';
import { Search, Bell, Bot } from 'lucide-react';
import { useChatContext } from '../App';

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/customers': 'Customer List',
  '/orders': 'Orders Management',
  '/inventory': 'Inventory Management',
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

      <style>{`
        .header {
          height: var(--header-height);
          padding: 0 var(--spacing-xl);
          background-color: var(--color-bg-primary);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .header-search {
          width: 250px;
        }

        .ai-assistant-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple));
          color: white;
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: 500;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .ai-assistant-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .ai-assistant-btn.active {
          background: linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-blue));
        }

        .header-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          overflow: hidden;
          background-color: var(--color-bg-tertiary);
          cursor: pointer;
        }

        .header-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </header>
  );
}

export default Header;
