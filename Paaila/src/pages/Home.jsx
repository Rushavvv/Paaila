import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../home.css';

const toSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, '-');

const RoadmapHome = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMessage, setSearchMessage] = useState('');
  const navigate = useNavigate();

  const allRoles = [
    { id: 1, title: 'Data Analyst',        slug: 'data-analyst',        icon: '📊', meta: 'Analytics · SQL · Python'     },
    { id: 2, title: 'Frontend Developer',  slug: 'frontend-developer',  icon: '💻', meta: 'React · CSS · JavaScript'      },
    { id: 3, title: 'Backend Developer',   slug: 'backend-developer',   icon: '⚙️', meta: 'Node · APIs · Databases'       },
    { id: 4, title: 'Software Engineer',   slug: 'software-engineer',   icon: '🚀', meta: 'Systems · DSA · Architecture'  },
    { id: 5, title: 'DevOps Engineer',     slug: 'devops-engineer',     icon: '🔧', meta: 'CI/CD · Docker · Cloud'        },
    { id: 6, title: 'Machine Learning Engineer', slug: 'machine-learning-engineer', icon: '🤖', meta: 'ML · Python · TensorFlow' },
    { id: 7, title: 'UI/UX Designer',      slug: 'ui-ux-designer',      icon: '🎨', meta: 'Figma · Wireframes · Prototyping'  },
    { id: 8, title: 'Full Stack Developer',slug: 'full-stack-developer',icon: '🌐', meta: 'React · Node · Databases'          },
    { id: 9, title: 'Cybersecurity Analyst',slug: 'cybersecurity-analyst',icon: '🔒', meta: 'Security · Networks · Pentesting'  },
  ];

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const [randomRoles] = useState(() => shuffle(allRoles).slice(0, 4));

  const allSearchableRoles = allRoles;

  const handleRoleClick = (roleTitle) => {
    const role = allRoles.find(r => r.title === roleTitle);
    const slug = role ? role.slug : toSlug(roleTitle);
    navigate(`/roadmap/${slug}`);
  };

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const matchedRoles = trimmedQuery
    ? allSearchableRoles.filter((role) => {
        const haystack = `${role.title} ${role.meta}`.toLowerCase();
        return haystack.includes(trimmedQuery);
      })
    : [];

  const handleSuggestionClick = (roleTitle) => {
    setSearchQuery(roleTitle);
    setSearchMessage('');
    handleRoleClick(roleTitle);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setSearchMessage('Type a role or skill to search.');
      return;
    }

    if (matchedRoles.length > 0) {
      setSearchMessage('');
      const role = allRoles.find(r => r.title === matchedRoles[0].title);
      const slug = role ? role.slug : toSlug(matchedRoles[0].title);
      navigate(`/roadmap/${slug}`);
      return;
    }

    setSearchMessage(`No roadmap found for "${searchQuery.trim()}". Try roles like Frontend Developer, DevOps Engineer, or Cybersecurity Analyst.`);
  };

  return (
    <div className="roadmap-container">

      {/* Ambient background layers */}
      <div className="bg-grid" />
      <div className="bg-glow" />

      {/* ── Navigation ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">
              Paaila
            </span>
          </div>
          <div className="menu-links">
            <a href="/home"                          className="menu-link active">Home</a>
            <a href="http://localhost:5173/chat"           className="menu-link">PDF Chatbot</a>
            <a href="http://localhost:5173/resume-parser"  className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <div className="main-content">

        {/* Header */}
        <div className="header-section">
          <span className="header-eyebrow">AI-Powered Career Intelligence</span>
          <h1 className="main-title">
            Career Roadmap<br />
            <span className="title-accent">Generator</span>
          </h1>
          <p className="main-description">
            Discover your path to success with AI-powered career roadmaps tailored to your goals.
            Choose your desired role and get a comprehensive learning plan with resources,
            milestones, and guidance.
          </p>
        </div>

        {/* Search */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (searchMessage) {
                  setSearchMessage('');
                }
              }}
              placeholder="Search for a career path or skill..."
              className="search-input"
              autoComplete="off"
            />
            <button type="submit" className="search-button">
              Search
            </button>

            {matchedRoles.length > 0 && (
              <div className="search-dropdown">
                {matchedRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className="search-suggestion"
                    onMouseDown={() => handleSuggestionClick(role.title)}
                  >
                    <span className="search-suggestion-title">{role.title}</span>
                    <span className="search-suggestion-meta">{role.meta}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
          {searchMessage && <p className="search-message">{searchMessage}</p>}
        </div>

        {/* Role Cards */}
        <div className="roles-wrapper">
          <p className="section-label">Choose a career path</p>
          <div className="roles-grid">
            {randomRoles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role.title)}
                className="role-card"
              >
                <div className="role-card-content">
                  <div className="role-icon-wrapper">
                    <span className="role-icon">{role.icon}</span>
                  </div>
                  <h3 className="role-title">{role.title}</h3>
                  <p className="role-meta">
                    <span className="role-meta-dot" />
                    {role.meta}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="info-section">
          <h2 className="info-title">How It Works</h2>
          <div className="info-content">
            {[
              { n: '01', text: 'Select your desired career path from the options above or search for a specific role.' },
              { n: '02', text: 'Get a personalized roadmap with learning resources, projects, and milestones.' },
              { n: '03', text: 'Track your progress and adjust your learning path as you grow.' },
              { n: '04', text: 'Access curated resources, tutorials, and industry insights for your chosen field.' },
            ].map(({ n, text }) => (
              <div key={n} className="info-item">
                <span className="info-number">{n}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <footer className="footer">
        <div className="footer-content">
          <span className="footer-logo">Paaila</span>
          <span className="footer-divider" />
          <span className="footer-text">© 2026 Paaila. All rights reserved.</span>
        </div>
      </footer>
    </div>
  
  );

};

export default RoadmapHome;