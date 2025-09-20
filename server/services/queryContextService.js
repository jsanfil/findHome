/**
 * Query Context Management Service
 * Handles persistent context for multi-turn home search conversations
 */
class QueryContextService {
    constructor() {
        this.contexts = {};
    }

    /**
     * Merge new filters with existing context for a session
     * @param {string} sessionId - Session identifier
     * @param {Object} newFilters - Newly parsed filters
     * @returns {Object} Updated context
     */
    mergeFilters(sessionId, newFilters) {
        if (!this.contexts[sessionId]) {
            this.contexts[sessionId] = {};
        }

        // Normalize propertyTypes to array if needed
        if (newFilters.propertyTypes && !Array.isArray(newFilters.propertyTypes)) {
            if (typeof newFilters.propertyTypes === 'object') {
                newFilters.propertyTypes = Object.values(newFilters.propertyTypes);
            } else {
                newFilters.propertyTypes = [newFilters.propertyTypes];
            }
        }

        // Prevent complete context reset
        if (Object.keys(newFilters).length === 0) {
            return this.contexts[sessionId];
        }

        // Preserve location if not explicitly changed
        if (this.contexts[sessionId].location && !newFilters.location) {
            newFilters.location = this.contexts[sessionId].location;
        }

        // Merge filters, preserving existing values for unspecified keys
        const updatedContext = { ...this.contexts[sessionId] };

        // Prioritize new filters while keeping existing context
        Object.keys(newFilters).forEach(key => {
            if (typeof newFilters[key] === 'object' && newFilters[key] !== null) {
                updatedContext[key] = {
                    ...this.contexts[sessionId][key],
                    ...newFilters[key]
                };
            } else {
                updatedContext[key] = newFilters[key];
            }
        });

        this.contexts[sessionId] = updatedContext;
        return this.contexts[sessionId];
    }

    /**
     * Reset the context for a specific session
     * @param {string} sessionId - Session identifier
     */
    resetContext(sessionId) {
        if (sessionId && this.contexts[sessionId]) {
            delete this.contexts[sessionId];
        }
    }

    /**
     * Get the current context for a session
     * @param {string} sessionId - Session identifier
     * @returns {Object} Current context
     */
    getContext(sessionId) {
        return { ...(this.contexts[sessionId] || {}) };
    }
}

module.exports = new QueryContextService();
