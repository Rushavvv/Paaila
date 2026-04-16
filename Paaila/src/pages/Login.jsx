
// Import React and hooks for state management
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ENDPOINTS, buildBackendUrl } from '../config/api';
import { normalizeEmail, validateEmail } from '../utils/validation';
// Import the CSS file for styling
import '../login.css';

// Login component handles user authentication UI and logic
const Login = () => {
  const LOGIN_MESSAGES = {
    emptyBoth: 'Please enter both email and password to continue.',
    invalidEmail: 'The email format is invalid. Please use a valid email like user@example.com.',
    emptyPassword: 'Password cannot be empty. Please enter your password.',
    wrongPassword: 'The password is incorrect for this account.',
    emailNotFound: 'No account was found for this email address.',
    emailWhitespace: 'Please remove leading or trailing spaces from your email address.',
    success: 'Success',
    genericAuth: 'Invalid email or password',
  };

  // State variables for form fields and UI feedback
  const [email, setEmail] = useState(''); // User email input
  const [password, setPassword] = useState(''); // User password input
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [error, setError] = useState(''); // Error message display
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const navigate = useNavigate(); // Navigation hook
  const location = useLocation(); // Get location state for redirects

  // Check for authentication/session errors from protected route redirects
  useEffect(() => {
    const state = location.state;
    if (state?.sessionExpired) {
      setError('Your session has expired. Please log in again.');
    } else if (state?.noAuth) {
      setError('Authentication required. Please log in to access this page.');
    }
  }, [location.state]);

  // Handle form submission for login
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form reload
    setLoading(true);
    setError('');
    setSuccess('');

    const rawEmail = String(email || '');
    const trimmedEmail = rawEmail.trim();
    const rawPassword = String(password || '');

    if (!rawEmail && !rawPassword) {
      setFieldErrors({ email: LOGIN_MESSAGES.emptyBoth, password: LOGIN_MESSAGES.emptyBoth });
      setError(LOGIN_MESSAGES.emptyBoth);
      setLoading(false);
      return;
    }

    if (rawEmail && rawEmail !== trimmedEmail) {
      setFieldErrors((prev) => ({ ...prev, email: LOGIN_MESSAGES.emailWhitespace }));
      setError(LOGIN_MESSAGES.emailWhitespace);
      setLoading(false);
      return;
    }

    if (!trimmedEmail || validateEmail(trimmedEmail)) {
      setFieldErrors((prev) => ({ ...prev, email: LOGIN_MESSAGES.invalidEmail }));
      setError(LOGIN_MESSAGES.invalidEmail);
      setLoading(false);
      return;
    }

    if (!rawPassword.trim()) {
      setFieldErrors((prev) => ({ ...prev, password: LOGIN_MESSAGES.emptyPassword }));
      setError(LOGIN_MESSAGES.emptyPassword);
      setLoading(false);
      return;
    }

    const nextErrors = {
      email: '',
      password: '',
    };
    setFieldErrors(nextErrors);

    try {
      // Send login request to backend API
      const response = await fetch(buildBackendUrl(ENDPOINTS.API_LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizeEmail(trimmedEmail), password: rawPassword }),
      });

      if (response.ok) {
        // On success, store token and redirect user
        const data = await response.json();
        localStorage.setItem('token', data.token);
        const userType = (data?.user?.userType || '').toLowerCase();
        localStorage.setItem('userType', userType);
        setSuccess(LOGIN_MESSAGES.success);
        // Determine user type and navigate accordingly
        setTimeout(() => {
          navigate(userType === 'admin' ? '/admin' : '/home', { replace: true });
        }, 150);
      } else {
        const data = await response.json().catch(() => ({}));
        const detail = data?.detail || '';

        if (response.status === 401 && detail === 'Incorrect password') {
          setError(LOGIN_MESSAGES.wrongPassword);
        } else if (response.status === 401 && detail === 'Email not registered') {
          setError(LOGIN_MESSAGES.emailNotFound);
        } else if (response.status === 422 && detail) {
          setError(typeof detail === 'string' ? detail : 'Validation failed. Please check your input.');
        } else {
          setError(LOGIN_MESSAGES.genericAuth);
        }
      }
    } catch (err) {
      // Show error for network or server issues
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render the login form and UI
  return (
    <div className="login-container">
      {/* Main login content area */}
      <div className="login-content">
        <div className="login-card">
          {/* Header with title and subtitle */}
          <div className="login-header">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your Paaila account</p>
          </div>

          {/* Error message display */}
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  let message = '';
                  if (value && value !== value.trim()) {
                    message = LOGIN_MESSAGES.emailWhitespace;
                  } else if (value && validateEmail(value)) {
                    message = LOGIN_MESSAGES.invalidEmail;
                  }
                  setFieldErrors((prev) => ({ ...prev, email: message }));
                }}
              />
              {fieldErrors.email && <p className="form-hint">{fieldErrors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  setFieldErrors((prev) => ({ ...prev, password: value.trim() ? '' : LOGIN_MESSAGES.emptyPassword }));
                }}
              />
              {fieldErrors.password && <p className="form-hint">{fieldErrors.password}</p>}
            </div>

            {/* Submit button, shows loading state when submitting */}
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer with registration link */}
          <div className="login-footer">
            <p>Don't have an account? <a href="/register" className="register-link">Sign up</a></p>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="login-background-grid" />
      </div>
    </div>
  );
};

// Export the Login component as default
export default Login;
