import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import './RegisterPage.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);

    try {
      const response = await authApi.post('/auth/register', { username, password });
      if (response.data && response.data.success) {
        navigate('/login');
      } else {
        setError('Invalid response from server.');
      }
    } catch (err) {
       setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box card">
        <h2 style={{marginBottom: '20px', fontSize: '28px', fontWeight: 500}}>Create account</h2>
        
        {error && <div className="error-alert">{error}</div>}
        
        <form onSubmit={handleRegister} className="flex-col gap-4">
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
              placeholder="At least 6 characters"
            />
          </div>
          <div className="form-group flex-col">
            <label htmlFor="confirmPassword">Re-enter password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary w-full" style={{padding: '12px', marginTop: '10px'}} disabled={loading}>
            {loading ? 'Creating account...' : 'Continue'}
          </button>
        </form>
        
        <div style={{marginTop: '20px', fontSize: '13px'}}>
          By creating an account, you agree to Bookstore's Conditions of Use and Privacy Notice.
        </div>

        <div className="already-account" style={{marginTop: '20px', fontSize: '13px'}}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
