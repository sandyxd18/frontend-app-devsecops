import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import { useLoginRateLimit } from '../../hooks/useLoginRateLimit';
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

  // Anti-brute-force: key unik agar tidak konflik dengan dashboard
  const {
    isLocked,
    isPermanent,
    remainingLabel,
    attempts,
    recordFailure,
    resetAttempts,
  } = useLoginRateLimit('login_rl_frontend');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Tolak submit jika sedang dalam status locked
    if (isLocked) return;

    setLoading(true);
    try {
      const response = await authApi.post('/auth/login', { username, password });
      const { user, token } = response.data?.data || {};
      if (!user) throw new Error('Invalid response from server.');

      // Login sukses — reset counter brute-force
      resetAttempts();
      login(user, token);
      navigate('/');

    } catch (err) {
      // Catat kegagalan dan perbarui lock state
      const { isLocked: nowLocked, isPermanent: nowPermanent } = recordFailure();

      if (nowPermanent) {
        setError('Account locked due to too many failed login attempts. Please contact the administrator.');
      } else {
        setError('Incorrect username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pesan lockout untuk ditampilkan di atas form
  const lockBanner = () => {
    if (isPermanent) {
      return (
        <div style={{
          color: '#7f1d1d', fontSize: '13px',
          border: '1px solid #b91c1c',
          padding: '12px 14px',
          backgroundColor: '#fee2e2',
          borderRadius: '4px',
          marginBottom: '14px',
        }}>
          <strong>🚫 Access Denied</strong><br />
          Too many failed login attempts. This session has been permanently blocked.
          Please close the browser and try again, or contact the administrator.
        </div>
      );
    }
    if (isLocked) {
      const attemptsLeft = attempts >= 10 ? '30 menit' : '10 menit';
      return (
        <div style={{
          color: '#78350f', fontSize: '13px',
          border: '1px solid #d97706',
          padding: '12px 14px',
          backgroundColor: '#fef3c7',
          borderRadius: '4px',
          marginBottom: '14px',
        }}>
          <strong>⏳ Temporary Login Locked</strong><br />
          Too many failed login attempts ({attempts}×). Please wait{' '}
          <strong>{remainingLabel()}</strong> before trying again.
        </div>
      );
    }
    // Peringatan ringan setelah ≥ 3 kali gagal, sebelum threshold pertama
    if (attempts >= 3 && attempts < 5) {
      return (
        <div style={{
          color: '#92400e', fontSize: '12px',
          border: '1px solid #fbbf24',
          padding: '10px 12px',
          backgroundColor: '#fffbeb',
          borderRadius: '4px',
          marginBottom: '14px',
        }}>
          ⚠️ {5 - attempts} attempts before temporary login lock.
        </div>
      );
    }
    return null;
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

          {/* Lockout / warning banner */}
          {lockBanner()}

          {/* Error dari server (hanya tampil jika belum locked) */}
          {error && !isLocked && (
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
                disabled={isLocked}
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
                  disabled={isLocked}
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: isLocked ? 'default' : 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="auth-btn-primary"
              style={{ marginTop: '4px' }}
              disabled={loading || isLocked}
            >
              {loading ? 'Signing in…' : isLocked ? (isPermanent ? 'Diblokir' : `Tunggu ${remainingLabel()}`) : 'Sign in'}
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
