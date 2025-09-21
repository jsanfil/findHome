const RuleBasedQueryParser = require('./ruleBasedQueryParser');
const OpenRouterQueryParser = require('./openRouterQueryParser');
const OpenAIQueryParser = require('./openAIQueryParser');
const AnthropicQueryParser = require('./anthropicQueryParser');

class QueryParserFactory {
    static create(type = 'rule-based', config = {}) {
        switch (type) {
            case 'rule-based':
                return new RuleBasedQueryParser(config);
            case 'openrouter':
                // Merge full config with openrouter-specific config
                return new OpenRouterQueryParser({ ...config, ...(config.openrouter || {}) });
            case 'openai':
                // Merge full config with openai-specific config
                return new OpenAIQueryParser({ ...config, ...(config.openai || {}) });
            case 'anthropic':
                // Merge full config with anthropic-specific config
                return new AnthropicQueryParser({ ...config, ...(config.anthropic || {}) });
            default:
                throw new Error(`Unsupported parser type: ${type}. Supported types: rule-based, openrouter, openai, anthropic`);
        }
    }
}

module.exports = QueryParserFactory;
