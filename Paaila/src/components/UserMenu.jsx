import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './UserMenu.css';


export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleLogout() {
    localStorage.clear();
    sessionStorage.clear();
    if (window.caches) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
    window.location.href = '/home';
  }

  return (
    <div className="user-menu" ref={wrapperRef}>
    <button
      type="button"
      className="user-menu__trigger"
      aria-label="Open user menu"
      aria-expanded={open}
      onClick={() => setOpen((prev) => !prev)}
    >
      {/* Hamburger menu icon */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', margin: 'auto' }}
      >
        <rect x="4" y="4" width="16" height="2" rx="1" fill="currentColor" />
        <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
        <rect x="4" y="18" width="16" height="2" rx="1" fill="currentColor" />
      </svg>
    </button>

      {open && (
        <div className="user-menu__dropdown" role="menu">
          <button
            type="button"
            className="user-menu__item"
            onClick={() => {
              setOpen(false);
              navigate('/profile');
            }}
          >
            User Profile
          </button>
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
