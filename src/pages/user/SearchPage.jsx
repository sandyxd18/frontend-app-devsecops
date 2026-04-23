import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useStore';
import { bookApi } from '../../services/api';

const formatIDR = (p) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p);

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { books, setBooks } = useAppStore();
  const q = searchParams.get('q') || '';

  useEffect(() => {
    if (books.length === 0) {
      bookApi.get('/books').then(r => setBooks(r.data?.data?.books || [])).catch(console.error);
    }
  }, []);

  const fuzzyMatch = (query, text) => {
    if (!query || !text) return false;
    const ql = query.toLowerCase(), tl = text.toLowerCase();
    let qi = 0;
    for (let i = 0; i < tl.length && qi < ql.length; i++) if (tl[i] === ql[qi]) qi++;
    return qi === ql.length;
  };

  const results = useMemo(() => {
    if (!q) return [];
    return books.filter(b => fuzzyMatch(q, b.title) || fuzzyMatch(q, b.author));
  }, [q, books]);

  // Group results by author where author itself matches the query
  const authorGroups = useMemo(() => {
    const matchedAuthors = [...new Set(
      books.filter(b => fuzzyMatch(q, b.author)).map(b => b.author)
    )];
    return matchedAuthors.map(author => ({
      author,
      books: books.filter(b => b.author === author),
    }));
  }, [q, books]);

  return (
    <div style={{ backgroundColor: '#EAEDED', minHeight: 'calc(100vh - 130px)', padding: '20px 0 50px' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 500, color: '#0f1111', margin: 0 }}>
              {q ? (
                <>Search results for "<span style={{ color: '#B12704' }}>{q}</span>"</>
              ) : 'All Books'}
            </h2>
            <div style={{ fontSize: '13px', color: '#565959', marginTop: '4px' }}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '4px', padding: '7px 16px', cursor: 'pointer', fontSize: '13px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f2f2'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            ← Back to Home
          </button>
        </div>

        {results.length === 0 ? (
          <div style={{ background: '#fff', padding: '50px', textAlign: 'center', borderRadius: '8px', border: '1px solid #d5d9d9' }}>
            <div style={{ fontSize: '46px', marginBottom: '14px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', color: '#0f1111', marginBottom: '8px' }}>No results found</h3>
            <p style={{ color: '#565959', fontSize: '14px' }}>Try different keywords or browse all books.</p>
          </div>
        ) : (
          <>
            {/* Author Group Cards */}
            {authorGroups.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0f1111', borderBottom: '2px solid #FFD814', paddingBottom: '6px', display: 'inline-block' }}>
                  Authors matching "{q}"
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {authorGroups.map(({ author, books: ab }) => (
                    <div key={author}
                      style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '18px', cursor: 'pointer', transition: 'box-shadow 0.18s' }}
                      onClick={() => navigate(`/author/${encodeURIComponent(author)}`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                      <h4 style={{ margin: '0 0 12px', fontSize: '15px', color: '#0f1111', fontWeight: 700 }}>{author}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                        {ab.slice(0, 3).map(b => (
                          <div key={b.id}>
                            <img src={b.image_url || 'https://via.placeholder.com/80x110'} alt={b.title}
                              style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '3px' }} />
                            <div style={{ fontSize: '10px', marginTop: '3px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', color: '#565959' }}>{b.title}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: '#007185', fontSize: '13px' }}>See all {ab.length} book{ab.length !== 1 ? 's' : ''} →</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All matching books */}
            <section>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', color: '#0f1111', borderBottom: '2px solid #FFD814', paddingBottom: '6px', display: 'inline-block' }}>
                All Results
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '16px' }}>
                {results.map(book => (
                  <div key={book.id}
                    style={{ background: '#fff', border: '1px solid #d5d9d9', borderRadius: '8px', padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.18s' }}
                    onClick={() => navigate(`/book/${book.id}`)}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                  >
                    <img src={book.image_url || 'https://via.placeholder.com/150x200'} alt={book.title}
                      style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f1111', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#007185', marginTop: '4px' }}>{book.author}</div>
                    <div style={{ fontSize: '14px', color: '#B12704', fontWeight: 700, marginTop: '6px' }}>{formatIDR(book.price)}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
