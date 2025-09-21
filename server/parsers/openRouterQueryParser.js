const QueryParserInterface = require('./queryParserInterface');

class OpenRouterQueryParser extends QueryParserInterface {
    constructor(config = {}) {
        super(config);
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY environment variable is required');
        }

        // Initialization logging
        console.log(`[OpenRouterQueryParser] Initialized with:`, {
            model: this.config.model || 'anthropic/claude-3-haiku',
            temperature: this.config.temperature || 0.7,
            maxTokens: this.config.maxTokens || 1000,
            baseUrl: this.baseUrl,
            debug: this.config.debug || false
        });
    }

    async parse(query, context) {
        try {
            const prompt = this.buildPrompt(query, context);

            const requestBody = {
                model: this.config.model || 'anthropic/claude-3-haiku',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a real estate query parser. Extract structured filters from natural language queries about property searches. Return only valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: this.config.temperature || 0.7,
                max_tokens: this.config.maxTokens || 1000
            };

            // Debug logging - request
            if (this.config.debug) {
                console.log(`[OpenRouterQueryParser] Request:`, {
                    url: this.baseUrl,
                    headers: {
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
                        'X-Title': 'FindHome Query Parser'
                    },
                    body: requestBody
                });
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:3001',
                    'X-Title': 'FindHome Query Parser'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            // Debug logging - response
            if (this.config.debug) {
                console.log(`[OpenRouterQueryParser] Response:`, {
                    status: response.status,
                    statusText: response.statusText,
                    content: content ? content.substring(0, 200) + '...' : null,
                    usage: data.usage
                });
            }

            if (!content) {
                throw new Error('No response content from OpenRouter API');
            }

            return this.parseLLMResponse(content);
        } catch (error) {
            console.error('OpenRouter query parsing error:', error);
            // Fallback to basic parsing if LLM fails
            return this.fallbackParse(query, context);
        }
    }

    buildPrompt(query, context) {
        const contextStr = context ? `Context: ${JSON.stringify(context)}\n` : '';
        return `${contextStr}Parse this real estate query into structured filters: "${query}"

Return a JSON object with these possible fields:
- location: {city: string, state?: string} - Always use object format for location
- price: {min: number, max: number} in dollars
- beds: {min: number, max: number}
- baths: {min: number, max: number}
- propertyType: "house", "condo", "apartment", "townhouse", etc.
- squareFeet: {min: number, max: number}
- yearBuilt: {min: number, max: number}
- hasGarage: boolean
- hasPool: boolean
- petFriendly: boolean
- daysOnMarket: {max: number} (days listed)

Only include fields that are mentioned or clearly implied in the query. Use null for unspecified values.`;
    }

    parseLLMResponse(content) {
        try {
            // Extract JSON from the response (LLMs sometimes add extra text)
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in LLM response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Debug: Log parsed LLM response
            console.log(`[OpenRouterQueryParser] Parsed LLM response:`, JSON.stringify(parsed, null, 2));

            // Validate and normalize the response - omit null/undefined fields
            const result = {};
            if (parsed.location) result.location = parsed.location;
            if (parsed.price) result.price = parsed.price;
            if (parsed.beds) result.beds = parsed.beds;
            if (parsed.baths) result.baths = parsed.baths;
            if (parsed.propertyType) result.propertyType = parsed.propertyType;
            if (parsed.squareFeet) result.squareFeet = parsed.squareFeet;
            if (parsed.yearBuilt) result.yearBuilt = parsed.yearBuilt;
            if (parsed.hasGarage !== null && parsed.hasGarage !== undefined) result.hasGarage = parsed.hasGarage;
            if (parsed.hasPool !== null && parsed.hasPool !== undefined) result.hasPool = parsed.hasPool;
            if (parsed.petFriendly !== null && parsed.petFriendly !== undefined) result.petFriendly = parsed.petFriendly;
            if (parsed.daysOnMarket) result.daysOnMarket = parsed.daysOnMarket;

            // Debug: Log final result
            console.log(`[OpenRouterQueryParser] Final parse result:`, JSON.stringify(result, null, 2));

            return result;
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    fallbackParse(query, context) {
        // Simple fallback parsing if LLM fails
        const filters = {};

        // Basic location extraction
        const cityMatch = query.match(/\b(?:in|near|around)\s+([A-Za-z\s]+?)(?:\s|$|with|for|under|over)/i);
        if (cityMatch) {
            filters.location = cityMatch[1].trim();
        }

        // Basic price extraction
        const priceMatch = query.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:to|and|-)\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
        if (priceMatch) {
            filters.price = {
                min: parseInt(priceMatch[1].replace(/,/g, '')),
                max: parseInt(priceMatch[2].replace(/,/g, ''))
            };
        }

        return filters;
    }

    generateRefinements(filters) {
        const refinements = [];

        // Budget refinements
        if (filters.price?.max) {
            refinements.push({
                label: `+ $25k budget`,
                message: `increase budget by 25k to ${filters.price.max + 25000}`
            });
        }

        // Location refinements
        if (filters.location?.city) {
            const locationStr = filters.location.state
                ? `${filters.location.city}, ${filters.location.state}`
                : filters.location.city;
            refinements.push({
                label: 'Expand search area',
                message: `search in ${locationStr} and nearby areas`
            });
        }

        // Property type refinements
        refinements.push({
            label: 'Include townhouses',
            message: 'include townhouses in search'
        });

        // Size refinements
        refinements.push({
            label: 'Larger homes only',
            message: 'show homes with at least 2000 square feet'
        });

        return refinements.slice(0, 5);
    }

    generateClarifyingQuestions(filters) {
        const questions = [];

        if (!filters.location) {
            questions.push('Which city or neighborhood are you interested in?');
        }

        if (!filters.price) {
            questions.push('What\'s your budget range for the property?');
        }

        if (!filters.beds) {
            questions.push('How many bedrooms do you need?');
        }

        return questions.slice(0, 3);
    }
}

module.exports = OpenRouterQueryParser;
