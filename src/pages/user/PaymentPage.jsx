import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { paymentApi, orderApi } from '../../services/api';

const formatIDR = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);
const QR_VALIDITY_SECONDS = 15 * 60; // 15 minutes

export default function PaymentPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { paymentMethod = 'qr' } = location.state || {};

  useEffect(() => { document.title = 'Payment | Bookstore'; }, []);

  const [qrData, setQrData] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Countdown timer — 15 minutes, persisted via sessionStorage so closing/reopening doesn't reset it
  const [secondsLeft, setSecondsLeft] = useState(QR_VALIDITY_SECONDS);
  const [timerExpired, setTimerExpired] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const orderRes = await orderApi.get(`/orders/${orderId}`);
        const order = orderRes.data?.data;
        setOrderDetails(order);

        // Backend field is total_price, not total_amount
        const totalAmount = parseFloat(order.total_price ?? order.total_amount ?? 0);

        const qrRes = await paymentApi.post('/payments/qr', {
          order_id: orderId,
          amount: totalAmount,
        });
        setQrData(qrRes.data?.data);

        // Record start time only once per order so timer survives page re-visits
        const storageKey = `qr_start_${orderId}`;
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, Date.now().toString());
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment.');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) load();
  }, [orderId]);

  // Countdown effect — calculates remaining time from persisted start timestamp
  useEffect(() => {
    if (loading || error || confirmed) return;
    const storageKey = `qr_start_${orderId}`;

    const tick = () => {
      const startTime = parseInt(sessionStorage.getItem(storageKey) || Date.now().toString(), 10);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, QR_VALIDITY_SECONDS - elapsed);
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setTimerExpired(true);
        clearInterval(interval);
      }
    };

    tick(); // run immediately on mount to restore correct remaining time
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [loading, error, confirmed, orderId]);

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleConfirm = async () => {
    const pid = qrData?.payment_id || qrData?.id;
    if (!pid) return;
    setConfirming(true);
    setError('');
    try {
      await paymentApi.post('/payments/confirm', { payment_id: pid });
      setConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 130px)', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '40px' }}>🔐</div>
      <div style={{ fontSize: '16px', color: '#565959' }}>Initializing secure payment…</div>
    </div>
  );

  if (error && !qrData) return (
    <div className="container" style={{ padding: '50px 20px' }}>
      <div style={{ color: '#c40000', padding: '14px', background: '#fef0ef', border: '1px solid #fbb', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>
      <button onClick={() => navigate('/')} style={{ padding: '9px 20px', background: '#FFD814', border: '1px solid #a88734', borderRadius: '999px', cursor: 'pointer', fontWeight: 600 }}>Return Home</button>
    </div>
  );

  // Success screen
  if (confirmed) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 130px)' }}>
      <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #d5d9d9', borderRadius: '12px', padding: '50px 40px', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#007600', marginBottom: '8px' }}>Payment Confirmed!</h2>
        <p style={{ color: '#565959', fontSize: '14px', marginBottom: '24px' }}>Your order has been successfully paid. Thank you for shopping at Bookstore!</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <Link to="/orders" style={{ padding: '10px 24px', background: '#FFD814', border: '1px solid #a88734', borderRadius: '999px', textDecoration: 'none', color: '#111', fontWeight: 700, fontSize: '14px' }}>
            View My Orders
          </Link>
          <Link to="/" style={{ padding: '10px 24px', background: '#fff', border: '1px solid #d5d9d9', borderRadius: '999px', textDecoration: 'none', color: '#0f1111', fontSize: '14px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#EAEDED', minHeight: 'calc(100vh - 130px)', padding: '30px 0 50px' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

          {/* Header */}
          <div style={{ background: '#232f3e', padding: '20px 24px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '4px' }}>Order #{orderId?.substring(0, 8)}…</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#FFD814' }}>
              {formatIDR(orderDetails?.total_price ?? orderDetails?.total_amount ?? 0)}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Countdown */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: timerExpired ? '#fef0ef' : '#f0fff0', border: `1px solid ${timerExpired ? '#fbb' : '#99d99a'}`,
              borderRadius: '6px', padding: '10px 14px', marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', color: timerExpired ? '#c40000' : '#007600', fontWeight: 600 }}>
                {timerExpired ? '⏰ QR Code Expired' : '⏳ QR Code Valid for'}
              </div>
              {!timerExpired && (
                <div style={{ fontFamily: 'monospace', fontSize: '20px', fontWeight: 700, color: secondsLeft < 60 ? '#c40000' : '#007600' }}>
                  {formatCountdown(secondsLeft)}
                </div>
              )}
              {timerExpired && (
                <button onClick={() => {
                  sessionStorage.removeItem(`qr_start_${orderId}`);
                  navigate(0);
                }} style={{ fontSize: '12px', padding: '4px 12px', background: '#c40000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Refresh
                </button>
              )}
            </div>

            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#565959', marginBottom: '12px' }}>
                Scan with your mobile banking app
              </div>
              <div style={{
                background: '#f8f9fa', padding: '20px', borderRadius: '8px', display: 'inline-block',
                border: '2px solid #e0e0e0', filter: timerExpired ? 'blur(4px) grayscale(1)' : 'none',
                transition: 'filter 0.3s', position: 'relative'
              }}>
                {qrData?.qr_image ? (
                  <img src={qrData.qr_image} alt="QR Payment" style={{ width: '220px', height: '220px', display: 'block' }} />
                ) : (
                  /* Fallback placeholder QR */
                  <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
                    <svg viewBox="0 0 200 200" width="180" height="180">
                      {/* QR placeholder pattern */}
                      <rect width="200" height="200" fill="white"/>
                      {/* Corner squares */}
                      <rect x="10" y="10" width="60" height="60" fill="none" stroke="#000" strokeWidth="8"/>
                      <rect x="20" y="20" width="40" height="40" fill="#000"/>
                      <rect x="130" y="10" width="60" height="60" fill="none" stroke="#000" strokeWidth="8"/>
                      <rect x="140" y="20" width="40" height="40" fill="#000"/>
                      <rect x="10" y="130" width="60" height="60" fill="none" stroke="#000" strokeWidth="8"/>
                      <rect x="20" y="140" width="40" height="40" fill="#000"/>
                      {/* Center pattern */}
                      <rect x="85" y="85" width="30" height="30" fill="#000"/>
                      <rect x="90" y="10" width="10" height="10" fill="#000"/>
                      <rect x="110" y="10" width="10" height="10" fill="#000"/>
                      <rect x="10" y="90" width="10" height="10" fill="#000"/>
                      <rect x="180" y="90" width="10" height="10" fill="#000"/>
                      <text x="100" y="188" textAnchor="middle" fontSize="10" fill="#888">BOOKSTORE PAY</text>
                    </svg>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#007185', marginTop: '10px' }}>
                Payment ID: {(qrData?.payment_id || qrData?.id)?.substring(0, 12) || 'Generating…'}…
              </div>
            </div>

            {/* Instructions */}
            <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '14px', marginBottom: '20px', fontSize: '13px', color: '#565959', lineHeight: 1.6 }}>
              <strong style={{ color: '#0f1111', display: 'block', marginBottom: '6px' }}>How to pay:</strong>
              <ol style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Open your mobile banking or e-wallet app</li>
                <li>Select "Scan QR" or "Pay via QR"</li>
                <li>Scan the QR code above</li>
                <li>Confirm the amount and complete payment</li>
                <li>Click "Confirm Payment" button below</li>
              </ol>
            </div>

            {error && (
              <div style={{ color: '#c40000', fontSize: '13px', marginBottom: '14px', padding: '10px', background: '#fef0ef', borderRadius: '4px', border: '1px solid #fbb' }}>{error}</div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleConfirm}
                disabled={confirming || timerExpired}
                style={{
                  flex: 1, padding: '12px', background: timerExpired ? '#e0e0e0' : '#FFD814',
                  border: '1px solid #a88734', borderRadius: '999px', fontWeight: 700,
                  fontSize: '14px', cursor: timerExpired ? 'not-allowed' : 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={e => !timerExpired && (e.currentTarget.style.background = '#f0c14b')}
                onMouseLeave={e => !timerExpired && (e.currentTarget.style.background = '#FFD814')}
              >
                {confirming ? 'Confirming…' : timerExpired ? 'QR Expired' : '✓ Confirm Payment'}
              </button>
              <Link
                to="/orders"
                style={{
                  flex: 1, padding: '12px', background: '#fff', border: '1px solid #d5d9d9',
                  borderRadius: '999px', textDecoration: 'none', color: '#0f1111',
                  fontWeight: 600, fontSize: '14px', textAlign: 'center', display: 'block',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                📋 View Orders
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
