const trimTrailingSlash = (value = '') => String(value).replace(/\/+$/, '')
const trimLeadingSlash = (value = '') => String(value).replace(/^\/+/, '')

export const BACKEND_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8000/'
)

export const ENDPOINTS = {
  API_REGISTER: import.meta.env.VITE_ENDPOINT_API_REGISTER || 'api/register',
  API_LOGIN: import.meta.env.VITE_ENDPOINT_API_LOGIN || 'api/login',
  API_USER: import.meta.env.VITE_ENDPOINT_API_USER || 'api/user',

  DOCUMENTS: import.meta.env.VITE_ENDPOINT_DOCUMENTS || 'documents/',
  DOCUMENTS_BASE: import.meta.env.VITE_ENDPOINT_DOCUMENTS_BASE || 'documents',
  CHAT_HISTORY: import.meta.env.VITE_ENDPOINT_CHAT_HISTORY || 'chat/history',
  CHAT_DELETE_HISTORY: import.meta.env.VITE_ENDPOINT_CHAT_DELETE_HISTORY || 'chat/delete_history',
  CHAT: import.meta.env.VITE_ENDPOINT_CHAT || 'chat/',
  UPLOAD: import.meta.env.VITE_ENDPOINT_UPLOAD || 'upload/',
  SUMMARIZE: import.meta.env.VITE_ENDPOINT_SUMMARIZE || 'summarize/',

  ADMIN_STATS: import.meta.env.VITE_ENDPOINT_ADMIN_STATS || 'admin/stats',
  ADMIN_USERS_BASE: import.meta.env.VITE_ENDPOINT_ADMIN_USERS_BASE || 'admin/users',

  RESUME_LIST: import.meta.env.VITE_ENDPOINT_RESUME_LIST || 'resumes/',
  RESUME_UPLOAD: import.meta.env.VITE_ENDPOINT_RESUME_UPLOAD || 'resumeParser/',
  RESUME_ANALYZE: import.meta.env.VITE_ENDPOINT_RESUME_ANALYZE || 'resumeParser/analyze',
  RESUME_IMPROVE: import.meta.env.VITE_ENDPOINT_RESUME_IMPROVE || 'resumeParser/improve',
  RESUME_SAVE_EDITED: import.meta.env.VITE_ENDPOINT_RESUME_SAVE_EDITED || 'resume/save-edited',
}

export const buildBackendUrl = (path) => `${BACKEND_BASE_URL}/${trimLeadingSlash(path)}`
