// Import React and hooks for state management
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS, buildBackendUrl } from '../config/api';
import { normalizeEmail, sanitizeText, validateEmail, validateName, validatePassword, validatePhone } from '../utils/validation';
// Import the CSS file for styling
import '../register.css';

// Register component handles user registration UI and logic
const Register = () => {
  // State for form fields and UI feedback
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false); // Loading state for submit button
  const [error, setError] = useState(''); // Error message display
  const [success, setSuccess] = useState(''); // Success message display
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate(); // Navigation hook

  const validateField = (name, value, nextState = formData) => {
    if (name === 'first_name') return validateName(value, 'First name');
    if (name === 'last_name') return validateName(value, 'Last name');
    if (name === 'phone_number') return validatePhone(value);
    if (name === 'email') return validateEmail(value);
    if (name === 'password') return validatePassword(value);
    if (name === 'confirmPassword') {
      return String(value) === String(nextState.password) ? '' : 'Passwords do not match';
    }
    return '';
  };

  const validateForm = () => {
    const nextErrors = {
      first_name: validateField('first_name', formData.first_name),
      last_name: validateField('last_name', formData.last_name),
      phone_number: validateField('phone_number', formData.phone_number),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    setFieldErrors(nextErrors);
    return nextErrors;
  };

  // Handle input changes for all form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextState = {
      ...formData,
      [name]: value,
    };
    setFormData(nextState);
    const message = validateField(name, value, nextState);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: message,
      ...(name === 'password' ? { confirmPassword: validateField('confirmPassword', nextState.confirmPassword, nextState) } : {}),
    }));
  };

  // Handle form submission for registration
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form reload
    setError('');
    setSuccess('');

    const nextErrors = validateForm();
    if (Object.values(nextErrors).some(Boolean)) {
      const firstError = Object.values(nextErrors).find(Boolean) || 'Please fix validation errors before submitting';
      setError(firstError);
      return;
    }

    setLoading(true);

    try {
      // Send registration request to backend API
      const response = await fetch(buildBackendUrl(ENDPOINTS.API_REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: sanitizeText(formData.first_name),
          last_name: sanitizeText(formData.last_name),
          phone_number: sanitizeText(formData.phone_number),
          email: normalizeEmail(formData.email),
          password: formData.password,
        }),
      });

      if (response.ok) {
        // On success, show message and redirect to login
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // Show error from backend or generic error
        const data = await response.json();
        setError(data.detail || 'Registration failed');
      }
    } catch (err) {
      // Show error for network or server issues
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render the registration form and UI
  return (
    <div className="register-container">
      {/* Main register content area */}
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
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-input"
                placeholder="John"
                onChange={handleChange}
                value={formData.first_name}
                required
              />
              {fieldErrors.first_name && <p className="form-hint">{fieldErrors.first_name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-input"
                placeholder="Doe"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
              {fieldErrors.last_name && <p className="form-hint">{fieldErrors.last_name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="phone_number" className="form-label">Phone Number</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                className="form-input"
                placeholder="9841111111"
                value={formData.phone_number}
                onChange={handleChange}
                required
              />
              {fieldErrors.phone_number && <p className="form-hint">{fieldErrors.phone_number}</p>}
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
              {fieldErrors.email && <p className="form-hint">{fieldErrors.email}</p>}
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
              <p className="form-hint">At least 8 characters, with upper/lowercase and a number</p>
              {fieldErrors.password && <p className="form-hint">{fieldErrors.password}</p>}
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
              {fieldErrors.confirmPassword && <p className="form-hint">{fieldErrors.confirmPassword}</p>}
            </div>


            <button type="submit" className="register-btn" disabled={loading || Object.values(fieldErrors).some(Boolean)}>
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
