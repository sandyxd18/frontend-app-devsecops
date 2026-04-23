import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import './BookDetailPage.css';

export default function BookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Image Zoom State
  const [isZooming, setIsZooming] = useState(false);
  const [backgroundPos, setBackgroundPos] = useState('0% 0%');
  const imgRef = useRef(null);

  const fetchBook = async () => {
    setLoading(true);
    try {
      const res = await bookApi.get(`/books/${bookId}`);
      setBook(res.data?.data || res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Book not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookId) fetchBook();
  }, [bookId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && bookId) fetchBook();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [bookId]);

  const handleBuyNow = () => {
    if (!token || !user) { navigate('/login'); return; }
    navigate('/checkout', { state: { book } });
  };

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPos(`${x}% ${y}%`);
  };

  if (loading) return <div className="status-container">Loading book details...</div>;
  if (error) return <div className="status-container" style={{ color: '#c40000' }}>{error}</div>;
  if (!book) return <div className="status-container">Book not found.</div>;

  const imageUrl = book.image_url || null;

  return (
    <div className="book-detail-wrapper">
      <div className="book-detail-grid">

        {/* LEFT: Cover Image */}
        <div className="book-cover-section">
          <div
            className="main-image-container"
            onMouseEnter={() => imageUrl && setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
          >
            {imageUrl ? (
              <img
                ref={imgRef}
                src={imageUrl}
                alt={book.title}
                className="main-image"
              />
            ) : (
              <div className="no-image-placeholder">No Cover Available</div>
            )}
          </div>

          {/* Only show thumbnail strip if there's an actual image */}
          {imageUrl && (
            <div className="thumbnails-container">
              <div className="thumbnail active">
                <img src={imageUrl} alt="thumbnail" />
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Details */}
        <div className="book-info-section">
          {/* Zoom Result Overlay */}
          {isZooming && imageUrl && (
            <div
              className="zoom-result-box"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundPosition: backgroundPos,
              }}
            />
          )}

          <h1 className="book-title">{book.title}</h1>
          <div className="book-author">
            by <span className="author-name">{book.author || 'Unknown Author'}</span> (Author)
          </div>

          <hr className="book-divider" />

          <div className="book-price-block">
            <span className="price-label">Price: </span>
            <span className="book-price">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(book.price)}
            </span>
          </div>

          <div className="book-description">
            {book.description
              ? <p>{book.description}</p>
              : <p className="no-description">No description available for this book. It looks like an intriguing read!</p>
            }
          </div>
        </div>

        {/* RIGHT: Buy Box */}
        <div className="book-action-section">
          <div className="action-box">
            <div className="action-price">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(book.price)}
            </div>

            <div className={`action-stock ${book.stock > 0 ? 'stock-in' : 'stock-out'}`}>
              {book.stock > 0 ? `In Stock (${book.stock} available).` : 'Out of Stock.'}
            </div>

            <button
              className="btn-buy"
              onClick={handleBuyNow}
              disabled={book.stock <= 0}
            >
              {book.stock > 0 ? 'Buy Now' : 'Currently Unavailable'}
            </button>

            <hr className="action-divider" />

            <div className="guarantee-list">
              <div className="guarantee-item">
                <span>Ships from</span>
                <span>bookstore.com</span>
              </div>
              <div className="guarantee-item">
                <span>Sold by</span>
                <span>bookstore.com</span>
              </div>
              <div className="guarantee-item">
                <span>Returns</span>
                <span className="link">Eligible for Return</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
