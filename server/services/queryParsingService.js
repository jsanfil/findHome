const QueryParserFactory = require('../parsers/queryParserFactory');

class QueryParsingService {
    constructor(parserType = 'rule-based', config = {}) {
        this.parser = QueryParserFactory.create(parserType, config);
    }

    parse(query, context) {
        return this.parser.parse(query, context);
    }

    generateRefinements(filters) {
        return this.parser.generateRefinements(filters);
    }

    generateClarifyingQuestions(filters) {
        return this.parser.generateClarifyingQuestions(filters);
    }
}

module.exports = QueryParsingService;
