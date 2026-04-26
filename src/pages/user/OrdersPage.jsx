import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useStore';
import { orderApi, paymentApi, bookApi } from '../../services/api';

const formatIDR = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const STATUS_COLORS = {
  PENDING:   { bg: '#fffbe6', text: '#b45309', border: '#f5c518' },
  PAID:      { bg: '#f0fff0', text: '#059669', border: '#99d99a' },
  COMPLETED: { bg: '#f0fff0', text: '#059669', border: '#99d99a' },
  CANCELLED: { bg: '#fef0ef', text: '#c40000', border: '#fbb' },
  EXPIRED:   { bg: '#fef0ef', text: '#c40000', border: '#fbb' },
};

const QR_VALIDITY_SECONDS = 15 * 60;

// ─── QR Payment Modal ────────────────────────────────────────────────────────
function QRModal({ order, onClose, onCancelled, onConfirmed }) {
  const storageKey = `qr_start_${order.id}`;

  const [qrData, setQrData]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(QR_VALIDITY_SECONDS);
  const [expired, setExpired]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError]         = useState('');

  // Fetch QR from backend (idempotent — returns existing PENDING payment if any)
  const fetchQR = () => {
    setLoading(true);
    setError('');
    paymentApi.post('/payments/qr', {
      order_id: order.id,
      amount: parseFloat(order.total_price ?? order.total_amount ?? 0),
    })
      .then(r => {
        setQrData(r.data?.data);
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, Date.now().toString());
        }
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load QR.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchQR(); }, []);

  // Countdown — persisted via sessionStorage so closing/reopening doesn't reset
  useEffect(() => {
    if (loading || confirmed) return;

    const tick = () => {
      const startTime = parseInt(sessionStorage.getItem(storageKey) || Date.now().toString(), 10);
      const elapsed   = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, QR_VALIDITY_SECONDS - elapsed);
      setSecondsLeft(remaining);
      if (remaining === 0) {
        setExpired(true);
        clearInterval(iv);
        // Auto-cancel the order on the backend when QR expires
        orderApi.patch(`/orders/${order.id}/status`, { status: 'CANCELLED' })
          .then(() => { if (onCancelled) onCancelled(order.id); })
          .catch(() => {});
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [loading, confirmed]);

  const formatCountdown = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Fix: backend returns payment_id, not id
  const handleConfirm = async () => {
    const pid = qrData?.payment_id || qrData?.id;
    if (!pid) return;
    setConfirming(true);
    setError('');
    try {
      await paymentApi.post('/payments/confirm', { payment_id: pid });
      setConfirmed(true);
      // Use callback to update state instead of full page reload (which would log out the user)
      setTimeout(() => {
        onClose();
        if (onConfirmed) onConfirmed(order.id);
      }, 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  const handleRefresh = () => {
    sessionStorage.removeItem(storageKey);
    sessionStorage.setItem(storageKey, Date.now().toString());
    setExpired(false);
    setSecondsLeft(QR_VALIDITY_SECONDS);
    setQrData(null);
    fetchQR();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '12px', width: '440px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: '#232f3e', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Order #{order.id.substring(0, 8)}…</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#FFD814' }}>
              {formatIDR(order.total_price ?? order.total_amount ?? 0)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px' }}>
          {confirmed ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: '#007600', marginBottom: '8px' }}>Payment Confirmed!</h3>
              <p style={{ color: '#565959', fontSize: '13px' }}>Refreshing orders…</p>
            </div>
          ) : (
            <>
              {/* Countdown */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: expired ? '#fef0ef' : '#f0fff0',
                border: `1px solid ${expired ? '#fbb' : '#99d99a'}`,
                borderRadius: '6px', padding: '8px 14px', marginBottom: '16px',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: expired ? '#c40000' : '#007600' }}>
                  {expired ? '⏰ QR Expired — Order Cancelled' : '⏳ Valid for'}
                </span>
                {!expired && (
                  <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 700, color: secondsLeft < 60 ? '#c40000' : '#007600' }}>
                    {formatCountdown(secondsLeft)}
                  </span>
                )}
                {expired && (
                  <button
                    onClick={handleRefresh}
                    style={{ fontSize: '12px', padding: '3px 10px', background: '#c40000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Refresh
                  </button>
                )}
              </div>

              {/* QR Image */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#565959' }}>Loading QR…</div>
              ) : (
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{
                    display: 'inline-block', padding: '16px',
                    background: '#f8f9fa', border: '2px solid #e0e0e0', borderRadius: '8px',
                    filter: expired ? 'blur(4px) grayscale(1)' : 'none', transition: 'filter 0.3s',
                  }}>
                    {/* Fix: backend returns qr_image, not qr_code_base64 */}
                    {qrData?.qr_image ? (
                      <img src={qrData.qr_image} alt="QR Payment" style={{ width: '180px', height: '180px', display: 'block' }} />
                    ) : (
                      <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '13px' }}>
                        📲 QR not available
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#007185', marginTop: '8px' }}>
                    Payment ID: {(qrData?.payment_id || qrData?.id)?.substring(0, 12) || '—'}…
                  </div>
                </div>
              )}

              {error && (
                <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px', background: '#fef0ef', borderRadius: '4px' }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleConfirm}
                  disabled={confirming || expired || loading}
                  style={{
                    flex: 1, padding: '11px',
                    background: (expired || loading) ? '#e0e0e0' : '#FFD814',
                    border: '1px solid #a88734', borderRadius: '999px',
                    fontWeight: 700, fontSize: '14px',
                    cursor: (expired || loading) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {confirming ? 'Confirming…' : expired ? 'QR Expired' : '✓ Confirm Payment'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────
function OrderDetailModal({ order, bookMap, onClose, onPayNow, onCancelRequest }) {
  const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
  const isPending   = order.status === 'PENDING';
  const items       = order.items || order.order_items || [];

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: '12px', width: '500px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: '#232f3e', padding: '16px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Detail</div>
            <div style={{ fontSize: '13px', color: '#ccc', fontFamily: 'monospace' }}>#{order.id}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '22px', lineHeight: 1 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Summary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Order Date</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f1111' }}>
                {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Total</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#B12704' }}>
                {formatIDR(order.total_price ?? order.total_amount ?? 0)}
              </div>
            </div>
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Status</div>
              <span style={{
                display: 'inline-block', fontSize: '12px', fontWeight: 700,
                padding: '2px 10px', borderRadius: '999px',
                background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`,
              }}>
                {order.status === 'EXPIRED' ? 'CANCELLED' : order.status}
              </span>
            </div>
          </div>

          {/* Items */}
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f1111', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Items Ordered
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {items.map((item, idx) => {
              const book = bookMap[item.book_id] || {};
              return (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <img
                    src={book.image_url || `https://via.placeholder.com/48x64/e0e0e0/888?text=📖`}
                    alt={book.title || 'Book'}
                    style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0, border: '1px solid #e0e0e0' }}
                    onError={e => { e.currentTarget.src = `https://via.placeholder.com/48x64/e0e0e0/888?text=Book`; }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#0f1111', fontSize: '14px', marginBottom: '2px' }}>
                      {book.title || `Book #${item.book_id?.substring(0, 8)}…`}
                    </div>
                    {book.author && (
                      <div style={{ fontSize: '12px', color: '#007185', marginBottom: '4px' }}>by {book.author}</div>
                    )}
                    <div style={{ fontSize: '12px', color: '#565959' }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#B12704', flexShrink: 0 }}>
                    {formatIDR(item.price)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f1111' }}>Order Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#B12704' }}>
              {formatIDR(order.total_price ?? order.total_amount ?? 0)}
            </span>
          </div>
        </div>

        {/* Footer */}
        {isPending && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e7e7e7', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { onClose(); onPayNow(order); }}
                style={{
                  flex: 1, padding: '12px', background: '#FFD814',
                  border: '1px solid #a88734', borderRadius: '999px',
                  fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0c14b'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFD814'}
              >
                📲 Pay Now
              </button>
              <button
                onClick={() => {
                  onCancelRequest?.(order);
                }}
                style={{
                  flex: 1, padding: '12px', background: '#fff',
                  border: '1px solid #c40000', color: '#c40000', borderRadius: '999px',
                  fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#c40000'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#c40000'; }}
              >
                ❌ Cancel Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders Page ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user } = useAuthStore();
  useEffect(() => { document.title = 'Order List | Bookstore'; }, []);
  const [orders, setOrders]       = useState([]);
  const [bookMap, setBookMap]     = useState({}); // { book_id: { title, image_url, author } }
  const [loading, setLoading]     = useState(true);
  const [qrOrder, setQrOrder]     = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);

  // Fetch orders then enrich with book details
  useEffect(() => {
    if (!user?.id) return;

    orderApi.get(`/orders/user/${user.id}`)
      .then(async r => {
        const data = r.data?.data?.orders || r.data?.orders || r.data || [];
        const ordersArr = Array.isArray(data) ? data : [];
        setOrders(ordersArr);

        // Collect all unique book_ids across all orders
        const bookIds = [...new Set(
          ordersArr.flatMap(o => (o.items || o.order_items || []).map(i => i.book_id))
        )].filter(Boolean);

        // Fetch book details in parallel
        const map = {};
        await Promise.allSettled(
          bookIds.map(id =>
            bookApi.get(`/books/${id}`)
              .then(res => { map[id] = res.data?.data; })
              .catch(() => {})
          )
        );
        setBookMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Called when QR expires and order is auto-cancelled
  const handleOrderCancelled = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    setQrOrder(null);
  };

  // Called when payment is successfully confirmed
  const handleOrderConfirmed = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PAID' } : o));
    setQrOrder(null);
  };

  if (!user) return <Navigate to="/login" replace />;


  return (
    <div style={{ backgroundColor: '#EAEDED', minHeight: 'calc(100vh - 130px)', padding: '30px 0 50px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, marginBottom: '20px', color: '#0f1111' }}>Your Orders</h1>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#565959' }}>Loading your orders…</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px', background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '46px', marginBottom: '12px' }}>📦</div>
            <h3 style={{ marginBottom: '8px', color: '#0f1111' }}>No orders yet</h3>
            <p style={{ color: '#565959', fontSize: '14px', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
            <Link to="/" style={{ padding: '10px 24px', background: '#FFD814', border: '1px solid #a88734', borderRadius: '999px', textDecoration: 'none', color: '#111', fontWeight: 700 }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => {
              const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
              const isPending   = order.status === 'PENDING';
              const items       = order.items || order.order_items || [];

              return (
                <div key={order.id} style={{ border: '1px solid #d5d9d9', borderRadius: '8px', background: '#fff', overflow: 'hidden' }}>
                  {/* Order Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f2f2', padding: '14px 20px', borderBottom: '1px solid #d5d9d9', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600 }}>Order Placed</div>
                        <div style={{ fontWeight: 500, fontSize: '14px', marginTop: '2px' }}>
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#B12704', marginTop: '2px' }}>
                          {formatIDR(order.total_price ?? order.total_amount)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#565959', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                        <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '999px', background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}` }}>
                          {order.status === 'EXPIRED' ? 'CANCELLED' : order.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '12px', color: '#565959' }}>#{order.id.substring(0, 12)}…</div>
                      {isPending && (
                        <>
                          <button
                            onClick={() => setCancelOrder(order)}
                            style={{ padding: '7px 16px', background: '#fff', border: '1px solid #d5d9d9', borderRadius: '999px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.15s', color: '#0f1111' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f2'; e.currentTarget.style.borderColor = '#aaa'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d5d9d9'; }}
                          >
                            ❌ Cancel
                          </button>
                          <button
                            onClick={() => setQrOrder(order)}
                            style={{ padding: '7px 16px', background: '#FFD814', border: '1px solid #a88734', borderRadius: '999px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0c14b'}
                            onMouseLeave={e => e.currentTarget.style.background = '#FFD814'}
                          >
                            📲 Pay Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div style={{ padding: '16px 20px' }}>
                    {items.map((item, idx) => {
                      const book = bookMap[item.book_id] || {};
                      const isLast = idx === items.length - 1;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex', gap: '16px',
                            marginBottom: isLast ? 0 : '14px',
                            paddingBottom: isLast ? 0 : '14px',
                            borderBottom: isLast ? 'none' : '1px solid #f0f0f0',
                          }}
                        >
                          {/* Book cover */}
                          <img
                            src={book.image_url || `https://via.placeholder.com/50x68/e0e0e0/888?text=Book`}
                            alt={book.title || 'Book'}
                            style={{ width: '50px', height: '68px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0, border: '1px solid #e0e0e0' }}
                            onError={e => { e.currentTarget.src = `https://via.placeholder.com/50x68/e0e0e0/888?text=Book`; }}
                          />
                          <div style={{ flex: 1 }}>
                            {/* Clickable book title → opens order detail modal */}
                            <div
                              onClick={() => setDetailOrder(order)}
                              style={{ fontWeight: 600, color: '#007185', fontSize: '14px', marginBottom: '4px', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.textDecorationColor = '#007185'}
                              onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                            >
                              {book.title || `Book #${item.book_id?.substring(0, 8)}…`}
                            </div>
                            {book.author && (
                              <div style={{ fontSize: '12px', color: '#565959', marginBottom: '4px' }}>by {book.author}</div>
                            )}
                            <div style={{ fontSize: '13px', color: '#565959' }}>Qty: {item.quantity}</div>
                            <div style={{ fontSize: '14px', color: '#B12704', fontWeight: 700, marginTop: '4px' }}>
                              {formatIDR(item.price)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          bookMap={bookMap}
          onClose={() => setDetailOrder(null)}
          onPayNow={(order) => setQrOrder(order)}
          onCancelRequest={(order) => setCancelOrder(order)}
        />
      )}

      {/* QR Payment Modal */}
      {qrOrder && (
        <QRModal
          order={qrOrder}
          onClose={() => setQrOrder(null)}
          onCancelled={handleOrderCancelled}
          onConfirmed={handleOrderConfirmed}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCancelOrder(null)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '400px', overflow: 'hidden', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#c40000', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span> Cancel Order
            </h3>
            <p style={{ fontSize: '14px', color: '#0f1111', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to cancel this order? This action <strong>cannot be undone</strong>.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setCancelOrder(null)} 
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, color: '#0f1111' }}
              >
                No, keep it
              </button>
              <button 
                onClick={async () => {
                  try {
                    await orderApi.patch(`/orders/${cancelOrder.id}/status`, { status: 'CANCELLED' });
                    handleOrderCancelled(cancelOrder.id);
                    if (detailOrder?.id === cancelOrder.id) setDetailOrder(null);
                  } catch (e) {
                    alert('Failed to cancel: ' + (e.response?.data?.message || 'Unknown error'));
                  } finally {
                    setCancelOrder(null);
                  }
                }}
                style={{ padding: '8px 16px', background: '#c40000', border: '1px solid #c40000', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: 600 }}
              >
                Yes, cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
