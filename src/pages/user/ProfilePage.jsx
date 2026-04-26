import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { authApi, orderApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path d="M3.5 11.5a3.5 3.5 0 1 1 3.163-5H14L15.5 8 14 9.5l-1-1-1 1-1-1-1 1-1-1-1 1H6.663a3.5 3.5 0 0 1-3.163 2M2.5 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
  </svg>
);

const IconArrowClockwise = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
  </svg>
);


const IconTriangleFill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
  </svg>
);

// order_approve Material Symbol — order with a checkmark (approval)
const IconOrderApprove = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor" style={{ marginRight: '6px', verticalAlign: 'middle', flexShrink: 0 }}>
    <path d="m691-150 139-138-42-42-97 95-39-39-42 43 81 81ZM240-600h480v-80H240v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM120-80v-680q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v267q-19-9-39-15t-41-9v-243H200v562h243q5 31 15.5 59T486-86l-6 6-60-60-60 60-60-60-60 60-60-60-60 60Zm120-200h203q3-21 9-41t15-39H240v80Zm0-160h284q38-37 88.5-58.5T720-520H240v80Zm-40 242v-562 562Z"/>
  </svg>
);

const modalOverlay = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 500,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const modalBox = {
  background: '#fff', borderRadius: '8px', padding: '28px 30px',
  width: '100%', maxWidth: '420px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
};

