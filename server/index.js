require('dotenv').config();
const express = require('express');
const app = express();

const { search: searchListings } = require('./services/listingsService');
const { parseQuery, KNOWN_CITIES } = require('./utils/parseQuery');
const queryContextService = require('./services/queryContextService');

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

// Mount contextRoutes for context-related endpoints
const contextRoutes = require('./routes/contextRoutes');
app.use('/api', contextRoutes);

// Chat query - accepts natural language, returns interpreted filters + listings or clarifying Qs
app.post('/api/chat/query', async (req, res, next) => {
  try {
    const { message, isNewQuery = false, sessionId } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'sessionId is required and must be a string' });
    }

    // Reset context for new queries
    if (isNewQuery) {
      queryContextService.resetContext(sessionId);
    }

    // Get current context
    const previousContext = queryContextService.getContext(sessionId);

    // MVP: rules-based parser (no LLM yet)
    const filters = parseQuery(message, previousContext);

    // Update context with new filters
    queryContextService.mergeFilters(sessionId, filters);

    // If location missing, ask a clarifying question instead of guessing
    const clarifyingQuestions = [];
    if (!filters.location) {
      clarifyingQuestions.push(
        `Which city are you interested in? For example: ${KNOWN_CITIES.join(', ')}`
      );
      return res.json({
        assistantSummary:
          'I need a location to search. Please specify a city and state (e.g., "Denver, CO").',
        filters,
        clarifyingQuestions,
        refinements: [],
        listings: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
    }

    // Fetch listings using structured filters
    const page = await searchListings(filters);

    // Create a short assistant summary of interpreted filters
    const assistantSummary = summarizeFilters(filters, page.total);

    // Offer a few refinement chips (simple text prompts parsed by fallback)
    const refinements = buildRefinements(filters);

    res.json({
      assistantSummary,
      filters,
      clarifyingQuestions,
      refinements,
      listings: page.items,
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
    });
  } catch (err) {
    next(err);
  }
});

/** Helpers **/

function summarizeFilters(filters, total) {
  const parts = [];
  if (filters.location) parts.push(filters.location);
  if (filters.price?.max) parts.push(`≤ $${formatMoney(filters.price.max)}`);
  if (filters.price?.min) parts.push(`≥ $${formatMoney(filters.price.min)}`);
  if (filters.beds?.min) parts.push(`${filters.beds.min}+ beds`);
  if (filters.baths?.min) parts.push(`${filters.baths.min}+ baths`);
  if (filters.propertyTypes?.length) parts.push(filters.propertyTypes.join(', '));
  if (filters.daysOnMarket) parts.push(`≤ ${filters.daysOnMarket} days`);
  return `Showing ${Math.min(total, 10)} of ${total} results for ${parts.join(' • ') || 'your criteria'}.`;
}

function buildRefinements(filters) {
  const ref = [];
  // Budget tweaks
  if (filters.price?.max) {
    ref.push({
      label: '+ $50k budget',
      message: 'increase budget by 50k',
    });
  } else {
    ref.push({
      label: 'Cap budget at $700k',
      message: 'max 700k',
    });
  }
  // Beds tweaks
  if (filters.beds?.min) {
    ref.push({
      label: '+1 bed',
      message: 'add 1 bedroom',
    });
  } else {
    ref.push({
      label: 'At least 3 beds',
      message: 'at least 3 bedrooms',
    });
  }
  // Property type toggles
  ref.push({ label: 'Only condos', message: 'only show condos' });
  ref.push({ label: 'Only single-family', message: 'only show single family houses' });

  // Freshness
  if (!filters.daysOnMarket || filters.daysOnMarket > 7) {
    ref.push({ label: 'New this week', message: 'show homes from this week only' });
  }

  return ref.slice(0, 5);
}

function formatMoney(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const msg = err.message || 'Internal Server Error';
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('Error:', err);
  }
  res.status(status).json({ error: msg });
});

const port = process.env.PORT || 3001;
const environment = process.env.NODE_ENV || 'development';

console.log(`[STARTUP] Server initializing`);
console.log(`[STARTUP] Environment: ${environment}`);
console.log(`[STARTUP] Timestamp: ${new Date().toISOString()}`);

app.listen(port, () => {
  console.log(`[STARTUP] API running on http://localhost:${port}`);
  console.log(`[STARTUP] Server fully initialized at: ${new Date().toISOString()}`);
});
