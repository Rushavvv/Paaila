import React from 'react';
import { useAuth } from './AuthContext';

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="nav-content">
          <h2>My App</h2>
          <div className="nav-right">
            <span className="welcome-text">Welcome, {user?.username}!</span>
            <button onClick={logout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <h1>Welcome to Your Dashboard</h1>
          <p>You're successfully logged in!</p>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <h3>Profile Information</h3>
            <p><strong>Username:</strong> {user?.username}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Full Name:</strong> {user?.full_name || 'Not provided'}</p>
          </div>

          <div className="info-card">
            <h3>Quick Actions</h3>
            <p>Add your features here!</p>
            <button className="btn-primary">Get Started</button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;