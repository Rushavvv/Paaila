import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../roadmap.css';

// ─── Roadmap Data (unchanged) ─────────────────────────────────────────────────
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
      { id: 'html',       label: 'HTML',             side: [], children: [] },
      { id: 'css',        label: 'CSS',              side: [], children: [] },
      { id: 'javascript', label: 'JavaScript',       side: [], children: [] },
      { id: 'vcs',        label: 'Version Control',  side: ['Git'], children: [] },
      { id: 'vcshosting', label: 'VCS Hosting',      side: ['GitHub', 'GitLab', 'Bitbucket'], children: [] },
      { id: 'pkgmanagers',label: 'Package Managers', side: [], children: ['npm', 'yarn', 'pnpm', 'Bun'] },
      { id: 'framework',  label: 'Pick a Framework', side: ['React', 'Vue.js', 'Angular', 'Svelte'], children: [] },
      { id: 'cssframeworks', label: 'CSS Frameworks', side: [], children: ['Tailwind CSS', 'Bootstrap', 'Bulma', 'Material UI'] },
      { id: 'testing',    label: 'Testing',          side: [], children: ['Jest', 'Vitest', 'Playwright', 'Cypress'] },
      { id: 'typescript', label: 'TypeScript',       side: [], children: [] },
      { id: 'build',      label: 'Build Tools',      side: [], children: ['Vite', 'Webpack', 'esbuild', 'Rollup'] },
      { id: 'perf',       label: 'Web Performance',  side: [], children: ['Core Web Vitals', 'Lighthouse', 'Lazy Loading', 'Code Splitting'] },
    ],
  },

  'backend-developer': {
    title: 'Backend Developer',
    icon: '⚙️',
    description: 'Step by step guide to becoming a backend developer',
    nodes: [
      { id: 'lang',     label: 'Pick a Language',       side: [], children: ['Node.js', 'Python', 'Go', 'Java', 'Rust', 'PHP'] },
      { id: 'os',       label: 'OS & General Knowledge', side: [], children: ['Linux Basics', 'Terminal Usage', 'Networking', 'SSH'] },
      { id: 'db',       label: 'Databases',             side: ['PostgreSQL', 'MySQL', 'SQLite'], children: ['MongoDB', 'Redis', 'Firebase'] },
      { id: 'api',      label: 'APIs',                  side: [], children: ['REST', 'GraphQL', 'gRPC', 'WebSockets'] },
      { id: 'auth',     label: 'Authentication',        side: [], children: ['JWT', 'OAuth 2.0', 'Session-based', 'API Keys'] },
      { id: 'cache',    label: 'Caching',               side: [], children: ['Redis', 'Memcached', 'CDN', 'HTTP Caching'] },
      { id: 'security', label: 'Web Security',          side: [], children: ['HTTPS / TLS', 'CORS', 'SQL Injection', 'XSS', 'CSRF'] },
      { id: 'testing',  label: 'Testing',               side: [], children: ['Unit Tests', 'Integration Tests', 'E2E Tests'] },
      { id: 'deploy',   label: 'Deployment',            side: ['AWS', 'Google Cloud', 'Azure'], children: ['Docker', 'Kubernetes', 'CI/CD'] },
    ],
  },

  'data-analyst': {
    title: 'Data Analyst',
    icon: '📊',
    description: 'Step by step guide to becoming a data analyst',
    nodes: [
      { id: 'excel',  label: 'Spreadsheets',           side: [], children: ['Microsoft Excel', 'Google Sheets', 'Pivot Tables', 'VLOOKUP / INDEX-MATCH'] },
      { id: 'sql',    label: 'SQL & Databases',         side: [], children: ['SELECT, WHERE, JOIN', 'Aggregations', 'Subqueries', 'PostgreSQL', 'MySQL'] },
      { id: 'python', label: 'Python for Data',         side: [], children: ['Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Jupyter Notebooks'] },
      { id: 'stats',  label: 'Statistics & Math',       side: [], children: ['Descriptive Statistics', 'Probability', 'Hypothesis Testing', 'Regression'] },
      { id: 'viz',    label: 'Data Visualization',      side: ['Tableau', 'Power BI'], children: ['Plotly', 'D3.js', 'Looker Studio'] },
      { id: 'etl',    label: 'Data Wrangling / ETL',    side: [], children: ['Data Cleaning', 'Data Pipelines', 'dbt', 'Apache Airflow'] },
      { id: 'cloud',  label: 'Cloud & Big Data',        side: [], children: ['BigQuery', 'AWS Redshift', 'Snowflake', 'Spark Basics'] },
      { id: 'ml',     label: 'Intro to Machine Learning', side: [], children: ['Scikit-learn', 'Linear Regression', 'Classification', 'Clustering'] },
      { id: 'comm',   label: 'Communication & Reporting', side: [], children: ['Storytelling with Data', 'Dashboard Design', 'Stakeholder Reports'] },
    ],
  },

  'software-engineer': {
    title: 'Software Engineer',
    icon: '🚀',
    description: 'Step by step guide to becoming a software engineer',
    nodes: [
      { id: 'dsa',     label: 'Data Structures & Algorithms', side: [], children: ['Arrays & Strings', 'Linked Lists', 'Trees & Graphs', 'Sorting & Searching', 'Dynamic Programming'] },
      { id: 'lang',    label: 'Programming Language',        side: [], children: ['Python', 'Java', 'C++', 'JavaScript', 'Go'] },
      { id: 'oop',     label: 'OOP & Design Patterns',       side: [], children: ['SOLID Principles', 'Creational Patterns', 'Structural Patterns', 'Behavioral Patterns'] },
      { id: 'vcs',     label: 'Version Control',             side: ['Git', 'GitHub', 'GitLab'], children: [] },
      { id: 'os',      label: 'OS & Systems',                side: [], children: ['Processes & Threads', 'Memory Management', 'File Systems', 'Networking Basics'] },
      { id: 'db',      label: 'Databases',                   side: [], children: ['SQL Fundamentals', 'NoSQL Concepts', 'ORMs', 'Indexing & Optimization'] },
      { id: 'api',     label: 'APIs & Architecture',         side: [], children: ['REST APIs', 'GraphQL', 'Microservices', 'Event-Driven Architecture'] },
      { id: 'testing', label: 'Testing',                     side: [], children: ['Unit Testing', 'TDD', 'Mocking', 'Code Coverage'] },
      { id: 'devops',  label: 'DevOps Basics',               side: ['AWS', 'GCP', 'Azure'], children: ['Docker', 'CI/CD', 'Linux', 'Monitoring'] },
      { id: 'system',  label: 'System Design',               side: [], children: ['Load Balancing', 'Caching Strategies', 'CAP Theorem', 'Database Sharding'] },
    ],
  },

  'devops-engineer': {
    title: 'DevOps Engineer',
    icon: '🔧',
    description: 'Step by step guide to becoming a DevOps engineer',
    nodes: [
      { id: 'linux',     label: 'Linux & Shell',     side: [],                           children: ['Bash Scripting', 'File Permissions', 'Process Management', 'Networking Commands'] },
      { id: 'vcs',       label: 'Version Control',   side: ['Git', 'GitHub'],            children: [] },
      { id: 'ci',        label: 'CI/CD Pipelines',   side: ['Jenkins', 'GitHub Actions'],children: ['GitLab CI', 'CircleCI', 'ArgoCD'] },
      { id: 'container', label: 'Containers',        side: [],                           children: ['Docker', 'Docker Compose', 'Container Registries'] },
      { id: 'orch',      label: 'Orchestration',     side: [],                           children: ['Kubernetes', 'Helm', 'Service Mesh'] },
      { id: 'cloud',     label: 'Cloud Providers',   side: ['AWS', 'GCP', 'Azure'],      children: [] },
      { id: 'iac',       label: 'Infra as Code',     side: [],                           children: ['Terraform', 'Ansible', 'Pulumi'] },
      { id: 'monitor',   label: 'Monitoring & Logs', side: [],                           children: ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog'] },
      { id: 'security',  label: 'DevSecOps',         side: [],                           children: ['SAST/DAST', 'Secret Management', 'Vulnerability Scanning'] },
    ],
  },

  'machine-learning-engineer': {
    title: 'Machine Learning Engineer',
    icon: '🤖',
    description: 'Step by step guide to becoming a machine learning engineer',
    nodes: [
      { id: 'math',    label: 'Math Foundations',  side: [],                              children: ['Linear Algebra', 'Calculus', 'Probability & Statistics'] },
      { id: 'python',  label: 'Python for ML',     side: [],                              children: ['NumPy', 'Pandas', 'Matplotlib', 'Jupyter'] },
      { id: 'ml',      label: 'ML Fundamentals',   side: [],                              children: ['Supervised Learning', 'Unsupervised Learning', 'Evaluation Metrics', 'Cross Validation'] },
      { id: 'sklearn', label: 'Scikit-Learn',      side: [],                              children: ['Regression', 'Classification', 'Clustering', 'Pipelines'] },
      { id: 'dl',      label: 'Deep Learning',     side: ['TensorFlow', 'PyTorch'],       children: ['Neural Networks', 'CNNs', 'RNNs', 'Transformers'] },
      { id: 'nlp',     label: 'NLP',               side: [],                              children: ['Tokenization', 'Embeddings', 'LLMs', 'Fine-tuning'] },
      { id: 'mlops',   label: 'MLOps',             side: [],                              children: ['MLflow', 'Model Serving', 'Feature Stores', 'Monitoring'] },
      { id: 'cloud',   label: 'Cloud ML',          side: ['AWS SageMaker', 'Vertex AI'],  children: [] },
    ],
  },

  'ui-ux-designer': {
    title: 'UI/UX Designer',
    icon: '🎨',
    description: 'Step by step guide to becoming a UI/UX designer',
    nodes: [
      { id: 'basics', label: 'Design Fundamentals', side: [],                     children: ['Color Theory', 'Typography', 'Grid Systems', 'Visual Hierarchy'] },
      { id: 'ux',     label: 'UX Principles',       side: [],                     children: ['User Research', 'Personas', 'User Journeys', 'Information Architecture'] },
      { id: 'wire',   label: 'Wireframing',         side: [],                     children: ['Low-fidelity Mockups', 'User Flows', 'Sketching'] },
      { id: 'proto',  label: 'Prototyping',         side: ['Figma', 'Adobe XD'],  children: ['Interactive Prototypes', 'Micro-interactions', 'Handoff'] },
      { id: 'test',   label: 'Usability Testing',   side: [],                     children: ['A/B Testing', 'Heuristic Evaluation', 'User Interviews'] },
      { id: 'design', label: 'Design Systems',      side: [],                     children: ['Component Libraries', 'Tokens', 'Accessibility (WCAG)', 'Dark Mode'] },
      { id: 'motion', label: 'Motion Design',       side: [],                     children: ['Transitions', 'Lottie Animations', 'After Effects Basics'] },
    ],
  },

  'full-stack-developer': {
    title: 'Full Stack Developer',
    icon: '🌐',
    description: 'Step by step guide to becoming a full stack developer',
    nodes: [
      { id: 'html',     label: 'HTML & CSS',         side: [],                           children: ['Semantic HTML', 'Flexbox & Grid', 'Responsive Design', 'Animations'] },
      { id: 'js',       label: 'JavaScript',         side: [],                           children: ['ES6+', 'Async/Await', 'DOM Manipulation', 'Fetch API'] },
      { id: 'frontend', label: 'Frontend Framework', side: ['React', 'Vue', 'Angular'],  children: [] },
      { id: 'node',     label: 'Node.js & Backend',  side: [],                           children: ['Express', 'REST APIs', 'Middleware', 'Authentication'] },
      { id: 'db',       label: 'Databases',          side: ['PostgreSQL', 'MongoDB'],    children: ['SQL Queries', 'ORMs', 'Schema Design', 'Redis'] },
      { id: 'auth',     label: 'Auth & Security',    side: [],                           children: ['JWT', 'OAuth 2.0', 'HTTPS', 'Input Validation'] },
      { id: 'deploy',   label: 'Deployment',         side: ['Vercel', 'Railway', 'AWS'], children: ['Docker', 'CI/CD', 'Environment Variables'] },
      { id: 'ts',       label: 'TypeScript',         side: [],                           children: ['Types & Interfaces', 'Generics', 'Decorators'] },
    ],
  },

  'cybersecurity-analyst': {
    title: 'Cybersecurity Analyst',
    icon: '🔒',
    description: 'Step by step guide to becoming a cybersecurity analyst',
    nodes: [
      { id: 'net',     label: 'Networking',           side: [],                           children: ['TCP/IP', 'DNS & HTTP', 'Firewalls', 'VPNs', 'Wireshark'] },
      { id: 'os',      label: 'Operating Systems',    side: [],                           children: ['Linux CLI', 'Windows Security', 'File Permissions'] },
      { id: 'threats', label: 'Threat Landscape',     side: [],                           children: ['OWASP Top 10', 'Malware Types', 'Social Engineering', 'Phishing'] },
      { id: 'pentest', label: 'Penetration Testing',  side: ['Kali Linux', 'Metasploit'],children: ['Reconnaissance', 'Exploitation', 'Post-Exploitation', 'Reporting'] },
      { id: 'siem',    label: 'SIEM & Monitoring',    side: [],                           children: ['Splunk', 'ELK Stack', 'Log Analysis', 'Incident Response'] },
      { id: 'appsec',  label: 'Application Security', side: [],                           children: ['SQL Injection', 'XSS', 'CSRF', 'Secure Coding'] },
      { id: 'crypto',  label: 'Cryptography',         side: [],                           children: ['Symmetric & Asymmetric', 'TLS/SSL', 'Hashing', 'PKI'] },
      { id: 'certs',   label: 'Certifications',       side: ['CompTIA Security+', 'CEH'],children: ['OSCP', 'CISSP'] },
    ],
  },
};

