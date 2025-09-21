const { z } = require('zod');

// Configuration schema for query parsers
const QueryParserConfigSchema = z.object({
    type: z.enum(['rule-based', 'openai', 'openrouter', 'anthropic']).default('rule-based'),
    debug: z.boolean().default(false),
    openai: z.object({
        model: z.string().default('gpt-4o-mini'),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().positive().default(1000)
    }).optional(),
    openrouter: z.object({
        model: z.string().default('anthropic/claude-3-haiku'),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().positive().default(1000)
    }).optional(),
    anthropic: z.object({
        model: z.string().default('claude-3-sonnet-20240229'),
        temperature: z.number().min(0).max(2).default(0.7),
        maxTokens: z.number().positive().default(1000)
    }).optional()
});

// Load configuration from environment variables
function loadQueryParserConfig() {
    const config = {
        type: process.env.QUERYPARSER_TYPE || 'rule-based',
        debug: process.env.DEBUG_PARSERS === 'true',
        openai: {
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000')
        },
        openrouter: {
            model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
            temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '1000')
        },
        anthropic: {
            model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
            temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000')
        }
    };

    // Validate configuration
    const validatedConfig = QueryParserConfigSchema.parse(config);

    // Check for required API keys based on parser type
    if (validatedConfig.type === 'openai' && !process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required when using OpenAI parser');
    }
    if (validatedConfig.type === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY environment variable is required when using OpenRouter parser');
    }
    if (validatedConfig.type === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required when using Anthropic parser');
    }

    return validatedConfig;
}

module.exports = {
    loadQueryParserConfig,
    QueryParserConfigSchema
};
