import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthStore, useAppStore } from '../store/useStore';
import { bookApi } from '../services/api';
import './UserLayout.css';

const IconPersonFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
  </svg>
);
const IconBoxArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path fillRule="evenodd" d="M6 12.5a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-8a.5.5 0 0 0-.5.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6.5 2h8A1.5 1.5 0 0 1 16 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 5 12.5v-2a.5.5 0 0 1 1 0z"/>
    <path fillRule="evenodd" d="M.146 8.354a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L1.707 7.5H10.5a.5.5 0 0 1 0 1H1.707l2.147 2.146a.5.5 0 0 1-.708.708z"/>
  </svg>
);
const IconPersonLinesFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', flexShrink: 0 }}>
    <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z"/>
  </svg>
);

export default function UserLayout() {
  const { user, token, logout } = useAuthStore();
  const { books, setBooks, setSelectedAuthor } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuTimeoutRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync search input with URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    if (books.length > 0) return;
    bookApi.get('/books')
      .then(r => setBooks(r.data?.data?.books || []))
      .catch(console.error);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchFocused(false);
    }
  };

  const uniqueAuthors = [...new Set(books.map(b => b.author))].filter(Boolean);
  const topAuthors = uniqueAuthors.slice(0, 5);

  const handleLogout = () => { logout(); navigate('/'); };
  const handleMenuEnter = () => { if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current); setMenuOpen(true); };
  const handleMenuLeave = () => { menuTimeoutRef.current = setTimeout(() => setMenuOpen(false), 300); };

  // Overlay: sidebar OR menu OR search focused
  const overlayActive = sidebarOpen || menuOpen || searchFocused;

  return (
    <div className="user-layout">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="navbar" style={{ position: 'relative', zIndex: 100 }}>
        <div className="navbar-container container flex items-center justify-between">
          <Link to="/" className="navbar-brand" onClick={() => setSelectedAuthor(null)}>
            Bookstore
          </Link>

          {/* Search Bar */}
          <div className="search-bar flex w-full" style={{ position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%' }}>
              <input
                type="text"
                className="search-input"
                placeholder="Search books or authors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                autoComplete="off"
              />
              <button className="search-btn" type="submit">
                <Search size={24} />
              </button>
            </form>
          </div>

          {/* Right Nav */}
          <div className="navbar-actions flex items-center gap-4">
            {token ? (
              <div className="nav-dropdown-container flex items-center" onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave} style={{ position: 'relative' }}>
                <div className="nav-link flex flex-col items-start cursor-pointer" style={{ marginRight: '2px' }}>
                  <span className="leading-tight text-xs text-gray-300">Hello, {user?.username}</span>
                  <div className="flex items-center leading-tight" style={{ fontWeight: '800' }}>Account &amp; Lists</div>
                </div>
                <span className="text-[10px] text-gray-300" style={{ marginTop: '12px', marginLeft: '-2px' }}>▼</span>
                <div className="nav-dropdown-menu" style={{ display: menuOpen ? 'block' : 'none', minWidth: '170px', padding: '12px' }}>
                  <Link to="/profile" style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', color: '#0f1111', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', borderRadius: '8px', transition: 'background-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <IconPersonFill /> Profile
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left', padding: '10px 14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }} 
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}>
                    <IconBoxArrowLeft /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-dropdown-container flex items-center" onMouseEnter={handleMenuEnter} onMouseLeave={handleMenuLeave} style={{ position: 'relative' }}>
                <Link to="/login" className="nav-link flex flex-col items-start cursor-pointer" style={{ marginRight: '2px' }}>
                  <span className="leading-tight text-xs text-gray-300">Hello, sign in</span>
                  <div className="flex items-center leading-tight" style={{ fontWeight: '800' }}>Account &amp; Lists</div>
                </Link>
                <span className="text-[10px] text-gray-300" style={{ marginTop: '12px', marginLeft: '-2px' }}>▼</span>
                <div className="nav-dropdown-menu" style={{ display: menuOpen ? 'block' : 'none' }}>
                  <div className="text-center w-full">
                    <Link to="/login" className="dropdown-btn">Sign in</Link>
                    <div className="dropdown-register-text mt-2">New customer? <Link to="/register" className="dropdown-register-link">Start here.</Link></div>
                  </div>
                </div>
              </div>
            )}
            <Link to="/orders" className="nav-link flex items-center text-white" style={{ textDecoration: 'none', fontWeight: '800' }}>
              <span style={{ fontSize: '15px' }}>Orders</span>
            </Link>
          </div>
        </div>

        {/* Bottom Nav */}
        {!isProfilePage && (
          <div className="navbar-bottom">
            <div className="container flex gap-4" style={{ alignItems: 'center' }}>
              <span className="bottom-nav-link" style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setSidebarOpen(true)}>
                ☰ All
              </span>
              {topAuthors.map((author, idx) => (
                <span key={idx} className="bottom-nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate(`/author/${encodeURIComponent(author)}`)}>
                  {author}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Dark Overlay (sidebar + account hover + search focus) ── */}
      {overlayActive && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50 }}
          onClick={() => { setSidebarOpen(false); setMenuOpen(false); setSearchFocused(false); }}
        />
      )}

      {/* ── Author Sidebar ─────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '290px',
        background: '#fff', zIndex: 200, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease', boxShadow: '4px 0 16px rgba(0,0,0,0.25)', overflowY: 'auto'
      }}>
        <div style={{ background: '#232f3e', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '16px' }}>Browse by Author</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: '8px 0' }}>
          <div style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#0f1111', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => { setSidebarOpen(false); navigate('/'); }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            🏠 All Books
          </div>
          {uniqueAuthors.map((author, i) => (
            <div key={i} style={{ padding: '12px 20px', cursor: 'pointer', fontSize: '14px', color: '#0f1111', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}
              onClick={() => { setSidebarOpen(false); navigate(`/author/${encodeURIComponent(author)}`); }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <IconPersonLinesFill />{author}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="main-content" style={{ position: 'relative', zIndex: 30 }}>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container text-center">
          <p>&copy; {new Date().getFullYear()} Bookstore. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
