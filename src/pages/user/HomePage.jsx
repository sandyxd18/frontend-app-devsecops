import React, { useState, useEffect } from 'react';
import { bookApi } from '../../services/api';
import { useCartStore } from '../../store/useStore';
import './HomePage.css';

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const addToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await bookApi.get('/books');
        // Handle pagination response structure from book-service
        setBooks(response.data?.data || []);
      } catch (err) {
        setError('Failed to load books. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="homepage">
      <div className="hero-banner">
        <div className="hero-content">
          <h1>Up to 50% Off Electronics & Books</h1>
          <p>Discover our latest deals on premium electronics, accessories, and literature.</p>
          <button className="btn btn-primary" style={{marginTop: '20px'}}>Shop Now</button>
        </div>
      </div>
      
      <div className="container" style={{marginTop: '-150px', position: 'relative', zIndex: 5}}>
        {loading ? (
          <div className="loading-spinner" style={{textAlign: 'center', margin: '50px', color: 'black'}}>Loading products...</div>
        ) : error ? (
          <div className="error-alert">{error}</div>
        ) : (
          <div className="product-grid">
            {books.map(product => (
              <div key={product.id} className="product-card card">
                <div className="product-image-wrap">
                  <img src={product.image_url || 'https://via.placeholder.com/200?text=No+Image'} alt={product.title} className="product-image" />
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <div style={{fontSize: '13px', color: '#565959', marginBottom: '8px'}}>{product.author}</div>
                  <div className="product-price">${parseFloat(product.price).toFixed(2)}</div>
                  <button 
                    className="btn btn-primary w-full" 
                    style={{marginTop: '15px'}}
                    onClick={() => addToCart(product, 1)}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
