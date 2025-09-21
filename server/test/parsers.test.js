const QueryParserFactory = require('../parsers/queryParserFactory');
const QueryParsingService = require('../services/queryParsingService');

// Test basic factory functionality
console.log('Testing QueryParserFactory...');

// Test rule-based parser (should work without env vars)
try {
    const ruleBasedParser = QueryParserFactory.create('rule-based');
    console.log('✅ Rule-based parser created successfully');
} catch (error) {
    console.log('❌ Rule-based parser failed:', error.message);
}

// Test OpenAI parser (will fail without API key, but should fail gracefully)
try {
    const openAIParser = QueryParserFactory.create('openai');
    console.log('✅ OpenAI parser created successfully');
} catch (error) {
    console.log('ℹ️  OpenAI parser creation failed (expected without API key):', error.message);
}

// Test OpenRouter parser (will fail without API key, but should fail gracefully)
try {
    const openRouterParser = QueryParserFactory.create('openrouter');
    console.log('✅ OpenRouter parser created successfully');
} catch (error) {
    console.log('ℹ️  OpenRouter parser creation failed (expected without API key):', error.message);
}

// Test Anthropic parser (will fail without API key, but should fail gracefully)
try {
    const anthropicParser = QueryParserFactory.create('anthropic');
    console.log('✅ Anthropic parser created successfully');
} catch (error) {
    console.log('ℹ️  Anthropic parser creation failed (expected without API key):', error.message);
}

// Test invalid parser type
try {
    const invalidParser = QueryParserFactory.create('invalid-type');
    console.log('❌ Invalid parser type should have failed');
} catch (error) {
    console.log('✅ Invalid parser type correctly rejected:', error.message);
}

// Test QueryParsingService with default config
console.log('\nTesting QueryParsingService...');
try {
    const service = new QueryParsingService();
    console.log('✅ QueryParsingService created with default config');
    console.log('Current parser type:', service.getParserType());
} catch (error) {
    console.log('❌ QueryParsingService failed:', error.message);
}

console.log('\nParser integration test completed!');
