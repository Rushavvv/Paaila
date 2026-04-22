import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_BASE_URL, ENDPOINTS, buildBackendUrl } from '../config/api';
import { sanitizeText, validateEmail, validateImageFile, validateName, validatePhone } from '../utils/validation';
import '../profile.css';
import UserMenu from '../components/UserMenu';

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('personal');
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [originalImagePath, setOriginalImagePath] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
  });

  const [draft, setDraft] = useState({ ...form });

  // Fetch current user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        const response = await fetch(buildBackendUrl(ENDPOINTS.API_USER), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user profile: ${response.statusText}`);
        }

        const userData = await response.json();
        const userFormData = {
          firstName: userData.first_name || '',
          lastName:  userData.last_name || '',
          email:     userData.email || '',
          phone:     userData.phone_number || '',
        };
        
        setForm(userFormData);
        setDraft(userFormData);
        
        // Load existing profile image from the server if it exists
        if (userData.profile_image_path) {
          const normalized = String(userData.profile_image_path).replace(/^\/+/, '');
          setAvatarSrc(`${BACKEND_BASE_URL}/${normalized}`);
          setOriginalImagePath(userData.profile_image_path);
        }
        
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load user profile');
        setFormMessage({ type: 'error', text: 'Could not load your profile. Please refresh and try again.' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const initials = `${draft.firstName?.[0] ?? ''}${draft.lastName?.[0] ?? ''}`.toUpperCase();

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
    const msg = name === 'firstName'
      ? validateName(value, 'First name')
      : name === 'lastName'
      ? validateName(value, 'Last name')
      : name === 'phone'
      ? validatePhone(value)
      : name === 'email'
      ? validateEmail(value)
      : '';

    setFieldErrors((prev) => ({ ...prev, [name]: msg }));
    setFieldTouched((prev) => ({ ...prev, [name]: true }));
    setSaved(false);
    setError(null);
    setFormMessage({ type: '', text: '' });
  }

  function validateProfileForm() {
    const nextErrors = {
      firstName: validateName(draft.firstName, 'First name'),
      lastName: validateName(draft.lastName, 'Last name'),
      email: validateEmail(draft.email),
      phone: validatePhone(draft.phone),
    };

    const avatarFile = fileInputRef.current?.files?.[0];
    if (avatarFile) {
      nextErrors.profile_image = validateImageFile(avatarFile);
    }

    setFieldErrors(nextErrors);
    setFieldTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profile_image: true,
    });

    return nextErrors;
  }

  async function handleSave() {
    const token = localStorage.getItem('token');
    if (!token) {
      setFormMessage({ type: 'error', text: 'You are not logged in. Please sign in and try again.' });
      return;
    }

    const nextErrors = validateProfileForm();
    const firstFieldError = Object.values(nextErrors).find(Boolean);
    if (firstFieldError) {
      setFormMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
      return;
    }

    const hasChanges =
      draft.firstName !== form.firstName ||
      draft.lastName !== form.lastName ||
      draft.phone !== form.phone ||
      Boolean(fileInputRef.current?.files?.[0]);

    if (!hasChanges) {
      setFormMessage({ type: 'success', text: 'No changes to save. Your profile is already up to date.' });
      return;
    }

    // Use FormData to send both JSON and file data
    const formData = new FormData();
    formData.append('first_name', sanitizeText(draft.firstName));
    formData.append('last_name', sanitizeText(draft.lastName));
    formData.append('phone_number', sanitizeText(draft.phone));

    // If a new avatar image was selected, add it to the form data
    if (fileInputRef.current?.files?.[0]) {
      formData.append('profile_image', fileInputRef.current.files[0]);
    }

    try {
      setIsSaving(true);
      setFormMessage({ type: '', text: '' });

      const response = await fetch(buildBackendUrl(ENDPOINTS.API_USER), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      await response.json();
      setForm({ ...draft });
      setSaved(true);
      setFormMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setSaved(false), 2500);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setFormMessage({ type: 'error', text: 'Could not save your profile. Please try again.' });
      setError('Profile update failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveProfileImage() {
    const token = localStorage.getItem('token');
    if (!token) {
      setFormMessage({ type: 'error', text: 'You are not logged in. Please sign in and try again.' });
      return;
    }

    setIsRemoving(true);
    try {
      const formData = new FormData();
      // Send a flag to indicate deletion instead of null
      formData.append('delete_profile_image', 'true');

      const response = await fetch(buildBackendUrl(ENDPOINTS.API_USER), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to remove profile image');
      }

      await response.json();
      setAvatarSrc(null);
      setOriginalImagePath(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFormMessage({ type: 'success', text: 'Profile photo removed successfully.' });
    } catch (err) {
      setFormMessage({
        type: 'error',
        text: 'Could not remove profile photo. Please try again.',
      });
      setError('Profile photo removal failed.');
    } finally {
      setIsRemoving(false);
    }
  }

  function handleCancel() {
    setDraft({ ...form });
    setFieldErrors({});
    setFieldTouched({});
    setError(null);
    setFormMessage({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSaved(false);
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileError = validateImageFile(file);
    if (fileError) {
      setFieldTouched((prev) => ({ ...prev, profile_image: true }));
      setFieldErrors((prev) => ({ ...prev, profile_image: fileError }));
      setFormMessage({ type: 'error', text: 'Please select a valid JPG or PNG image under 2 MB.' });
      e.target.value = '';
      return;
    }

    setFieldTouched((prev) => ({ ...prev, profile_image: true }));
    setFieldErrors((prev) => ({ ...prev, profile_image: '' }));
    setFormMessage({ type: 'success', text: 'Profile photo selected. Click Save changes to apply it.' });
    const url = URL.createObjectURL(file);
    setAvatarSrc(url);
  }

  function getFieldMessage(name) {
    if (fieldErrors[name]) {
      return { type: 'error', text: fieldErrors[name] };
    }

    if (name === 'email') {
      return { type: 'success', text: 'Email is verified and cannot be changed here.' };
    }

    if (!fieldTouched[name]) {
      return null;
    }

    const hasValue = Boolean(String(draft[name] || '').trim());
    if (!hasValue) {
      return null;
    }

    const successText =
      name === 'firstName'
        ? 'First name looks good.'
        : name === 'lastName'
        ? 'Last name looks good.'
        : name === 'phone'
        ? 'Phone number looks valid.'
        : name === 'profile_image'
        ? 'Photo is ready to upload.'
        : '';

    return successText ? { type: 'success', text: successText } : null;
  }

  const tabs = [
    { id: 'personal', label: 'Personal Info' },
  ];

  return (
    <div className="pp-root">
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

      <div className="pp-wrapper">
        <div className="pp-breadcrumb">
          <span className="pp-bc-link" onClick={() => navigate('/home')}>Home</span>
          <span className="pp-bc-sep">›</span>
          <span className="pp-bc-current">Profile</span>
        </div>

        <div className="pp-card">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="pp-sidebar">
            <div className="pp-avatar-area">
              <div className="pp-avatar" onClick={handleAvatarClick} title="Change photo">
                {avatarSrc
                  ? <img src={avatarSrc} alt="Profile" className="pp-avatar-img" />
                  : <span className="pp-avatar-initials">{initials || 'U'}</span>
                }
                <div className="pp-avatar-overlay">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="pp-sidebar-name">
                {draft.firstName} {draft.lastName}
              </div>
              <div className="pp-sidebar-email">{draft.email}</div>
            </div>

            <nav className="pp-tabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`pp-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── MAIN PANEL ── */}
          <div className="pp-main">
            {loading && (
              <div className="pp-loading-state">
                <span className="pp-loading-spinner" />
                Loading profile...
              </div>
            )}
            
            {error && (
              <div className="pp-error-state">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!loading && !error && activeTab === 'personal' && (
              <>
                <div className="pp-section-label">Personal info</div>

                <div className="pp-fields">
                  <div className="pp-field-row">
                    <div className="pp-field">
                      <label className="pp-label">First name</label>
                      <input
                        className={`pp-input ${fieldErrors.firstName ? 'pp-input-error' : ''}`}
                        name="firstName"
                        value={draft.firstName}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched((prev) => ({ ...prev, firstName: true }))}
                        placeholder="First name"
                        aria-invalid={Boolean(fieldErrors.firstName)}
                      />
                      {getFieldMessage('firstName') && (
                        <p className={`pp-field-msg ${getFieldMessage('firstName').type === 'error' ? 'error' : 'success'}`}>
                          {getFieldMessage('firstName').text}
                        </p>
                      )}
                    </div>
                    <div className="pp-field">
                      <label className="pp-label">Last name</label>
                      <input
                        className={`pp-input ${fieldErrors.lastName ? 'pp-input-error' : ''}`}
                        name="lastName"
                        value={draft.lastName}
                        onChange={handleChange}
                        onBlur={() => setFieldTouched((prev) => ({ ...prev, lastName: true }))}
                        placeholder="Last name"
                        aria-invalid={Boolean(fieldErrors.lastName)}
                      />
                      {getFieldMessage('lastName') && (
                        <p className={`pp-field-msg ${getFieldMessage('lastName').type === 'error' ? 'error' : 'success'}`}>
                          {getFieldMessage('lastName').text}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pp-field">
                    <label className="pp-label">Email address</label>
                    <input
                      className={`pp-input ${fieldErrors.email ? 'pp-input-error' : ''}`}
                      name="email"
                      type="email"
                      value={draft.email}
                      onChange={handleChange}
                      onBlur={() => setFieldTouched((prev) => ({ ...prev, email: true }))}
                      placeholder="you@email.com"
                      disabled
                      aria-invalid={Boolean(fieldErrors.email)}
                    />
                    {getFieldMessage('email') && (
                      <p className={`pp-field-msg ${getFieldMessage('email').type === 'error' ? 'error' : 'success'}`}>
                        {getFieldMessage('email').text}
                      </p>
                    )}
                  </div>

                  <div className="pp-field">
                    <label className="pp-label">Phone number</label>
                    <input
                      className={`pp-input ${fieldErrors.phone ? 'pp-input-error' : ''}`}
                      name="phone"
                      type="tel"
                      value={draft.phone}
                      onChange={handleChange}
                      onBlur={() => setFieldTouched((prev) => ({ ...prev, phone: true }))}
                      placeholder="+977 98XXXXXXXX"
                      aria-invalid={Boolean(fieldErrors.phone)}
                    />
                    {getFieldMessage('phone') && (
                      <p className={`pp-field-msg ${getFieldMessage('phone').type === 'error' ? 'error' : 'success'}`}>
                        {getFieldMessage('phone').text}
                      </p>
                    )}
                  </div>

                  <div className="pp-field">
                    <label className="pp-label">Profile photo</label>
                    <div className="pp-photo-row">
                      <div className="pp-photo-thumb">
                        {avatarSrc
                          ? <img src={avatarSrc} alt="Preview" className="pp-photo-thumb-img" />
                          : <span className="pp-photo-thumb-initials">{initials || 'U'}</span>
                        }
                      </div>
                      <div className="pp-photo-actions">
                        <button className="pp-upload-btn" onClick={handleAvatarClick}>
                          Upload photo
                        </button>
                        {avatarSrc && (
                          <button
                            className="pp-remove-btn"
                            onClick={handleRemoveProfileImage}
                            disabled={isRemoving}
                          >
                            {isRemoving ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                        <span className="pp-photo-hint">JPG or PNG · Max 2 MB</span>
                        {getFieldMessage('profile_image') && (
                          <span className={`pp-field-msg ${getFieldMessage('profile_image').type === 'error' ? 'error' : 'success'}`}>
                            {getFieldMessage('profile_image').text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="pp-footer">
              {formMessage.text && (
                <span className={`pp-form-msg ${formMessage.type === 'error' ? 'error' : 'success'}`}>
                  {formMessage.text}
                </span>
              )}
              {saved && <span className="pp-saved-msg">Changes saved</span>}
              <button className="pp-btn-ghost" onClick={handleCancel}>Cancel</button>
              <button
                className="pp-btn-primary"
                onClick={handleSave}
                disabled={isSaving || Object.values(fieldErrors).some(Boolean)}
              >
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}