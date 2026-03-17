import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 36px',
    width: 360,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  title: { fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#1e293b', textAlign: 'center' },
  subtitle: { color: '#64748b', marginBottom: 28, textAlign: 'center', fontSize: 14 },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    marginTop: 4,
    transition: 'background 0.2s',
  },
  toggle: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
  },
  link: { color: '#4f46e5', cursor: 'pointer', fontWeight: 600 },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 14,
    fontSize: 14,
  },
};

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await axios.post(`${API_BASE}${endpoint}`, { email, password });
      onAuth(data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📝 NoteHub</h1>
        <p style={styles.subtitle}>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={styles.toggle}>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <span style={styles.link} onClick={() => { setMode('register'); setError(''); }}>
                Register
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span style={styles.link} onClick={() => { setMode('login'); setError(''); }}>
                Sign In
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
