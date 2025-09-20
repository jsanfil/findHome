require('dotenv').config();
const express = require('express');
const app = express();

const QueryParsingService = require('./services/queryParsingService');
const queryContextService = require('./services/queryContextService');
const { search: searchListings } = require('./services/listingsService');

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'api', ts: new Date().toISOString() });
});

// simple in-memory data to start (kept from scaffold)
let todos = [{ id: 1, text: 'learn Cline', done: false }];

app.get('/api/todos', (_req, res) => res.json(todos));

app.post('/api/todos', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  const todo = { id: Date.now().toString(), text, done: false };
  todos.unshift(todo);
  res.status(201).json(todo);
});

// Listings search - accepts structured filters (FilterSchema)
app.post('/api/listings/search', async (req, res, next) => {
  try {
    const filters = req.body || {};
    const page = await searchListings(filters);
    res.json(page);
  } catch (err) {
    next(err);
  }
});

// Mount consolidated routes for API endpoints
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[STARTUP] API running on http://localhost:${port}`);
});
