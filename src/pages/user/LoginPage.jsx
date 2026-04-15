import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/useStore';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.post('/auth/login', { username, password });
      if (response.data && response.data.data && response.data.data.token) {
        // Because of the 'no localStorage' requirement, just save to Zustand memory
        setAuth(response.data.data.token, { username });
        navigate('/');
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
       setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box card">
        <h2 style={{marginBottom: '20px', fontSize: '28px', fontWeight: 500}}>Sign in</h2>
        
        {error && <div className="error-alert">{error}</div>}
        
        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div className="form-group flex-col">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group flex-col">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full" style={{padding: '12px', marginTop: '10px'}} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div style={{marginTop: '20px', fontSize: '13px'}}>
          By continuing, you agree to Bookstore's Conditions of Use and Privacy Notice.
        </div>
      </div>
      
      <div className="login-divider">
         <span>New to Bookstore?</span>
      </div>
      
      <Link to="/register" className="btn btn-secondary register-btn w-full">
         Create your Bookstore account
      </Link>
    </div>
  );
}
