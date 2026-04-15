import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi, orderApi } from '../../services/api';
import './PaymentPage.css';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderDetails, setOrderDetails] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchOrderAndGenerateQR = async () => {
      try {
        // Fetch order details simply to know the amount
        const orderRes = await orderApi.get(`/orders/${orderId}`);
        const totalAmount = orderRes.data.data.total_amount;
        setOrderDetails(orderRes.data.data);
        
        // Request QR code from payment service
        const qrRes = await paymentApi.post('/payments/qr', {
          order_id: orderId,
          amount: parseFloat(totalAmount)
        });
        
        setQrCodeData(qrRes.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to initialize payment.');
      } finally {
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrderAndGenerateQR();
    }
  }, [orderId]);

  const handleConfirmPayment = async () => {
    if (!qrCodeData?.id) return;
    
    setConfirming(true);
    setError('');
    try {
      await paymentApi.post('/payments/confirm', {
        payment_id: qrCodeData.id
      });
      alert('Payment Confirmed Successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Loading Secure Payment Gateway...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{padding: '50px'}}>
        <div className="error-alert">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="container flex justify-center" style={{padding: '40px 20px'}}>
      <div className="payment-box card" style={{maxWidth: '500px', width: '100%', textAlign: 'center'}}>
        <h2>Scan to Pay</h2>
        <p style={{color: '#565959', marginBottom: '20px'}}>Order #{orderId.substring(0,8)}...</p>
        
        <div style={{fontSize: '32px', fontWeight: 'bold', marginBottom: '20px'}}>
           ${parseFloat(orderDetails?.total_amount).toFixed(2)}
        </div>
        
        <div className="qr-container" style={{backgroundColor: '#f8f8f8', padding: '20px', borderRadius: '8px', margin: '0 auto', width: 'fit-content'}}>
           {/* In reality, the QR service returns base64 string for the image */}
           {qrCodeData?.qr_code_base64 ? (
             <img src={qrCodeData.qr_code_base64} alt="Payment QR Code" style={{width: '250px', height: '250px'}} />
           ) : (
             <div style={{width: '250px', height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc'}}>
               No QR Data Generated
             </div>
           )}
        </div>
        
        <p style={{marginTop: '20px', fontSize: '13px', color: '#565959'}}>
          Please scan this QR code using your mobile banking app.
        </p>

        <button 
          className="btn btn-primary w-full" 
          style={{marginTop: '30px', padding: '12px'}}
          onClick={handleConfirmPayment}
          disabled={confirming}
        >
          {confirming ? 'Confirming...' : 'I have completed the payment'}
        </button>
      </div>
    </div>
  );
}
