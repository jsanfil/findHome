const QueryParserFactory = require('../parsers/queryParserFactory');
const { loadQueryParserConfig } = require('../config/queryParserConfig');

class QueryParsingService {
    constructor(parserType, config) {
        // If no parser type provided, load from config
        if (!parserType) {
            const fullConfig = loadQueryParserConfig();
            this.parserType = fullConfig.type;
            this.config = fullConfig;
        } else {
            this.parserType = parserType;
            this.config = config || {};
        }

        this.parser = QueryParserFactory.create(this.parserType, this.config);
    }

    async parse(query, context) {
        try {
            const result = await this.parser.parse(query, context);
            console.log(`[QueryParsingService] Parse result:`, JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            console.error(`[QueryParsingService] Parse error:`, error);
            return {}; // Return empty filters on error
        }
    }

    generateRefinements(filters) {
        return this.parser.generateRefinements(filters);
    }

    generateClarifyingQuestions(filters) {
        return this.parser.generateClarifyingQuestions(filters);
    }

    // Method to get current parser type
    getParserType() {
        return this.parserType;
    }
}

module.exports = QueryParsingService;
