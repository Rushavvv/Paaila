import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../home.css';

const RoadmapHome = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const roles = [
    { id: 1, title: 'Data Analyst', icon: '📊' },
    { id: 2, title: 'Frontend Developer', icon: '💻' },
    { id: 3, title: 'Backend Developer', icon: '⚙️' },
    { id: 4, title: 'Software Engineer', icon: '🚀' }
  ];

  const handleRoleClick = (roleTitle) => {
    console.log(`Selected role: ${roleTitle}`);
    const slug = roleTitle.toLowerCase().replace(/\s+/g, '-');
    navigate(`/roadmap/${slug}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log(`Searching for: ${searchQuery}`);
    // Add your search logic here
  };

  return (
    <div className="roadmap-container">
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">Career Roadmap</span>
          </div>
          <div className="menu-links">
            <a href="/" className="menu-link active">Home</a>
            <a href="http://localhost:5173/chat" className="menu-link">PDF Chatbot</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {/* Header Section */}
        <div className="header-section">
          <h1 className="main-title">
            Career Roadmap Generator
          </h1>
          <p className="main-description">
            Discover your path to success with AI-powered career roadmaps tailored to your goals. 
            Choose your desired role and get a comprehensive learning plan with resources, milestones, and guidance.
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a career path or skill..."
              className="search-input"
            />
            <button type="submit" className="search-button">
              Search
            </button>
          </form>
        </div>

        {/* Role Cards Grid */}
        <div className="roles-wrapper">
          <div className="roles-grid">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role.title)}
                className="role-card"
              >
                <div className="role-card-content">
                  <div className="role-icon">
                    {role.icon}
                  </div>
                  <h3 className="role-title">
                    {role.title}
                  </h3>
                  <div className="role-underline" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="info-section">
          <h2 className="info-title">How It Works</h2>
          <div className="info-content">
            <p className="info-item">
              <span className="info-number">1.</span>
              Select your desired career path from the options above or search for a specific role
            </p>
            <p className="info-item">
              <span className="info-number">2.</span>
              Get a personalized roadmap with learning resources, projects, and milestones
            </p>
            <p className="info-item">
              <span className="info-number">3.</span>
              Track your progress and adjust your learning path as you grow
            </p>
            <p className="info-item">
              <span className="info-number">4.</span>
              Access curated resources, tutorials, and industry insights for your chosen field
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapHome;