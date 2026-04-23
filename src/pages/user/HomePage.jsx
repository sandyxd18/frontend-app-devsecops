import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useAuthStore } from '../../store/useStore';
import './HomePage.css';

export default function HomePage() {
  const { books, selectedAuthor, setSelectedAuthor } = useAppStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Deduplicate authors (up to 4)
  const groupAuthors = [...new Set(books.map(b => b.author))].filter(Boolean).slice(0, 4);

  const handleBuyNow = (book) => {
    if (!token) {
      navigate('/login');
      return;
    }
    // Navigate to checkout page (not directly to payment QR)
    navigate('/checkout', { state: { book } });
  };

  return (
    <div className="homepage" style={{ backgroundColor: '#eaeded', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="hero-banner-wrapper" style={{ backgroundColor: '#eaeded', display: 'flex', justifyContent: 'center' }}>
        <div className="hero-banner" style={{ maxWidth: '1500px', width: '100%' }}>
          <div className="hero-content">
            <h1>Up to 50% Off Books collection</h1>
            <p>Discover our latest deals on premium books.</p>
            <button className="btn btn-primary" style={{ marginTop: '20px' }}>Shop Now</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-150px', position: 'relative', zIndex: 5 }}>

        {/* Author Groupings — fixed-width cards, no stretching */}
        {books.length > 0 && groupAuthors.length > 0 && (
          <div className="author-groups-row">
            {groupAuthors.map((author, idx) => {
              const authorBooks = books.filter(b => b.author === author).slice(0, 4);
              return (
                <div key={idx} className="author-group-card card">
                  <h3 style={{ marginBottom: '15px' }}>{author} Collection</h3>
                  <div className={`author-books-grid author-books-${Math.min(authorBooks.length, 2)}`}>
                    {authorBooks.map(b => (
                      <div
                        key={b.id}
                        className="author-book-item"
                        onClick={() => navigate(`/book/${b.id}`)}
                      >
                        <img
                          src={b.image_url || 'https://via.placeholder.com/150'}
                          alt={b.title}
                          className="author-book-img"
                        />
                        <div className="author-book-title">{b.title}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="see-more-link"
                    onClick={() => navigate(`/author/${encodeURIComponent(author)}`)}
                  >
                    See more from {author}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Books Grid */}
        <div style={{ background: 'white', padding: '20px', marginBottom: '40px' }}>
          <h2 style={{ marginBottom: '20px' }}>All Books</h2>
          <div className="product-grid">
            {books.map(product => (
              <div key={product.id} className="product-card card">
                <div
                  className="product-image-wrap"
                  onClick={() => navigate(`/book/${product.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={product.image_url || 'https://via.placeholder.com/200?text=No+Image'}
                    alt={product.title}
                    className="product-image"
                  />
                </div>
                <div className="product-info">
                  <h3 className="product-title" onClick={() => navigate(`/book/${product.id}`)}>
                    {product.title}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#565959', marginBottom: '8px' }}>
                    {product.author}
                  </div>
                  <div className="product-price">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}
                  </div>
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
                    disabled={product.stock <= 0}
                  >
                    {product.stock > 0 ? 'Buy Now' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            ))}
            {books.length === 0 && <p>No books found.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
