import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../App";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";
import { Eye, EyeOff, Zap, Sun, Moon } from 'lucide-react';
import '../styles/pages/Login.css';

const Login = () => {
  // Modes: 'login', 'register', 'verify', 'forgot', 'reset'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const from = location.state?.from?.pathname || '/dashboard';

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome Back';
      case 'register': return 'Create Account';
      case 'verify': return 'Verify Email';
      case 'forgot': return 'Forgot Password';
      case 'reset': return 'Reset Password';
      default: return 'Welcome';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      if (mode === 'login') {
        await login(email, password);
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        await api.post('/auth/register', {
          email,
          password,
          first_name: firstName,
          last_name: lastName
        });
        setSuccess('Registration successful! Please check your email for verification code.');
        setMode('verify');
      } else if (mode === 'verify') {
        await api.post('/auth/verify', { email, code });
        setSuccess('Email verified! You can now sign in.');
        setMode('login');
      } else if (mode === 'forgot') {
        await api.post('/auth/forgot-password', { email });
        setSuccess('Password reset code sent to your email.');
        setMode('reset');
      } else if (mode === 'reset') {
        await api.post('/auth/reset-password', { email, code, new_password: password });
        setSuccess('Password reset successful! You can now sign in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button className="login-theme-toggle" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className="login-card">
        <div className="login-logo">
          <Zap size={24} color="#3b82f6" />
          <span className="login-logo-text">HyperVerge</span>
        </div>
        <h2 className="login-title">{getTitle()}</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          {/* NAME FIELDS for Registration */}
          {mode === 'register' && (
            <div className="login-form-row">
              <div className="login-form-group">
                <label className="login-label">First Name</label>
                <input className="login-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="login-form-group">
                <label className="login-label">Last Name</label>
                <input className="login-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          )}

          {/* EMAIL FIELD */}
          <div className="login-form-group">
            <label className="login-label">Email</label>
            <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          {/* PASSWORD FIELD - Login, Register, Reset */}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div className="login-form-group">
              <label className="login-label">{mode === 'reset' ? 'New Password' : 'Password'}</label>
              <div className="login-password-wrapper">
                <input
                  className="login-input has-toggle"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="login-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* CODE FIELD - Verify, Reset */}
          {(mode === 'verify' || mode === 'reset') && (
            <div className="login-form-group">
              <label className="login-label">Verification Code (6-digit)</label>
              <input
                className="login-input"
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(val);
                }}
                placeholder="123456"
                required
                maxLength={6}
                inputMode="numeric"
                pattern="\d{6}"
              />
            </div>
          )}

          {error && <div className="login-error-message">{error}</div>}
          {success && <div className="login-success-message">{success}</div>}

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Processing..." : (
              mode === 'login' ? "Sign In" :
                mode === 'register' ? "Sign Up" :
                  mode === 'verify' ? "Verify" :
                    mode === 'forgot' ? "Send Code" : "Reset Password"
            )}
          </button>
        </form>

        {/* FOOTER LINKS */}
        <div className="login-footer">
          {mode === 'login' && (
            <>
              <p className="login-link-text">
                Don't have an account? <span onClick={() => { setMode('register'); clearMessages(); }}>Sign Up</span>
              </p>
              <p className="login-link-text small">
                <span onClick={() => { setMode('forgot'); clearMessages(); }}>Forgot Password?</span>
              </p>
            </>
          )}

          {mode === 'register' && (
            <p className="login-link-text">
              Already have an account? <span onClick={() => { setMode('login'); clearMessages(); }}>Sign In</span>
            </p>
          )}

          {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <p className="login-link-text">
              <span onClick={() => { setMode('login'); clearMessages(); }}>Back to Login</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
