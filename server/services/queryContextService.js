/**
 * Query Context Management Service
 * Handles persistent context for multi-turn home search conversations
 */
class QueryContextService {
    constructor() {
        this.context = {};
    }

    /**
     * Merge new filters with existing context
     * @param {Object} newFilters - Newly parsed filters
     * @returns {Object} Updated context
     */
    mergeFilters(newFilters) {
        // Prevent complete context reset
        if (Object.keys(newFilters).length === 0) {
            return this.context;
        }

        // Preserve location if not explicitly changed
        if (this.context.location && !newFilters.location) {
            newFilters.location = this.context.location;
        }

        // Merge filters, preserving existing values for unspecified keys
        const updatedContext = { ...this.context };

        // Prioritize new filters while keeping existing context
        Object.keys(newFilters).forEach(key => {
            // Special handling for nested objects like price, beds, baths
            if (typeof newFilters[key] === 'object' && newFilters[key] !== null) {
                updatedContext[key] = {
                    ...this.context[key],
                    ...newFilters[key]
                };
            } else {
                updatedContext[key] = newFilters[key];
            }
        });

        this.context = updatedContext;
        return this.context;
    }

    /**
     * Reset the current context
     */
    resetContext() {
        this.context = {};
    }

    /**
     * Get the current context
     * @returns {Object} Current context
     */
    getContext() {
        return { ...this.context };
    }
}

module.exports = new QueryContextService();
