import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import NotesPage from './pages/NotesPage';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('notehub_token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('notehub_token', token);
    } else {
      localStorage.removeItem('notehub_token');
    }
  }, [token]);

  const handleLogout = () => setToken(null);

  return token ? (
    <NotesPage token={token} onLogout={handleLogout} />
  ) : (
    <AuthPage onAuth={setToken} />
  );
}

export default App;
