const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const notesRoutes = require('./routes/notes');
const { initDB } = require('./db');
const logger = require('./logger');
const { register: metricsRegister, collectDefaultMetrics } = require('prom-client');

dotenv.config();
collectDefaultMetrics();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Health probes
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notes-service' }));
app.get('/ready', (req, res) => res.json({ status: 'ready', service: 'notes-service' }));

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
});

// Notes routes
app.use('/notes', notesRoutes);

initDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Notes service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to initialise database', { error: err.message });
    process.exit(1);
  });
