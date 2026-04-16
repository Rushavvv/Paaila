// RoadmapPage.jsx - Main roadmap UI for career tracks

import React, { useState } from 'react';
// React imports for state and routing
import { useParams, useNavigate } from 'react-router-dom';
import '../roadmap.css';
import UserMenu from '../components/UserMenu';
// Import roadmap-specific styles

// Static roadmap data for all supported roles
const ROADMAPS = {
    // Each role contains title, icon, duration, and phase breakdown
  'data-analyst': {
    title: 'Data Analyst',
    icon: '📊',
    weeks: 20,
    skills: 32,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Data Foundations',
        duration: 'Weeks 1 – 4',
        subtitle: 'Spreadsheets, SQL & Statistics',
        status: 'upcoming',
        skills: [
          { label: 'Excel / Google Sheets', status: 'upcoming' },
          { label: 'SQL Basics', status: 'upcoming' },
          { label: 'Descriptive Statistics', status: 'upcoming' },
          { label: 'Data Types & Cleaning', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Complete SQL 50 on LeetCode', status: 'pending' },
          { text: 'Clean a messy real-world dataset', status: 'pending' },
          { text: 'Build your first pivot-table dashboard', status: 'pending' },
        ],
        resources: [
          { label: 'Mode SQL Tutorial', type: 'article', url: 'https://mode.com/sql-tutorial' },
          { label: 'Statistics for Data Science', type: 'course', url: 'https://www.khanacademy.org/math/statistics-probability' },
          { label: 'Kaggle Learn – Intro to SQL', type: 'course', url: 'https://kaggle.com/learn/intro-to-sql' },
        ],
      },
      {
        num: 2,
        title: 'Python for Analysis',
        duration: 'Weeks 5 – 10',
        subtitle: 'Pandas, NumPy & Visualization',
        status: 'upcoming',
        skills: [
          { label: 'Python Basics', status: 'upcoming' },
          { label: 'Pandas', status: 'upcoming' },
          { label: 'NumPy', status: 'upcoming' },
          { label: 'Matplotlib / Seaborn', status: 'upcoming' },
          { label: 'Jupyter Notebooks', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Analyse a 100k-row dataset end-to-end', status: 'pending' },
          { text: 'Create 5 publication-quality charts', status: 'pending' },
          { text: 'Submit first Kaggle notebook', status: 'pending' },
        ],
        resources: [
          { label: 'Python for Data Analysis (book)', type: 'article', url: 'https://wesmckinney.com/book/' },
          { label: 'Kaggle Pandas Course', type: 'course', url: 'https://kaggle.com/learn/pandas' },
          { label: 'Seaborn Gallery', type: 'article', url: 'https://seaborn.pydata.org/examples.html' },
        ],
      },
      {
        num: 3,
        title: 'BI & Storytelling',
        duration: 'Weeks 11 – 16',
        subtitle: 'Dashboards & Business Insights',
        status: 'upcoming',
        skills: [
          { label: 'Tableau / Power BI', status: 'upcoming' },
          { label: 'KPI Design', status: 'upcoming' },
          { label: 'Data Storytelling', status: 'upcoming' },
          { label: 'Advanced SQL (CTEs, Window Fns)', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build an interactive Tableau dashboard', status: 'pending' },
          { text: 'Present insights to a non-technical audience', status: 'pending' },
          { text: 'Earn Tableau Desktop Specialist cert', status: 'pending' },
        ],
        resources: [
          { label: 'Storytelling with Data (book)', type: 'article', url: 'https://www.storytellingwithdata.com/' },
          { label: 'Tableau Public Gallery', type: 'project', url: 'https://public.tableau.com/' },
          { label: 'Advanced SQL – Mode', type: 'article', url: 'https://mode.com/sql-tutorial/advanced-sql' },
        ],
      },
      {
        num: 4,
        title: 'Portfolio & Job Launch',
        duration: 'Weeks 17 – 20',
        subtitle: 'Case Studies & Career Prep',
        status: 'upcoming',
        skills: [
          { label: 'Portfolio Projects', status: 'upcoming' },
          { label: 'Case Study Writing', status: 'upcoming' },
          { label: 'Interview Prep', status: 'upcoming' },
          { label: 'LinkedIn Optimization', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Publish 2 end-to-end analysis projects', status: 'pending' },
          { text: 'Complete 10 SQL interview challenges', status: 'pending' },
          { text: 'Send 20 tailored job applications', status: 'pending' },
        ],
        resources: [
          { label: 'Data Analyst Interview Guide', type: 'article', url: 'https://www.interviewquery.com/' },
          { label: 'StrataScratch SQL Practice', type: 'project', url: 'https://www.stratascratch.com/' },
          { label: 'Portfolio on GitHub Pages', type: 'project', url: 'https://pages.github.com/' },
        ],
      },
    ],
  },

  'frontend-developer': {
    title: 'Frontend Developer',
    icon: '💻',
    weeks: 22,
    skills: 36,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Web Fundamentals',
        duration: 'Weeks 1 – 5',
        subtitle: 'HTML, CSS & The Browser',
        status: 'upcoming',
        skills: [
          { label: 'HTML5 Semantics', status: 'upcoming' },
          { label: 'CSS3 & Flexbox', status: 'upcoming' },
          { label: 'CSS Grid', status: 'upcoming' },
          { label: 'Responsive Design', status: 'upcoming' },
          { label: 'Browser DevTools', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a pixel-perfect landing page from a Figma design', status: 'pending' },
          { text: 'Make a fully responsive multi-page site', status: 'pending' },
          { text: 'Pass CSS Grid & Flexbox challenges on Frontend Mentor', status: 'pending' },
        ],
        resources: [
          { label: 'MDN Web Docs', type: 'article', url: 'https://developer.mozilla.org' },
          { label: 'CSS Tricks – Complete Guide to Grid', type: 'article', url: 'https://css-tricks.com/snippets/css/complete-guide-grid' },
          { label: 'Frontend Mentor Challenges', type: 'project', url: 'https://www.frontendmentor.io' },
        ],
      },
      {
        num: 2,
        title: 'JavaScript Core',
        duration: 'Weeks 6 – 11',
        subtitle: 'ES6+, DOM & Async',
        status: 'upcoming',
        skills: [
          { label: 'ES6+ Syntax', status: 'upcoming' },
          { label: 'DOM Manipulation', status: 'upcoming' },
          { label: 'Fetch API & Promises', status: 'upcoming' },
          { label: 'Async / Await', status: 'upcoming' },
          { label: 'LocalStorage', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a weather app using a public API', status: 'pending' },
          { text: 'Create a to-do app with CRUD and persistence', status: 'pending' },
          { text: 'Complete JavaScript30 by Wes Bos', status: 'pending' },
        ],
        resources: [
          { label: 'JavaScript.info', type: 'article', url: 'https://javascript.info' },
          { label: 'JavaScript30', type: 'course', url: 'https://javascript30.com' },
          { label: 'Eloquent JavaScript', type: 'article', url: 'https://eloquentjavascript.net' },
        ],
      },
      {
        num: 3,
        title: 'React & Ecosystem',
        duration: 'Weeks 12 – 18',
        subtitle: 'Components, Hooks & State',
        status: 'upcoming',
        skills: [
          { label: 'React Fundamentals', status: 'upcoming' },
          { label: 'React Hooks', status: 'upcoming' },
          { label: 'React Router', status: 'upcoming' },
          { label: 'State Management (Zustand)', status: 'upcoming' },
          { label: 'REST & GraphQL APIs', status: 'upcoming' },
          { label: 'Testing (Vitest)', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a full CRUD app with React + REST API', status: 'pending' },
          { text: 'Implement authentication (JWT / OAuth)', status: 'pending' },
          { text: 'Write unit tests for all components', status: 'pending' },
        ],
        resources: [
          { label: 'React Docs (react.dev)', type: 'article', url: 'https://react.dev' },
          { label: 'Full Stack Open – University of Helsinki', type: 'course', url: 'https://fullstackopen.com' },
          { label: 'Scrimba React Course', type: 'video', url: 'https://scrimba.com/learn/react' },
        ],
      },
      {
        num: 4,
        title: 'Performance & Career',
        duration: 'Weeks 19 – 22',
        subtitle: 'Optimization, Tooling & Portfolio',
        status: 'upcoming',
        skills: [
          { label: 'Vite / Webpack', status: 'upcoming' },
          { label: 'Web Performance (Core Web Vitals)', status: 'upcoming' },
          { label: 'Accessibility (WCAG)', status: 'upcoming' },
          { label: 'CI/CD & Deployment', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Ship 3 portfolio projects on Vercel', status: 'pending' },
          { text: 'Score 90+ on Lighthouse for all projects', status: 'pending' },
          { text: 'Complete 10 technical interviews', status: 'pending' },
        ],
        resources: [
          { label: 'web.dev Performance', type: 'article', url: 'https://web.dev/performance' },
          { label: 'Vercel Deployment Guides', type: 'article', url: 'https://vercel.com/docs' },
          { label: 'LeetCode Blind 75', type: 'project', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions' },
        ],
      },
    ],
  },

  'backend-developer': {
    title: 'Backend Developer',
    icon: '⚙️',
    weeks: 22,
    skills: 34,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Programming Foundations',
        duration: 'Weeks 1 – 4',
        subtitle: 'Python or Node.js Core Concepts',
        status: 'upcoming',
        skills: [
          { label: 'Node.js / Python Basics', status: 'upcoming' },
          { label: 'Data Structures', status: 'upcoming' },
          { label: 'OOP Principles', status: 'upcoming' },
          { label: 'Git & Version Control', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a CLI tool that reads & writes files', status: 'pending' },
          { text: 'Implement common data structures from scratch', status: 'pending' },
          { text: 'Complete 20 LeetCode Easy problems', status: 'pending' },
        ],
        resources: [
          { label: 'Node.js Official Docs', type: 'article', url: 'https://nodejs.org/docs' },
          { label: 'CS50 Python – Harvard', type: 'course', url: 'https://cs50.harvard.edu/python' },
          { label: 'Pro Git Book', type: 'article', url: 'https://git-scm.com/book/en/v2' },
        ],
      },
      {
        num: 2,
        title: 'APIs & Databases',
        duration: 'Weeks 5 – 11',
        subtitle: 'REST, SQL & NoSQL',
        status: 'upcoming',
        skills: [
          { label: 'Express / FastAPI', status: 'upcoming' },
          { label: 'REST API Design', status: 'upcoming' },
          { label: 'PostgreSQL', status: 'upcoming' },
          { label: 'MongoDB', status: 'upcoming' },
          { label: 'ORM (Prisma / SQLAlchemy)', status: 'upcoming' },
          { label: 'Authentication (JWT)', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a fully authenticated REST API', status: 'pending' },
          { text: 'Design a normalized relational schema for a real use-case', status: 'pending' },
          { text: 'Implement pagination, filtering and sorting', status: 'pending' },
        ],
        resources: [
          { label: 'Express.js Guide', type: 'article', url: 'https://expressjs.com' },
          { label: 'PostgreSQL Tutorial', type: 'course', url: 'https://www.postgresql.org/docs' },
          { label: 'Designing Data-Intensive Applications', type: 'article', url: 'https://dataintensive.net' },
        ],
      },
      {
        num: 3,
        title: 'Advanced Backend',
        duration: 'Weeks 12 – 18',
        subtitle: 'Caching, Queues & Microservices',
        status: 'upcoming',
        skills: [
          { label: 'Redis Caching', status: 'upcoming' },
          { label: 'Message Queues (RabbitMQ)', status: 'upcoming' },
          { label: 'GraphQL', status: 'upcoming' },
          { label: 'WebSockets', status: 'upcoming' },
          { label: 'Microservices Patterns', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Add Redis caching layer to existing API', status: 'pending' },
          { text: 'Build a real-time chat feature with WebSockets', status: 'pending' },
          { text: 'Refactor a monolith into 3 microservices', status: 'pending' },
        ],
        resources: [
          { label: 'Redis University', type: 'course', url: 'https://university.redis.com' },
          { label: 'System Design Primer (GitHub)', type: 'article', url: 'https://github.com/donnemartin/system-design-primer' },
          { label: 'RabbitMQ Tutorials', type: 'article', url: 'https://www.rabbitmq.com/getstarted.html' },
        ],
      },
      {
        num: 4,
        title: 'Deployment & Career',
        duration: 'Weeks 19 – 22',
        subtitle: 'DevOps Basics & Job Prep',
        status: 'upcoming',
        skills: [
          { label: 'Docker', status: 'upcoming' },
          { label: 'CI/CD Pipelines', status: 'upcoming' },
          { label: 'AWS / GCP Basics', status: 'upcoming' },
          { label: 'API Security', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Containerize and deploy an API to AWS', status: 'pending' },
          { text: 'Set up a GitHub Actions CI/CD pipeline', status: 'pending' },
          { text: 'Pass 3 system design mock interviews', status: 'pending' },
        ],
        resources: [
          { label: 'Docker Getting Started', type: 'article', url: 'https://docs.docker.com/get-started' },
          { label: 'AWS Free Tier Projects', type: 'project', url: 'https://aws.amazon.com/free' },
          { label: 'Backend Engineer Roadmap (roadmap.sh)', type: 'article', url: 'https://roadmap.sh/backend' },
        ],
      },
    ],
  },

  'software-engineer': {
    title: 'Software Engineer',
    icon: '🚀',
    weeks: 24,
    skills: 40,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'CS Fundamentals',
        duration: 'Weeks 1 – 6',
        subtitle: 'Algorithms, Data Structures & Complexity',
        status: 'upcoming',
        skills: [
          { label: 'Big-O Analysis', status: 'upcoming' },
          { label: 'Arrays & Linked Lists', status: 'upcoming' },
          { label: 'Trees & Graphs', status: 'upcoming' },
          { label: 'Sorting & Searching', status: 'upcoming' },
          { label: 'Recursion & Dynamic Programming', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Solve 100 LeetCode problems across all difficulty levels', status: 'pending' },
          { text: 'Implement a binary search tree with all operations', status: 'pending' },
          { text: 'Complete NeetCode 150', status: 'pending' },
        ],
        resources: [
          { label: 'NeetCode – Algorithms Course', type: 'video', url: 'https://neetcode.io' },
          { label: 'CLRS – Introduction to Algorithms', type: 'article', url: 'https://mitpress.mit.edu/9780262033848' },
          { label: 'LeetCode Blind 75', type: 'project', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions' },
        ],
      },
      {
        num: 2,
        title: 'Software Design',
        duration: 'Weeks 7 – 13',
        subtitle: 'OOP, Design Patterns & Clean Code',
        status: 'upcoming',
        skills: [
          { label: 'SOLID Principles', status: 'upcoming' },
          { label: 'Design Patterns (GoF)', status: 'upcoming' },
          { label: 'Clean Code Practices', status: 'upcoming' },
          { label: 'Unit & Integration Testing', status: 'upcoming' },
          { label: 'Code Review Skills', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Refactor an existing codebase using SOLID principles', status: 'pending' },
          { text: 'Implement 5 design patterns in a real project', status: 'pending' },
          { text: 'Achieve 90% test coverage on a module', status: 'pending' },
        ],
        resources: [
          { label: 'Clean Code by Robert Martin', type: 'article', url: 'https://www.oreilly.com/library/view/clean-code-a/9780136083238' },
          { label: 'Refactoring.Guru – Design Patterns', type: 'article', url: 'https://refactoring.guru/design-patterns' },
          { label: 'The Pragmatic Programmer', type: 'article', url: 'https://pragprog.com/titles/tpp20/the-pragmatic-programmer-your-journey-to-mastery-20th-anniversary-edition' },
        ],
      },
      {
        num: 3,
        title: 'System Design',
        duration: 'Weeks 14 – 20',
        subtitle: 'Scalability, Distributed Systems',
        status: 'upcoming',
        skills: [
          { label: 'Load Balancing', status: 'upcoming' },
          { label: 'CAP Theorem', status: 'upcoming' },
          { label: 'Databases at Scale', status: 'upcoming' },
          { label: 'Message Queues', status: 'upcoming' },
          { label: 'CDN & Caching', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Design Twitter / URL Shortener from scratch', status: 'pending' },
          { text: 'Complete 5 system design mock interviews', status: 'pending' },
          { text: 'Build a horizontally scalable service', status: 'pending' },
        ],
        resources: [
          { label: 'System Design Primer (GitHub)', type: 'article', url: 'https://github.com/donnemartin/system-design-primer' },
          { label: 'Designing Data-Intensive Applications', type: 'article', url: 'https://dataintensive.net' },
          { label: 'ByteByteGo Newsletter', type: 'article', url: 'https://blog.algoexpert.io/byte-by-byte' },
        ],
      },
      {
        num: 4,
        title: 'Career Launch',
        duration: 'Weeks 21 – 24',
        subtitle: 'Interview Prep & FAANG Strategy',
        status: 'upcoming',
        skills: [
          { label: 'Behavioral Interviews (STAR)', status: 'upcoming' },
          { label: 'Technical Communication', status: 'upcoming' },
          { label: 'Negotiation', status: 'upcoming' },
          { label: 'Open Source Contributions', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Complete 10 full mock interviews (algo + system design)', status: 'pending' },
          { text: 'Contribute to a popular open-source project', status: 'pending' },
          { text: 'Apply to 30+ companies with tailored materials', status: 'pending' },
        ],
        resources: [
          { label: 'Grokking the System Design Interview', type: 'course', url: 'https://www.educative.io/courses/grokking-the-system-design-interview' },
          { label: 'interviewing.io Practice', type: 'project', url: 'https://interviewing.io' },
          { label: 'Levels.fyi Salary Data', type: 'article', url: 'https://levels.fyi' },
        ],
      },
    ],
  },

  'devops-engineer': {
    title: 'DevOps Engineer',
    icon: '🔧',
    weeks: 22,
    skills: 35,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Linux & Networking',
        duration: 'Weeks 1 – 4',
        subtitle: 'OS Fundamentals & Shell Scripting',
        status: 'upcoming',
        skills: [
          { label: 'Linux Command Line', status: 'upcoming' },
          { label: 'Bash Scripting', status: 'upcoming' },
          { label: 'Networking Basics (TCP/IP, DNS)', status: 'upcoming' },
          { label: 'SSH & Security Basics', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Write a bash script that automates server setup', status: 'pending' },
          { text: 'Set up and harden a Linux VPS', status: 'pending' },
          { text: 'Complete Linux Foundation Essentials cert', status: 'pending' },
        ],
        resources: [
          { label: 'The Linux Command Line (book)', type: 'article', url: 'https://linuxcommand.org' },
          { label: 'OverTheWire – Bandit wargame', type: 'project', url: 'https://overthewire.org/wargames/bandit' },
          { label: 'NetworkChuck – Linux Series', type: 'video', url: 'https://www.youtube.com/@NetworkChuck' },
        ],
      },
      {
        num: 2,
        title: 'Containers & CI/CD',
        duration: 'Weeks 5 – 11',
        subtitle: 'Docker, Kubernetes & Pipelines',
        status: 'upcoming',
        skills: [
          { label: 'Docker & Docker Compose', status: 'upcoming' },
          { label: 'Kubernetes Basics', status: 'upcoming' },
          { label: 'GitHub Actions', status: 'upcoming' },
          { label: 'Jenkins / GitLab CI', status: 'upcoming' },
          { label: 'Artifact Registries', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Containerize a multi-service app with Docker Compose', status: 'pending' },
          { text: 'Deploy an app to a Kubernetes cluster', status: 'pending' },
          { text: 'Build a full CI/CD pipeline that tests, builds & deploys', status: 'pending' },
        ],
        resources: [
          { label: 'Docker Getting Started', type: 'article', url: 'https://docs.docker.com/get-started' },
          { label: 'Kubernetes the Hard Way', type: 'project', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way' },
          { label: 'GitHub Actions Docs', type: 'article', url: 'https://docs.github.com/en/actions' },
        ],
      },
      {
        num: 3,
        title: 'Cloud & IaC',
        duration: 'Weeks 12 – 18',
        subtitle: 'AWS / GCP & Infrastructure as Code',
        status: 'upcoming',
        skills: [
          { label: 'AWS Core Services', status: 'upcoming' },
          { label: 'Terraform', status: 'upcoming' },
          { label: 'Ansible', status: 'upcoming' },
          { label: 'Cloud Networking (VPC, Load Balancers)', status: 'upcoming' },
          { label: 'Secrets Management', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Provision a full AWS stack with Terraform', status: 'pending' },
          { text: 'Automate configuration management with Ansible', status: 'pending' },
          { text: 'Earn AWS Solutions Architect Associate cert', status: 'pending' },
        ],
        resources: [
          { label: 'AWS Free Tier Projects', type: 'project', url: 'https://aws.amazon.com/free' },
          { label: 'Terraform Tutorials (HashiCorp)', type: 'article', url: 'https://developer.hashicorp.com/terraform/tutorials' },
          { label: 'Adrian Cantrill AWS Course', type: 'course', url: 'https://learn.cantrill.io' },
        ],
      },
      {
        num: 4,
        title: 'Monitoring & Career',
        duration: 'Weeks 19 – 22',
        subtitle: 'Observability, SRE & Job Prep',
        status: 'upcoming',
        skills: [
          { label: 'Prometheus & Grafana', status: 'upcoming' },
          { label: 'ELK Stack (Logging)', status: 'upcoming' },
          { label: 'SLOs & Incident Response', status: 'upcoming' },
          { label: 'FinOps Basics', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Set up full observability stack for a production app', status: 'pending' },
          { text: 'Define and track SLOs for a service', status: 'pending' },
          { text: 'Complete 5 DevOps technical interviews', status: 'pending' },
        ],
        resources: [
          { label: 'Site Reliability Engineering (Google book)', type: 'article', url: 'https://sre.google/books' },
          { label: 'Grafana Labs Tutorials', type: 'article', url: 'https://grafana.com/tutorials' },
          { label: 'DevOps Roadmap (roadmap.sh)', type: 'article', url: 'https://roadmap.sh/devops' },
        ],
      },
    ],
  },

  'machine-learning-engineer': {
    title: 'Machine Learning Engineer',
    icon: '🤖',
    weeks: 26,
    skills: 42,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Math & Python Foundations',
        duration: 'Weeks 1 – 5',
        subtitle: 'Linear Algebra, Calculus & NumPy',
        status: 'upcoming',
        skills: [
          { label: 'Linear Algebra', status: 'upcoming' },
          { label: 'Calculus (Derivatives)', status: 'upcoming' },
          { label: 'Probability & Statistics', status: 'upcoming' },
          { label: 'NumPy & Pandas', status: 'upcoming' },
          { label: 'Matplotlib', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Implement matrix operations from scratch in NumPy', status: 'pending' },
          { text: 'Complete fast.ai Part 1 – Practical Deep Learning', status: 'pending' },
          { text: 'Solve 10 Kaggle starter notebooks', status: 'pending' },
        ],
        resources: [
          { label: '3Blue1Brown – Linear Algebra', type: 'video', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
          { label: 'StatQuest with Josh Starmer', type: 'video', url: 'https://www.youtube.com/@statquest' },
          { label: 'Kaggle Micro-Courses', type: 'course', url: 'https://kaggle.com/learn' },
        ],
      },
      {
        num: 2,
        title: 'Classic Machine Learning',
        duration: 'Weeks 6 – 12',
        subtitle: 'Scikit-learn & Core Algorithms',
        status: 'upcoming',
        skills: [
          { label: 'Regression & Classification', status: 'upcoming' },
          { label: 'Decision Trees & Random Forests', status: 'upcoming' },
          { label: 'Clustering (K-Means)', status: 'upcoming' },
          { label: 'Feature Engineering', status: 'upcoming' },
          { label: 'Model Evaluation & Cross-Validation', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Win a top-25% finish in a Kaggle tabular competition', status: 'pending' },
          { text: 'Build a custom ML pipeline with scikit-learn', status: 'pending' },
          { text: 'Explain bias-variance tradeoff with examples', status: 'pending' },
        ],
        resources: [
          { label: 'Hands-On Machine Learning (Géron)', type: 'article', url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632' },
          { label: 'Scikit-learn User Guide', type: 'article', url: 'https://scikit-learn.org/stable/user_guide.html' },
          { label: 'Kaggle Competitions', type: 'project', url: 'https://www.kaggle.com/competitions' },
        ],
      },
      {
        num: 3,
        title: 'Deep Learning',
        duration: 'Weeks 13 – 20',
        subtitle: 'Neural Networks, CNNs & Transformers',
        status: 'upcoming',
        skills: [
          { label: 'Neural Networks & Backprop', status: 'upcoming' },
          { label: 'TensorFlow / PyTorch', status: 'upcoming' },
          { label: 'CNNs (Computer Vision)', status: 'upcoming' },
          { label: 'RNNs & LSTMs', status: 'upcoming' },
          { label: 'Transformers & Attention', status: 'upcoming' },
          { label: 'Transfer Learning', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Train an image classifier with 95%+ accuracy', status: 'pending' },
          { text: 'Fine-tune a HuggingFace model for a custom task', status: 'pending' },
          { text: 'Reproduce a paper result and write a blog post', status: 'pending' },
        ],
        resources: [
          { label: 'Deep Learning Specialization – deeplearning.ai', type: 'course', url: 'https://www.deeplearning.ai' },
          { label: 'fast.ai Practical Deep Learning', type: 'course', url: 'https://www.fast.ai' },
          { label: 'The Annotated Transformer (Harvard NLP)', type: 'article', url: 'http://nlp.seas.harvard.edu/2018/04/03/attention.html' },
        ],
      },
      {
        num: 4,
        title: 'MLOps & Career',
        duration: 'Weeks 21 – 26',
        subtitle: 'Production ML & Portfolio',
        status: 'upcoming',
        skills: [
          { label: 'MLflow / W&B', status: 'upcoming' },
          { label: 'Model Serving (FastAPI)', status: 'upcoming' },
          { label: 'Data Pipelines (Airflow)', status: 'upcoming' },
          { label: 'A/B Testing ML Models', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Deploy an ML model to production with monitoring', status: 'pending' },
          { text: 'Build an end-to-end ML project on GitHub', status: 'pending' },
          { text: 'Complete 5 ML system design interviews', status: 'pending' },
        ],
        resources: [
          { label: 'Made With ML – MLOps', type: 'course', url: 'https://madewithml.com' },
          { label: 'MLflow Documentation', type: 'article', url: 'https://mlflow.org' },
          { label: 'ML Engineer Interview Guide', type: 'article', url: 'https://www.interviewquery.com' },
        ],
      },
    ],
  },

  'ui-ux-designer': {
    title: 'UI/UX Designer',
    icon: '🎨',
    weeks: 24,
    skills: 38,
    progressPct: 35,
    phases: [
      {
        num: 1,
        title: 'Foundation',
        duration: 'Weeks 1 – 6',
        subtitle: 'Design Fundamentals',
        status: 'done',
        skills: [
          { label: 'Design Principles', status: 'learned' },
          { label: 'Color Theory', status: 'learned' },
          { label: 'Typography', status: 'learned' },
          { label: 'Layout & Grid', status: 'learned' },
          { label: 'Figma Basics', status: 'learned' },
          { label: 'Visual Hierarchy', status: 'learned' },
        ],
        milestones: [
          { text: 'Completed Figma essentials certification', status: 'done' },
          { text: 'Redesigned a real-world app screen', status: 'done' },
          { text: 'Built a personal mood board & style guide', status: 'done' },
        ],
        resources: [
          { label: 'Google UX Design Certificate', type: 'course' },
          { label: 'Figma Masterclass', type: 'video' },
          { label: 'Laws of UX', type: 'article' },
        ],
      },
      {
        num: 2,
        title: 'Core Skills',
        duration: 'Weeks 7 – 14',
        subtitle: 'Research & Interaction Design',
        status: 'active',
        skills: [
          { label: 'User Research', status: 'learned' },
          { label: 'Wireframing', status: 'learned' },
          { label: 'Prototyping', status: 'current' },
          { label: 'Usability Testing', status: 'current' },
          { label: 'Information Architecture', status: 'upcoming' },
          { label: 'Interaction Design', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Conducted 5 user interviews & synthesized findings', status: 'done' },
          { text: 'Build a full prototype with 20+ linked screens', status: 'active' },
          { text: 'Run a moderated usability test session', status: 'pending' },
        ],
        resources: [
          { label: 'Interaction Design Foundation', type: 'course', url: 'https://www.interaction-design.org' },
          { label: 'Portfolio Project #1', type: 'project', url: 'https://dribbble.com' },
          { label: 'NN/g UX Research', type: 'video', url: 'https://www.nngroup.com/videos' },
          { label: 'Don\'t Make Me Think', type: 'article', url: 'https://www.amazon.com/Dont-Make-Think-Revisited-Usability/dp/0321965515' },
        ],
      },
      {
        num: 3,
        title: 'Advanced',
        duration: 'Weeks 15 – 20',
        subtitle: 'Systems & Strategy',
        status: 'upcoming',
        skills: [
          { label: 'Design Systems', status: 'upcoming' },
          { label: 'Component Libraries', status: 'upcoming' },
          { label: 'Design Tokens', status: 'upcoming' },
          { label: 'Motion Design', status: 'upcoming' },
          { label: 'Accessibility (WCAG)', status: 'upcoming' },
          { label: 'Cross-team Handoff', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a complete design system with 50+ components', status: 'pending' },
          { text: 'Design an accessible, WCAG AA-compliant product', status: 'pending' },
          { text: 'Create developer-ready specs with design tokens', status: 'pending' },
        ],
        resources: [
          { label: 'Atomic Design by Bradfrost', type: 'article', url: 'https://atomicdesign.bradfrost.com' },
          { label: 'Design Systems Figma Course', type: 'video', url: 'https://www.youtube.com/watch?v=sHJ2dhqHd8E' },
          { label: 'Portfolio Project #2', type: 'project', url: 'https://dribbble.com' },
        ],
      },
      {
        num: 4,
        title: 'Job Ready',
        duration: 'Weeks 21 – 24',
        subtitle: 'Portfolio & Career Launch',
        status: 'upcoming',
        skills: [
          { label: 'Case Study Writing', status: 'upcoming' },
          { label: 'Portfolio Site', status: 'upcoming' },
          { label: 'Resume Design', status: 'upcoming' },
          { label: 'LinkedIn Branding', status: 'upcoming' },
          { label: 'Interview Prep', status: 'upcoming' },
          { label: 'Salary Negotiation', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Publish a portfolio with 3 end-to-end case studies', status: 'pending' },
          { text: 'Submit 20 tailored job applications', status: 'pending' },
          { text: 'Complete 5 mock portfolio reviews', status: 'pending' },
        ],
        resources: [
          { label: 'Portfolio Project #3', type: 'project', url: 'https://dribbble.com' },
          { label: 'UX Portfolio Guide', type: 'article', url: 'https://www.nngroup.com/articles/ux-portfolios' },
          { label: 'Behavioral Interview Prep', type: 'video', url: 'https://www.youtube.com/watch?v=3bhaKm71oNk' },
        ],
      },
    ],
  },

  'full-stack-developer': {
    title: 'Full Stack Developer',
    icon: '🌐',
    weeks: 28,
    skills: 48,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Frontend Core',
        duration: 'Weeks 1 – 7',
        subtitle: 'HTML, CSS, JavaScript & React',
        status: 'upcoming',
        skills: [
          { label: 'HTML5 & CSS3', status: 'upcoming' },
          { label: 'JavaScript ES6+', status: 'upcoming' },
          { label: 'React & Hooks', status: 'upcoming' },
          { label: 'Responsive Design', status: 'upcoming' },
          { label: 'Tailwind CSS', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a fully responsive React SPA', status: 'pending' },
          { text: 'Implement client-side routing with React Router', status: 'pending' },
          { text: 'Complete 5 Frontend Mentor challenges', status: 'pending' },
        ],
        resources: [
          { label: 'Full Stack Open – Helsinki', type: 'course' },
          { label: 'React Documentation', type: 'article' },
          { label: 'Frontend Mentor', type: 'project' },
        ],
      },
      {
        num: 2,
        title: 'Backend Core',
        duration: 'Weeks 8 – 15',
        subtitle: 'Node.js, REST APIs & Databases',
        status: 'upcoming',
        skills: [
          { label: 'Node.js & Express', status: 'upcoming' },
          { label: 'REST API Design', status: 'upcoming' },
          { label: 'PostgreSQL & Prisma', status: 'upcoming' },
          { label: 'MongoDB & Mongoose', status: 'upcoming' },
          { label: 'JWT Authentication', status: 'upcoming' },
          { label: 'File Uploads & Storage', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a full CRUD REST API with auth', status: 'pending' },
          { text: 'Design a relational schema for a social app', status: 'pending' },
          { text: 'Implement email verification & password reset', status: 'pending' },
        ],
        resources: [
          { label: 'Node.js Docs', type: 'article', url: 'https://nodejs.org/docs' },
          { label: 'Prisma Getting Started', type: 'article', url: 'https://www.prisma.io/docs/getting-started' },
          { label: 'MongoDB University', type: 'course', url: 'https://university.mongodb.com' },
        ],
      },
      {
        num: 3,
        title: 'Full Stack Integration',
        duration: 'Weeks 16 – 22',
        subtitle: 'Real Projects, State & Performance',
        status: 'upcoming',
        skills: [
          { label: 'State Management (Redux / Zustand)', status: 'upcoming' },
          { label: 'React Query / SWR', status: 'upcoming' },
          { label: 'WebSockets (real-time)', status: 'upcoming' },
          { label: 'Payment Integration (Stripe)', status: 'upcoming' },
          { label: 'Email (Resend / SendGrid)', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Build a full-stack SaaS with payments & auth', status: 'pending' },
          { text: 'Add real-time features with WebSockets', status: 'pending' },
          { text: 'Write integration tests for the API', status: 'pending' },
        ],
        resources: [
          { label: 'Stripe Docs', type: 'article', url: 'https://stripe.com/docs' },
          { label: 'React Query Docs', type: 'article', url: 'https://tanstack.com/query/latest' },
          { label: 'Socket.io Tutorial', type: 'video', url: 'https://socket.io/docs/v4/server-installation' },
        ],
      },
      {
        num: 4,
        title: 'Deploy & Career',
        duration: 'Weeks 23 – 28',
        subtitle: 'Deployment, DevOps Basics & Portfolio',
        status: 'upcoming',
        skills: [
          { label: 'Docker & Docker Compose', status: 'upcoming' },
          { label: 'Vercel / Railway Deployment', status: 'upcoming' },
          { label: 'CI/CD with GitHub Actions', status: 'upcoming' },
          { label: 'Performance Optimization', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Ship 3 full-stack projects with custom domains', status: 'pending' },
          { text: 'Set up automated testing and deployment pipelines', status: 'pending' },
          { text: 'Land a full-stack internship or junior role', status: 'pending' },
        ],
        resources: [
          { label: 'Vercel Documentation', type: 'article', url: 'https://vercel.com/docs' },
          { label: 'Docker for Developers', type: 'video', url: 'https://www.youtube.com/watch?v=rIrNIzy6PJA' },
          { label: 'Full Stack Open Certificates', type: 'course', url: 'https://fullstackopen.com' },
        ],
      },
    ],
  },

  'cybersecurity-analyst': {
    title: 'Cybersecurity Analyst',
    icon: '🔒',
    weeks: 24,
    skills: 38,
    progressPct: 0,
    phases: [
      {
        num: 1,
        title: 'Networking & OS',
        duration: 'Weeks 1 – 5',
        subtitle: 'Protocols, Linux & Windows Basics',
        status: 'upcoming',
        skills: [
          { label: 'TCP/IP & OSI Model', status: 'upcoming' },
          { label: 'DNS, HTTP, TLS', status: 'upcoming' },
          { label: 'Linux Fundamentals', status: 'upcoming' },
          { label: 'Windows Active Directory', status: 'upcoming' },
          { label: 'Wireshark & Packet Analysis', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Analyse a full TCP handshake in Wireshark', status: 'pending' },
          { text: 'Set up a home lab with a vulnerable VM', status: 'pending' },
          { text: 'Complete TryHackMe Pre-Security Path', status: 'pending' },
        ],
        resources: [
          { label: 'Professor Messer – CompTIA Network+', type: 'video', url: 'https://www.youtube.com/playlist?list=PLG49S3nxzAnlCJlw6OAPJtgosgv6-zsKY' },
          { label: 'TryHackMe Pre-Security', type: 'course', url: 'https://tryhackme.com/path/presecurity' },
          { label: 'Wireshark Official Docs', type: 'article', url: 'https://www.wireshark.org/docs' },
        ],
      },
      {
        num: 2,
        title: 'Security Fundamentals',
        duration: 'Weeks 6 – 11',
        subtitle: 'Cryptography, Threats & Defences',
        status: 'upcoming',
        skills: [
          { label: 'Cryptography Basics', status: 'upcoming' },
          { label: 'OWASP Top 10', status: 'upcoming' },
          { label: 'Vulnerability Scanning (Nmap, Nessus)', status: 'upcoming' },
          { label: 'SIEM Concepts', status: 'upcoming' },
          { label: 'Incident Response Basics', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Complete OWASP Juice Shop challenges', status: 'pending' },
          { text: 'Run a full vulnerability scan on a test environment', status: 'pending' },
          { text: 'Earn CompTIA Security+ certification', status: 'pending' },
        ],
        resources: [
          { label: 'OWASP Juice Shop', type: 'project', url: 'https://owasp.org/www-project-juice-shop' },
          { label: 'CompTIA Security+ Study Guide', type: 'course', url: 'https://www.comptia.org/certifications/security' },
          { label: 'CyberDefenders Blue Team Labs', type: 'project', url: 'https://cyberdefenders.org' },
        ],
      },
      {
        num: 3,
        title: 'Ethical Hacking',
        duration: 'Weeks 12 – 19',
        subtitle: 'Pentesting, Exploitation & CTFs',
        status: 'upcoming',
        skills: [
          { label: 'Kali Linux', status: 'upcoming' },
          { label: 'Metasploit Framework', status: 'upcoming' },
          { label: 'Web App Pentesting (Burp Suite)', status: 'upcoming' },
          { label: 'Privilege Escalation', status: 'upcoming' },
          { label: 'Password Cracking', status: 'upcoming' },
          { label: 'CTF Challenges', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Complete 20 TryHackMe rooms (intermediate)', status: 'pending' },
          { text: 'Compromise your first Hack The Box machine', status: 'pending' },
          { text: 'Write a pentest report for a practice target', status: 'pending' },
        ],
        resources: [
          { label: 'Hack The Box Academy', type: 'course', url: 'https://academy.hackthebox.com' },
          { label: 'TCM Security – Practical Ethical Hacking', type: 'video', url: 'https://www.udemy.com/course/practical-ethical-hacking' },
          { label: 'PortSwigger Web Security Academy', type: 'course', url: 'https://portswigger.net/web-security' },
        ],
      },
      {
        num: 4,
        title: 'Certs & Career',
        duration: 'Weeks 20 – 24',
        subtitle: 'Certifications, Blue Team & Job Prep',
        status: 'upcoming',
        skills: [
          { label: 'SOC Analyst Workflow', status: 'upcoming' },
          { label: 'Threat Intelligence', status: 'upcoming' },
          { label: 'MITRE ATT&CK Framework', status: 'upcoming' },
          { label: 'Resume & Portfolio', status: 'upcoming' },
        ],
        milestones: [
          { text: 'Earn eJPT or CEH entry-level certification', status: 'pending' },
          { text: 'Build a security blog documenting your CTF write-ups', status: 'pending' },
          { text: 'Apply for SOC Analyst or Junior Pentest roles', status: 'pending' },
        ],
        resources: [
          { label: 'MITRE ATT&CK Navigator', type: 'article', url: 'https://mitre-engenuity.org/ctid/mitre-attack-navigator' },
          { label: 'eJPT Certification – eLearnSecurity', type: 'course', url: 'https://elearnsecurity.com/certifications/ejpt' },
          { label: 'CyberSec Interview Prep', type: 'article', url: 'https://www.interviewquery.com' },
        ],
      },
    ],
  },
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
// Converts a string to a URL-friendly slug (e.g., "Data Science" -> "data-science")
const toSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, '-');
// Helper to convert text to a URL-friendly slug

// Maps resource types to CSS class names for coloring resource chips
const RESOURCE_TYPE_COLOR = {
  video:   'rc-video',
  article: 'rc-article',
  project: 'rc-project',
  course:  'rc-course',
  video:   'rc-video',
  article: 'rc-article',
  project: 'rc-project',
  course:  'rc-course',
};

function PhaseCard({ phase, phaseIndex, onStatusChange, onSkillClick, selectedSkill }) {
  // Renders a single phase card (collapsible)
  const [open, setOpen] = useState(phase.status === 'active' || phase.status === 'done');

  // Handle phase status changes (done, active, upcoming)

  const handlePhaseClick = () => {
    if (phase.status === 'done') {
      onStatusChange(phaseIndex, 'upcoming');
    } else if (phase.status === 'upcoming') {
      onStatusChange(phaseIndex, 'active');
      setOpen(true);
    } else if (phase.status === 'active') {
      onStatusChange(phaseIndex, 'done');
    }
  };

  const statusClass =
    phase.status === 'done'   ? 'done-card'   :
    phase.status === 'active' ? 'active-card'  : '';

  const numClass =
    phase.status === 'done'   ? 'done'   :
    phase.status === 'active' ? 'active'  : '';

  const badgeClass =
    phase.status === 'done'   ? 'badge-done'    :
    phase.status === 'active' ? 'badge-active'   : 'badge-upcoming';

  const badgeLabel =
    phase.status === 'done'   ? 'Completed'  :
    phase.status === 'active' ? 'In Progress' : 'Upcoming';

  const numDisplay = phase.status === 'done' ? '✓' : phase.num;

  return (
    <div className="phase">
      <div className="phase-num-col">
        <div className={`phase-num ${numClass}`}>{numDisplay}</div>
      </div>

      <div className={`phase-body ${statusClass}`}>
        <div className="phase-header" onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
          <div style={{ flex: 1 }}>
            <div className="phase-title">
              {phase.title}
            </div>
            <div className="phase-subtitle">{phase.duration} &nbsp;·&nbsp; {phase.subtitle}</div>
          </div>
          <div className="phase-header-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePhaseClick();
              }}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                background: phase.status === 'done' ? 'var(--green)' : phase.status === 'active' ? 'var(--blue-accent)' : 'var(--muted)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.target.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.target.style.opacity = '1')}
              title="Click to mark as done/active/upcoming"
            >
              {phase.status === 'done' ? '✓ Done' : phase.status === 'active' ? '→ Active' : 'Start'}
            </button>
            <span className={`phase-chevron ${open ? 'open' : ''}`}>›</span>
          </div>
        </div>

        {open && (
          <>
            <div className="phase-content">
              <div className="phase-col">
                <div className="col-label">Skills</div>
                <div className="skills-list">
                  {/* Render skill pills for each skill in the phase */}
                  {phase.skills.map((s, i) => (
                    <span
                      key={i}
                      className={`skill-pill ${s.status}${selectedSkill === s.label ? ' skill-pill-selected' : ''}`}
                      onClick={() => onSkillClick(selectedSkill === s.label ? null : s.label)}
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: selectedSkill === s.label ? '#2d1912' : undefined,
                        borderColor: selectedSkill === s.label ? '#daa882' : undefined,
                        color: selectedSkill === s.label ? '#daa882' : undefined,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="phase-col">
                <div className="col-label">Milestones</div>
                <div className="milestone-list">
                  {/* Render milestone list for this phase */}
                  {phase.milestones.map((m, i) => {
                    return (
                      <div key={i} className="milestone">
                        <span 
                          onClick={() => onSkillClick(selectedSkill === m.text ? null : m.text)}
                          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.7';
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          {m.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="resource-row">
              {/* Render resource chips for this phase */}
              {phase.resources.map((r, i) => (
                <a 
                  key={i} 
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="resource-chip"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <span className={`rc-dot ${RESOURCE_TYPE_COLOR[r.type] || 'rc-article'}`} />
                  {r.label}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function RoadmapPage() {
  // Main roadmap page component
  const { role } = useParams();
  const navigate = useNavigate();
  const data = ROADMAPS[role];

  const [phaseStatuses, setPhaseStatuses] = useState(() => {
    try {
      const saved = sessionStorage.getItem(`roadmap_${role}_phases`);
      return saved ? JSON.parse(saved) : data?.phases.map(p => p.status) || [];
    } catch {
      return data?.phases.map(p => p.status) || [];
    }
  });

  const [selectedSkill, setSelectedSkill] = useState(null);

  // Skill notes for all roadmaps
  const SKILL_NOTES = {
    // Data Analyst
    'Excel / Google Sheets': {
      overview: 'Master spreadsheet tools for data manipulation and analysis.',
      key_topics: ['Formulas & functions', 'Pivot tables & VLOOKUP', 'Data validation & charts', 'Conditional formatting'],
      resources: [
        { label: 'Google Sheets templates', url: 'https://docs.google.com/spreadsheets/templates' },
        { label: 'Excel functions guide', url: 'https://support.microsoft.com/en-us/excel' },
        { label: 'DataCamp spreadsheets course', url: 'https://datacamp.com' }
      ],
    },
    'SQL Basics': {
      overview: 'Structured Query Language for querying databases efficiently.',
      key_topics: ['SELECT and FROM clauses', 'WHERE filtering', 'JOIN operations', 'Aggregation functions (SUM, COUNT, AVG)'],
      resources: [
        { label: 'Mode SQL tutorial', url: 'https://mode.com/sql-tutorial' },
        { label: 'LeetCode SQL problems', url: 'https://leetcode.com/problemset/database' },
        { label: 'W3Schools SQL reference', url: 'https://www.w3schools.com/sql' }
      ],
    },
    'Descriptive Statistics': {
      overview: 'Summarizing and understanding data distributions.',
      key_topics: ['Mean, median, mode', 'Standard deviation & variance', 'Distributions & skewness', 'Correlation & relationships'],
      resources: [
        { label: 'Khan Academy Statistics', url: 'https://www.khanacademy.org/math/statistics-probability' },
        { label: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/c/joshstarmer' },
        { label: 'R for Data Science book', url: 'https://r4ds.had.co.nz' }
      ],
    },
    'Data Types & Cleaning': {
      overview: 'Preparing data for analysis by handling quality issues.',
      key_topics: ['Data type conversion', 'Handling missing values', 'Outlier detection', 'Data normalization'],
      resources: [
        { label: 'Kaggle Data Cleaning course', url: 'https://kaggle.com/learn/data-cleaning' },
        { label: 'DataCamp Data Cleaning', url: 'https://datacamp.com' },
        { label: 'Pandas documentation', url: 'https://pandas.pydata.org/docs' }
      ],
    },
    'Python Basics': {
      overview: 'Foundation of the Python programming language.',
      key_topics: ['Syntax and data types', 'Control flow (if/else, loops)', 'Functions and modules', 'Exception handling'],
      resources: [
        { label: 'Python Official Documentation', url: 'https://docs.python.org' },
        { label: 'Think Python book', url: 'https://greenteapress.com/wp/think-python-2e' },
        { label: 'Real Python tutorials', url: 'https://realpython.com' }
      ],
    },
    'Pandas': {
      overview: 'Data manipulation and analysis library for Python.',
      key_topics: ['DataFrames and Series', 'Indexing and selecting data', 'Aggregation and grouping', 'Merging and reshaping'],
      resources: [
        { label: 'Pandas documentation', url: 'https://pandas.pydata.org' },
        { label: 'McKinney - Python for Data Analysis', url: 'https://wesmckinney.com/book' },
        { label: 'Mode Analytics SQL tutorial', url: 'https://mode.com/sql-tutorial' }
      ],
    },
    'NumPy': {
      overview: 'Fundamental package for numerical computing in Python.',
      key_topics: ['Array creation and indexing', 'Mathematical operations', 'Linear algebra basics', 'Broadcasting'],
      resources: [
        { label: 'NumPy documentation', url: 'https://numpy.org/doc' },
        { label: 'NumPy tutorial', url: 'https://numpy.org/learn' },
        { label: 'Kaggle numpy course', url: 'https://kaggle.com/learn/numpy' }
      ],
    },
    'Matplotlib / Seaborn': {
      overview: 'Data visualization libraries for Python.',
      key_topics: ['Creating and customizing plots', 'Figure and axes management', 'Color scales and aesthetics', 'Statistical visualizations'],
      resources: [
        { label: 'Matplotlib tutorials', url: 'https://matplotlib.org/stable/tutorials/index.html' },
        { label: 'Seaborn gallery', url: 'https://seaborn.pydata.org/examples.html' },
        { label: 'Data Visualization with Python', url: 'https://realpython.com/python-matplotlib-guide' }
      ],
    },
    'Jupyter Notebooks': {
      overview: 'Interactive Python environment for data exploration and analysis.',
      key_topics: ['Cell execution', 'Markdown documentation', 'Inline visualizations', 'Notebook sharing & deployment'],
      resources: [
        { label: 'Jupyter official docs', url: 'https://jupyter.org' },
        { label: 'Project Jupyter', url: 'https://jupyter.readthedocs.io' },
        { label: 'nbconvert tutorial', url: 'https://nbconvert.readthedocs.io' }
      ],
    },
    'Tableau / Power BI': {
      overview: 'Business intelligence and data visualization tools.',
      key_topics: ['Dashboard creation', 'Data blending', 'Interactive filters', 'Publishing and sharing'],
      resources: [
        { label: 'Tableau desktop tutorial', url: 'https://www.tableau.com/learn/training' },
        { label: 'Power BI learning path', url: 'https://learn.microsoft.com/en-us/power-bi' },
        { label: 'Dashboard design best practices', url: 'https://www.tableau.com/about/blog' }
      ],
    },
    'KPI Design': {
      overview: 'Creating meaningful Key Performance Indicators for business.',
      key_topics: ['Metric selection', 'Goal setting', 'Dashboard metrics', 'Monitoring & alerts'],
      resources: [
        { label: 'KPI Design Guide', url: 'https://www.bernardmarr.com/default.asp?contentID=1838' },
        { label: 'Analytics Demystified', url: 'https://analyticshour.io' },
        { label: 'Goodreads Metrics', url: 'https://www.goodreads.com/book/show/34838939-measuring-business-value' }
      ],
    },
    'Data Storytelling': {
      overview: 'Communicating data insights effectively to stakeholders.',
      key_topics: ['Narrative structure', 'Visual hierarchy', 'Audience analysis', 'Presentation skills'],
      resources: [
        { label: 'Storytelling with Data (book)', url: 'https://www.storytellingwithdata.com' },
        { label: 'Cole Nussbaumer Knaflic', url: 'https://www.storytellingwithdata.com/blog' },
        { label: 'TED talks analysis', url: 'https://www.ted.com' }
      ],
    },
    'Advanced SQL (CTEs, Window Fns)': {
      overview: 'Complex SQL techniques for advanced data analysis.',
      key_topics: ['Common Table Expressions (CTE)', 'Window functions (ROW_NUMBER, RANK)', 'Recursive queries', 'Performance optimization'],
      resources: [
        { label: 'Advanced SQL – Mode', url: 'https://mode.com/sql-tutorial/advanced-sql' },
        { label: 'SQL Window Functions', url: 'https://www.postgresql.org/docs/current/functions-window.html' },
        { label: 'LeetCode SQL Hard', url: 'https://leetcode.com/problemset/database/?difficulty=HARD' }
      ],
    },
    'Portfolio Projects': {
      overview: 'Showcasing your skills through complete data projects.',
      key_topics: ['Project selection', 'End-to-end workflow', 'Documentation', 'Deployment & sharing'],
      resources: [
        { label: 'GitHub portfolio', url: 'https://github.com' },
        { label: 'Medium & Towards Data Science', url: 'https://towardsdatascience.com' },
        { label: 'Kaggle notebooks', url: 'https://kaggle.com/notebooks' }
      ],
    },
    'Case Study Writing': {
      overview: 'Documenting your analytical process and findings.',
      key_topics: ['Problem definition', 'Methodology', 'Key findings', 'Recommendations & impact'],
      resources: [
        { label: 'Harvard Case Study format', url: 'https://www.hbs.edu' },
        { label: 'Medium case study examples', url: 'https://medium.com' },
        { label: 'Data journalism resources', url: 'https://pudding.cool' }
      ],
    },
    
    // Frontend Developer
    'HTML5 Semantics': {
      overview: 'Semantic HTML markup for accessible and SEO-friendly websites.',
      key_topics: ['Semantic elements (<article>, <section>)', 'Accessibility attributes', 'Form elements', 'Microdata & schema'],
      resources: [
        { label: 'MDN HTML reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
        { label: 'W3C standards', url: 'https://www.w3.org/TR/html52' },
        { label: 'A11y Project', url: 'https://www.a11yproject.com' }
      ],
    },
    'CSS3 & Flexbox': {
      overview: 'Modern CSS layout techniques with Flexbox.',
      key_topics: ['Flexbox container & items', 'justify-content & align-items', 'Flex-grow & flex-shrink', 'Responsive layouts'],
      resources: [
        { label: 'CSS Tricks – Complete Guide to Flexbox', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox' },
        { label: 'MDN Flexbox', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox' },
        { label: 'Flexbox Froggy game', url: 'https://flexboxfroggy.com' }
      ],
    },
    'CSS Grid': {
      overview: 'Two-dimensional layout system with CSS Grid.',
      key_topics: ['Grid container & items', 'Grid columns & rows', 'Grid template areas', 'Alignment & justification'],
      resources: [
        { label: 'CSS Tricks – Complete Guide to Grid', url: 'https://css-tricks.com/snippets/css/complete-guide-grid' },
        { label: 'Grid Garden game', url: 'https://cssgridgarden.com' },
        { label: 'MDN CSS Grid', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout' }
      ],
    },
    'Responsive Design': {
      overview: 'Creating websites that work across all device sizes.',
      key_topics: ['Media queries', 'Mobile-first approach', 'Viewport meta tag', 'Fluid typography & images'],
      resources: [
        { label: 'MDN Responsive Design', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design' },
        { label: 'Mobile-First CSS', url: 'https://www.mobileresponsive.org' },
        { label: 'Frontend Mentor challenges', url: 'https://frontendmentor.io' }
      ],
    },
    'Browser DevTools': {
      overview: 'Debugging and inspecting web applications.',
      key_topics: ['Inspector & elements', 'Console & debugging', 'Network tab', 'Performance profiling'],
      resources: [
        { label: 'Chrome DevTools docs', url: 'https://developer.chrome.com/docs/devtools' },
        { label: 'Firefox Developer Edition', url: 'https://www.mozilla.org/en-US/firefox/developer' },
        { label: 'Web development debugging guide', url: 'https://developer.mozilla.org/en-US/docs/Learn' }
      ],
    },
    'ES6+ Syntax': {
      overview: 'Modern JavaScript syntax and features.',
      key_topics: ['Let/const vs var', 'Arrow functions', 'Template literals', 'Destructuring & spread operator'],
      resources: [
        { label: 'JavaScript.info', url: 'https://javascript.info' },
        { label: 'You Don\'t Know JS', url: 'https://github.com/getify/You-Dont-Know-JS' },
        { label: 'MDN JavaScript guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' }
      ],
    },
    'DOM Manipulation': {
      overview: 'Interacting with and modifying the Document Object Model.',
      key_topics: ['Selecting elements', 'Event listeners', 'DOM traversal', 'Creating & removing elements'],
      resources: [
        { label: 'MDN DOM docs', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model' },
        { label: 'JavaScript30 challenges', url: 'https://javascript30.com' },
        { label: 'DOM interactive tutorials', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript' }
      ],
    },
    'Fetch API & Promises': {
      overview: 'Making asynchronous HTTP requests in JavaScript.',
      key_topics: ['Fetch syntax', 'Promise chaining', 'Error handling', 'JSON parsing'],
      resources: [
        { label: 'MDN Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API' },
        { label: 'Promise tutorials', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise' },
        { label: 'JSONPlaceholder API', url: 'https://jsonplaceholder.typicode.com' }
      ],
    },
    'Async / Await': {
      overview: 'Cleaner asynchronous JavaScript with async/await syntax.',
      key_topics: ['Async functions', 'Await keyword', 'Error handling with try/catch', 'Concurrent requests'],
      resources: [
        { label: 'MDN async/await', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises' },
        { label: 'JavaScript promises deep dive', url: 'https://javascript.info/async-await' },
        { label: 'Async patterns guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises' }
      ],
    },
    'LocalStorage': {
      overview: 'Client-side web storage for persisting data.',
      key_topics: ['localStorage API', 'Data serialization', 'Storage limits', 'SessionStorage vs localStorage'],
      resources: [
        { label: 'MDN Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API' },
        { label: 'localStorage guide', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage' },
        { label: 'Data persistence patterns', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript' }
      ],
    },
    'React Fundamentals': {
      overview: 'Core concepts of the React library.',
      key_topics: ['Components & JSX', 'Props & state', 'Rendering & re-rendering', 'Component lifecycle'],
      resources: [
        { label: 'React official docs', url: 'https://react.dev' },
        { label: 'React tutorial', url: 'https://react.dev/learn' },
        { label: 'Virtual DOM explanation', url: 'https://react.dev/learn/preserving-and-resetting-state' }
      ],
    },
    'React Hooks': {
      overview: 'Modern React function component features.',
      key_topics: ['useState hook', 'useEffect hook', 'Custom hooks', 'Hook rules & best practices'],
      resources: [
        { label: 'React Hooks documentation', url: 'https://react.dev/reference/react/hooks' },
        { label: 'useEffect deep dive', url: 'https://react.dev/reference/react/useEffect' },
        { label: 'Building custom hooks', url: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }
      ],
    },
    'React Router': {
      overview: 'Client-side routing for single-page applications.',
      key_topics: ['Routes & routing', 'Navigation', 'Dynamic routes', 'Nested routing & layouts'],
      resources: [
        { label: 'React Router docs', url: 'https://reactrouter.com' },
        { label: 'React Router tutorial', url: 'https://reactrouter.com/start/overview' },
        { label: 'SPA routing patterns', url: 'https://reactrouter.com/en/main/guides/design-philosophy' }
      ],
    },
    'State Management (Zustand)': {
      overview: 'Managing global application state efficiently.',
      key_topics: ['State stores', 'Actions & mutations', 'Context vs Redux vs Zustand', 'Debugging state'],
      resources: [
        { label: 'Zustand documentation', url: 'https://github.com/pmndrs/zustand' },
        { label: 'Redux Toolkit', url: 'https://redux-toolkit.js.org' },
        { label: 'State management comparison', url: 'https://react.dev/learn/passing-data-deeply-with-context' }
      ],
    },
    'REST & GraphQL APIs': {
      overview: 'Consuming APIs from frontend applications.',
      key_topics: ['REST principles', 'HTTP methods', 'GraphQL queries & mutations', 'Error handling & retries'],
      resources: [
        { label: 'API design best practices', url: 'https://restfulapi.net' },
        { label: 'GraphQL.org', url: 'https://graphql.org/learn' },
        { label: 'API integration patterns', url: 'https://developer.mozilla.org/en-US/docs/Web/API' }
      ],
    },
    'Testing (Vitest)': {
      overview: 'Writing and running unit tests for JavaScript.',
      key_topics: ['Unit testing basics', 'Mocking', 'Test coverage', 'Component testing'],
      resources: [
        { label: 'Vitest documentation', url: 'https://vitest.dev' },
        { label: 'Testing Library', url: 'https://testing-library.com' },
        { label: 'Jest guide', url: 'https://jestjs.io' }
      ],
    },
    'Vite / Webpack': {
      overview: 'Module bundlers for JavaScript applications.',
      key_topics: ['Bundling & optimization', 'Code splitting', 'Dev server', 'Asset loading'],
      resources: [
        { label: 'Vite documentation', url: 'https://vitejs.dev' },
        { label: 'Webpack docs', url: 'https://webpack.js.org' },
        { label: 'Module bundling guide', url: 'https://webpack.js.org/guides' }
      ],
    },
    'Web Performance (Core Web Vitals)': {
      overview: 'Optimizing website speed and user experience.',
      key_topics: ['LCP (Largest Contentful Paint)', 'FID (First Input Delay)', 'CLS (Cumulative Layout Shift)', 'Image optimization'],
      resources: [
        { label: 'web.dev Vitals', url: 'https://web.dev/vitals' },
        { label: 'Lighthouse', url: 'https://developers.google.com/web/tools/lighthouse' },
        { label: 'Performance profiling', url: 'https://developer.chrome.com/docs/devtools/performance' }
      ],
    },
    'Accessibility (WCAG)': {
      overview: 'Building inclusive websites for all users.',
      key_topics: ['Semantic HTML', 'ARIA roles', 'Keyboard navigation', 'Color contrast & screen readers'],
      resources: [
        { label: 'WCAG guidelines', url: 'https://www.w3.org/WAI/WCAG21/quickref' },
        { label: 'A11y Project', url: 'https://www.a11yproject.com' },
        { label: 'Axe DevTools', url: 'https://www.deque.com/axe/devtools' }
      ],
    },
    'CI/CD & Deployment': {
      overview: 'Automating testing and deployment of web applications.',
      key_topics: ['GitHub Actions', 'Automated testing', 'Deployment pipelines', 'Continuous integration'],
      resources: [
        { label: 'GitHub Actions docs', url: 'https://docs.github.com/en/actions' },
        { label: 'CI/CD best practices', url: 'https://www.atlassian.com/continuous-delivery/ci-cd' },
        { label: 'Deployment guides', url: 'https://vercel.com/guides' }
      ],
    },

    // Backend Developer
    'Node.js / Python Basics': {
      overview: 'Server-side programming languages and runtime.',
      key_topics: ['Hello world program', 'Modules & packages', 'File I/O operations', 'Package managers (npm, pip)'],
      resources: [
        { label: 'Node.js Official Docs', url: 'https://nodejs.org/docs' },
        { label: 'CS50 Python – Harvard', url: 'https://cs50.harvard.edu/python' },
        { label: 'Python tutorial', url: 'https://docs.python.org/3/tutorial' }
      ],
    },
    'Data Structures': {
      overview: 'Fundamental data organization patterns.',
      key_topics: ['Arrays & lists', 'Hash maps & dictionaries', 'Stacks & queues', 'Trees & graphs'],
      resources: [
        { label: 'Visualgo', url: 'https://visualgo.net' },
        { label: 'LeetCode', url: 'https://leetcode.com' },
        { label: 'Data Structures & Algorithms course', url: 'https://www.udacity.com/course/data-structures-and-algorithms-nanodegree--nd256' }
      ],
    },
    'OOP Principles': {
      overview: 'Object-Oriented Programming design concepts.',
      key_topics: ['Classes & objects', 'Inheritance', 'Encapsulation', 'Polymorphism & abstraction'],
      resources: [
        { label: 'Design Patterns book', url: 'https://www.refactoring.guru/design-patterns' },
        { label: 'OOP in Python/Node.js', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects' },
        { label: 'SOLID principles', url: 'https://en.wikipedia.org/wiki/SOLID' }
      ],
    },
    'Git & Version Control': {
      overview: 'Managing code versions and collaboration with Git.',
      key_topics: ['Git workflow', 'Branches & merging', 'Pull requests', 'Resolving conflicts'],
      resources: [
        { label: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2' },
        { label: 'GitHub Learning Lab', url: 'https://github.skills.io' },
        { label: 'Atlassian Git tutorial', url: 'https://www.atlassian.com/git' }
      ],
    },
    'Express / FastAPI': {
      overview: 'Web frameworks for building REST APIs.',
      key_topics: ['Routing', 'Middleware', 'Request/response handling', 'Error handling'],
      resources: [
        { label: 'Express.js Guide', url: 'https://expressjs.com' },
        { label: 'FastAPI docs', url: 'https://fastapi.tiangolo.com' },
        { label: 'Building REST APIs', url: 'https://restfulapi.net' }
      ],
    },
    'REST API Design': {
      overview: 'Designing RESTful web services.',
      key_topics: ['HTTP methods (GET, POST, PUT, DELETE)', 'Status codes', 'URL design', 'Versioning & pagination'],
      resources: [
        { label: 'REST API best practices', url: 'https://restfulapi.net' },
        { label: 'HTTP status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
        { label: 'API design guide', url: 'https://swagger.io/resources/articles/best-practices-in-api-design' }
      ],
    },
    'PostgreSQL': {
      overview: 'Relational database management system.',
      key_topics: ['Tables & schemas', 'Relationships & foreign keys', 'Indexes & optimization', 'Transactions'],
      resources: [
        { label: 'PostgreSQL Tutorial', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
        { label: 'SQL tutorial', url: 'https://www.postgresql.org/docs/current/sql.html' },
        { label: 'Database design', url: 'https://www.postgresql.org/docs/current/ddl.html' }
      ],
    },
    'MongoDB': {
      overview: 'NoSQL document database.',
      key_topics: ['Collections & documents', 'BSON format', 'Querying & indexing', 'Aggregation pipelines'],
      resources: [
        { label: 'MongoDB University', url: 'https://university.mongodb.com' },
        { label: 'MongoDB documentation', url: 'https://docs.mongodb.com' },
        { label: 'NoSQL vs SQL comparison', url: 'https://www.mongodb.com/blog/post/relational-vs-non-relational-databases' }
      ],
    },
    'ORM (Prisma / SQLAlchemy)': {
      overview: 'Object-Relational Mapping for database interaction.',
      key_topics: ['Model definitions', 'Query building', 'Migrations', 'Relationships mapping'],
      resources: [
        { label: 'Prisma documentation', url: 'https://www.prisma.io/docs' },
        { label: 'SQLAlchemy ORM', url: 'https://docs.sqlalchemy.org/en/20/orm' },
        { label: 'Database abstraction', url: 'https://en.wikipedia.org/wiki/Object-relational_mapping' }
      ],
    },
    'Authentication (JWT)': {
      overview: 'Securing APIs with JSON Web Tokens.',
      key_topics: ['Token generation & validation', 'Payload encoding', 'Expiration & refresh', 'Security best practices'],
      resources: [
        { label: 'JWT.io', url: 'https://jwt.io' },
        { label: 'Auth0 JWT articles', url: 'https://auth0.com/blog/search/?query=jwt' },
        { label: 'OAuth2 & OpenID', url: 'https://openid.net' }
      ],
    },
    'Redis Caching': {
      overview: 'In-memory data store for caching.',
      key_topics: ['Key-value storage', 'Cache strategies', 'TTL & expiration', 'Pub/Sub messaging'],
      resources: [
        { label: 'Redis documentation', url: 'https://redis.io/documentation' },
        { label: 'Redis University', url: 'https://university.redis.com' },
        { label: 'Caching patterns', url: 'https://redis.io/topics/patterns' }
      ],
    },
    'Message Queues (RabbitMQ)': {
      overview: 'Asynchronous task processing and messaging.',
      key_topics: ['Queues & exchanges', 'Message routing', 'Consumer patterns', 'Reliability & persistence'],
      resources: [
        { label: 'RabbitMQ Tutorials', url: 'https://www.rabbitmq.com/getstarted.html' },
        { label: 'Message queue patterns', url: 'https://www.rabbitmq.com/documentation.html' },
        { label: 'Async task processing', url: 'https://www.rabbitmq.com/tutorials' }
      ],
    },
    'GraphQL': {
      overview: 'Query language for APIs with precise data fetching.',
      key_topics: ['Queries & mutations', 'Schema definition', 'Resolvers', 'Subscriptions'],
      resources: [
        { label: 'GraphQL.org', url: 'https://graphql.org' },
        { label: 'Apollo Server docs', url: 'https://www.apollographql.com/docs/apollo-server' },
        { label: 'GraphQL best practices', url: 'https://graphql.org/learn' }
      ],
    },
    'WebSockets': {
      overview: 'Real-time bidirectional communication protocol.',
      key_topics: ['WebSocket connection lifecycle', 'Message sending/receiving', 'Rooms & namespaces', 'Scaling considerations'],
      resources: [
        { label: 'Socket.io tutorial', url: 'https://socket.io/docs/v4/tutorial' },
        { label: 'WebSocket protocol', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket' },
        { label: 'Real-time applications', url: 'https://socket.io/docs/v4' }
      ],
    },
    'Microservices Patterns': {
      overview: 'Architecture for scalable distributed systems.',
      key_topics: ['Service decomposition', 'Inter-service communication', 'API Gateway', 'Database per service'],
      resources: [
        { label: 'Microservices patterns', url: 'https://microservices.io/patterns' },
        { label: 'Sam Newman books', url: 'https://www.amazon.com/Building-Microservices-Designing-Fine-Grained-Systems/dp/1491950358' },
        { label: 'Distributed systems design', url: 'https://developers.google.com/architecture/microservices' }
      ],
    },
    'Docker': {
      overview: 'Containerization for consistent environments.',
      key_topics: ['Docker images & containers', 'Dockerfile', 'Docker Compose', 'Container networking'],
      resources: [
        { label: 'Docker Getting Started', url: 'https://docs.docker.com/get-started' },
        { label: 'Docker documentation', url: 'https://docs.docker.com' },
        { label: 'Container orchestration', url: 'https://docs.docker.com/compose' }
      ],
    },
    'CI/CD Pipelines': {
      overview: 'Automated testing and deployment workflows.',
      key_topics: ['Pipeline stages', 'Automated testing', 'Build artifacts', 'Deploy triggers'],
      resources: [
        { label: 'GitHub Actions docs', url: 'https://docs.github.com/en/actions' },
        { label: 'GitLab CI/CD', url: 'https://docs.gitlab.com/ee/ci' },
        { label: 'Jenkins tutorial', url: 'https://www.jenkins.io/doc' }
      ],
    },
    'AWS / GCP Basics': {
      overview: 'Cloud platform fundamentals.',
      key_topics: ['Virtual machines (EC2)', 'Managed databases (RDS)', 'Storage (S3)', 'Serverless functions (Lambda)'],
      resources: [
        { label: 'AWS Free Tier Projects', url: 'https://aws.amazon.com/free' },
        { label: 'AWS documentation', url: 'https://docs.aws.amazon.com' },
        { label: 'Cloud computing guide', url: 'https://cloud.google.com/architecture' }
      ],
    },
    'API Security': {
      overview: 'Securing API endpoints and data.',
      key_topics: ['HTTPS/TLS', 'API key management', 'Rate limiting', 'Input validation & sanitization'],
      resources: [
        { label: 'OWASP API security', url: 'https://owasp.org/www-project-api-security' },
        { label: 'API security checklist', url: 'https://github.com/shieldfy/API-Security-Checklist' },
        { label: 'Security best practices', url: 'https://cheatsheetseries.owasp.org/cheatsheets/API_Security_Cheat_Sheet.html' }
      ],
    },

    // Software Engineer / DevOps / ML / etc
    'Big-O Analysis': {
      overview: 'Understanding algorithm time and space complexity.',
      key_topics: ['Time complexity', 'Space complexity', 'Best/worst/average case', 'Big O notation'],
      resources: [
        { label: 'Big O Cheat Sheet', url: 'https://www.bigocheatsheet.com' },
        { label: 'Algorithm complexity guide', url: 'https://en.wikipedia.org/wiki/Time_complexity' },
        { label: 'Visualgo', url: 'https://visualgo.net' }
      ],
    },
    'Arrays & Linked Lists': {
      overview: 'Fundamental linear data structures.',
      key_topics: ['Array operations', 'Linked list traversal', 'Insertion & deletion', 'Reverse & rotation'],
      resources: [
        { label: 'LeetCode Easy problems', url: 'https://leetcode.com/problemset/all/?difficulty=EASY' },
        { label: 'Algorithm visualization', url: 'https://visualgo.net/en/list' },
        { label: 'DSA books', url: 'https://www.geeksforgeeks.org/data-structures' }
      ],
    },
    'Trees & Graphs': {
      overview: 'Hierarchical and networked data structures.',
      key_topics: ['Binary trees', 'Tree traversal (DFS, BFS)', 'Graph representation', 'Shortest path algorithms'],
      resources: [
        { label: 'Tree visualization', url: 'https://visualgo.net/en/bst' },
        { label: 'Graph algorithms', url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms' },
        { label: 'LeetCode problems', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions' }
      ],
    },
    'Sorting & Searching': {
      overview: 'Fundamental algorithms for data organization.',
      key_topics: ['Merge sort, quick sort', 'Binary search', 'Search optimization', 'Space-time tradeoffs'],
      resources: [
        { label: 'Sorting visualizations', url: 'https://visualgo.net/en/sorting' },
        { label: 'Algorithm tutorials', url: 'https://www.geeksforgeeks.org/sorting-algorithms' },
        { label: 'LeetCode practice', url: 'https://leetcode.com/problemset/all/?topicSlugs=sorting' }
      ],
    },
    'Recursion & Dynamic Programming': {
      overview: 'Problem-solving techniques for complex problems.',
      key_topics: ['Recursive thinking', 'Base cases & recurrence', 'Memoization', 'DP patterns'],
      resources: [
        { label: 'DP problem guide', url: 'https://www.geeksforgeeks.org/dynamic-programming' },
        { label: 'Recursion tutorials', url: 'https://www.geeksforgeeks.org/recursion' },
        { label: 'LeetCode DP problems', url: 'https://leetcode.com/problemset/all/?topicSlugs=dynamic-programming' }
      ],
    },
    'SOLID Principles': {
      overview: 'Software design principles for maintainable code.',
      key_topics: ['Single Responsibility', 'Open/Closed', 'Liskov Substitution', 'Dependency Inversion'],
      resources: [
        { label: 'Clean Code book', url: 'https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882' },
        { label: 'SOLID explanation', url: 'https://www.baeldung.com/solid-principles' },
        { label: 'Design patterns', url: 'https://www.refactoring.guru/design-patterns' }
      ],
    },
    'Design Patterns (GoF)': {
      overview: 'Reusable solutions to common design problems.',
      key_topics: ['Creational patterns', 'Structural patterns', 'Behavioral patterns', 'Pattern trade-offs'],
      resources: [
        { label: 'Refactoring.Guru patterns', url: 'https://www.refactoring.guru/design-patterns' },
        { label: 'Design Patterns book', url: 'https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612' },
        { label: 'Pattern implementations', url: 'https://github.com/kamranahmedse/design-patterns-for-humans' }
      ],
    },
    'Load Balancing': {
      overview: 'Distributing traffic across multiple servers.',
      key_topics: ['Load balancer types', 'Routing algorithms', 'Session persistence', 'Health checks'],
      resources: [
        { label: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
        { label: 'Load balancing guide', url: 'https://www.nginx.com/resources/glossary/load-balancing' },
        { label: 'Architecture patterns', url: 'https://microservices.io/patterns/deployment/service-mesh.html' }
      ],
    },
    'CAP Theorem': {
      overview: 'Fundamental trade-offs in distributed systems.',
      key_topics: ['Consistency', 'Availability', 'Partition tolerance', 'Choosing trade-offs'],
      resources: [
        { label: 'CAP Theorem explained', url: 'https://www.ibm.com/cloud/learn/cap-theorem' },
        { label: 'Distributed systems basics', url: 'https://en.wikipedia.org/wiki/CAP_theorem' },
        { label: 'NoSQL databases', url: 'https://www.mongodb.com/blog/post/cap-theorem' }
      ],
    },
    'Databases at Scale': {
      overview: 'Managing databases in high-traffic scenarios.',
      key_topics: ['Sharding', 'Replication', 'Read replicas', 'Query optimization'],
      resources: [
        { label: 'Designing Data-Intensive Apps', url: 'https://www.oreilly.com/library/view/designing-data-intensive-applications/9781491902929' },
        { label: 'Database scaling', url: 'https://www.postgresql.org/docs/current/warm-standby.html' },
        { label: 'Replica patterns', url: 'https://www.postgresql.org/docs/current/runtime-config-replication.html' }
      ],
    },
    'Linux Command Line': {
      overview: 'Master the Linux terminal and command-line interface.',
      key_topics: ['File navigation (cd, ls, pwd)', 'File operations (cp, mv, rm)', 'Text processing (grep, sed, awk)', 'Permissions and ownership'],
      resources: [
        { label: 'The Linux Command Line book', url: 'https://linuxcommand.org/lc3_learning_the_shell.php' },
        { label: 'Linuxize tutorials', url: 'https://linuxize.com' },
        { label: 'Bash scripting guides', url: 'https://www.gnu.org/software/bash/manual' }
      ],
    },
    'Bash Scripting': {
      overview: 'Learn to automate tasks with Bash shell scripts.',
      key_topics: ['Variables and data types', 'Conditionals and loops', 'Functions and error handling', 'Script debugging techniques'],
      resources: [
        { label: 'Bash manual pages', url: 'https://www.gnu.org/software/bash/manual' },
        { label: 'Google Cloud Shell scripting', url: 'https://cloud.google.com/shell/docs/how-cloud-shell-works' },
        { label: 'Advanced Bash scripting guide', url: 'https://www.tldp.org/LDP/abs/html' }
      ],
    },
    'Networking Basics (TCP/IP, DNS)': {
      overview: 'Understand core networking protocols and concepts.',
      key_topics: ['OSI model and TCP/IP stack', 'IP addressing and subnetting', 'DNS resolution process', 'Common ports and protocols'],
      resources: [
        { label: 'Computer Networks (Kurose & Ross)', url: 'https://www.pearson.com/us/higher-education/product/Kurose-Computer-Networking-8th-Edition/9780136681151.html' },
        { label: 'Cisco CCNA materials', url: 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/expert.html' },
        { label: 'Professor Messer videos', url: 'https://www.professormesser.com' }
      ],
    },
    'SSH & Security Basics': {
      overview: 'Secure remote access and foundational security practices.',
      key_topics: ['SSH keys and authentication', 'Public/private key cryptography', 'Firewalls and security groups', 'Common vulnerabilities'],
      resources: [
        { label: 'SSH documentation', url: 'https://www.ssh.com/ssh/protocol' },
        { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten' },
        { label: 'Linux security hardening guides', url: 'https://www.cisecurity.org/cis-benchmarks' }
      ],
    },
    'Docker & Docker Compose': {
      overview: 'Containerization and multi-container orchestration.',
      key_topics: ['Dockerfile syntax', 'Image building', 'Docker Compose services', 'Container networking'],
      resources: [
        { label: 'Docker documentation', url: 'https://docs.docker.com' },
        { label: 'Docker Compose guide', url: 'https://docs.docker.com/compose' },
        { label: 'Container best practices', url: 'https://docs.docker.com/develop/dev-best-practices' }
      ],
    },
    'Kubernetes Basics': {
      overview: 'Container orchestration platform for scaling.',
      key_topics: ['Pods & deployments', 'Services & networking', 'ConfigMaps & Secrets', 'Persistent volumes'],
      resources: [
        { label: 'Kubernetes documentation', url: 'https://kubernetes.io/docs' },
        { label: 'Kubernetes the Hard Way', url: 'https://github.com/kelseyhightower/kubernetes-the-hard-way' },
        { label: 'K8s tutorials', url: 'https://kubernetes.io/docs/tutorials' }
      ],
    },
    'GitHub Actions': {
      overview: 'Automation and CI/CD with GitHub workflows.',
      key_topics: ['Workflow syntax', 'Actions & jobs', 'Triggers & events', 'Artifacts & caching'],
      resources: [
        { label: 'GitHub Actions documentation', url: 'https://docs.github.com/en/actions' },
        { label: 'Workflow examples', url: 'https://github.com/actions' },
        { label: 'CI/CD automation', url: 'https://docs.github.com/en/actions/learn-github-actions' }
      ],
    },
    'Jenkins / GitLab CI': {
      overview: 'Alternative CI/CD platforms for automation.',
      key_topics: ['Pipeline configuration', 'Stages & jobs', 'Plugins & integrations', 'Distributed builds'],
      resources: [
        { label: 'Jenkins documentation', url: 'https://www.jenkins.io/doc' },
        { label: 'GitLab CI guide', url: 'https://docs.gitlab.com/ee/ci' },
        { label: 'Pipeline tutorials', url: 'https://www.jenkins.io/doc/tutorials' }
      ],
    },
    'Artifact Registries': {
      overview: 'Managing and storing build artifacts and container images.',
      key_topics: ['Image registry (Docker Hub, ECR)', 'Artifact versioning', 'Image scanning', 'Access control'],
      resources: [
        { label: 'Container registry docs', url: 'https://docs.docker.com/docker-hub' },
        { label: 'Image management', url: 'https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html' },
        { label: 'Security scanning', url: 'https://docs.docker.com/docker-hub/vulnerability-scans' }
      ],
    },
    'AWS Core Services': {
      overview: 'Essential Amazon Web Services for cloud infrastructure.',
      key_topics: ['EC2, S3, RDS', 'Lambda & API Gateway', 'IAM & security', 'CloudWatch monitoring'],
      resources: [
        { label: 'AWS documentation', url: 'https://docs.aws.amazon.com' },
        { label: 'AWS training', url: 'https://aws.amazon.com/training' },
        { label: 'AWS certification prep', url: 'https://aws.amazon.com/certification' }
      ],
    },
    'Terraform': {
      overview: 'Infrastructure as Code for cloud resources.',
      key_topics: ['HCL syntax', 'State management', 'Modules & reusability', 'Provisioners'],
      resources: [
        { label: 'Terraform documentation', url: 'https://www.terraform.io/docs' },
        { label: 'HashiCorp tutorials', url: 'https://learn.hashicorp.com/terraform' },
        { label: 'IaC best practices', url: 'https://cloud.hashicorp.com/resources' }
      ],
    },
    'Ansible': {
      overview: 'Configuration management and automation tool.',
      key_topics: ['Playbooks & roles', 'Inventory management', 'Variables & facts', 'Error handling'],
      resources: [
        { label: 'Ansible documentation', url: 'https://docs.ansible.com' },
        { label: 'Ansible tutorials', url: 'https://www.ansible.com/resources/get-started' },
        { label: 'Configuration management guide', url: 'https://www.ansible.com/use-cases' }
      ],
    },
    'Cloud Networking (VPC, Load Balancers)': {
      overview: 'Network architecture in cloud environments.',
      key_topics: ['Virtual Private Cloud (VPC)', 'Subnets & routing', 'Security groups & NACLs', 'Load balancer configuration'],
      resources: [
        { label: 'VPC basics', url: 'https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html' },
        { label: 'Networking guide', url: 'https://docs.aws.amazon.com/vpc/latest/userguide' },
        { label: 'Cloud architecture', url: 'https://cloud.google.com/architecture' }
      ],
    },
    'Secrets Management': {
      overview: 'Safely handling sensitive credentials and data.',
      key_topics: ['Secret rotation', 'Encryption at rest', 'Access policies', 'Audit logging'],
      resources: [
        { label: 'HashiCorp Vault', url: 'https://www.vaultproject.io' },
        { label: 'AWS Secrets Manager', url: 'https://docs.aws.amazon.com/secretsmanager' },
        { label: 'Secrets management guide', url: 'https://www.vaultproject.io/use-cases' }
      ],
    },
    'Prometheus & Grafana': {
      overview: 'Monitoring and visualization for observability.',
      key_topics: ['Metrics collection', 'Time-series data', 'Dashboards & alerts', 'PromQL queries'],
      resources: [
        { label: 'Prometheus docs', url: 'https://prometheus.io/docs' },
        { label: 'Grafana tutorials', url: 'https://grafana.com/docs/grafana/latest' },
        { label: 'Observability guide', url: 'https://grafana.com/blog' }
      ],
    },
    'ELK Stack (Logging)': {
      overview: 'Centralized logging with Elasticsearch, Logstash, Kibana.',
      key_topics: ['Event parsing', 'Index management', 'Log aggregation', 'Visualization'],
      resources: [
        { label: 'ELK documentation', url: 'https://www.elastic.co/guide/index.html' },
        { label: 'Logging best practices', url: 'https://www.elastic.co/blog' },
        { label: 'Log analysis', url: 'https://www.elastic.co/guide/en/kibana/current/index.html' }
      ],
    },
    'SLOs & Incident Response': {
      overview: 'Service level objectives and handling production issues.',
      key_topics: ['SLO definition', 'Error budgets', 'On-call rotation', 'Incident postmortems'],
      resources: [
        { label: 'Google SRE book', url: 'https://sre.google/books' },
        { label: 'Incident management', url: 'https://www.atlassian.com/incident-management' },
        { label: 'SLO guidelines', url: 'https://www.atlassian.com/incident-management/postmortem' }
      ],
    },
    'FinOps Basics': {
      overview: 'Cost optimization and financial management in cloud.',
      key_topics: ['Cost analysis', 'Reserved instances', 'Spot instances', 'Waste identification'],
      resources: [
        { label: 'FinOps foundation', url: 'https://www.finops.org' },
        { label: 'Cloud cost optimization', url: 'https://aws.amazon.com/aws-cost-management' },
        { label: 'Cost reporting', url: 'https://docs.aws.amazon.com/awsaccountbilling' }
      ],
    },
    'Linear Algebra': {
      overview: 'Mathematical foundation for machine learning.',
      key_topics: ['Vectors & matrices', 'Matrix operations', 'Eigenvalues & eigenvectors', 'Singular Value Decomposition'],
      resources: [
        { label: '3Blue1Brown Essence of Linear Algebra', url: 'https://www.3blue1brown.com/topics/linear-algebra' },
        { label: 'MIT OpenCourseWare', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010' },
        { label: 'Linear Algebra book', url: 'https://www.amazon.com/Linear-Algebra-Its-Applications-5th/dp/032198238X' }
      ],
    },
    'Calculus (Derivatives)': {
      overview: 'Calculus basics for understanding optimization.',
      key_topics: ['Derivatives & chain rule', 'Partial derivatives', 'Gradient descent', 'Newton\'s method'],
      resources: [
        { label: 'Khan Academy Calculus', url: 'https://www.khanacademy.org/math/calculus-1' },
        { label: 'Calculus textbooks', url: 'https://www.amazon.com/Calculus-James-Stewart/dp/1285740629' },
        { label: 'Optimization visualization', url: 'https://www.3blue1brown.com/topics/gradient-descent' }
      ],
    },
    'Probability & Statistics': {
      overview: 'Probabilistic foundations for data science.',
      key_topics: ['Probability distributions', 'Bayes\' theorem', 'Hypothesis testing', 'Confidence intervals'],
      resources: [
        { label: 'StatQuest with Josh Starmer', url: 'https://www.youtube.com/c/joshstarmer' },
        { label: 'Probability & Statistics course', url: 'https://www.khanacademy.org/math/statistics-probability' },
        { label: 'Bayesian inference', url: 'https://betanalpha.github.io/assets/case_studies/bayesian_logistic_regression.html' }
      ],
    },
    'Regression & Classification': {
      overview: 'Core supervised learning algorithms.',
      key_topics: ['Linear regression', 'Logistic regression', 'Classification metrics', 'Regularization'],
      resources: [
        { label: 'Scikit-learn tutorials', url: 'https://scikit-learn.org/stable/modules/classes.html' },
        { label: 'Machine Learning basics', url: 'https://www.coursera.org/learn/machine-learning' },
        { label: 'Andrew Ng course', url: 'https://www.deeplearning.ai/courses' }
      ],
    },
    'Decision Trees & Random Forests': {
      overview: 'Tree-based ensemble learning methods.',
      key_topics: ['Tree splitting criteria', 'Ensemble methods', 'Feature importance', 'Pruning & overfitting'],
      resources: [
        { label: 'Scikit-learn documentation', url: 'https://scikit-learn.org/stable/modules/ensemble.html' },
        { label: 'Ensemble learning', url: 'https://www.amazon.com/Ensemble-Methods-Learning-Gregory-Schumer/dp/B08FDNNQ2G' },
        { label: 'Tree visualization', url: 'https://www.dtree.org' }
      ],
    },
    'Clustering (K-Means)': {
      overview: 'Unsupervised learning for data grouping.',
      key_topics: ['K-means algorithm', 'Choosing K', 'Distance metrics', 'Clustering evaluation'],
      resources: [
        { label: 'K-means tutorial', url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means' },
        { label: 'Clustering algorithms', url: 'https://en.wikipedia.org/wiki/Cluster_analysis' },
        { label: 'Scikit-learn clustering', url: 'https://scikit-learn.org/stable/modules/clustering.html' }
      ],
    },
    'Feature Engineering': {
      overview: 'Creating effective features for machine learning models.',
      key_topics: ['Feature scaling', 'Categorical encoding', 'Feature selection', 'Polynomial features'],
      resources: [
        { label: 'Feature Engineering book', url: 'https://www.amazon.com/Feature-Engineering-Machine-Real-World-Systems/dp/1491953896' },
        { label: 'Kaggle competitions', url: 'https://kaggle.com/competitions' },
        { label: 'Feature scaling guide', url: 'https://scikit-learn.org/stable/modules/preprocessing.html' }
      ],
    },
    'Model Evaluation & Cross-Validation': {
      overview: 'Assessing machine learning model performance.',
      key_topics: ['Train/test/validation splits', 'Cross-validation strategies', 'Evaluation metrics', 'ROC curves'],
      resources: [
        { label: 'Scikit-learn model selection', url: 'https://scikit-learn.org/stable/modules/cross_validation.html' },
        { label: 'Cross-validation guide', url: 'https://en.wikipedia.org/wiki/Cross-validation_(statistics)' },
        { label: 'Evaluation metrics', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html' }
      ],
    },
    'Neural Networks & Backprop': {
      overview: 'Deep learning fundamentals.',
      key_topics: ['Neurons & activation functions', 'Forward & backward propagation', 'Gradient computation', 'Training dynamics'],
      resources: [
        { label: 'Neural Networks from scratch', url: 'https://github.com/eriklindernoren/ML-From-Scratch' },
        { label: 'Backpropagation visualization', url: 'https://www.3blue1brown.com/topics/neural-networks' },
        { label: 'Deep learning fundamentals', url: 'https://www.deeplearningbook.org' }
      ],
    },
    'TensorFlow / PyTorch': {
      overview: 'Deep learning frameworks.',
      key_topics: ['Tensor operations', 'Building models', 'Training loops', 'GPU acceleration'],
      resources: [
        { label: 'TensorFlow tutorials', url: 'https://www.tensorflow.org/tutorials' },
        { label: 'PyTorch documentation', url: 'https://pytorch.org/tutorials' },
        { label: 'Framework comparison', url: 'https://www.deeplearningbook.org' }
      ],
    },
    'CNNs (Computer Vision)': {
      overview: 'Convolutional Neural Networks for image tasks.',
      key_topics: ['Convolutional layers', 'Pooling operations', 'Architectural design', 'Image classification'],
      resources: [
        { label: 'CNN tutorials', url: 'https://www.tensorflow.org/tutorials/images/cnn' },
        { label: 'Image classification guide', url: 'https://paperswithcode.com/task/image-classification' },
        { label: 'Computer Vision papers', url: 'https://arxiv.org' }
      ],
    },
    'RNNs & LSTMs': {
      overview: 'Recurrent networks for sequential data.',
      key_topics: ['Recurrent units', 'Long Short-Term Memory', 'Sequence modeling', 'Vanishing gradients'],
      resources: [
        { label: 'RNN tutorial', url: 'https://www.tensorflow.org/tutorials/structured_data/time_series' },
        { label: 'LSTM explanation', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs' },
        { label: 'Sequence models', url: 'https://www.coursera.org/learn/nlp-sequence-models' }
      ],
    },
    'Transformers & Attention': {
      overview: 'Modern architecture for natural language processing.',
      key_topics: ['Self-attention mechanism', 'Transformer architecture', 'Multi-head attention', 'Positional encoding'],
      resources: [
        { label: 'Transformer tutorial', url: 'https://www.tensorflow.org/text/tutorials/transformer' },
        { label: 'The Annotated Transformer', url: 'http://nlp.seas.harvard.edu/2018/04/03/attention.html' },
        { label: 'Attention visualization', url: 'https://jalammar.github.io/illustrated-transformer' }
      ],
    },
    'Transfer Learning': {
      overview: 'Leveraging pre-trained models for new tasks.',
      key_topics: ['Fine-tuning', 'Feature extraction', 'Pre-trained models', 'Domain adaptation'],
      resources: [
        { label: 'Transfer Learning guide', url: 'https://cs231n.github.io/transfer-learning' },
        { label: 'HuggingFace models', url: 'https://huggingface.co/models' },
        { label: 'Domain generalization', url: 'https://github.com/jingleliu/awesome-transfer-learning' }
      ],
    },
    'MLflow / W&B': {
      overview: 'Experiment tracking and model management.',
      key_topics: ['Experiment logging', 'Hyperparameter tracking', 'Model registry', 'Comparison tools'],
      resources: [
        { label: 'MLflow documentation', url: 'https://mlflow.org/docs' },
        { label: 'Weights & Biases docs', url: 'https://docs.wandb.ai' },
        { label: 'Experiment management', url: 'https://mlflow.org/docs/latest/tracking' }
      ],
    },
    'Model Serving (FastAPI)': {
      overview: 'Deploying machine learning models as APIs.',
      key_topics: ['API endpoints', 'Model loading', 'Input validation', 'Scalability & performance'],
      resources: [
        { label: 'FastAPI framework', url: 'https://fastapi.tiangolo.com' },
        { label: 'Model serving guide', url: 'https://mlflow.org/docs/latest/models' },
        { label: 'Production ML', url: 'https://developers.google.com/machine-learning/guide/rules-of-ml' }
      ],
    },
    'Data Pipelines (Airflow)': {
      overview: 'Orchestrating data workflow automation.',
      key_topics: ['DAGs (Directed Acyclic Graphs)', 'Task dependencies', 'Scheduling', 'Error handling'],
      resources: [
        { label: 'Airflow documentation', url: 'https://airflow.apache.org/docs' },
        { label: 'Workflow orchestration', url: 'https://airflow.apache.org/docs/apache-airflow/stable/tutorial.html' },
        { label: 'Data engineering', url: 'https://www.udacity.com/course/data-engineer-nanodegree--nd027' }
      ],
    },
    'A/B Testing ML Models': {
      overview: 'Comparing model performance in production.',
      key_topics: ['Statistical testing', 'Canary deployments', 'Feature flags', 'Metrics interpretation'],
      resources: [
        { label: 'A/B testing guide', url: 'https://www.amazon.com/Trustworthy-Online-Controlled-Experiments-Practical/dp/1108724264' },
        { label: 'Experiment design', url: 'https://www.youtube.com/watch?v=O7RGvDtVN0o' },
        { label: 'Bayesian AB testing', url: 'https://www.evanmiller.org/bayesian-ab-testing.html' }
      ],
    },

    // UI/UX Designer (basic entries)
    'Design Principles': {
      overview: 'Fundamental concepts of good design.',
      key_topics: ['Contrast & emphasis', 'Alignment & spacing', 'Proximity & grouping', 'Visual balance'],
      resources: [
        { label: 'Design Fundamentals', url: 'https://www.youtube.com/c/CharliMarieTV' },
        { label: 'Laws of UX', url: 'https://lawsofux.com' },
        { label: 'Design thinking', url: 'https://www.nngroup.com/articles/design-thinking' }
      ],
    },
    'Color Theory': {
      overview: 'Understanding color relationships and psychology.',
      key_topics: ['Color harmony', 'Warm vs cool colors', 'Accessibility contrast', 'Color psychology'],
      resources: [
        { label: 'Color theory guide', url: 'https://www.interaction-design.org/literature/article/color-theory-for-designers-part-1' },
        { label: 'Accessible colors', url: 'https://www.nngroup.com/articles/contrast-ratio-errors' },
        { label: 'Adobe Color', url: 'https://color.adobe.com' }
      ],
    },
    'Typography': {
      overview: 'Selecting and using typefaces effectively.',
      key_topics: ['Font families', 'Hierarchy & sizing', 'Readability & legibility', 'Font pairing'],
      resources: [
        { label: 'Typography guide', url: 'https://www.nngroup.com/courses/typography-ux' },
        { label: 'Google Fonts', url: 'https://fonts.google.com' },
        { label: 'Typewolf', url: 'https://www.typewolf.com' }
      ],
    },
    'Layout & Grid': {
      overview: 'Organizing content with grids and layouts.',
      key_topics: ['Grid systems', 'Columns & rows', 'Whitespace', 'Responsive grids'],
      resources: [
        { label: 'Grid layout guide', url: 'https://www.interaction-design.org/literature/article/page-grids-for-web-design' },
        { label: 'Design systems', url: 'https://www.designsystems.com' },
        { label: 'Responsive design', url: 'https://www.smashingmagazine.com/responsive-web-design' }
      ],
    },
    'Figma Basics': {
      overview: 'Getting started with Figma design tool.',
      key_topics: ['Workspace & tools', 'Frames & layers', 'Components & variants', 'Prototyping basics'],
      resources: [
        { label: 'Figma tutorials', url: 'https://www.figma.com/resources/learn-design' },
        { label: 'Figma shortcuts', url: 'https://www.figma.com/shortcuts' },
        { label: 'Design tool mastery', url: 'https://www.figma.com/resources' }
      ],
    },
    'Visual Hierarchy': {
      overview: 'Guiding user attention through visual design.',
      key_topics: ['Size & scale', 'Color & contrast', 'Placement & proximity', 'Interactive cues'],
      resources: [
        { label: 'Visual hierarchy guide', url: 'https://www.nngroup.com/articles/visual-hierarchy' },
        { label: 'Information architecture', url: 'https://www.nngroup.com/articles/ia-vs-navigation' },
        { label: 'UX principles', url: 'https://www.nngroup.com/articles/ten-usability-heuristics' }
      ],
    },
    'User Research': {
      overview: 'Understanding user needs and behaviors.',
      key_topics: ['User interviews', 'Surveys & analytics', 'User personas', 'Journey mapping'],
      resources: [
        { label: 'UX research guide', url: 'https://www.nngroup.com/articles/ux-research-cheat-sheet' },
        { label: 'Interview techniques', url: 'https://www.nngroup.com/articles/user-interviews' },
        { label: 'Research methods', url: 'https://www.nngroup.com/articles/which-ux-research-methods' }
      ],
    },
    'Wireframing': {
      overview: 'Low-fidelity layouts for planning interfaces.',
      key_topics: ['Wireframe types', 'Content hierarchy', 'Flow & interactions', 'Feedback loops'],
      resources: [
        { label: 'Wireframing guide', url: 'https://www.nngroup.com/articles/wireframing-real-life-projects' },
        { label: 'Wireframe tools', url: 'https://www.nngroup.com/articles/mobile-wireframing-tools' },
        { label: 'Layout planning', url: 'https://www.nngroup.com/articles/big-payoff-sketching' }
      ],
    },
    'Prototyping': {
      overview: 'Interactive mockups for user testing.',
      key_topics: ['Interactive components', 'Animations & transitions', 'User flows', 'Prototype feedback'],
      resources: [
        { label: 'Prototyping guide', url: 'https://www.figma.com/resources/assets/prototyping-guide' },
        { label: 'Figma prototyping', url: 'https://www.figma.com/file/prototyping' },
        { label: 'InVision', url: 'https://www.invisionapp.com' }
      ],
    },
    'Usability Testing': {
      overview: 'Evaluating design through user testing.',
      key_topics: ['Test planning', 'Task scenarios', 'Observation & analysis', 'Insights & iterations'],
      resources: [
        { label: 'Usability testing guide', url: 'https://www.nngroup.com/articles/usability-testing-101' },
        { label: 'Testing methodologies', url: 'https://www.nngroup.com/articles/ux-research-methods' },
        { label: 'Remote testing tools', url: 'https://www.userlytics.com' }
      ],
    },
    'Information Architecture': {
      overview: 'Organizing information in user interfaces.',
      key_topics: ['Navigation structures', 'Labeling systems', 'Site maps', 'Content organization'],
      resources: [
        { label: 'IA guide', url: 'https://www.nngroup.com/articles/information-architecture' },
        { label: 'Navigation patterns', url: 'https://www.nngroup.com/articles/navigation-ia-design' },
        { label: 'Content strategy', url: 'https://www.nngroup.com/articles/content-strategy' }
      ],
    },
    'Interaction Design': {
      overview: 'Designing how users interact with interfaces.',
      key_topics: ['Feedback & response', 'Micro-interactions', 'Gestures & animations', 'State transitions'],
      resources: [
        { label: 'Interaction design guide', url: 'https://www.nngroup.com/articles/designing-interactions' },
        { label: 'Micro-interaction patterns', url: 'https://www.smashingmagazine.com/2020/03/animation-interaction-micro-interactions-state-transition' },
        { label: 'Animation principles', url: 'https://www.interaction-design.org/literature/article/animation' }
      ],
    },
    'Design Systems': {
      overview: 'Creating reusable design components.',
      key_topics: ['Component inventory', 'Design tokens', 'Consistency & scalability', 'Maintenance'],
      resources: [
        { label: 'Design Systems book', url: 'https://www.smashingmagazine.com/design-systems-book' },
        { label: 'Atomic design', url: 'https://atomicdesign.bradfrost.com' },
        { label: 'Component libraries', url: 'https://www.nngroup.com/articles/design-systems' }
      ],
    },
    'Component Libraries': {
      overview: 'Building modular, reusable UI components.',
      key_topics: ['Component states', 'Variants & props', 'Documentation', 'Developer handoff'],
      resources: [
        { label: 'Component library guide', url: 'https://www.nngroup.com/articles/library' },
        { label: 'Storybook', url: 'https://storybook.js.org' },
        { label: 'Design to code', url: 'https://www.figma.com/resources/guides/design-to-code' }
      ],
    },
    'Design Tokens': {
      overview: 'Systematic design values for consistency.',
      key_topics: ['Token types', 'Naming conventions', 'Tool integration', 'Version management'],
      resources: [
        { label: 'Design tokens spec', url: 'https://design-tokens.github.io/community-group' },
        { label: 'Token management', url: 'https://www.figma.com/blog/what-are-design-tokens' },
        { label: 'Design system scaling', url: 'https://www.invisionapp.com/inside-design/design-tokens' }
      ],
    },
    'Motion Design': {
      overview: 'Using animation to enhance user experience.',
      key_topics: ['Animation principles', 'Easing functions', 'Transitions & delays', 'Performance'],
      resources: [
        { label: 'Motion guide', url: 'https://www.nngroup.com/articles/animation-purpose-ux' },
        { label: 'Animation tools', url: 'https://www.adobe.com/products/animate.html' },
        { label: '12 principles of animation', url: 'https://www.youtube.com/watch?v=uOUu3pL8FE0' }
      ],
    },
    'Case Study Writing': {
      overview: 'Documenting design process and outcomes.',
      key_topics: ['Problem & context', 'Research & insights', 'Design process', 'Results & learnings'],
      resources: [
        { label: 'Case study format', url: 'https://www.nngroup.com/articles/case-studies-fast-and-cost-effective' },
        { label: 'UX portfolio', url: 'https://www.nngroup.com/articles/portfolios-ux-design' },
        { label: 'Communication skills', url: 'https://www.nngroup.com/articles/design-storytelling' }
      ],
    },
    'Interview Prep': {
      overview: 'Preparing for design interviews.',
      key_topics: ['Portfolio review', 'Design exercises', 'Behavioral questions', 'Answering strategies'],
      resources: [
        { label: 'Interview prep guide', url: 'https://www.nngroup.com/articles/ux-interviews' },
        { label: 'Design exercises', url: 'https://maze.co/collections/ux-research-templates/design-exercise' },
        { label: 'Portfolio tips', url: 'https://www.nngroup.com/articles/portfolios-ux-design' }
      ],
    },

    // Full Stack Developer (combined entries from Frontend & Backend)
    'HTML5 & CSS3': {
      overview: 'Modern HTML and CSS for responsive web development.',
      key_topics: ['Semantic HTML', 'CSS layouts (Flexbox, Grid)', 'Responsive design', 'CSS preprocessors (Sass)'],
      resources: [
        { label: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web' },
        { label: 'Frontend Mentor', url: 'https://frontendmentor.io' },
        { label: 'Web development guide', url: 'https://web.dev/learn' }
      ],
    },
    'JavaScript ES6+': {
      overview: 'Modern JavaScript syntax and features.',
      key_topics: ['ES6+ syntax', 'Async/await', 'Destructuring', 'Modules & imports'],
      resources: [
        { label: 'JavaScript.info', url: 'https://javascript.info' },
        { label: 'MDN Guides', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript' },
        { label: 'You Don\'t Know JS', url: 'https://github.com/getify/You-Dont-Know-JS' }
      ],
    },
    'React & Hooks': {
      overview: 'Modern React with functional components.',
      key_topics: ['Functional components', 'Hooks (useState, useEffect)', 'Custom hooks', 'Context API'],
      resources: [
        { label: 'React docs', url: 'https://react.dev' },
        { label: 'React Hooks guide', url: 'https://react.dev/reference/react' },
        { label: 'Official tutorials', url: 'https://react.dev/learn' }
      ],
    },
    'Tailwind CSS': {
      overview: 'Utility-first CSS framework for rapid UI development.',
      key_topics: ['Utility classes', 'Responsive design', 'Component extraction', 'Customization'],
      resources: [
        { label: 'Tailwind docs', url: 'https://tailwindcss.com/docs' },
        { label: 'Tailwind tutorials', url: 'https://tailwindcss.com/docs/installation' },
        { label: 'Component libraries', url: 'https://www.tailwindui.com' }
      ],
    },
    'Node.js & Express': {
      overview: 'JavaScript runtime and web framework for backend.',
      key_topics: ['Event loop', 'Express routing', 'Middleware', 'Request/response handling'],
      resources: [
        { label: 'Node.js docs', url: 'https://nodejs.org/docs' },
        { label: 'Express guide', url: 'https://expressjs.com/starter/basic-routing.html' },
        { label: 'Backend development', url: 'https://www.freecodecamp.org/news/the-nodejs-handbook' }
      ],
    },
    'PostgreSQL & Prisma': {
      overview: 'Relational database with modern ORM.',
      key_topics: ['SQL queries', 'Prisma schema', 'Migrations', 'Database design'],
      resources: [
        { label: 'PostgreSQL docs', url: 'https://www.postgresql.org/docs' },
        { label: 'Prisma documentation', url: 'https://www.prisma.io/docs' },
        { label: 'Database design', url: 'https://www.postgresql.org/docs/current/ddl.html' }
      ],
    },
    'MongoDB & Mongoose': {
      overview: 'NoSQL database with object modeling.',
      key_topics: ['Collections & documents', 'Schema definition', 'Queries & validation', 'Transactions'],
      resources: [
        { label: 'MongoDB docs', url: 'https://docs.mongodb.com' },
        { label: 'Mongoose guide', url: 'https://mongoosejs.com/docs' },
        { label: 'NoSQL patterns', url: 'https://www.mongodb.com/developer' }
      ],
    },
    'JWT Authentication': {
      overview: 'Secure authentication with JSON Web Tokens.',
      key_topics: ['Token generation', 'Verification', 'Refresh tokens', 'Security practices'],
      resources: [
        { label: 'JWT.io', url: 'https://jwt.io' },
        { label: 'Auth guides', url: 'https://auth0.com/docs' },
        { label: 'Security best practices', url: 'https://owasp.org/www-project-cheat-sheets' }
      ],
    },
    'File Uploads & Storage': {
      overview: 'Handling file uploads in web applications.',
      key_topics: ['Multer middleware', 'Validation', 'Cloud storage (S3)', 'Stream processing'],
      resources: [
        { label: 'File upload guide', url: 'https://www.freecodecamp.org/news/how-to-handle-file-uploads' },
        { label: 'S3 tutorial', url: 'https://docs.aws.amazon.com/s3' },
        { label: 'Storage options', url: 'https://www.cloudinary.com' }
      ],
    },
    'Redux / Zustand': {
      overview: 'State management solutions for React.',
      key_topics: ['Store & state', 'Actions & reducers', 'Selectors', 'Middleware'],
      resources: [
        { label: 'Redux docs', url: 'https://redux.js.org' },
        { label: 'Zustand guide', url: 'https://zustand.surge.sh' },
        { label: 'State management patterns', url: 'https://redux.js.org/usage/structuring-reducers' }
      ],
    },
    'React Query / SWR': {
      overview: 'Data fetching libraries for React.',
      key_topics: ['Cache management', 'Synchronization', 'Background updates', 'Optimistic updates'],
      resources: [
        { label: 'React Query docs', url: 'https://tanstack.com/query/latest' },
        { label: 'SWR guide', url: 'https://swr.vercel.app' },
        { label: 'Data fetching patterns', url: 'https://www.freecodecamp.org/news/how-to-fetch-data-with-react' }
      ],
    },
    'WebSockets (real-time)': {
      overview: 'Real-time bidirectional communication.',
      key_topics: ['WebSocket API', 'Socket.io', 'Rooms & events', 'Error handling'],
      resources: [
        { label: 'Socket.io tutorial', url: 'https://socket.io/docs/v4/tutorial/introduction' },
        { label: 'WebSocket guide', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket' },
        { label: 'Real-time patterns', url: 'https://socket.io/docs/v4' }
      ],
    },
    'Payment Integration (Stripe)': {
      overview: 'Integrating payment processing.',
      key_topics: ['Stripe API', 'Payment intents', 'Webhooks', 'Error handling'],
      resources: [
        { label: 'Stripe docs', url: 'https://stripe.com/docs' },
        { label: 'Payment integration guide', url: 'https://stripe.com/docs/payments/quickstart' },
        { label: 'PCI compliance', url: 'https://www.pcisecuritystandards.org' }
      ],
    },
    'Email (Resend / SendGrid)': {
      overview: 'Sending email from applications.',
      key_topics: ['Email templates', 'Transactional emails', 'Deliverability', 'Testing'],
      resources: [
        { label: 'Resend docs', url: 'https://resend.com/docs' },
        { label: 'SendGrid guide', url: 'https://sendgrid.com/docs' },
        { label: 'Email best practices', url: 'https://mailgun.com/resources' }
      ],
    },
    'Docker & Docker Compose (Full Stack)': {
      overview: 'Containerizing full-stack applications.',
      key_topics: ['Multi-stage builds', 'Docker Compose services', 'Volume management', 'Networking'],
      resources: [
        { label: 'Docker guide', url: 'https://docs.docker.com' },
        { label: 'Compose tutorial', url: 'https://docs.docker.com/compose/gettingstarted' },
        { label: 'Container orchestration', url: 'https://docs.docker.com/compose' }
      ],
    },
    'Vercel / Railway Deployment': {
      overview: 'Deploying full-stack apps to modern platforms.',
      key_topics: ['Git integration', 'Environment variables', 'Serverless functions', 'Database hosting'],
      resources: [
        { label: 'Vercel docs', url: 'https://vercel.com/docs' },
        { label: 'Railway guide', url: 'https://docs.railway.app' },
        { label: 'Deployment best practices', url: 'https://vercel.com/guides' }
      ],
    },
    'Performance Optimization': {
      overview: 'Optimizing web application performance.',
      key_topics: ['Code splitting', 'Image optimization', 'Caching', 'Monitoring'],
      resources: [
        { label: 'Web Vitals', url: 'https://web.dev/vitals' },
        { label: 'Performance profiling', url: 'https://developer.chrome.com/docs/devtools/performance' },
        { label: 'Optimization guide', url: 'https://web.dev/performance' }
      ],
    },

    // Cybersecurity
    'TCP/IP & OSI Model': {
      overview: 'Understanding network layers and protocols.',
      key_topics: ['OSI layers', 'TCP handshake', 'UDP', 'IP addressing'],
      resources: [
        { label: 'OSI model guide', url: 'https://www.cisco.com/c/en/us/support/docs/security/vpn-3des-ipsec/4128-9.html' },
        { label: 'Network fundamentals', url: 'https://www.comptia.org/certifications/network' },
        { label: 'Computer networks', url: 'https://en.wikipedia.org/wiki/OSI_model' }
      ],
    },
    'DNS, HTTP, TLS': {
      overview: 'Core internet protocols.',
      key_topics: ['DNS resolution', 'HTTP methods & status codes', 'HTTPS & SSL/TLS', 'Certificate management'],
      resources: [
        { label: 'DNS guide', url: 'https://www.cloudflare.com/learning/dns' },
        { label: 'HTTP protocol', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP' },
        { label: 'HTTPS best practices', url: 'https://www.ssl.com' }
      ],
    },
    'Linux Fundamentals': {
      overview: 'Essential Linux concepts for security.',
      key_topics: ['File permissions', 'User management', 'Package management', 'System monitoring'],
      resources: [
        { label: 'Linux basics', url: 'https://www.linux.com/what-is-linux' },
        { label: 'Linux Academy', url: 'https://www.coursera.org/learn/linux-command-line-basics' },
        { label: 'Security-focused Linux', url: 'https://www.kali.org' }
      ],
    },
    'Windows Active Directory': {
      overview: 'Enterprise directory and authentication service.',
      key_topics: ['AD structure', 'User & group policies', 'Kerberos', 'Domain management'],
      resources: [
        { label: 'AD documentation', url: 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started-with-active-directory-domain-services' },
        { label: 'Windows security', url: 'https://learn.microsoft.com/en-us/windows-server/security' },
        { label: 'AD administration', url: 'https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/manage/ad-forest-recovery-guide' }
      ],
    },
    'Wireshark & Packet Analysis': {
      overview: 'Analyzing network traffic for security.',
      key_topics: ['Packet capture', 'Protocol analysis', 'Traffic filtering', 'Anomaly detection'],
      resources: [
        { label: 'Wireshark guide', url: 'https://www.wireshark.org/download' },
        { label: 'Packet analysis', url: 'https://www.wireshark.org/docs' },
        { label: 'Network troubleshooting', url: 'https://www.youtube.com/c/WiresharkUniversity' }
      ],
    },
    'Cryptography Basics': {
      overview: 'Encryption and cryptographic concepts.',
      key_topics: ['Symmetric encryption', 'Asymmetric encryption', 'Hashing', 'Digital signatures'],
      resources: [
        { label: 'Cryptography guide', url: 'https://www.khanacademy.org/computing/computer-science/cryptography' },
        { label: 'Encryption basics', url: 'https://www.ibm.com/topics/encryption' },
        { label: 'Applied cryptography', url: 'https://www.amazon.com/Applied-Cryptography-Protocols-Algorithms-Source/dp/1119096726' }
      ],
    },
    'OWASP Top 10': {
      overview: 'Most critical web security vulnerabilities.',
      key_topics: ['Injection attacks', 'Broken authentication', 'XSS & CSRF', 'Insecure deserialization'],
      resources: [
        { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten' },
        { label: 'Security testing guide', url: 'https://owasp.org/www-project-web-security-testing-guide' },
        { label: 'Vulnerability prevention', url: 'https://owasp.org/www-project-api-security' }
      ],
    },
    'Vulnerability Scanning (Nmap, Nessus)': {
      overview: 'Tools for discovering security vulnerabilities.',
      key_topics: ['Port scanning', 'Service identification', 'Vulnerability databases', 'Remediation'],
      resources: [
        { label: 'Nmap tutorial', url: 'https://nmap.org/book/intro.html' },
        { label: 'Nessus guide', url: 'https://www.tenable.com/products/nessus' },
        { label: 'Security scanning', url: 'https://www.youtube.com/watch?v=KVHSGWgVf-k' }
      ],
    },
    'SIEM Concepts': {
      overview: 'Security Information and Event Management.',
      key_topics: ['Log collection & aggregation', 'Correlation rules', 'Alerting', 'Incident investigation'],
      resources: [
        { label: 'SIEM guide', url: 'https://www.splunk.com/en_us/data-insider/what-is-siem.html' },
        { label: 'Splunk basics', url: 'https://www.splunk.com/en_us/training/free-courses-certifications.html' },
        { label: 'ELK Stack', url: 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html' }
      ],
    },
    'Incident Response Basics': {
      overview: 'Responding to security incidents.',
      key_topics: ['Response plan', 'Detection & containment', 'Investigation', 'Recovery & lessons'],
      resources: [
        { label: 'IR handbook', url: 'https://www.amazon.com/Incident-Response-Essentials-Breaches-Incidents/dp/0134856686' },
        { label: 'Incident response guide', url: 'https://www.cisa.gov/cybersecurity-best-practices' },
        { label: 'Forensics basics', url: 'https://www.sans.org/reading-room/whitepapers' }
      ],
    },
    'Kali Linux': {
      overview: 'Linux distribution for penetration testing.',
      key_topics: ['Tool suite', 'Penetration testing workflow', 'Wordlists & exploits', 'Reporting'],
      resources: [
        { label: 'Kali docs', url: 'https://www.kali.org/docs' },
        { label: 'Penetration testing guide', url: 'https://www.offsec.com' },
        { label: 'Hacking with Kali', url: 'https://www.offensive-security.com/courses/pwk' }
      ],
    },
    'Metasploit Framework': {
      overview: 'Penetration testing and exploitation framework.',
      key_topics: ['Exploit selection', 'Payload generation', 'Post-exploitation', 'Module development'],
      resources: ['Metasploit guide', 'Penetration testing', 'Exploit development'],
    },
    'Web App Pentesting (Burp Suite)': {
      overview: 'Testing web applications for vulnerabilities.',
      key_topics: ['Burp features', 'Attack vectors', 'Authentication bypass', 'API testing'],
      resources: ['Burp tutorial', 'Web app security', 'PortSwigger Academy'],
    },
    'Privilege Escalation': {
      overview: 'Gaining higher privileges on systems.',
      key_topics: ['Vulnerability exploitation', 'Misconfiguration abuse', 'Kernel exploits', 'Post-exploitation'],
      resources: ['PrivEsc guide', 'Linux PrivEsc', 'Windows PrivEsc'],
    },
    'Password Cracking': {
      overview: 'Breaking password hashes and protecting against it.',
      key_topics: ['Hash types', 'Rainbow tables', 'Wordlist attacks', 'GPU acceleration'],
      resources: ['Hashcat guide', 'Password cracking', 'Hash security'],
    },
    'CTF Challenges': {
      overview: 'Capture The Flag hacking competitions.',
      key_topics: ['Various vulnerability types', 'Forensics', 'Reverse engineering', 'Problem-solving'],
      resources: ['CTF resources', 'HackTheBox', 'TryHackMe'],
    },
    'SOC Analyst Workflow': {
      overview: 'Security Operations Center analyst duties.',
      key_topics: ['Alert triage', 'Ticket management', 'Escalation procedures', 'Metrics tracking'],
      resources: ['SOC analyst guide', 'SIEM operations', 'Incident ticketing'],
    },
    'Threat Intelligence': {
      overview: 'Gathering and analyzing threat information.',
      key_topics: ['OSINT', 'Threat actors', 'Indicators of Compromise', 'Attribution'],
      resources: ['Threat intel guide', 'OSINT resources', 'Threat feeding'],
    },
    'MITRE ATT&CK Framework': {
      overview: 'Knowledge base of adversary tactics and techniques.',
      key_topics: ['Tactic & techniques', 'Attack patterns', 'Defense mapping', 'Detection strategies'],
      resources: ['MITRE ATT&CK', 'Framework guide', 'Threat modeling'],
    },
    
    // Phase Titles - Data Analyst
    'Data Foundations': {
      overview: 'Learn spreadsheets, SQL basics, and statistics to start analyzing data.',
      key_topics: ['Excel & Google Sheets', 'SQL SELECT queries', 'Descriptive statistics', 'Data types & cleaning'],
      resources: ['Mode SQL Tutorial', 'Statistics for Data Science', 'Kaggle Learn – Intro to SQL'],
    },
    'Python for Analysis': {
      overview: 'Master Python with Pandas, NumPy for data manipulation and visualization.',
      key_topics: ['Python fundamentals', 'Pandas DataFrames', 'NumPy arrays', 'Matplotlib & Seaborn'],
      resources: ['Python for Data Analysis book', 'Kaggle Pandas Course', 'Seaborn Gallery'],
    },
    'BI & Storytelling': {
      overview: 'Build dashboards with Tableau/Power BI and communicate insights effectively.',
      key_topics: ['Dashboard creation', 'KPI design', 'Data storytelling', 'Advanced SQL'],
      resources: ['Storytelling with Data book', 'Tableau Public Gallery', 'Advanced SQL – Mode'],
    },
    // Add more phase titles as needed
  };

  const progressPct = (() => {
    if (!data?.phases.length) return 0;
    const doneCount = phaseStatuses.filter(s => s === 'done').length;
    return Math.round((doneCount / data.phases.length) * 100);
  })();

  // Update phase status
  const handlePhaseStatusChange = (index, newStatus) => {
    const updated = [...phaseStatuses];
    updated[index] = newStatus;
    setPhaseStatuses(updated);
    sessionStorage.setItem(`roadmap_${role}_phases`, JSON.stringify(updated));
  };

  // Reset progress
  const handleResetProgress = () => {
    const freshStatuses = data.phases.map(p => p.status);
    setPhaseStatuses(freshStatuses);
    sessionStorage.removeItem(`roadmap_${role}_phases`);
  };

  if (!data) {
    return (
      <div className="rp-not-found">
        <nav className="menu-bar">
          <div className="menu-container">
            <div className="menu-logo">
              <span className="logo-text">Paaila</span>
            </div>
            <div className="menu-links">
              <a href="/home" className="menu-link">Home</a>
              <a href="/chat" className="menu-link">PDF Chatbot</a>
              <a href="/resume-parser" className="menu-link">Resume Parser</a>
              <UserMenu />
            </div>
          </div>
        </nav>
        <div className="rp-notfound-body">
          <p className="rp-notfound-title">Roadmap not found</p>
          <p className="rp-notfound-sub">We don't have a roadmap for "{role}" yet.</p>
          <button onClick={() => navigate('/home')} className="rp-back-btn">← Back to Home</button>
        </div>
      </div>
    );
  }

  const phaseLabels = data.phases.map(p => p.title);

  return (
    <div className="rp-root">

      {/* ── Nav ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">Paaila</span>
          </div>
          <div className="menu-links">
            <a href="/home" className="menu-link">Home</a>
            <a href="http://localhost:5173/chat" className="menu-link">PDF Chatbot</a>
            <a href="http://localhost:5173/resume-parser" className="menu-link">Resume Parser</a>
            <UserMenu />
          </div>
        </div>
      </nav>

      <div className="rp-wrapper">

        {/* Breadcrumb */}
        <div className="rp-breadcrumb">
          <span className="rp-bc-link" onClick={() => navigate('/home')}>Home</span>
          <span className="rp-bc-sep">›</span>
          <span className="rp-bc-current">{data.title}</span>
        </div>

        {/* Hero */}
        <div className="rp-hero">
          <div className="rp-hero-left">
            <div className="rp-hero-icon">{data.icon}</div>
            <h1 className="rp-hero-title">
              <em>Your</em> <span className="rp-accent">{data.title}</span><br />
              <em>Roadmap</em>
            </h1>
            <p className="rp-hero-sub">
              A structured {data.weeks}-week path to becoming a job-ready {data.title}.
              Follow the phases, complete the milestones, and build a standout portfolio.
            </p>
          </div>

          <div className="rp-stats-row">
            <div className="rp-stat-item">
              <div className="rp-stat-val">{data.weeks}</div>
              <div className="rp-stat-label">Weeks</div>
            </div>
            <div className="rp-stat-item">
              <div className="rp-stat-val">{data.phases.length}</div>
              <div className="rp-stat-label">Phases</div>
            </div>
            <div className="rp-stat-item">
              <div className="rp-stat-val">{data.skills}</div>
              <div className="rp-stat-label">Skills</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="rp-progress-section">
          <div className="rp-progress-header">
            <span className="rp-progress-label">Overall Progress</span>
            <span className="rp-progress-pct">{progressPct}%</span>
          </div>
          <div className="rp-progress-track">
            <div className="rp-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div className="rp-phase-indicators" style={{ flex: 1 }}>
              {data.phases.map((p, idx) => (
                <span key={p.num} className={`rp-phase-dot ${phaseStatuses[idx]}`}>
                  <span className="rp-dot" />
                  {p.title}
                </span>
              ))}
            </div>
            {progressPct > 0 && (
              <button
                onClick={handleResetProgress}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--muted)',
                  borderRadius: '4px',
                  background: 'transparent',
                  color: 'var(--muted2)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  marginLeft: '16px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--red)';
                  e.target.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--muted2)';
                }}
              >
                Reset Progress
              </button>
            )}
          </div>
        </div>

        {/* Section label */}
        <div className="rp-section-label">Learning Phases</div>

        {/* Timeline */}
        <div className="rp-timeline">
          {data.phases.map((phase, idx) => {
            const phaseStatus = phaseStatuses[idx];
            const statusPhase = { ...phase, status: phaseStatus };
            return (
              <PhaseCard
                key={phase.num}
                phase={statusPhase}
                phaseIndex={idx}
                onStatusChange={handlePhaseStatusChange}
                onSkillClick={setSelectedSkill}
                selectedSkill={selectedSkill}
              />
            );
          })}
        </div>

        <div className="rp-bottom-bar" />
        <footer className="rp-footer">© 2025 Paaila · AI-Powered Career Intelligence</footer>
      </div>

      {/* Skill Notes Sidebar */}
      <div className={`rp-skill-sidebar ${selectedSkill ? 'open' : ''}`}>
        <div className="rp-skill-sidebar-header">
          <h2>{selectedSkill}</h2>
          <button 
            className="rp-skill-close-btn"
            onClick={() => setSelectedSkill(null)}
          >
            ✕
          </button>
        </div>
        <div className="rp-skill-sidebar-content">
          {SKILL_NOTES[selectedSkill] && (
            <>
              <div className="rp-skill-section">
                <h3>Overview</h3>
                <p>{SKILL_NOTES[selectedSkill].overview}</p>
              </div>
              <div className="rp-skill-section">
                <h3>Key Topics</h3>
                <ul className="rp-skill-topics">
                  {SKILL_NOTES[selectedSkill].key_topics.map((topic, i) => (
                    <li key={i}>{topic}</li>
                  ))}
                </ul>
              </div>
              <div className="rp-skill-section">
                <h3>Recommended Resources</h3>
                <ul className="rp-skill-resources">
                  {SKILL_NOTES[selectedSkill].resources.map((resource, i) => (
                    <li key={i}>
                      {resource.url ? (
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          {resource.label}
                        </a>
                      ) : (
                        resource.label
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}