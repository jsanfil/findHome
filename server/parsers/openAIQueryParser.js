const QueryParserInterface = require('./queryParserInterface');

class OpenAIQueryParser extends QueryParserInterface {
    constructor(config = {}) {
        super(config);
        this.apiKey = process.env.OPENAI_API_KEY;
        this.baseUrl = 'https://api.openai.com/v1/chat/completions';

        if (!this.apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }

        // Initialization logging
        console.log(`[OpenAIQueryParser] Initialized with:`, {
            model: this.config.model || 'gpt-4o-mini',
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
                model: this.config.model || 'gpt-4o-mini',
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
                console.log(`[OpenAIQueryParser] Request:`, {
                    url: this.baseUrl,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: requestBody
                });
            }

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            // Debug logging - response
            if (this.config.debug) {
                console.log(`[OpenAIQueryParser] Response:`, {
                    status: response.status,
                    statusText: response.statusText,
                    content: content ? content.substring(0, 200) + '...' : null,
                    usage: data.usage
                });
            }

            if (!content) {
                throw new Error('No response content from OpenAI API');
            }

            return this.parseLLMResponse(content);
        } catch (error) {
            console.error('OpenAI query parsing error:', error);
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

            // Validate and normalize the response
            return {
                location: parsed.location || null,
                price: parsed.price || null,
                beds: parsed.beds || null,
                baths: parsed.baths || null,
                propertyType: parsed.propertyType || null,
                squareFeet: parsed.squareFeet || null,
                yearBuilt: parsed.yearBuilt || null,
                hasGarage: parsed.hasGarage || null,
                hasPool: parsed.hasPool || null,
                petFriendly: parsed.petFriendly || null,
                daysOnMarket: parsed.daysOnMarket || null
            };
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
        if (filters.location) {
            refinements.push({
                label: 'Expand search area',
                message: `search in ${filters.location} and nearby areas`
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

module.exports = OpenAIQueryParser;
