import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../roadmap.css';


const roadmapData = {
  'frontend-developer': {
    title: 'Frontend Developer',
    icon: '💻',
    description: 'Step by step guide to becoming a modern frontend developer',
    nodes: [
      {
        id: 'internet',
        label: 'Internet',
        children: [
          'How does the internet work?',
          'What is HTTP?',
          'What is Domain Name?',
          'What is Hosting?',
          'DNS and how it works?',
          'Browsers and how they work?',
        ],
      },
      { id: 'html', label: 'HTML', side: [], children: [] },
      { id: 'css', label: 'CSS', side: [], children: [] },
      { id: 'javascript', label: 'JavaScript', side: [], children: [] },
      {
        id: 'vcs',
        label: 'Version Control',
        side: ['Git'],
        children: [],
      },
      {
        id: 'vcshosting',
        label: 'VCS Hosting',
        side: ['GitHub', 'GitLab', 'Bitbucket'],
        children: [],
      },
      {
        id: 'pkgmanagers',
        label: 'Package Managers',
        side: [],
        children: ['npm', 'yarn', 'pnpm', 'Bun'],
      },
      {
        id: 'framework',
        label: 'Pick a Framework',
        side: ['React', 'Vue.js', 'Angular', 'Svelte'],
        children: [],
      },
      {
        id: 'cssframeworks',
        label: 'CSS Frameworks',
        side: [],
        children: ['Tailwind CSS', 'Bootstrap', 'Bulma', 'Material UI'],
      },
      {
        id: 'testing',
        label: 'Testing',
        side: [],
        children: ['Jest', 'Vitest', 'Playwright', 'Cypress'],
      },
      { id: 'typescript', label: 'TypeScript', side: [], children: [] },
      {
        id: 'build',
        label: 'Build Tools',
        side: [],
        children: ['Vite', 'Webpack', 'esbuild', 'Rollup'],
      },
      {
        id: 'perf',
        label: 'Web Performance',
        side: [],
        children: ['Core Web Vitals', 'Lighthouse', 'Lazy Loading', 'Code Splitting'],
      },
    ],
  },

  'backend-developer': {
    title: 'Backend Developer',
    icon: '⚙️',
    description: 'Step by step guide to becoming a backend developer',
    nodes: [
      {
        id: 'lang',
        label: 'Pick a Language',
        side: [],
        children: ['Node.js', 'Python', 'Go', 'Java', 'Rust', 'PHP'],
      },
      {
        id: 'os',
        label: 'OS & General Knowledge',
        side: [],
        children: ['Linux Basics', 'Terminal Usage', 'Networking', 'SSH'],
      },
      {
        id: 'db',
        label: 'Databases',
        side: ['PostgreSQL', 'MySQL', 'SQLite'],
        children: ['MongoDB', 'Redis', 'Firebase'],
      },
      {
        id: 'api',
        label: 'APIs',
        side: [],
        children: ['REST', 'GraphQL', 'gRPC', 'WebSockets'],
      },
      {
        id: 'auth',
        label: 'Authentication',
        side: [],
        children: ['JWT', 'OAuth 2.0', 'Session-based', 'API Keys'],
      },
      {
        id: 'cache',
        label: 'Caching',
        side: [],
        children: ['Redis', 'Memcached', 'CDN', 'HTTP Caching'],
      },
      {
        id: 'security',
        label: 'Web Security',
        side: [],
        children: ['HTTPS / TLS', 'CORS', 'SQL Injection', 'XSS', 'CSRF'],
      },
      {
        id: 'testing',
        label: 'Testing',
        side: [],
        children: ['Unit Tests', 'Integration Tests', 'E2E Tests'],
      },
      {
        id: 'deploy',
        label: 'Deployment',
        side: ['AWS', 'Google Cloud', 'Azure'],
        children: ['Docker', 'Kubernetes', 'CI/CD'],
      },
    ],
  },

  'data-analyst': {
    title: 'Data Analyst',
    icon: '📊',
    description: 'Step by step guide to becoming a data analyst',
    nodes: [
      {
        id: 'excel',
        label: 'Spreadsheets',
        side: [],
        children: ['Microsoft Excel', 'Google Sheets', 'Pivot Tables', 'VLOOKUP / INDEX-MATCH'],
      },
      {
        id: 'sql',
        label: 'SQL & Databases',
        side: [],
        children: ['SELECT, WHERE, JOIN', 'Aggregations', 'Subqueries', 'PostgreSQL', 'MySQL'],
      },
      {
        id: 'python',
        label: 'Python for Data',
        side: [],
        children: ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter Notebooks'],
      },
      {
        id: 'stats',
        label: 'Statistics & Math',
        side: [],
        children: ['Descriptive Statistics', 'Probability', 'Hypothesis Testing', 'Regression'],
      },
      {
        id: 'viz',
        label: 'Data Visualization',
        side: ['Tableau', 'Power BI'],
        children: ['Plotly', 'D3.js', 'Looker Studio'],
      },
      {
        id: 'etl',
        label: 'Data Wrangling / ETL',
        side: [],
        children: ['Data Cleaning', 'Data Pipelines', 'dbt', 'Apache Airflow'],
      },
      {
        id: 'cloud',
        label: 'Cloud & Big Data',
        side: [],
        children: ['BigQuery', 'AWS Redshift', 'Snowflake', 'Spark Basics'],
      },
      {
        id: 'ml',
        label: 'Intro to Machine Learning',
        side: [],
        children: ['Scikit-learn', 'Linear Regression', 'Classification', 'Clustering'],
      },
      {
        id: 'comm',
        label: 'Communication & Reporting',
        side: [],
        children: ['Storytelling with Data', 'Dashboard Design', 'Stakeholder Reports'],
      },
    ],
  },

  'software-engineer': {
    title: 'Software Engineer',
    icon: '🚀',
    description: 'Step by step guide to becoming a software engineer',
    nodes: [
      {
        id: 'dsa',
        label: 'Data Structures & Algorithms',
        side: [],
        children: ['Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Sorting & Searching', 'Dynamic Programming'],
      },
      {
        id: 'lang',
        label: 'Programming Language',
        side: [],
        children: ['Python', 'Java', 'C++', 'JavaScript', 'Go'],
      },
      {
        id: 'oop',
        label: 'OOP & Design Patterns',
        side: [],
        children: ['SOLID Principles', 'Creational Patterns', 'Structural Patterns', 'Behavioral Patterns'],
      },
      {
        id: 'vcs',
        label: 'Version Control',
        side: ['Git', 'GitHub', 'GitLab'],
        children: [],
      },
      {
        id: 'os',
        label: 'OS & Systems',
        side: [],
        children: ['Processes & Threads', 'Memory Management', 'File Systems', 'Networking Basics'],
      },
      {
        id: 'db',
        label: 'Databases',
        side: [],
        children: ['SQL Fundamentals', 'NoSQL Concepts', 'ORMs', 'Indexing & Optimization'],
      },
      {
        id: 'api',
        label: 'APIs & Architecture',
        side: [],
        children: ['REST APIs', 'GraphQL', 'Microservices', 'Event-Driven Architecture'],
      },
      {
        id: 'testing',
        label: 'Testing',
        side: [],
        children: ['Unit Testing', 'TDD', 'Mocking', 'Code Coverage'],
      },
      {
        id: 'devops',
        label: 'DevOps Basics',
        side: ['AWS', 'GCP', 'Azure'],
        children: ['Docker', 'CI/CD', 'Linux', 'Monitoring'],
      },
      {
        id: 'system',
        label: 'System Design',
        side: [],
        children: ['Load Balancing', 'Caching Strategies', 'CAP Theorem', 'Database Sharding'],
      },
    ],
  },
};


