# LLM Query Parsers for FindHome

This document explains how to use the new LLM-based query parsers that have been added to the FindHome application.

## Overview

The application now supports four types of query parsers:

1. **Rule-based** (default) - Uses predefined patterns and rules
2. **OpenAI** - Uses OpenAI's GPT models
3. **OpenRouter** - Uses OpenRouter API (supports multiple models)
4. **Anthropic** - Uses Anthropic's Claude models

## Configuration

### Environment Variables

Create a `.env` file in the `server/` directory based on the provided `.env.example`:

```bash
# Choose parser type: 'rule-based', 'openai', 'openrouter', 'anthropic'
QUERYPARSER_TYPE=anthropic

# For OpenAI parser
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# For OpenRouter parser
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-3-haiku

# For Anthropic parser
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
```

### Configuration Options

Each parser supports the following configuration options:

- **model**: The specific model to use
- **temperature**: Controls randomness (0.0 to 2.0)
- **maxTokens**: Maximum tokens in response

## Usage Examples

### Basic Usage

```javascript
const QueryParsingService = require('./services/queryParsingService');

// Uses configuration from environment variables
const service = new QueryParsingService();

// Or specify parser type directly
const openAIService = new QueryParsingService('openai', {
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000
});

// Parse a query
const filters = await service.parse('3 bedroom house in San Francisco under $1.2M');
console.log(filters);
```

### Expected Output

```javascript
{
    location: 'San Francisco',
    price: { min: null, max: 1200000 },
    beds: { min: 3, max: 3 },
    propertyType: 'house',
    // ... other fields
}
```

## Parser Features

### LLM Parsers (OpenAI, OpenRouter, Anthropic)

- **Natural Language Processing**: Understands complex, conversational queries
- **Context Awareness**: Considers conversation context for better parsing
- **Fallback Support**: Falls back to basic parsing if API fails
- **Structured Output**: Returns consistent JSON filter objects

### Rule-Based Parser

- **Fast**: No API calls, instant response
- **Reliable**: Deterministic parsing based on patterns
- **No Dependencies**: Works without external API keys

## Error Handling

The LLM parsers include robust error handling:

- **API Failures**: Automatic fallback to basic parsing
- **Invalid Responses**: JSON extraction and validation
- **Missing Keys**: Clear error messages for missing API keys
- **Rate Limits**: Graceful handling of API rate limits

## Testing

Run the parser tests:

```bash
cd server
node test/parsers.test.js
```

## Switching Parsers

To switch between parsers, simply change the `QUERYPARSER_TYPE` environment variable:

```bash
# Use Anthropic Claude
QUERYPARSER_TYPE=anthropic

# Use OpenAI GPT
QUERYPARSER_TYPE=openai

# Use OpenRouter
QUERYPARSER_TYPE=openrouter

# Use rule-based (default)
QUERYPARSER_TYPE=rule-based
```

## Security Notes

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Store keys securely in environment variables
- **Access Control**: LLM parsers validate API key presence before initialization
- **Error Messages**: Sensitive information is not exposed in error messages

## Performance Considerations

- **LLM Parsers**: May have latency due to API calls (typically 1-3 seconds)
- **Caching**: Consider implementing response caching for frequently parsed queries
- **Rate Limits**: Monitor API usage to avoid hitting rate limits
- **Fallback**: Rule-based parser provides instant fallback when needed

## Troubleshooting

### Common Issues

1. **"API key required" error**: Ensure the correct environment variable is set
2. **"Invalid JSON" error**: LLM returned malformed response, fallback should activate
3. **Timeout errors**: Check network connectivity and API service status
4. **Rate limit errors**: Implement exponential backoff or switch to rule-based parser

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=query-parser
```

This will log detailed information about parser operations and API responses.
