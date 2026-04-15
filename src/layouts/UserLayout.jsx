import React, { useState, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Search, User, LogOut } from 'lucide-react';
import { useAuthStore, useCartStore } from '../store/useStore';
import './UserLayout.css';

export default function UserLayout() {
  const { user, token, logout } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [searchFocused, setSearchFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timeoutRef = useRef(null);

  const handleMenuEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMenuOpen(true);
  };

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setMenuOpen(false);
    }, 300);
  };

  const overlayActive = searchFocused || menuOpen;

  return (
    <div className="user-layout">
      <header className="navbar">
        <div className="navbar-container container flex items-center justify-between">
          <Link to="/" className="navbar-brand">
            Bookstore
          </Link>

          <div className="search-bar flex w-full">
            <input
              type="text"
              className="search-input"
              placeholder="Search Bookstore"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <button className="search-btn">
              <Search size={24} />
            </button>
          </div>

          <div className="navbar-actions flex items-center gap-4">
            {token ? (
              <div
                className="nav-dropdown-container"
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
              >
                <div className="nav-link flex flex-col items-start cursor-pointer" onClick={handleLogout}>
                  <span className="leading-tight text-xs text-gray-300">Hello, {user?.username}</span>
                  <div className="flex items-center leading-tight font-bold text-sm">
                    Account
                    <span className="ml-1 text-[10px] text-white">▼</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="nav-dropdown-container"
                onMouseEnter={handleMenuEnter}
                onMouseLeave={handleMenuLeave}
              >
                <Link to="/login" className="nav-link flex flex-col items-start cursor-pointer">
                  <span className="leading-tight text-xs text-gray-300">Hello, sign in</span>
                  <div className="flex items-center leading-tight font-bold text-sm">
                    Account & Lists
                    <span className="ml-1 text-[10px] text-white">▼</span>
                  </div>
                </Link>
                <div className="nav-dropdown-menu" style={{ display: menuOpen ? 'block' : 'none' }}>
                  <div className="text-center w-full">
                    <Link to="/login" className="dropdown-btn">Sign in</Link>
                    <div className="dropdown-register-text mt-2">
                      New customer? <Link to="/register" className="dropdown-register-link">Start here.</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Returns & Orders removed */}
            {/* Cart link removed as per request */}
          </div>
        </div>
        <div className="navbar-bottom">
          <div className="container flex gap-4">
            <a href="#" className="bottom-nav-link">All</a>
            <a href="#" className="bottom-nav-link">Today's Deals</a>
            <a href="#" className="bottom-nav-link">Customer Service</a>
            <a href="#" className="bottom-nav-link">Registry</a>
            <a href="#" className="bottom-nav-link">Gift Cards</a>
            <a href="#" className="bottom-nav-link">Sell</a>
          </div>
        </div>
      </header>

      {/* Dark Overlay for Focus and Hover */}
      {overlayActive && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        ></div>
      )}

      <main className="main-content relative z-30">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} Bookstore. Created with Love.</p>
        </div>
      </footer>
    </div>
  );
}
