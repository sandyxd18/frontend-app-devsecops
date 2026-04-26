import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Search, LogOut, User } from 'lucide-react';
import { useAuthStore, useAppStore } from '../store/useStore';
import { bookApi, authApi } from '../services/api';
import './UserLayout.css';

const IconPersonFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
  </svg>
);

const IconPersonLinesFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', flexShrink: 0 }}>
    <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zM11 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m.5 2.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 0-1zm2 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1zm0 3a.5.5 0 0 0 0 1h2a.5.5 0 0 0 0-1z"/>
  </svg>
);

// Home icon (sidebar "All Books" entry)
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

// Article + Person icon (sidebar author entries)
const IconArticlePerson = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M13 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM3 7H1v14h2V7zm0-4H1v2h2V3zm18 0h-2v2h2V3zm0 4h-2v14h2V7z"/>
  </svg>
);

export default function UserLayout() {
  const { user, setUser, clearUser } = useAuthStore();
  const { books, setBooks, setSelectedAuthor } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isProfilePage = location.pathname === '/profile';
  const isOrdersPage  = location.pathname === '/orders';

  // Pages where bottom navbar (search + authors) is hidden
  const hideBottomNav = isProfilePage || isOrdersPage;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuTimeoutRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll-hide state — navbar is hidden when scrolling down, revealed on scroll up
  const [navbarHidden, setNavbarHidden] = useState(false);
  const lastScrollY = useRef(0);
  const isHomePage = location.pathname === '/';

  // Sync search input with URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  // Restore auth session from HttpOnly cookie on mount
  useEffect(() => {
    if (user) return;
    authApi.get('/auth/me')
      .then(res => {
        const data = res.data?.data;
        if (data) setUser(data, data.token);
        else clearUser();
      })
      .catch(() => clearUser());
  }, []);



  // Fetch books once on mount
  useEffect(() => {
    bookApi.get('/books')
      .then(r => setBooks(r.data?.data?.books || []))
      .catch(console.error);
  }, []);


  // Scroll-hide behavior: only on home page
  useEffect(() => {
    if (!isHomePage) {
      setNavbarHidden(false);
      return;
    }
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 10) {
        // At top — always show
        setNavbarHidden(false);
      } else if (currentY > lastScrollY.current + 5) {
        // Scrolling down — hide
        setNavbarHidden(true);
      } else if (currentY < lastScrollY.current - 5) {
        // Scrolling up — reveal
        setNavbarHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHomePage]);

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

  const handleLogout = async () => {
    try { await authApi.post('/auth/logout'); } catch {}
    clearUser(); navigate('/');
  };

  const handleMenuEnter = () => { if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current); setMenuOpen(true); };
  const handleMenuLeave = () => { menuTimeoutRef.current = setTimeout(() => setMenuOpen(false), 300); };

  // Overlay: sidebar OR menu OR search focused
  const overlayActive = sidebarOpen || menuOpen || searchFocused;

  return (
    <div className="user-layout">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header
        className="navbar"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          transform: navbarHidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}
      >
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
            {user ? (
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
                  {/* Sign Out — red button matching dashboard style */}
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%', textAlign: 'left',
                      padding: '10px 14px', background: '#ef4444', color: 'white',
                      border: 'none', cursor: 'pointer', fontSize: '14px', borderRadius: '8px',
                      transition: 'background-color 0.2s', fontWeight: 600, gap: '6px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                    onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                  >
                    <LogOut size={14} style={{ flexShrink: 0 }} /> Sign Out
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

        {/* Bottom Nav — hidden on profile and orders pages */}
        {!hideBottomNav && (
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
            <div style={{ padding: '12px 20px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#0f1111', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { setSidebarOpen(false); navigate('/'); }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <IconHome />
              All Books
            </div>
          {uniqueAuthors.map((author, i) => (
            <div key={i} style={{ padding: '12px 20px', cursor: 'pointer', fontSize: '14px', color: '#0f1111', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { setSidebarOpen(false); navigate(`/author/${encodeURIComponent(author)}`); }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <IconArticlePerson />
              {author}
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
