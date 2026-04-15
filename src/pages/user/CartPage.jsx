import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore, useAuthStore } from '../../store/useStore';
import { orderApi } from '../../services/api';
import './CartPage.css';

export default function CartPage() {
  const { items, removeItem, getCartTotal, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = getCartTotal();

  const handleCheckout = async () => {
    if (!token) {
      alert("Please sign in first to checkout.");
      navigate('/login');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Map Zustand cart items to the Expected order-service format
      const orderItems = items.map(item => ({
        book_id: item.book.id,
        quantity: item.quantity
      }));
      
      const response = await orderApi.post('/orders', { items: orderItems });
      const orderId = response.data?.data?.id;
      
      if (orderId) {
        clearCart();
        navigate(`/payment/${orderId}`);
      } else {
        setError("Order creation failed. Invalid response.");
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{padding: '40px 20px', backgroundColor: 'white', marginTop: '20px'}}>
        <h2>Your Bookstore Cart is empty.</h2>
        <p style={{marginTop: '10px'}}>Check your Saved for later items below or continue shopping.</p>
      </div>
    );
  }

  return (
    <div className="container flex" style={{padding: '20px 0', gap: '20px', alignItems: 'flex-start'}}>
      <div className="cart-content card" style={{flex: '1'}}>
        <h2 style={{borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '20px'}}>Shopping Cart</h2>
        
        {error && <div className="error-alert">{error}</div>}
        
        {items.map((item, idx) => (
          <div key={idx} className="cart-item flex gap-4" style={{borderBottom: '1px solid #ddd', paddingBottom: '20px', marginBottom: '20px'}}>
            <div style={{width: '150px', backgroundColor: '#f8f8f8', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
              <img src={item.book.image_url || 'https://via.placeholder.com/150'} alt={item.book.title} style={{maxHeight:'150px'}} />
            </div>
            <div className="cart-item-info flex-col justify-between" style={{flex: 1}}>
              <div>
                <h3 style={{fontSize: '18px'}}>{item.book.title}</h3>
                <div style={{color: '#007600', fontSize: '13px', marginTop: '5px'}}>In Stock</div>
                <div style={{fontSize: '13px', color: '#565959'}}>Quantity: {item.quantity}</div>
                <div style={{fontSize: '18px', fontWeight: 'bold', marginTop: '10px'}}>${item.book.price}</div>
              </div>
              <div>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => removeItem(item.book.id)}
                  style={{fontSize: '12px', padding: '4px 10px'}}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="cart-summary card" style={{width: '300px'}}>
        <h3 style={{fontSize: '18px'}}>Subtotal ({items.length} items): <span style={{fontWeight: 'bold'}}>${total.toFixed(2)}</span></h3>
        <button 
          className="btn btn-primary w-full" 
          style={{marginTop: '20px', padding: '12px'}}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to checkout'}
        </button>
      </div>
    </div>
  );
}
