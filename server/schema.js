const { z } = require('zod');

// Enums and shared pieces
const PropertyTypeEnum = z.enum([
    'single_family',
    'condo',
    'townhome',
    'multi_family',
    'land',
]);

const RangeNumber = z
    .object({
        min: z.number().int().nonnegative().optional(),
        max: z.number().int().nonnegative().optional(),
    })
    .refine((v) => v.min !== undefined || v.max !== undefined, {
        message: 'At least one of min or max is required',
    });

const SortByEnum = z.enum(['price_asc', 'price_desc', 'dom_desc', 'relevance']);

// Filters schema (MVP)
const FilterSchema = z.object({
    location: z.string().min(1).optional(), // city/state/neighborhood/zip (optional but strongly recommended)
    price: RangeNumber.optional(),
    beds: RangeNumber.optional(),
    baths: RangeNumber.optional(), // optional as requested
    propertyTypes: z.array(PropertyTypeEnum).nonempty().optional(),
    daysOnMarket: z.number().int().positive().optional(),
    keywords: z.array(z.string()).optional(), // best-effort matching
    sortBy: SortByEnum.default('relevance').optional(),
    page: z.number().int().min(1).default(1).optional(),
});

// Chat result schema (LLM output)
const ChatResultSchema = z.object({
    filters: FilterSchema,
    clarifyingQuestions: z.array(z.string()).default([]),
});

// Normalized listing schema
const ListingSchema = z.object({
    id: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip: z.string(),
    price: z.number().int().nonnegative(),
    beds: z.number().int().nonnegative(),
    baths: z.number().int().nonnegative().optional(),
    sqft: z.number().int().positive().optional(),
    lotSize: z.number().int().positive().optional(),
    yearBuilt: z.number().int().positive().optional(),
    propertyType: PropertyTypeEnum,
    daysOnMarket: z.number().int().nonnegative().optional(),
    status: z.string().optional(),
    photos: z.array(z.string()).default([]),
    heroPhoto: z.string(),
    listingUrl: z.string().url(),
    tags: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
});

// Pagination result schema for listings
const ListingsPageSchema = z.object({
    items: z.array(ListingSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().min(1),
    pageSize: z.number().int().positive(),
});

module.exports = {
    PropertyTypeEnum,
    SortByEnum,
    RangeNumber,
    FilterSchema,
    ChatResultSchema,
    ListingSchema,
    ListingsPageSchema,
};
