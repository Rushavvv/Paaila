import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import PDFChat from './pages/PDFChat'
import RoadmapPage from './pages/roadmap';
import ResumeParser from './pages/resumeParser';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/adminDashboard';
import Profile from './pages/profile';

const TOKEN_KEY = 'token'
const USER_TYPE_KEY = 'userType'

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_TYPE_KEY)
}

function parseJwtPayload(token) {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

function getTokenExpiryMs(token) {
  const payload = parseJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return null
  return payload.exp * 1000
}

function isTokenValid(token) {
  if (!token) return false
  const expiryMs = getTokenExpiryMs(token)
  if (!expiryMs) return false
  return Date.now() < expiryMs
}

function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem(TOKEN_KEY)

  // Check if token exists and is valid
  if (!token) {
    // No token - user needs to authenticate
    clearAuth()
    return <Navigate to="/login" replace state={{ from: location.pathname, noAuth: true }} />
  }

  if (!isTokenValid(token)) {
    // Token exists but is expired
    clearAuth()
    return <Navigate to="/login" replace state={{ from: location.pathname, sessionExpired: true }} />
  }

  return children
}

function AdminRoute({ children }) {
  const location = useLocation()
  const token = localStorage.getItem(TOKEN_KEY)
  const userType = localStorage.getItem(USER_TYPE_KEY)

  // Check if token exists and is valid
  if (!token) {
    // No token - user needs to authenticate
    clearAuth()
    return <Navigate to="/login" replace state={{ from: location.pathname, noAuth: true }} />
  }

  if (!isTokenValid(token)) {
    // Token exists but is expired
    clearAuth()
    return <Navigate to="/login" replace state={{ from: location.pathname, sessionExpired: true }} />
  }

  // Check if user is admin
  if ((userType || '').toLowerCase() !== 'admin') {
    // Not an admin - render children with admin access error
    return children
  }

  return children
}

function PublicRoute({ children }) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (isTokenValid(token)) {
    return <Navigate to="/home" replace />
  }
  return children
}

function SessionTimeoutWatcher() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return undefined

    const expiryMs = getTokenExpiryMs(token)
    if (!expiryMs || Date.now() >= expiryMs) {
      clearAuth()
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true })
      }
      return undefined
    }

    const timeout = window.setTimeout(() => {
      clearAuth()
      navigate('/login', { replace: true })
      window.alert('Your session has expired. Please log in again.')
    }, expiryMs - Date.now())

    return () => window.clearTimeout(timeout)
  }, [location.pathname, navigate])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <SessionTimeoutWatcher />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><PDFChat /></ProtectedRoute>} />
        <Route path="/roadmap/:role" element={<ProtectedRoute><RoadmapPage /></ProtectedRoute>} />
        <Route path="/resume-parser" element={<ProtectedRoute><ResumeParser /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
