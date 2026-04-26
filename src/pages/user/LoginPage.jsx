import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  useEffect(() => { document.title = 'Login | Bookstore'; }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // POST /auth/login — server sets HttpOnly cookie + returns user & token in body
      const response = await authApi.post('/auth/login', { username, password });
      const { user, token } = response.data?.data || {};
      if (!user) throw new Error('Invalid response from server.');
      login(user, token); // token stored in-memory for other service calls
      navigate('/');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '28px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
          Bookstore
        </Link>
      </div>
      <div style={{ width: '1px', height: '1px', background: '#ddd', margin: '0 auto', boxShadow: '0 1px 0 rgba(0,0,0,0.08)', width: '100%' }} />

      {/* Card */}
      <div style={{ width: '348px', margin: '20px auto 0', flex: 1 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '22px 26px 26px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 500, marginBottom: '18px', color: '#0f1111' }}>Sign in</h1>

          {error && (
            <div style={{ color: '#c40000', fontSize: '13px', border: '1px solid #d82c0d', padding: '10px 12px', backgroundColor: '#fef0ef', borderRadius: '4px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="auth-form-group">
              <label htmlFor="username">Username</label>
              <input
                className="auth-input"
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '48px' }}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>

            <button type="submit" className="auth-btn-primary" style={{ marginTop: '4px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: '16px', fontSize: '12px', lineHeight: 1.6, color: '#555' }}>
            By continuing, you agree to Bookstore's{' '}
            <a href="#" style={{ color: '#0066c0', textDecoration: 'none' }}>Conditions of Use</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#0066c0', textDecoration: 'none' }}>Privacy Notice</a>.
          </div>
          <div style={{ marginTop: '10px' }}>
            <Link to="/forgot-password" style={{ color: '#0066c0', textDecoration: 'none', fontSize: '13px' }}>
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0 12px' }}>
          <div style={{ flex: 1, borderTop: '1px solid #e7e7e7' }} />
          <span style={{ padding: '0 12px', fontSize: '12px', color: '#767676' }}>New to Bookstore?</span>
          <div style={{ flex: 1, borderTop: '1px solid #e7e7e7' }} />
        </div>

        <Link to="/register" className="auth-btn-secondary">
          Create your Bookstore account
        </Link>
      </div>

      <div style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: '40px', textAlign: 'center' }}>
        <span style={{ fontSize: '11px', color: '#777' }}>© 2026, Bookstore. All Rights Reserved</span>
      </div>
    </div>
  );
}
