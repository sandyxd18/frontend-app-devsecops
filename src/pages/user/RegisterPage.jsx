import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import './LoginPage.css';

export default function RegisterPage() {
  useEffect(() => { document.title = 'Register | Bookstore'; }, []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const navigate = useNavigate();

  const lengthValid  = password.length >= 8 && password.length <= 12;
  const caseValid    = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const numberValid  = /\d/.test(password);
  const symbolValid  = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  useEffect(() => {
    const check = async () => {
      if (!username) { setUsernameAvailable(null); return; }
      try {
        const res = await authApi.get(`/auth/check-username?username=${username}`);
        setUsernameAvailable(res.data?.data?.available);
      } catch { setUsernameAvailable(false); }
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [username]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (usernameAvailable === false) { setError('Username is already taken.'); return; }
    if (!lengthValid || !caseValid || !numberValid || !symbolValid) { setError('Please ensure your password meets all criteria.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await authApi.post('/auth/register', { username, password });
      if (res.data?.success) {
        const key = res.data?.data?.recovery_key;
        setRecoveryKey(key || null);
        if (!key) navigate('/login');
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(recoveryKey).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  const handleDownload = () => {
    const content = `Bookstore Recovery Key\n======================\n\nUsername: ${username}\nRecovery Key: ${recoveryKey}\n\nIMPORTANT: Store this file in a safe place.\nThis key is used to reset your password if you forget it.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookstore-recovery-key-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Recovery Key Screen ──────────────────────────────────────────────────
  if (recoveryKey) {
    return (
      <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '28px', fontWeight: 'bold' }}>Bookstore</Link>
        </div>
        <div style={{ width: '440px', margin: '20px auto 0', flex: 1 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '26px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '46px', marginBottom: '8px' }}>🔐</div>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#007600', margin: 0 }}>Account Created!</h2>
              <p style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>
                Your account <strong>{username}</strong> has been successfully registered.
              </p>
            </div>

            <div style={{ background: '#fffbe6', border: '1px solid #f5c518', borderRadius: '6px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7a5800', marginBottom: '6px' }}>
                ⚠️ IMPORTANT — Save Your Recovery Key
              </div>
              <p style={{ fontSize: '12px', color: '#555', marginBottom: '12px', lineHeight: 1.6 }}>
                This key is shown <strong>only once</strong>. Use it to reset your password if you forget it.
                Store it in a safe place — it cannot be recovered later.
              </p>
              {/* Key Box */}
              <div style={{
                background: '#fff', border: '2px dashed #f5c518', borderRadius: '4px',
                padding: '14px', textAlign: 'center', fontFamily: 'monospace',
                fontSize: '15px', fontWeight: 700, letterSpacing: '1.5px', color: '#131921',
                userSelect: 'all', wordBreak: 'break-all', lineHeight: 1.7,
              }}>
                {recoveryKey}
              </div>

              {/* Copy + Download row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 1, padding: '8px', background: '#f5c518', border: '1px solid #e2b100',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                  }}
                >
                  📋 Copy Key
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1, padding: '8px', background: '#fff', border: '1px solid #949494',
                    borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0f1111'
                  }}
                >
                  ⬇️ Download .txt
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="auth-btn-primary"
              style={{ fontSize: '14px', padding: '11px' }}
            >
              I've saved my key — Go to Sign In
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#777' }}>© 2026, Bookstore. All Rights Reserved</span>
        </div>

        {/* Copy Toast */}
        {copyToast && <div className="copy-toast">✓ Recovery key copied to clipboard!</div>}
      </div>
    );
  }

  // ─── Register Form ────────────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '28px', fontWeight: 'bold' }}>Bookstore</Link>
      </div>

      <div style={{ width: '348px', margin: '20px auto 0', flex: 1 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '22px 26px 26px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 500, marginBottom: '18px', color: '#0f1111' }}>Create account</h1>

          {error && (
            <div style={{ color: '#c40000', fontSize: '13px', border: '1px solid #d82c0d', padding: '10px 12px', backgroundColor: '#fef0ef', borderRadius: '4px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Username */}
            <div className="auth-form-group">
              <label htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type="text"
                  id="username"
                  value={username}
                  onChange={e => setUsername(e.target.value.substring(0, 12))}
                  required
                  maxLength="12"
                  style={{ paddingRight: '30px' }}
                />
                {username.length > 0 && usernameAvailable === true && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#007600', fontWeight: 'bold', fontSize: '16px' }}>✓</span>
                )}
                {username.length > 0 && usernameAvailable === false && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#c40000', fontWeight: 'bold', fontSize: '16px' }}>✗</span>
                )}
              </div>
            </div>

            {/* Password */}
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
                <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Re-enter password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="auth-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    paddingRight: '48px',
                    borderColor: confirmPassword && password !== confirmPassword ? '#c40000' : undefined,
                  }}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span style={{ color: '#c40000', fontSize: '12px', marginTop: '4px' }}>Passwords do not match</span>
              )}
            </div>

            {/* Password Criteria */}
            <div style={{ fontSize: '12px', color: '#565959', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: '3px' }}>Password must contain:</div>
              {[
                [lengthValid,  '8 – 12 characters'],
                [caseValid,    'Uppercase & lowercase letters'],
                [numberValid,  'At least one number'],
                [symbolValid,  'At least one symbol'],
              ].map(([ok, lbl], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ok ? '#007600' : '#d82c0d' }}>
                  <span style={{ width: '14px', fontWeight: 'bold' }}>{ok ? '✓' : '✗'}</span>{lbl}
                </div>
              ))}
            </div>

            <button type="submit" className="auth-btn-primary" style={{ marginTop: '6px' }} disabled={loading}>
              {loading ? 'Creating account…' : 'Continue'}
            </button>

            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
              By creating an account, you agree to Bookstore's{' '}
              <a href="#" style={{ color: '#0066c0', textDecoration: 'none' }}>Conditions of Use</a>{' '}
              and <a href="#" style={{ color: '#0066c0', textDecoration: 'none' }}>Privacy Notice</a>.
            </div>
          </form>

          <div style={{ borderTop: '1px solid #e7e7e7', marginTop: '18px', paddingTop: '14px', fontSize: '13px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#0066c0', textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: '40px', textAlign: 'center' }}>
        <span style={{ fontSize: '11px', color: '#777' }}>© 2026, Bookstore. All Rights Reserved</span>
      </div>
    </div>
  );
}