export default function ProfilePage() {
  const { user, clearUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => { document.title = 'Profile | Bookstore'; }, []);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Change password modal
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [changePwError, setChangePwError] = useState('');
  const [changePwSuccess, setChangePwSuccess] = useState('');

  // Regenerate recovery key modal
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenPw, setRegenPw] = useState('');
  const [showRegenPw, setShowRegenPw] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenError, setRegenError] = useState('');
  const [newRecoveryKey, setNewRecoveryKey] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const load = async () => {
      try {
        const requests = [authApi.get('/auth/profile')];
        if (user?.id) requests.push(orderApi.get(`/orders/user/${user.id}`));
        const [pRes, oRes] = await Promise.all(requests);
        setProfile(pRes.data?.data);
        if (oRes) setOrders(oRes.data?.data?.orders || oRes.data?.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  const handleLogout = async () => {
    try { await authApi.post('/auth/logout'); } catch {}
    clearUser(); navigate('/');
  };

  const handleDelete = async () => {
    if (!deletePassword) { setDeleteError('Please enter your password.'); return; }
    setDeleting(true); setDeleteError('');
    try {
      await authApi.delete('/auth/account', { data: { password: deletePassword } });
      try { await authApi.post('/auth/logout'); } catch {}
      clearUser(); navigate('/');

    } catch (e) { setDeleteError(e.response?.data?.message || 'Failed.'); setDeleting(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault(); setChangePwError(''); setChangePwSuccess('');
    if (!currentPw || !newPw) { setChangePwError('Please fill all fields.'); return; }
    setChangingPw(true);
    try {
      await authApi.patch('/auth/password', { current_password: currentPw, new_password: newPw });
      setChangePwSuccess('Password changed!');
      setCurrentPw(''); setNewPw('');
      setTimeout(() => { setShowChangePwModal(false); setChangePwSuccess(''); }, 1800);
    } catch (e) { setChangePwError(e.response?.data?.message || 'Failed.'); }
    finally { setChangingPw(false); }
  };

  const handleRegen = async (e) => {
    e.preventDefault(); setRegenError('');
    if (!regenPw) { setRegenError('Please enter your password.'); return; }
    setRegenLoading(true);
    try {
      const res = await authApi.post('/auth/recovery-key/regenerate', { password: regenPw });
      const key = res.data?.data?.recovery_key;
      setNewRecoveryKey(key || '(no key returned)');
      setRegenPw('');
    } catch (e) { setRegenError(e.response?.data?.message || 'Failed to regenerate key.'); }
    finally { setRegenLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newRecoveryKey).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  };

  const handleDownloadKey = () => {
    const txt = `Bookstore Recovery Key\n======================\nUsername: ${profile?.username || user?.username}\nRecovery Key: ${newRecoveryKey}\n\nStore this file safely.`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `bookstore-recovery-key.txt`; a.click();
  };

  const formatDate = (s) => {
    if (!s) return '-';
    const d = new Date(s);
    return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const activeOrders = orders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED');
  const totalBooks = activeOrders.reduce((s, o) => {
    const items = o.items || o.order_items || [];
    return s + items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, 0);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#555' }}>Loading profile…</div>;

  const btnBase = { padding: '9px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, border: 'none', transition: 'all 0.18s' };

  return (
    <div style={{ backgroundColor: '#EAEDED', minHeight: '100vh', paddingTop: '30px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '680px' }}>

        {/* ── Profile Card ── */}
        <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '28px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px' }}>
            <div style={{
              width: '70px', height: '70px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#131921,#232f3e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFD814', fontSize: '28px', fontWeight: 'bold', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              {(profile?.username || user?.username || '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 3px', color: '#0f1111' }}>
                {profile?.username || user?.username}
              </h1>
              <div style={{ fontSize: '13px', color: '#565959' }}>Member since {formatDate(profile?.created_at)}</div>
              <div style={{ fontSize: '11px', color: '#007185', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                {profile?.role || 'user'}
              </div>
            </div>
          </div>

          {/* ── Order History Container (big, clickable → /orders) ── */}
          <div
            onClick={() => navigate('/orders')}
            style={{
              border: '1px solid #d5d9d9', borderRadius: '8px', padding: '18px',
              marginBottom: '22px', cursor: 'pointer', background: '#fafafa',
              transition: 'box-shadow 0.18s',
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f1111', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
              <IconOrderApprove /> Order History
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '16px', textAlign: 'center', border: '1px solid #e8e8e8' }}>
                <div style={{ fontSize: '34px', fontWeight: 700, color: '#131921' }}>{activeOrders.length}</div>
                <div style={{ fontSize: '12px', color: '#565959', marginTop: '4px' }}>Orders Placed</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '6px', padding: '16px', textAlign: 'center', border: '1px solid #e8e8e8' }}>
                <div style={{ fontSize: '34px', fontWeight: 700, color: '#131921' }}>{totalBooks}</div>
                <div style={{ fontSize: '12px', color: '#565959', marginTop: '4px' }}>Books Purchased</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#007185' }}>
              View full order history →
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Sign Out */}
            <button
              onClick={handleLogout}
              style={{ ...btnBase, background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
            >
              <LogOut size={15} /> Sign Out
            </button>

            {/* Change Password */}
            <button
              onClick={() => setShowChangePwModal(true)}
              style={{ ...btnBase, background: '#fff', border: '1px solid #d5d9d9', color: '#0f1111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f2'; e.currentTarget.style.borderColor = '#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d5d9d9'; }}
            >
              <IconKey /> Change Password
            </button>

            {/* Regenerate Recovery Key */}
            <button
              onClick={() => { setShowRegenModal(true); setRegenError(''); setNewRecoveryKey(null); }}
              style={{ ...btnBase, background: '#fff', border: '1px solid #d5d9d9', color: '#0f1111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f2'; e.currentTarget.style.borderColor = '#aaa'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d5d9d9'; }}
            >
              <IconArrowClockwise /> Regenerate Recovery Key
            </button>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div style={{ background: '#fff', border: '1px solid #fbb', borderRadius: '8px', padding: '22px', marginBottom: '18px' }}>
          <h3 style={{ color: '#c40000', fontSize: '14px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
            <IconTriangleFill /> Danger Zone
          </h3>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px', lineHeight: 1.5 }}>
            Permanently delete your account and all data. This action cannot be undone.
          </p>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteError(''); setDeletePassword(''); }}
            style={{ ...btnBase, background: '#fff', color: '#c40000', border: '1px solid #c40000' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c40000'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#c40000'; }}
          >
            Delete Account
          </button>
        </div>


      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div style={modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#c40000', fontSize: '17px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <IconTriangleFill /> Delete Account
            </h3>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '16px', lineHeight: 1.5 }}>
              This will <strong>permanently</strong> delete your account. Enter your password to confirm.
            </p>
            {deleteError && <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px 10px', background: '#fef0ef', borderRadius: '4px', border: '1px solid #fbb' }}>{deleteError}</div>}
            <input type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Enter your password" autoFocus
              style={{ padding: '9px 12px', border: '1px solid #c40000', borderRadius: '4px', width: '100%', outline: 'none', marginBottom: '14px', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ ...btnBase, background: '#e7e9ec', border: '1px solid #adb1b8', fontWeight: 400 }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{ ...btnBase, background: '#c40000', color: '#fff' }}>
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Password Modal ── */}
      {showChangePwModal && (
        <div style={modalOverlay} onClick={() => setShowChangePwModal(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', color: '#0f1111' }}>
              <IconKey /> Change Password
            </h3>
            {changePwError && <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px 10px', background: '#fef0ef', borderRadius: '4px', border: '1px solid #fbb' }}>{changePwError}</div>}
            {changePwSuccess && <div style={{ color: '#007600', fontSize: '13px', marginBottom: '10px', padding: '8px 10px', background: '#f0fff0', borderRadius: '4px', border: '1px solid #99d99a' }}>{changePwSuccess}</div>}
            <form onSubmit={handleChangePw} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {[['Current Password', currentPw, setCurrentPw, showCurrentPw, setShowCurrentPw], ['New Password', newPw, setNewPw, showNewPw, setShowNewPw]].map(([lbl, val, setVal, show, setShow], i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{lbl}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={show ? 'text' : 'password'} value={val} onChange={e => setVal(e.target.value)} required
                      style={{ padding: '9px 44px 9px 12px', border: '1px solid #949494', borderRadius: '4px', width: '100%', outline: 'none', fontSize: '14px' }} />
                    <span onClick={() => setShow(!show)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}>
                      {show ? 'Hide' : 'Show'}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowChangePwModal(false)} style={{ ...btnBase, background: '#e7e9ec', border: '1px solid #adb1b8', fontWeight: 400 }}>Cancel</button>
                <button type="submit" disabled={changingPw} style={{ ...btnBase, background: '#FFD814', border: '1px solid #a88734' }}>{changingPw ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Regenerate Recovery Key Modal ── */}
      {showRegenModal && (
        <div style={modalOverlay} onClick={() => { setShowRegenModal(false); setNewRecoveryKey(null); }}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', color: '#0f1111' }}>
              <IconArrowClockwise /> Regenerate Recovery Key
            </h3>
            {newRecoveryKey ? (
              <>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px', lineHeight: 1.5 }}>
                  Your old key is now invalid. Save this new key — shown <strong>only once</strong>.
                </p>
                <div style={{ background: '#fffbe6', border: '2px dashed #f5c518', borderRadius: '4px', padding: '14px', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, letterSpacing: '1.5px', color: '#131921', wordBreak: 'break-all', textAlign: 'center', marginBottom: '12px', userSelect: 'all' }}>
                  {newRecoveryKey}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button onClick={handleCopy} style={{ ...btnBase, flex: 1, background: '#f5c518', border: '1px solid #e2b100', padding: '8px' }}>📋 Copy</button>
                  <button onClick={handleDownloadKey} style={{ ...btnBase, flex: 1, background: '#fff', border: '1px solid #aaa', padding: '8px', fontWeight: 400 }}>⬇️ Download</button>
                </div>
                <button onClick={() => { setShowRegenModal(false); setNewRecoveryKey(null); }} style={{ ...btnBase, width: '100%', background: '#FFD814', border: '1px solid #a88734' }}>Done — I've saved my key</button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px', lineHeight: 1.5 }}>
                  Enter your current password to generate a new recovery key. Your old key will be permanently invalidated.
                </p>
                {regenError && <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px', background: '#fef0ef', borderRadius: '4px', border: '1px solid #fbb' }}>{regenError}</div>}
                <form onSubmit={handleRegen} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>Current Password</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showRegenPw ? 'text' : 'password'} value={regenPw} onChange={e => setRegenPw(e.target.value)} required autoFocus
                        style={{ padding: '9px 44px 9px 12px', border: '1px solid #949494', borderRadius: '4px', width: '100%', outline: 'none', fontSize: '14px' }} />
                      <span onClick={() => setShowRegenPw(!showRegenPw)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '12px', color: '#007185', userSelect: 'none' }}>
                        {showRegenPw ? 'Hide' : 'Show'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowRegenModal(false)} style={{ ...btnBase, background: '#e7e9ec', border: '1px solid #adb1b8', fontWeight: 400 }}>Cancel</button>
                    <button type="submit" disabled={regenLoading} style={{ ...btnBase, background: '#FFD814', border: '1px solid #a88734' }}>
                      {regenLoading ? 'Generating…' : 'Generate New Key'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Copy Toast */}
      {copyToast && <div className="copy-toast" style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#232f3e', color: '#FFD814', padding: '10px 24px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.35)', whiteSpace: 'nowrap' }}>✓ Recovery key copied!</div>}
    </div>
  );
}
