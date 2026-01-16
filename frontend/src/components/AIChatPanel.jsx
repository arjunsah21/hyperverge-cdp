import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import '../styles/components/AIChatPanel.css';

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


    </div>
  );
}

export default AIChatPanel;
