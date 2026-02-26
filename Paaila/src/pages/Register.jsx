import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const data = await response.json();
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
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

      <div className="register-content">
        <div className="register-card">
          <div className="register-header">
            <h1 className="register-title">Create Account</h1>
            <p className="register-subtitle">Join Paaila to get started</p>
          </div>

          {error && <div className="register-error">{error}</div>}
          {success && <div className="register-success">{success}</div>}

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <p className="form-hint">At least 8 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>


            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

        </div>

        <div className="register-background-grid" />
      </div>
    </div>
  );
};

export default Register;
