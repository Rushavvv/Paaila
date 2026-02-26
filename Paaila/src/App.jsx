import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import PDFChat from './pages/PDFChat'
import RoadmapPage from './pages/roadmap';
import ResumeParser from './pages/resumeParser';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<PDFChat />} />
        <Route path="/roadmap/:role" element={<RoadmapPage />} />
        <Route path="/resume-parser" element={<ResumeParser />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
