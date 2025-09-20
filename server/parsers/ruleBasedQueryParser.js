const QueryParserInterface = require('./queryParserInterface');
const { parseQuery, KNOWN_CITIES } = require('../utils/parseQuery');

class RuleBasedQueryParser extends QueryParserInterface {
    parse(query, context) {
        return parseQuery(query, context);
    }

    generateRefinements(filters) {
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

    generateClarifyingQuestions(filters) {
        const clarifyingQuestions = [];

        if (!filters.location) {
            clarifyingQuestions.push(
                `Which city are you interested in? For example: ${KNOWN_CITIES.join(', ')}`
            );
        }

        return clarifyingQuestions;
    }
}

module.exports = RuleBasedQueryParser;
