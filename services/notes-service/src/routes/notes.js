const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { getPool } = require('../db');
const logger = require('../logger');

// Per-route rate limiter for notes endpoints (defence-in-depth)
const notesRouteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const router = express.Router();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is not set. Exiting.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set – using insecure default. Do NOT use in production!');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

// Middleware: verify JWT attached by the API Gateway (or directly)
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed authorization header' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// POST /notes
router.post(
  '/',
  notesRouteLimiter,
  authMiddleware,
  [body('title').notEmpty().trim(), body('content').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, content = '' } = req.body;
    try {
      const pool = getPool();
      const [result] = await pool.query(
        'INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)',
        [title, content, req.userId]
      );
      const [rows] = await pool.query('SELECT * FROM notes WHERE id = ?', [result.insertId]);
      logger.info('Note created', { noteId: result.insertId, userId: req.userId });
      return res.status(201).json(rows[0]);
    } catch (err) {
      logger.error('Create note error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /notes
router.get('/', notesRouteLimiter, authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    return res.json(rows);
  } catch (err) {
    logger.error('Get notes error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /notes/:id
router.put(
  '/:id',
  notesRouteLimiter,
  authMiddleware,
  [body('title').optional().notEmpty().trim(), body('content').optional().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { title, content } = req.body;

    try {
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT * FROM notes WHERE id = ? AND user_id = ?',
        [id, req.userId]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });

      const note = rows[0];
      const newTitle = title !== undefined ? title : note.title;
      const newContent = content !== undefined ? content : note.content;

      await pool.query('UPDATE notes SET title = ?, content = ? WHERE id = ?', [
        newTitle,
        newContent,
        id,
      ]);

      const [updated] = await pool.query('SELECT * FROM notes WHERE id = ?', [id]);
      logger.info('Note updated', { noteId: id, userId: req.userId });
      return res.json(updated[0]);
    } catch (err) {
      logger.error('Update note error', { error: err.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /notes/:id
router.delete('/:id', notesRouteLimiter, authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id FROM notes WHERE id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Note not found' });

    await pool.query('DELETE FROM notes WHERE id = ?', [id]);
    logger.info('Note deleted', { noteId: id, userId: req.userId });
    return res.status(204).send();
  } catch (err) {
    logger.error('Delete note error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
