class QueryParserInterface {
    constructor(config = {}) {
        this.config = config;
    }

    async parse(query, context) {
        throw new Error('parse method must be implemented by subclasses');
    }

    generateRefinements(filters) {
        throw new Error('generateRefinements method must be implemented by subclasses');
    }

    generateClarifyingQuestions(filters) {
        throw new Error('generateClarifyingQuestions method must be implemented by subclasses');
    }
}

module.exports = QueryParserInterface;