export const toSlug = (title) => title.toLowerCase().replace(/\s+/g, '-');

// ─── Tag ─────────────────────────────────────────────────────────────────────
function Tag({ label, nodeId, side, index, done, onToggle }) {
  const key     = side ? `${nodeId}-side-${index}` : `${nodeId}-child-${index}`;
  const checked = done[key];
  return (
    <button
      className={`rm-tag${checked ? ' rm-tag--done' : ''}`}
      onClick={() => onToggle(key)}
      title="Click to mark complete"
    >
      {checked && <span className="rm-tag-check">✓</span>}
      {label}
    </button>
  );
}

// ─── Node row ─────────────────────────────────────────────────────────────────
function Node({ node, done, onToggle }) {
  const mainDone   = done[node.id];
  const hasSide    = (node.side    || []).length > 0;
  const hasChildren= (node.children|| []).length > 0;

  return (
    <div className="rm-node-row">
      {/* Left tags */}
      <div className="rm-tag-group rm-tag-group--left">
        {(node.side || []).map((label, i) => (
          <Tag key={i} label={label} nodeId={node.id} side index={i} done={done} onToggle={onToggle} />
        ))}
      </div>

      {/* Left connector */}
      {hasSide && <div className="rm-hline rm-hline--left" />}

      {/* Main node */}
      <button
        className={`rm-main-node${mainDone ? ' rm-main-node--done' : ''}`}
        onClick={() => onToggle(node.id)}
        title="Click to mark complete"
      >
        {mainDone && <span>✓ </span>}
        {node.label}
      </button>

      {/* Right connector */}
      {hasChildren && <div className="rm-hline rm-hline--right" />}

      {/* Right tags */}
      <div className="rm-tag-group rm-tag-group--right">
        {(node.children || []).map((label, i) => (
          <Tag key={i} label={label} nodeId={node.id} index={i} done={done} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

// ─── RoadmapPage ─────────────────────────────────────────────────────────────
const RoadmapPage = () => {
  const { role }    = useParams();
  const navigate    = useNavigate();
  const [done, setDone] = useState({});

  const data = roadmapData[role];

  if (!data) {
    return (
      <div className="rm-page">
        <div className="rm-not-found">
          <h2>Roadmap not found</h2>
          <button className="rm-back-btn" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const toggle = (key) => setDone((d) => {
    const next = !d[key];
    const updates = { [key]: next };

    // If the toggled key is a parent node id, cascade to all its children and side tags
    const parentNode = data.nodes.find((n) => n.id === key);
    if (parentNode) {
      (parentNode.children || []).forEach((_, i) => {
        updates[`${key}-child-${i}`] = next;
      });
      (parentNode.side || []).forEach((_, i) => {
        updates[`${key}-side-${i}`] = next;
      });
    }

    return { ...d, ...updates };
  });

  // Compute progress
  const allKeys = data.nodes.reduce((acc, n) => {
    acc.push(n.id);
    (n.children || []).forEach((_, i) => acc.push(`${n.id}-child-${i}`));
    (n.side     || []).forEach((_, i) => acc.push(`${n.id}-side-${i}`));
    return acc;
  }, []);
  const completedCount = allKeys.filter((k) => done[k]).length;
  const pct = allKeys.length ? Math.round((completedCount / allKeys.length) * 100) : 0;

  return (
    <div className="rm-page">

      {/* ── Navbar ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">
              Paai<span className="logo-accent">la</span>
            </span>
          </div>
          <div className="menu-links">
            <a href="/home"                                className="menu-link">Home</a>
            <a href="http://localhost:5173/chat"           className="menu-link">PDF Chatbot</a>
            <a href="http://localhost:5173/resume-parser"  className="menu-link">Resume Parser</a>
          </div>
        </div>
      </nav>

      {/* ── Sticky sub-header ── */}
      <div className="rm-header">
        <button className="rm-back-btn" onClick={() => navigate('/home')}>
          ← Back
        </button>

        <div className="rm-title-block">
          <div className="rm-icon-box">
            <span className="rm-icon">{data.icon}</span>
          </div>
          <div>
            <h1 className="rm-title">{data.title} Roadmap</h1>
            <p className="rm-subtitle">{data.description}</p>
          </div>
        </div>

        <div className="rm-progress-block">
          <span className="rm-progress-label">{completedCount} / {allKeys.length}</span>
          <div className="rm-progress-bar-track">
            <div className="rm-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="rm-progress-pct">{pct}%</span>
        </div>
      </div>

      {/* ── Content ── */}
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