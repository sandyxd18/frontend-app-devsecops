import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import './LoginPage.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New recovery key given after successful reset
  const [newRecoveryKey, setNewRecoveryKey] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const navigate = useNavigate();

  const lengthValid = newPassword.length >= 8 && newPassword.length <= 12;
  const caseValid   = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const numberValid = /\d/.test(newPassword);
  const symbolValid = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleContinue = (e) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    setError('');
    setStep(2);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (!lengthValid || !caseValid || !numberValid || !symbolValid) {
      setError('New password does not meet all criteria.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.post('/auth/forgot-password', {
        username,
        recovery_key: recoveryKey,
        new_password: newPassword,
      });
      // Backend returns a new recovery_key after reset
      const newKey = res.data?.data?.recovery_key || res.data?.data?.new_recovery_key;
      if (newKey) {
        setNewRecoveryKey(newKey);
      } else {
        // No new key — just redirect
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check your recovery key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newRecoveryKey).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  const handleDownload = () => {
    const content = `Bookstore Recovery Key (New)\n============================\n\nUsername: ${username}\nRecovery Key: ${newRecoveryKey}\n\nIMPORTANT: This is your NEW recovery key after password reset.\nStore it in a safe place.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookstore-new-recovery-key-${username}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── New Recovery Key Screen (after successful reset) ──────────────────────
  if (newRecoveryKey) {
    return (
      <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '28px', fontWeight: 'bold' }}>Bookstore</Link>
        </div>
        <div style={{ width: '440px', margin: '20px auto 0', flex: 1 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '26px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '44px', marginBottom: '8px' }}>✅</div>
              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#007600', margin: 0 }}>Password Reset!</h2>
              <p style={{ fontSize: '13px', color: '#555', marginTop: '6px' }}>
                Your password has been updated. A <strong>new recovery key</strong> has been issued.
              </p>
            </div>

            <div style={{ background: '#fffbe6', border: '1px solid #f5c518', borderRadius: '6px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7a5800', marginBottom: '6px' }}>
                ⚠️ Your New Recovery Key
              </div>
              <p style={{ fontSize: '12px', color: '#555', marginBottom: '12px', lineHeight: 1.6 }}>
                Your old key is now invalid. Save this new key — it's shown <strong>only once</strong>.
              </p>
              <div style={{
                background: '#fff', border: '2px dashed #f5c518', borderRadius: '4px',
                padding: '14px', textAlign: 'center', fontFamily: 'monospace',
                fontSize: '15px', fontWeight: 700, letterSpacing: '1.5px', color: '#131921',
                userSelect: 'all', wordBreak: 'break-all', lineHeight: 1.7,
              }}>
                {newRecoveryKey}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={handleCopy}
                  style={{ flex: 1, padding: '8px', background: '#f5c518', border: '1px solid #e2b100', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  📋 Copy Key
                </button>
                <button
                  onClick={handleDownload}
                  style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #949494', borderRadius: '999px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0f1111' }}
                >
                  ⬇️ Download .txt
                </button>
              </div>
            </div>

            <button onClick={() => navigate('/login')} className="auth-btn-primary" style={{ padding: '11px', fontSize: '14px' }}>
              I've saved my key — Sign In
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: '40px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#777' }}>© 2026, Bookstore. All Rights Reserved</span>
        </div>
        {copyToast && <div className="copy-toast">✓ Recovery key copied to clipboard!</div>}
      </div>
    );
  }

  // ─── Forgot Password Form ────────────────────────────────────────────────
  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', padding: '18px 0 10px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#000', fontSize: '28px', fontWeight: 'bold' }}>Bookstore</Link>
      </div>

      <div style={{ width: '380px', margin: '20px auto 0', flex: 1 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '22px 26px 26px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '6px', color: '#0f1111' }}>Password assistance</h1>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '18px', lineHeight: 1.5 }}>
            Enter your username, then use your recovery key to set a new password.
          </p>

          {error && (
            <div style={{ color: '#c40000', fontSize: '13px', border: '1px solid #d82c0d', padding: '10px 12px', backgroundColor: '#fef0ef', borderRadius: '4px', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <button type="submit" className="auth-btn-primary">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: '#565959', padding: '8px 10px', background: '#f0f2f2', borderRadius: '4px' }}>
                Resetting password for: <strong>{username}</strong>
              </div>

              <div className="auth-form-group">
                <label htmlFor="rkey">Recovery Key</label>
                <input
                  className="auth-input"
                  type="text"
                  id="rkey"
                  value={recoveryKey}
                  onChange={e => setRecoveryKey(e.target.value)}
                  required
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="auth-form-group">
                <label htmlFor="newPw">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    id="newPw"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '48px' }}
                  />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </span>
                </div>
              </div>

              {newPassword.length > 0 && (
                <div style={{ fontSize: '12px', lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 700, marginBottom: '3px', color: '#565959' }}>Password must contain:</div>
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
              )}

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? 'Resetting…' : 'Save new password'}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ background: 'none', border: 'none', color: '#0066c0', cursor: 'pointer', fontSize: '13px', textAlign: 'left', padding: 0 }}>
                ← Change username
              </button>
            </form>
          )}
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#0066c0', textDecoration: 'none', fontSize: '13px' }}>Back to Sign In</Link>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eee', padding: '18px 0', marginTop: '40px', textAlign: 'center' }}>
        <span style={{ fontSize: '11px', color: '#777' }}>© 2026, Bookstore. All Rights Reserved</span>
      </div>
    </div>
  );
}
