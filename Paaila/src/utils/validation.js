const NAME_RE = /^[A-Za-z]+(?:-[A-Za-z]+)*$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const PHONE_RE = /^\d+$/
const ALNUM_RE = /[A-Za-z0-9]/

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  PASSWORD_MIN: 8,
  PHONE_MIN: 7,
  PHONE_MAX: 15,
  SEARCH_MAX: 120,
  AI_INPUT_MAX: 4000,
  PDF_MAX_BYTES: 10 * 1024 * 1024,
  IMAGE_MAX_BYTES: 2 * 1024 * 1024,
}

export function normalizeEmail(value = '') {
  return String(value).replace(/\s+/g, '').trim().toLowerCase()
}

export function sanitizeText(value = '') {
  return String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateName(value, label) {
  const name = sanitizeText(value)
  if (!name) return `${label} is required`
  if (name.length < LIMITS.NAME_MIN || name.length > LIMITS.NAME_MAX) {
    return `${label} must be ${LIMITS.NAME_MIN}-${LIMITS.NAME_MAX} characters`
  }
  if (!NAME_RE.test(name)) return `${label} can only contain letters and hyphens`
  return ''
}

export function validateEmail(value) {
  const email = normalizeEmail(value)
  if (!email) return 'Email is required'
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address'
  return ''
}

export function validatePassword(value) {
  const password = String(value || '')
  if (password.length < LIMITS.PASSWORD_MIN) return `Password must be at least ${LIMITS.PASSWORD_MIN} characters`
  if (!PASSWORD_RE.test(password)) {
    return 'Password must include uppercase, lowercase, and a number'
  }
  return ''
}

export function validatePhone(value) {
  const phone = sanitizeText(value)
  if (!phone) return 'Phone number is required'
  if (!PHONE_RE.test(phone)) return 'Phone number must contain digits only'
  if (phone.length < LIMITS.PHONE_MIN || phone.length > LIMITS.PHONE_MAX) {
    return `Phone number must be ${LIMITS.PHONE_MIN}-${LIMITS.PHONE_MAX} digits`
  }
  return ''
}

export function validateSearch(value) {
  const query = sanitizeText(value)
  if (!query) return 'Type a role or skill to search.'
  if (query.length > LIMITS.SEARCH_MAX) {
    return `Search must be at most ${LIMITS.SEARCH_MAX} characters`
  }
  if (!ALNUM_RE.test(query)) {
    return 'Search must include letters or numbers'
  }
  return ''
}

export function validatePdfFile(file) {
  if (!file) return 'Please select a PDF file.'
  const name = String(file.name || '').toLowerCase()
  if (!name.endsWith('.pdf')) return 'Only PDF files are allowed.'
  const allowedMime = ['application/pdf', 'application/x-pdf', 'application/octet-stream']
  if (file.type && !allowedMime.includes(file.type.toLowerCase())) {
    return 'Invalid PDF MIME type.'
  }
  if (file.size <= 0) return 'Uploaded file is empty.'
  if (file.size > LIMITS.PDF_MAX_BYTES) return 'PDF must be 10 MB or smaller.'
  return ''
}

export function validateImageFile(file) {
  if (!file) return ''
  const name = String(file.name || '').toLowerCase()
  if (!(name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png'))) {
    return 'Only JPG or PNG images are allowed.'
  }
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'application/octet-stream']
  if (file.type && !allowedMime.includes(file.type.toLowerCase())) {
    return 'Invalid image MIME type.'
  }
  if (file.size <= 0) return 'Uploaded image is empty.'
  if (file.size > LIMITS.IMAGE_MAX_BYTES) return 'Image must be 2 MB or smaller.'
  return ''
}

export function validateAiInput(value, label = 'Input') {
  const text = sanitizeText(value)
  if (!text) return `${label} is required`
  if (text.length > LIMITS.AI_INPUT_MAX) {
    return `${label} must be at most ${LIMITS.AI_INPUT_MAX} characters`
  }
  return ''
}