export const toSlug = (title) =>
  title.toLowerCase().replace(/\s+/g, '-');


function Tag({ label, nodeId, side, index, done, onToggle }) {
  const key = side ? `${nodeId}-side-${index}` : `${nodeId}-child-${index}`;
  const checked = done[key];
  return (
    <button
      className={`rm-tag ${checked ? 'rm-tag--done' : ''}`}
      onClick={() => onToggle(key)}
      title="Click to mark complete"
    >
      {checked && <span className="rm-tag-check">✓</span>}
      {label}
    </button>
  );
}

function Node({ node, done, onToggle }) {
  const mainDone = done[node.id];
  return (
    <div className="rm-node-row">
      {/* Left side tags */}
      <div className="rm-tag-group rm-tag-group--left">
        {(node.side || []).map((label, i) => (
          <Tag key={i} label={label} nodeId={node.id} side index={i} done={done} onToggle={onToggle} />
        ))}
      </div>

      {/* Connector line (left) */}
      {(node.side || []).length > 0 && <div className="rm-hline rm-hline--left" />}

      {/* Main node */}
      <button
        className={`rm-main-node ${mainDone ? 'rm-main-node--done' : ''}`}
        onClick={() => onToggle(node.id)}
        title="Click to mark complete"
      >
        {mainDone && <span>✓ </span>}
        {node.label}
      </button>

      {/* Connector line (right) */}
      {(node.children || []).length > 0 && <div className="rm-hline rm-hline--right" />}

      {/* Right side tags */}
      <div className="rm-tag-group rm-tag-group--right">
        {(node.children || []).map((label, i) => (
          <Tag key={i} label={label} nodeId={node.id} index={i} done={done} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}


const RoadmapPage = () => {
  const { role } = useParams();           
  const navigate = useNavigate();
  const [done, setDone] = useState({});

  const data = roadmapData[role];

  if (!data) {
    return (
      <div className="rm-not-found">
        <h2>Roadmap not found</h2>
        <button className="rm-back-btn" onClick={() => navigate('/home')}>← Back to Home</button>
      </div>
    );
  }

  const toggle = (key) => setDone((d) => ({ ...d, [key]: !d[key] }));

  const allKeys = data.nodes.reduce((acc, n) => {
    acc.push(n.id);
    (n.children || []).forEach((_, i) => acc.push(`${n.id}-child-${i}`));
    (n.side || []).forEach((_, i) => acc.push(`${n.id}-side-${i}`));
    return acc;
  }, []);
  const completedCount = allKeys.filter((k) => done[k]).length;
  const pct = allKeys.length ? Math.round((completedCount / allKeys.length) * 100) : 0;

  return (
    <div className="rm-page">

      {/* Nav */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">Paaila</span>
          </div>
          <div className="menu-links">
            <a href="/home" className="menu-link">Home</a>
            <a href="http://localhost:5173/chat" className="menu-link">PDF Chatbot</a>
            <a href="http://localhost:5173/resume-parser" className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      {/* Page header */}
      <div className="rm-header">
        <button className="rm-back-btn" onClick={() => navigate('/home')}>
          ← Back
        </button>
        <div className="rm-title-block">
          <span className="rm-icon">{data.icon}</span>
          <div>
            <h1 className="rm-title">{data.title} Roadmap</h1>
            <p className="rm-subtitle">{data.description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="rm-progress-block">
          <span className="rm-progress-label">{completedCount} / {allKeys.length} completed</span>
          <div className="rm-progress-bar-track">
            <div className="rm-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="rm-progress-pct">{pct}%</span>
        </div>
      </div>

      {/* Roadmap content */}
      <div className="rm-content">
        <p className="rm-hint">Click any node or topic to mark it as complete</p>

        <div className="rm-chain">
          {data.nodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <Node node={node} done={done} onToggle={toggle} />
              {idx < data.nodes.length - 1 && (
                <div className="rm-vline-wrapper">
                  <div className="rm-vline" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;