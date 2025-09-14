const { FilterSchema } = require('../schema');

// Provider selector (feature-flagged). Default to mock.
function getProvider() {
    const which = (process.env.FEATURE_PROVIDER || 'mock').toLowerCase();
    switch (which) {
        // Future: case 'scraper': return require('../providers/scraperProvider');
        // Future: case 'rapidapi': return require('../providers/rapidApiProvider');
        case 'mock':
        default:
            return require('../providers/mockProvider');
    }
}

/**
 * Validates and normalizes filters, then queries the active provider.
 * @param {unknown} filters
 * @returns {Promise<import('../schema').ListingsPageSchema>}
 */
async function search(filters) {
    const parsed = FilterSchema.safeParse(filters || {});
    if (!parsed.success) {
        const message = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        const err = new Error('Invalid filters: ' + message);
        err.status = 400;
        throw err;
    }
    const provider = getProvider();
    return provider.search(parsed.data);
}

module.exports = {
    search,
    getProvider,
};
