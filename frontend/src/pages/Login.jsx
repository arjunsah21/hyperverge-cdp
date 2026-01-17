import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import api from "../services/api";
import { Eye, EyeOff, Zap, Sun, Moon } from 'lucide-react';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--color-bg-primary);
  font-family: 'Inter', sans-serif;
  color: var(--color-text-primary);
  position: relative;
`;

const Card = styled.div`
  background: var(--color-bg-card);
  padding: 3rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
  border: 1px solid var(--color-border);
`;

const Title = styled.h2`
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.025em;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  outline: none;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 0.875rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 0.5rem;
  font-size: 1rem;

  &:hover {
    opacity: 0.95;
  }
  
  &:disabled {
    background: #475569;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ThemeToggle = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--color-bg-hover);
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: 0.375rem;
`;

const SuccessMessage = styled.div`
  color: #22c55e;
  font-size: 0.875rem;
  text-align: center;
  background: rgba(34, 197, 94, 0.1);
  padding: 0.5rem;
  border-radius: 0.375rem;
`;

const LinkText = styled.p`
    color: #94a3b8;
    text-align: center;
    font-size: 0.875rem;
    margin-top: 1.5rem;
    
    span {
        color: #3b82f6;
        cursor: pointer;
        font-weight: 500;
        transition: color 0.15s;
        &:hover { color: #60a5fa; text-decoration: underline; }
    }
`;

const PasswordWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  
  &:hover {
    color: #fff;
  }
`;


// ... (other imports and styles)

const Login = () => {
  // Modes: 'login', 'register', 'verify', 'forgot', 'reset'
  const [mode, setMode] = useState('login');
  // ... states

  // ... hooks
  const { theme, toggleTheme } = useTheme();

  // ... (rest of logic)

  return (
    <Container>
      <ThemeToggle onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </ThemeToggle>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Zap size={24} color="#3b82f6" />
          <span style={{ color: 'var(--color-text-primary)', fontWeight: '600', fontSize: '1.25rem' }}>HyperVerge</span>
        </div>
        <Title>{getTitle()}</Title>
        <Form onSubmit={handleSubmit}>
          {/* NAME FIELDS for Registration */}
          {mode === 'register' && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <FormGroup style={{ flex: 1 }}>
                <Label>First Name</Label>
                <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </FormGroup>
              <FormGroup style={{ flex: 1 }}>
                <Label>Last Name</Label>
                <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </FormGroup>
            </div>
          )}

          {/* EMAIL FIELD - Always visible except maybe... no always needed */}
          <FormGroup>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormGroup>

          {/* PASSWORD FIELD - Login, Register, Reset */}
          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <FormGroup>
              <Label>{mode === 'reset' ? 'New Password' : 'Password'}</Label>
              <PasswordWrapper>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </PasswordToggle>
              </PasswordWrapper>
            </FormGroup>
          )}

          {/* CODE FIELD - Verify, Reset */}
          {(mode === 'verify' || mode === 'reset') && (
            <FormGroup>
              <Label>Verification Code</Label>
              <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter 6-digit code" required />
            </FormGroup>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {success && <SuccessMessage>{success}</SuccessMessage>}

          <Button type="submit" disabled={loading}>
            {loading ? "Processing..." : (
              mode === 'login' ? "Sign In" :
                mode === 'register' ? "Sign Up" :
                  mode === 'verify' ? "Verify" :
                    mode === 'forgot' ? "Send Code" : "Reset Password"
            )}
          </Button>
        </Form>

        {/* FOOTER LINKS */}
        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          {mode === 'login' && (
            <>
              <LinkText>
                Don't have an account? <span onClick={() => { setMode('register'); clearMessages(); }}>Sign Up</span>
              </LinkText>
              <LinkText style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                <span onClick={() => { setMode('forgot'); clearMessages(); }}>Forgot Password?</span>
              </LinkText>
            </>
          )}

          {mode === 'register' && (
            <LinkText>
              Already have an account? <span onClick={() => { setMode('login'); clearMessages(); }}>Sign In</span>
            </LinkText>
          )}

          {(mode === 'verify' || mode === 'forgot' || mode === 'reset') && (
            <LinkText>
              <span onClick={() => { setMode('login'); clearMessages(); }}>Back to Login</span>
            </LinkText>
          )}
        </div>

      </Card>
    </Container>
  );
};

export default Login;
