import { useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
                <AuthProvider>
                    <Router>
                        <AppContent
                            isChatOpen={isChatOpen}
                            closeChat={closeChat}
                        />
                    </Router>
                </AuthProvider>
            </ChatContext.Provider>
        </ThemeContext.Provider>
    );
}

// Separate component to use AuthContext
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const AppContent = ({ isChatOpen, closeChat }) => {
    const { user } = useAuth();
    const location = useLocation();

    // Don't show sidebar/header on login page
    if (location.pathname === '/login') {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    return (
        <div className={`app-container ${isChatOpen ? 'chat-open' : ''}`}>
            {user && <Sidebar />}
            <div className="main-content">
                {user && <Header />}
                <div className="page-content">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                        <Route path="/segments" element={<ProtectedRoute><Segments /></ProtectedRoute>} />
                        <Route path="/flows" element={<ProtectedRoute><Flows /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
                    </Routes>
                </div>
            </div>
            {isChatOpen && <AIChatPanel onClose={closeChat} />}
        </div>
    );
};

export default App;
