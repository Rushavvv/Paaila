import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import HomePage from './HomePage';
import './paaila.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Show loading spinner
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // If user is logged in, show home page
  if (user) {
    return <HomePage />;
  }

  // If not logged in, show login or register page
  if (showRegister) {
    return (
      <RegisterPage 
        onSwitchToLogin={() => setShowRegister(false)} 
      />
    );
  }

  return (
    <LoginPage 
      onSwitchToRegister={() => setShowRegister(true)} 
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;