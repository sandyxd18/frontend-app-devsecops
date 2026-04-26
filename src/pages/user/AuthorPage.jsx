import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi, orderApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import './HomePage.css'; // Reuse product-grid styles

export default function AuthorPage() {
  const { authorName } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    document.title = authorName ? `${authorName} | Bookstore` : 'Bookstore';
    return () => { document.title = 'Bookstore'; };
  }, [authorName]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await bookApi.get('/books');
        const allBooks = response.data?.data?.books || [];
        setBooks(allBooks.filter(b => b.author === authorName));
      } catch (err) {
        setError('Failed to fetch author books.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [authorName]);

  const handleBuyNow = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setPurchasingId(product.id);
    try {
      const response = await orderApi.post('/orders', {
        user_id: user.id,
        items: [{ book_id: product.id, quantity: 1, price: product.price }]
      });
      const orderId = response.data?.data?.id;
      if (orderId) {
        navigate(`/payment/${orderId}`);
      } else {
        alert("Order creation failed.");
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order.');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Loading author collection...</div>;

  return (
    <div style={{ backgroundColor: '#eaeded', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{maxWidth: '1200px'}}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '4px', border: '1px solid #d5d9d9', marginBottom: '20px' }}>
           <h1 style={{fontSize: '28px', color: '#0f1111'}}>Books by {authorName}</h1>
           <p style={{color: '#565959', marginTop: '10px'}}>{books.length} result(s) found</p>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}

        <div style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #d5d9d9' }}>
          <div className="product-grid">
            {books.map(product => (
              <div key={product.id} className="product-card card">
                <div className="product-image-wrap" onClick={() => navigate(`/book/${product.id}`)} style={{ cursor: 'pointer' }}>
                  <img src={product.image_url || 'https://via.placeholder.com/200?text=No+Image'} alt={product.title} className="product-image" />
                </div>
                <div className="product-info">
                  <h3 className="product-title" onClick={() => navigate(`/book/${product.id}`)}>{product.title}</h3>
                  <div style={{ fontSize: '13px', color: '#565959', marginBottom: '8px' }}>{product.author}</div>
                  <div className="product-price">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}</div>
                  {product.stock <= 0 && (
                    <div style={{ color: '#c40000', fontSize: '13px', marginTop: '8px' }}>Out of Stock</div>
                  )}
                  <button
                    className="btn btn-primary w-full"
                    style={{ 
                      marginTop: product.stock <= 0 ? '8px' : '15px',
                      background: product.stock <= 0 ? '#e0e0e0' : undefined,
                      borderColor: product.stock <= 0 ? '#d5d9d9' : undefined,
                      color: product.stock <= 0 ? '#888' : undefined,
                      cursor: product.stock <= 0 ? 'not-allowed' : undefined
                    }}
                    onClick={() => handleBuyNow(product)}
                    disabled={purchasingId === product.id || product.stock <= 0}
                  >
                    {purchasingId === product.id ? 'Processing...' : (product.stock > 0 ? 'Buy Now' : 'Currently Unavailable')}
                  </button>
                </div>
              </div>
            ))}
            {books.length === 0 && <p>This author currently has no books in the store.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
