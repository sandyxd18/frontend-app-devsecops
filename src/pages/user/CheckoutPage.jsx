import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bookApi, orderApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';

const formatIDR = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

const PAYMENT_METHODS = [
  { id: 'qr', label: 'QR Code', icon: '📲', desc: 'Scan QR with your mobile banking', available: true },
  { id: 'va', label: 'Virtual Account', icon: '🏦', desc: 'Bank transfer via virtual account', available: false },
  { id: 'cc', label: 'Credit Card', icon: '💳', desc: 'Visa, Mastercard, JCB', available: false },
  { id: 'ew', label: 'E-Wallet', icon: '👛', desc: 'GoPay, OVO, ShopeePay, Dana', available: false },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive', available: false },
];

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Book passed via navigate state
  const { book } = location.state || {};

  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('qr');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!book) { navigate('/'); return; }
  }, []);

  if (!book) return null;

  const unitPrice = parseFloat(book.price);
  const totalPrice = unitPrice * quantity;
  const maxQty = Math.min(book.stock, 99);

  const handlePlaceOrder = async () => {
    if (!user) { navigate('/login'); return; }
    setError('');
    setPlacing(true);
    try {
      const res = await orderApi.post('/orders', {
        items: [{ book_id: book.id, quantity }],
      });
      const orderId = res.data?.data?.id;
      if (orderId) {
        navigate(`/payment/${orderId}`, { state: { paymentMethod } });
      } else {
        setError('Failed to create order. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#EAEDED', minHeight: 'calc(100vh - 130px)', padding: '30px 0 50px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '20px', color: '#0f1111' }}>Checkout</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
          {/* ── Left Column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Step 1: Item */}
            <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #e7e7e7', paddingBottom: '10px', marginBottom: '16px', color: '#0f1111' }}>
                1. Your Item
              </h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <img src={book.image_url || 'https://via.placeholder.com/80x110'} alt={book.title}
                  style={{ width: '80px', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#0f1111', marginBottom: '4px' }}>{book.title}</div>
                  <div style={{ fontSize: '13px', color: '#007185', marginBottom: '8px' }}>by {book.author}</div>
                  <div style={{ fontSize: '13px', color: book.stock > 0 ? '#007600' : '#B12704', fontWeight: 600, marginBottom: '10px' }}>
                    {book.stock > 0 ? `In Stock (${book.stock} available)` : 'Out of Stock'}
                  </div>
                  {/* Quantity selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#565959' }}>Qty:</span>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d5d9d9', borderRadius: '4px', overflow: 'hidden' }}>
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        style={{ width: '32px', height: '32px', border: 'none', background: '#f0f2f2', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: quantity <= 1 ? '#aaa' : '#0f1111' }}
                      >−</button>
                      <span style={{ width: '40px', textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{quantity}</span>
                      <button
                        onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty}
                        style={{ width: '32px', height: '32px', border: 'none', background: '#f0f2f2', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', color: quantity >= maxQty ? '#aaa' : '#0f1111' }}
                      >+</button>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#B12704', flexShrink: 0 }}>{formatIDR(totalPrice)}</div>
              </div>
            </div>

            {/* Step 2: Payment Method */}
            <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, borderBottom: '1px solid #e7e7e7', paddingBottom: '10px', marginBottom: '16px', color: '#0f1111' }}>
                2. Payment Method
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PAYMENT_METHODS.map(pm => (
                  <label key={pm.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
                      border: `2px solid ${paymentMethod === pm.id && pm.available ? '#FFD814' : '#d5d9d9'}`,
                      borderRadius: '8px', cursor: pm.available ? 'pointer' : 'not-allowed',
                      background: pm.available ? (paymentMethod === pm.id ? '#fffbe6' : '#fff') : '#f8f8f8',
                      opacity: pm.available ? 1 : 0.7, transition: 'border-color 0.15s',
                    }}
                  >
                    <input type="radio" name="payment" value={pm.id} checked={paymentMethod === pm.id}
                      onChange={() => pm.available && setPaymentMethod(pm.id)}
                      disabled={!pm.available} style={{ accentColor: '#FFD814' }} />
                    <span style={{ fontSize: '22px' }}>{pm.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f1111' }}>{pm.label}</div>
                      <div style={{ fontSize: '12px', color: '#565959' }}>{pm.desc}</div>
                    </div>
                    {!pm.available && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#aaa', borderRadius: '999px', padding: '2px 8px' }}>SOON</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '20px', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0f1111' }}>Order Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#565959' }}>Items ({quantity})</span>
                <span>{formatIDR(totalPrice)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#565959' }}>Shipping</span>
                <span style={{ color: '#007600' }}>FREE</span>
              </div>
              <div style={{ borderTop: '1px solid #e7e7e7', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
                <span>Order Total</span>
                <span style={{ color: '#B12704' }}>{formatIDR(totalPrice)}</span>
              </div>
            </div>

            {error && (
              <div style={{ color: '#c40000', fontSize: '12px', marginBottom: '10px', padding: '8px', background: '#fef0ef', borderRadius: '4px', border: '1px solid #fbb' }}>
                {error}
              </div>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || book.stock <= 0}
              style={{
                width: '100%', padding: '12px', background: '#FFD814', border: '1px solid #a88734',
                borderRadius: '999px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0c14b'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFD814'}
            >
              {placing ? 'Placing Order…' : 'Place Your Order'}
            </button>
            <p style={{ fontSize: '11px', color: '#565959', marginTop: '10px', textAlign: 'center', lineHeight: 1.5 }}>
              By placing your order, you agree to Bookstore's conditions of use and privacy notice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
