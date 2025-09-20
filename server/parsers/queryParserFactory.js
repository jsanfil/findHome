const RuleBasedQueryParser = require('./ruleBasedQueryParser');

class QueryParserFactory {
    static create(type = 'rule-based', config = {}) {
        switch (type) {
            case 'rule-based':
                return new RuleBasedQueryParser(config);
            default:
                throw new Error(`Unsupported parser type: ${type}`);
        }
    }
}

module.exports = QueryParserFactory;
