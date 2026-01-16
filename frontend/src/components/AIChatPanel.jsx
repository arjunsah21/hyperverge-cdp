import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';

const QUICK_PROMPTS = ['Last month\'s ROAS?', 'Top zip codes', 'Churn report'];

function AIChatPanel({ onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI Assistant. I can help you analyze data, generate reports, and provide insights about your e-commerce store. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (will be replaced with actual AI agent later)
    setTimeout(() => {
      const responses = [
        {
          content: "Based on the **Revenue Growth** chart, the dip on Tuesday was correlated with a 14% drop in traffic from your Google Ads campaign which reached its daily budget cap early at 2:00 PM.",
          recommendation: "Adjust Daily Budget Cap",
          source: "Marketing Reports & Q3 Analytics"
        },
        {
          content: "I'm analyzing your request. This feature will be connected to AI agents soon for real-time insights!",
          recommendation: null,
          source: null
        },
        {
          content: "Great question! Your top performing zip codes are 94102, 10001, and 90210 with a combined revenue of $45,230 this month.",
          recommendation: "Expand targeting to similar demographics",
          source: "Customer Analytics"
        }
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        recommendation: response.recommendation,
        source: response.source,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickPrompt = (prompt) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-icon">
            <Sparkles size={18} />
          </div>
          <div className="chat-header-info">
            <span className="chat-header-title">HyperVerge AI</span>
            <span className="chat-header-status">
              <span className="status-dot"></span>
              ONLINE & ANALYZING
            </span>
          </div>
        </div>
        <button className="chat-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="chat-messages">
        <div className="chat-date-divider">
          <span>TODAY, {formatTime(new Date()).toUpperCase()}</span>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.role}`}>
            {message.role === 'user' ? (
              <div className="chat-message-bubble user">
                {message.content}
              </div>
            ) : (
              <div className="chat-message-assistant">
                <div className="chat-message-header">
                  <Sparkles size={14} />
                  <span>AI Assistant</span>
                </div>
                <div className="chat-message-content">
                  <p dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />

                  {message.recommendation && (
                    <div className="chat-recommendation">
                      <div className="recommendation-label">RECOMMENDATION</div>
                      <div className="recommendation-action">
                        <span>{message.recommendation}</span>
                        <span className="recommendation-arrow">→</span>
                      </div>
                    </div>
                  )}

                  {message.source && (
                    <div className="chat-source">
                      Source: {message.source}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-message assistant">
            <div className="chat-message-assistant">
              <div className="chat-message-header">
                <Sparkles size={14} />
                <span>AI is analyzing stock levels...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <form className="chat-input-container" onSubmit={handleSubmit}>
          <button type="button" className="chat-attach-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            placeholder="Ask about your data..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button type="submit" className="chat-send-btn" disabled={!inputValue.trim()}>
            <Send size={18} />
          </button>
        </form>

        <div className="chat-quick-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="quick-prompt-btn"
              onClick={() => handleQuickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .chat-panel {
          width: 380px;
          min-width: 380px;
          background-color: var(--color-bg-secondary);
          border-left: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          border-bottom: 1px solid var(--color-border);
          background-color: var(--color-bg-primary);
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .chat-header-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-cyan));
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .chat-header-info {
          display: flex;
          flex-direction: column;
        }

        .chat-header-title {
          font-size: var(--font-size-base);
          font-weight: 600;
          color: var(--color-text-primary);
        }

        .chat-header-status {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-accent-green);
          font-weight: 500;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background-color: var(--color-accent-green);
          border-radius: 50%;
        }

        .chat-close-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .chat-close-btn:hover {
          background-color: var(--color-bg-tertiary);
          color: var(--color-text-primary);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .chat-date-divider {
          display: flex;
          justify-content: center;
          margin: var(--spacing-sm) 0;
        }

        .chat-date-divider span {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          background-color: var(--color-bg-tertiary);
          padding: var(--spacing-xs) var(--spacing-md);
          border-radius: var(--radius-full);
        }

        .chat-message {
          display: flex;
          flex-direction: column;
        }

        .chat-message-bubble.user {
          align-self: flex-end;
          background-color: var(--color-accent-blue);
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-lg);
          border-bottom-right-radius: var(--radius-sm);
          max-width: 85%;
          font-size: var(--font-size-sm);
          line-height: var(--line-height-relaxed);
        }

        .chat-message-assistant {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .chat-message-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-accent-blue);
          font-weight: 500;
        }

        .chat-message-content {
          background-color: var(--color-bg-tertiary);
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          border-top-left-radius: var(--radius-sm);
        }

        .chat-message-content p {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          line-height: var(--line-height-relaxed);
          margin: 0;
        }

        .chat-message-content strong {
          color: var(--color-text-primary);
          font-weight: 600;
        }

        .chat-recommendation {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .recommendation-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--spacing-xs);
        }

        .recommendation-action {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          font-weight: 500;
        }

        .recommendation-arrow {
          color: var(--color-text-muted);
        }

        .chat-source {
          margin-top: var(--spacing-md);
          font-size: var(--font-size-xs);
          color: var(--color-text-muted);
        }

        .chat-footer {
          border-top: 1px solid var(--color-border);
          background-color: var(--color-bg-primary);
          padding: var(--spacing-md) var(--spacing-lg);
        }

        .chat-input-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          background-color: var(--color-bg-tertiary);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: var(--spacing-xs) var(--spacing-sm);
        }

        .chat-attach-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .chat-attach-btn:hover {
          color: var(--color-text-primary);
          background-color: var(--color-bg-hover);
        }

        .chat-input {
          flex: 1;
          padding: var(--spacing-sm);
          background: transparent;
          border: none;
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }

        .chat-input:focus {
          outline: none;
        }

        .chat-input::placeholder {
          color: var(--color-text-muted);
        }

        .chat-send-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--color-accent-blue);
          color: white;
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .chat-send-btn:hover:not(:disabled) {
          background-color: var(--color-accent-blue-hover);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .chat-quick-prompts {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
          flex-wrap: wrap;
        }

        .quick-prompt-btn {
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-xs);
          color: var(--color-accent-blue);
          background-color: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .quick-prompt-btn:hover {
          background-color: var(--color-bg-tertiary);
          border-color: var(--color-accent-blue);
        }
      `}</style>
    </div>
  );
}

export default AIChatPanel;
