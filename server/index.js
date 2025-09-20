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

// Mount consolidated routes for API endpoints
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`[STARTUP] API running on http://localhost:${port}`);
});
