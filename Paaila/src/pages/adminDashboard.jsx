import { useState, useEffect, useMemo } from 'react'
import { ENDPOINTS, buildBackendUrl } from '../config/api'
import { normalizeEmail, sanitizeText, validateEmail, validateName, validateSearch } from '../utils/validation'
import '../adminDashboard.css'

const ROWS_PER_PAGE = 8

function getAuthHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, trendType, icon, colour, loading }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (loading || !value) return
    let start = null
    const duration = 900
    const target = Number(value)
    const tick = (ts) => {
      if (!start) start = ts
      const p    = Math.min((ts - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setDisplayed(Math.round(target * ease))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, loading])

  return (
    <div className={`stat-card stat-card--${colour}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon">{icon}</div>
      </div>

      {loading ? (
        <>
          <div className="skeleton skeleton-value" />
          <div className="skeleton skeleton-sub" />
        </>
      ) : (
        <>
          <div className="stat-card-value">{displayed}</div>
          <div className="stat-card-sub">
            {sub}
            {trend && (
              <span className={`stat-card-trend stat-card-trend--${trendType}`}>
                {trend}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const labels = { active: 'Active', inactive: 'Inactive' }
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge-dot" />
      {labels[status] || status}
    </span>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  // Check if user is admin
  const userType = localStorage.getItem('userType')
  const isAdmin = (userType || '').toLowerCase() === 'admin'

  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="admin-page">
        {/* ── Navbar ── */}
        <nav className="menu-bar">
          <div className="menu-container">
            <div className="menu-logo">
              <span className="logo-text">
                Paai<span className="logo-accent">la</span>
              </span>
            </div>
            <div className="menu-links">
              <a href="/home"          className="menu-link">Home</a>
              <a href="/chat"          className="menu-link">PDF Chatbot</a>
              <a href="/resume-parser" className="menu-link">Resume Parser</a>
            </div>
          </div>
        </nav>

        {/* ── Content ── */}
        <div className="admin-content">
          <div className="admin-header">
            <h1 className="admin-title">
              Access <span>Denied</span>
            </h1>
          </div>

          {/* Access denied notification */}
          <div style={{
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#991b1b',
            }}>
              Admin Access Required
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#dc2626',
              marginBottom: '16px',
            }}>
              You do not have permission to access the admin dashboard. Only administrators can view this page.
            </p>
            <a
              href="/home"
              style={{
                display: 'inline-block',
                backgroundColor: '#dc2626',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const [stats,   setStats]   = useState(null)
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')   
  const [sortKey,    setSortKey]    = useState('id')
  const [sortDir,    setSortDir]    = useState('asc')
  const [page,       setPage]       = useState(1)

  // Edit modal state
  const [editingUser, setEditingUser] = useState(null)
  const [editForm,    setEditForm]    = useState({ name: '', user_type: 'normal' })
  const [editLoading, setEditLoading] = useState(false)
  const [editErrors, setEditErrors] = useState({ name: '', user_type: '' })
  const [searchError, setSearchError] = useState('')

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch(buildBackendUrl(ENDPOINTS.ADMIN_STATS), { headers: getAuthHeaders() }),
          fetch(buildBackendUrl(ENDPOINTS.ADMIN_USERS_BASE), { headers: getAuthHeaders() }),
        ])

        if (!statsRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch admin dashboard data')
        }

        const statsData = await statsRes.json()
        const usersData = await usersRes.json()

        setStats(statsData || { totalUsers: 0, totalResumes: 0, activeUsers: 0 })
        setUsers(usersData?.users || [])
      } catch (err) {
        console.error('Failed to load admin data:', err)
        setStats({ totalUsers: 0, totalResumes: 0, activeUsers: 0 })
        setUsers([])
        setError('Could not load admin data from server.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  /* ── Sort handler ── */
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  /* ── Edit handler ── */
  const handleEditClick = (user) => {
    setEditingUser(user)
    setEditForm({ name: user.name, user_type: user.user_type || 'normal' })
    setEditErrors({ name: '', user_type: '' })
  }

  const handleEditSubmit = async () => {
    const normalizedName = sanitizeText(editForm.name)
    const nameParts = normalizedName.split(' ').filter(Boolean)
    const firstNameError = validateName(nameParts[0] || '', 'First name')
    const lastNameError = validateName(nameParts[1] || '', 'Last name')
    const userTypeError = !['admin', 'normal'].includes(editForm.user_type) ? 'Invalid user type' : ''
    const nextErrors = {
      name: firstNameError || lastNameError || '',
      user_type: userTypeError,
    }
    setEditErrors(nextErrors)

    if (nextErrors.name || nextErrors.user_type) {
      alert(nextErrors.name || nextErrors.user_type)
      return
    }

    setEditLoading(true)
    try {
      const res = await fetch(`${buildBackendUrl(ENDPOINTS.ADMIN_USERS_BASE)}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ name: normalizedName, user_type: editForm.user_type }),
      })

      if (!res.ok) {
        throw new Error('Failed to update user')
      }

      // Update local users list
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: normalizedName, user_type: editForm.user_type }
            : u
        )
      )
      setEditingUser(null)
      alert('User updated successfully')
    } catch (err) {
      console.error('Edit failed:', err)
      alert('Failed to update user')
    } finally {
      setEditLoading(false)
    }
  }

  /* ── Delete handler ── */
  const handleDeleteClick = (user) => {
    setDeleteConfirm(user)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return

    setDeleteLoading(true)
    try {
      const res = await fetch(`${buildBackendUrl(ENDPOINTS.ADMIN_USERS_BASE)}/${deleteConfirm.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!res.ok) {
        throw new Error('Failed to delete user')
      }

      // Reload the page after successful deletion
      window.location.reload();
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  /* ── Filtered + sorted users ── */
  const processed = useMemo(() => {
    let list = [...users]

    // filter by status
    if (filter !== 'all') list = list.filter((u) => u.status === filter)

    // search by name or email
    if (search.trim()) {
      const q = sanitizeText(search).toLowerCase()
      list = list.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }

    // sort
    list.sort((a, b) => {
      const av = String(a[sortKey] ?? '').toLowerCase()
      const bv = String(b[sortKey] ?? '').toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 :  1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })

    return list
  }, [users, filter, search, sortKey, sortDir])

  const totalPages   = Math.max(1, Math.ceil(processed.length / ROWS_PER_PAGE))
  const paginated    = processed.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
  const startRow     = (page - 1) * ROWS_PER_PAGE + 1
  const endRow       = Math.min(page * ROWS_PER_PAGE, processed.length)

  const FILTERS = ['all', 'active', 'inactive']

  const COLUMNS = [
    { key: 'id',     label: '#',       cls: 'col-num'     },
    { key: 'name',   label: 'Name'                        },
    { key: 'email',  label: 'Email'                       },
    { key: 'user_type', label: 'User Type'              },
    { key: 'status', label: 'Status'                      },
    { key: 'joined', label: 'Joined'                      },
    { key: null,     label: 'Actions',  cls: 'col-actions' },
  ]


  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (window.caches) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
    window.location.href = '/home';
  };

  return (
    <div className="admin-page">
      {/* ── Navbar ── */}
      <nav className="menu-bar">
        <div className="menu-container">
          <div className="menu-logo">
            <span className="logo-text">
              Paai<span className="logo-accent">la</span>
            </span>
          </div>
          <div className="menu-links">
            <a href="/home"          className="menu-link">Home</a>
            <a href="/chat"          className="menu-link">PDF Chatbot</a>
            <a href="/resume-parser" className="menu-link">Resume Parser</a>
            <button className="logout-btn" onClick={handleLogout} title="Logout and clear all data">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <div className="admin-content">

        {/* Page header */}
        <div className="admin-header">
          <span className="admin-header-eyebrow">System Overview</span>
          <h1 className="admin-title">
            Admin <span>Dashboard</span>
          </h1>
          <p className="admin-subtitle">
            Monitor users, track resume activity, and manage your platform in one place.
          </p>
          {error && <p className="admin-subtitle">{error}</p>}
        </div>

        {/* ── Stat cards ── */}
        <div>
          <p className="section-label">Platform Metrics</p>
          <div className="stat-grid">
            <StatCard
              label="Total Users"
              value={stats?.totalUsers}
              sub="Registered accounts"
              icon="👥"
              colour="blue"
              loading={loading}
            />
            <StatCard
              label="Resumes Parsed"
              value={stats?.totalResumes}
              sub="All-time uploads"
              icon="📄"
              colour="green"
              loading={loading}
            />
            <StatCard
              label="Active Users"
              value={stats?.activeUsers}
              sub="Currently active"
              icon="⚡"
              colour="amber"
              loading={loading}
            />
          </div>
        </div>

        {/* ── Users table ── */}
        <div className="table-section">
          <p className="section-label">User Management</p>

          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-search">
              <input
                className="table-search-input"
                type="text"
                placeholder="Search by name or email..."
                value={search}
                maxLength={120}
                onChange={(e) => {
                  const next = e.target.value
                  setSearch(next)
                  setPage(1)
                  setSearchError(validateSearch(next) === 'Type a role or skill to search.' ? '' : validateSearch(next))
                }}
              />
              {searchError && <p className="admin-subtitle" style={{ margin: '6px 0 0 0', color: 'var(--red)' }}>{searchError}</p>}
            </div>
            <div className="table-filter-group">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className={`table-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => { setFilter(f); setPage(1) }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.label}
                      className={[
                        col.cls || '',
                        col.key && sortKey === col.key ? 'sorted' : '',
                      ].join(' ').trim()}
                      onClick={col.key ? () => handleSort(col.key) : undefined}
                      style={{ cursor: col.key ? 'pointer' : 'default' }}
                    >
                      <div className="th-inner">
                        {col.label}
                        {col.key && (
                          <span className="sort-icon">
                            {sortKey === col.key
                              ? sortDir === 'asc' ? '▲' : '▼'
                              : '⇅'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center' }}>
                      <div className="spinner" />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="table-empty">
                        <div className="table-empty-icon">◈</div>
                        <div className="table-empty-text">No users found</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((user, idx) => (
                    <tr key={user.id}>
                      {/* Row number */}
                      <td className="row-num col-num">
                        {String(startRow + idx).padStart(2, '0')}
                      </td>

                      {/* Name + avatar */}
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{getInitials(user.name)}</div>
                          <span className="user-name">{user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="email-cell">{user.email}</td>

                      {/* User Type */}
                      <td>
                        <span className={`user-type-badge user-type-badge--${user.user_type}`}>
                          {user.user_type === 'admin' ? 'Admin' : 'Normal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td><StatusBadge status={user.status} /></td>

                      {/* Joined date */}
                      <td style={{ color: 'var(--muted2)', fontSize: '0.75rem' }}>
                        {formatDate(user.joined)}
                      </td>

                      {/* Actions */}
                      <td className="col-actions">
                        <div className="action-btns">
                          <button
                            className="action-btn"
                            onClick={() => handleEditClick(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="action-btn action-btn--danger"
                            onClick={() => handleDeleteClick(user)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Table footer */}
            {!loading && processed.length > 0 && (
              <div className="table-footer">
                <span className="table-footer-info">
                  Showing {startRow}–{endRow} of {processed.length} user{processed.length !== 1 ? 's' : ''}
                </span>
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn${page === p ? ' active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages}
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Edit Modal ── */}
        {editingUser && (
          <div className="modal-overlay" onClick={() => setEditingUser(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit User</h2>
                <button
                  className="modal-close"
                  onClick={() => setEditingUser(null)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm({ ...editForm, name: value })
                      const normalizedName = sanitizeText(value)
                      const parts = normalizedName.split(' ').filter(Boolean)
                      const firstNameError = validateName(parts[0] || '', 'First name')
                      const lastNameError = validateName(parts[1] || '', 'Last name')
                      setEditErrors((prev) => ({ ...prev, name: firstNameError || lastNameError || '' }))
                    }}
                    placeholder="Enter name"
                  />
                  {editErrors.name && <p className="admin-subtitle" style={{ marginTop: 6, color: 'var(--red)' }}>{editErrors.name}</p>}
                </div>
                
                <div className="form-group">
                  <label>User Type</label>
                  <select
                    value={editForm.user_type}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm({ ...editForm, user_type: value })
                      setEditErrors((prev) => ({ ...prev, user_type: '' }))
                    }}
                  >
                    <option value="normal">Normal User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editErrors.user_type && <p className="admin-subtitle" style={{ marginTop: 6, color: 'var(--red)' }}>{editErrors.user_type}</p>}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-modal btn-modal--cancel"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-modal btn-modal--primary"
                  onClick={handleEditSubmit}
                  disabled={editLoading || Boolean(editErrors.name || editErrors.user_type)}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Modal ── */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Delete User</h2>
                <button
                  className="modal-close"
                  onClick={() => setDeleteConfirm(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <p>
                  Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                </p>
                <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: '12px' }}>
                  This action cannot be undone.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-modal btn-modal--cancel"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn-modal btn-modal--danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}