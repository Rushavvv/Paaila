import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">Paaila</span>
          </div>
          <div className="menu-links">
            <a href="/home" className="menu-link">Home</a>
            <a href="/chat" className="menu-link">PDF Chatbot</a>
            <a href="/resume-parser" className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your Paaila account</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-remember">
              <input type="checkbox" id="remember" className="checkbox" />
              <label htmlFor="remember" className="checkbox-label">Remember me</label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-divider">
            <span>or</span>
          </div>

          <div className="login-social">
            <button className="social-btn">
              <span>🔵</span> Google
            </button>
            <button className="social-btn">
              <span>🔗</span> LinkedIn
            </button>
          </div>

          <div className="login-footer">
            <p>Don't have an account? <a href="/register" className="register-link">Sign up</a></p>
          </div>
        </div>

        <div className="login-background-grid" />
      </div>
    </div>
  );
};

export default Login;
