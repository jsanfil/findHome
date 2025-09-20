const express = require('express');
const router = express.Router();

const QueryParsingService = require('../services/queryParsingService');
const queryContextService = require('../services/queryContextService');
const { search: searchListings } = require('../services/listingsService');

// Health check endpoint
router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'api', ts: new Date().toISOString() });
});

// Listings search endpoint
router.post('/listings/search', async (req, res, next) => {
    try {
        const filters = req.body || {};
        const page = await searchListings(filters);
        res.json(page);
    } catch (err) {
        next(err);
    }
});

// Context management endpoints
router.post('/context/reset', (req, res) => {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    queryContextService.resetContext(sessionId);
    res.json({ message: 'Context reset successfully' });
});

router.get('/context/current', (req, res) => {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const currentContext = queryContextService.getContext(sessionId);
    res.json(currentContext);
});

// Chat query endpoint
router.post('/chat/query', async (req, res, next) => {
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

        // Use new QueryParsingService
        const queryParsingService = new QueryParsingService();
        const filters = queryParsingService.parse(message, previousContext);

        // Update context with new filters
        queryContextService.mergeFilters(sessionId, filters);

        // Generate clarifying questions and refinements
        const clarifyingQuestions = queryParsingService.generateClarifyingQuestions(filters);
        const refinements = queryParsingService.generateRefinements(filters);

        // If location missing, ask a clarifying question instead of guessing
        if (!filters.location) {
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

// Helper function for summarizing filters
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

// Money formatting helper
function formatMoney(n) {
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

module.exports = router;
