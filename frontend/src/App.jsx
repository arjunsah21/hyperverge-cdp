import { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import AIChatPanel from './components/AIChatPanel';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';

// Create context for chat state
export const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

function App() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => setIsChatOpen(!isChatOpen);
    const openChat = () => setIsChatOpen(true);
    const closeChat = () => setIsChatOpen(false);

    return (
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
                            </Routes>
                        </div>
                    </div>
                    {isChatOpen && <AIChatPanel onClose={closeChat} />}
                </div>
            </Router>
        </ChatContext.Provider>
    );
}

export default App;
