# Paaila

AI-powered career intelligence and document processing platform. Combine personalized career roadmaps, intelligent PDF chatbots, and AI-driven resume analysis in one modern web application.

---

## Features

### Career Roadmap Generator
- 9+ tech career paths (Frontend, Backend, Data Science, DevOps, ML, etc.)
- AI-curated learning resources, project milestones, and skill assessments
- Personalized learning paths tailored to your goals

### PDF Chatbot
- Upload PDF documents and get a unique **Document ID**
- Ask questions about PDF content using RAG + local Ollama (llama3.1:8b)
- View chat history and document summaries
- Clean, modern chat-bubble interface

### Resume Parser & Analyzer
- Upload resume and job description for AI-powered analysis
- Match scoring with keyword recommendations
- Identify skill gaps and improvement areas

### Resume Improvement Engine
- AI-driven resume rewriting to match job descriptions
- Automated keyword optimization
- Professional formatting and content enhancement

### User Management
- Secure JWT authentication with bcrypt password hashing
- User profiles with avatar uploads and session management
- Admin dashboard with platform metrics and user management

### Security
- Secure JWT-based authentication
- Environment-enforced secrets (no insecure defaults)
- Explicit CORS origin validation
- Input validation and sanitization

## Tech Stack

- **Frontend:** React 19, Vite, React Router, Quill, jsPDF, DOMPurify
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL
- **AI/ML:** LangChain, Ollama (llama3.1:8b), HuggingFace embeddings, FAISS
- **Testing:** Playwright end-to-end tests
- **Hosting / Local Development:** Runs locally on `http://127.0.0.1:8000/` (frontend: `http://localhost:5173`)

---

## Environment Variables

Set these before running the backend. Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/Paaila

JWT_SECRET_KEY=<your-strong-random-secret-key>
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
```

**Note:** `JWT_SECRET_KEY` is required and must be strong (no weak defaults accepted).

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- Ollama (running locally at `http://localhost:11434`)

### Backend Setup

1. Create python virtual environment:
```powershell
python -m venv myenv_windows
.\myenv_windows\Scripts\Activate.ps1
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure `.env` file with required variables

4. Run backend server:
```bash
uvicorn main:app --reload
```

Backend will be available at `http://127.0.0.1:8000/`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Paaila
```

2. Install Node dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Run Tests

```bash
npx playwright test
```

---

## Project Structure

```
projecxtfinal/
├── main.py              # FastAPI application entry point
├── models/              # SQLAlchemy models and schemas
├── service/             # PDF processing, QA, resume analysis
├── Paaila/              # React frontend (Vite)
│   ├── src/
│   │   ├── pages/       # Career, PDF Chat, Resume Parser, Profile
│   │   ├── components/  # Reusable UI components
│   │   └── utils/       # Validation, helpers
│   └── public/          # Static assets
├── tests/               # Playwright e2e tests
├── requirements.txt     # Python dependencies
└── .env.example         # Environment template
```

---

## Key Endpoints

**Authentication:**
- `POST /api/register` - Create new user
- `POST /api/login` - User login (returns JWT)

**PDF Chatbot:**
- `POST /api/upload` - Upload PDF document
- `POST /api/chat` - Ask questions about document
- `POST /api/summarize` - Generate document summary

**Resume Parser:**
- `POST /api/analyze-resume` - Analyze resume vs job description
- `POST /api/improve-resume` - Generate improved resume

**User:**
- `GET /api/user` - Get current user profile
- `PUT /api/user` - Update user profile

**Admin:**
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List all users

---


