import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const styles = {
  app: { minHeight: '100vh', background: '#f8fafc' },
  nav: {
    background: '#4f46e5',
    color: '#fff',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navTitle: { fontSize: 20, fontWeight: 700 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  main: { maxWidth: 720, margin: '0 auto', padding: '32px 16px' },
  card: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 28 },
  heading: { fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1e293b' },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 7,
    fontSize: 15,
    marginBottom: 10,
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #e2e8f0',
    borderRadius: 7,
    fontSize: 15,
    marginBottom: 10,
    minHeight: 90,
    resize: 'vertical',
    outline: 'none',
  },
  addBtn: {
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: 7,
    fontWeight: 600,
    fontSize: 14,
  },
  noteCard: {
    background: '#fff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '18px 20px',
    marginBottom: 14,
    position: 'relative',
  },
  noteTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#1e293b' },
  noteContent: { color: '#475569', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  noteDate: { color: '#94a3b8', fontSize: 12, marginTop: 10 },
  actions: { display: 'flex', gap: 8, marginTop: 12 },
  editBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  deleteBtn: {
    background: '#fee2e2',
    color: '#b91c1c',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  saveBtn: {
    background: '#dcfce7',
    color: '#166534',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  cancelBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 14,
    fontSize: 14,
  },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 15 },
};

export default function NotesPage({ token, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/notes`, { headers });
      setNotes(data);
    } catch {
      setError('Failed to load notes');
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/notes`, { title, content }, { headers });
      setTitle('');
      setContent('');
      await fetchNotes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`${API_BASE}/notes/${id}`, { headers });
      setNotes((n) => n.filter((note) => note.id !== id));
    } catch {
      setError('Failed to delete note');
    }
  };

  const startEdit = (note) => {
    setEditId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const handleSave = async (id) => {
    try {
      const { data } = await axios.put(
        `${API_BASE}/notes/${id}`,
        { title: editTitle, content: editContent },
        { headers }
      );
      setNotes((n) => n.map((note) => (note.id === id ? data : note)));
      setEditId(null);
    } catch {
      setError('Failed to update note');
    }
  };

  return (
    <div style={styles.app}>
      <nav style={styles.nav}>
        <span style={styles.navTitle}>📝 NoteHub</span>
        <button style={styles.logoutBtn} onClick={onLogout}>Sign Out</button>
      </nav>

      <main style={styles.main}>
        <div style={styles.card}>
          <h2 style={styles.heading}>New Note</h2>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleCreate}>
            <input
              style={styles.input}
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              style={styles.textarea}
              placeholder="Content (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button style={styles.addBtn} type="submit" disabled={loading}>
              {loading ? 'Saving...' : '+ Add Note'}
            </button>
          </form>
        </div>

        <h2 style={{ ...styles.heading, marginBottom: 16 }}>My Notes ({notes.length})</h2>

        {notes.length === 0 && (
          <p style={styles.empty}>No notes yet. Create your first note above!</p>
        )}

        {notes.map((note) => (
          <div key={note.id} style={styles.noteCard}>
            {editId === note.id ? (
              <>
                <input
                  style={styles.input}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  style={styles.textarea}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
                <div style={styles.actions}>
                  <button style={styles.saveBtn} onClick={() => handleSave(note.id)}>Save</button>
                  <button style={styles.cancelBtn} onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div style={styles.noteTitle}>{note.title}</div>
                {note.content && <div style={styles.noteContent}>{note.content}</div>}
                <div style={styles.noteDate}>
                  {new Date(note.created_at).toLocaleString()}
                </div>
                <div style={styles.actions}>
                  <button style={styles.editBtn} onClick={() => startEdit(note)}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(note.id)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
