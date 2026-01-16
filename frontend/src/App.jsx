import { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIChatPanel from './components/AIChatPanel';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Segments from './pages/Segments';
import Flows from './pages/Flows';

// Create context for chat state
// Create contexts
export const ChatContext = createContext();
export const ThemeContext = createContext();

export const useChatContext = () => useContext(ChatContext);
export const useTheme = () => useContext(ThemeContext);

function App() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [theme, setTheme] = useState('dark');

    const toggleChat = () => setIsChatOpen(!isChatOpen);
    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ChatContext.Provider value={{ isChatOpen, toggleChat, openChat, closeChat }}>
                <Router>
                    <div className={`app-container ${isChatOpen ? 'chat-open' : ''}`}>
                        <Sidebar />
                        <div className="main-content">
                            <Header />
                            <div className="page-content">
                                <Routes>
                                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/customers" element={<Customers />} />
                                    <Route path="/orders" element={<Orders />} />
                                    <Route path="/inventory" element={<Inventory />} />
                                    <Route path="/segments" element={<Segments />} />
                                    <Route path="/flows" element={<Flows />} />
                                </Routes>
                            </div>
                        </div>
                        {isChatOpen && <AIChatPanel onClose={closeChat} />}
                    </div>
                </Router>
            </ChatContext.Provider>
        </ThemeContext.Provider>
    );
}

export default App;
