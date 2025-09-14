/**
 * Very lightweight, rules-based parser to extract filters from a natural-language message.
 * This is a fallback for MVP to avoid LLM usage and costs. It is intentionally simple.
 * It recognizes a handful of cities (matching our mock dataset), price ranges, beds, property types,
 * and simple days-on-market phrases.
 */
const KNOWN_CITIES = [
    'Denver, CO',
    'San Diego, CA',
    'Austin, TX',
    'Portland, OR',
];

const CITY_ALIASES = [
    { pattern: /\bdenver\b/i, value: 'Denver, CO' },
    { pattern: /\bsan\s*diego\b/i, value: 'San Diego, CA' },
    { pattern: /\baustin\b/i, value: 'Austin, TX' },
    { pattern: /\bportland\b/i, value: 'Portland, OR' },
    // basic zips that exist in mock data
    { pattern: /\b8020[3|4|5|6|7|8|9]\b/, value: 'Denver, CO' },
    { pattern: /\b921(09|17)\b/, value: 'San Diego, CA' },
    { pattern: /\b787(05|23|35)\b/, value: 'Austin, TX' },
    { pattern: /\b972(01|11|14)\b/, value: 'Portland, OR' },
];

const PT_ALIASES = [
    { pattern: /\bsingle[-\s]?family|\bhouse\b/i, value: 'single_family' },
    { pattern: /\bcondo(s)?\b/i, value: 'condo' },
    { pattern: /\btown\s*home|\btown\s*house|\btownhome(s)?\b/i, value: 'townhome' },
    { pattern: /\bmulti[-\s]?family\b/i, value: 'multi_family' },
    { pattern: /\bland\b/i, value: 'land' },
];

function parseBeds(text) {
    const m = text.match(/(\d+)\s*[-\s]?(bed|beds|bedroom|bedrooms)\b/i);
    if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) return { min: n };
    }
    // variants like "3br"
    const m2 = text.match(/(\d+)\s*[-\s]?(br|bd)\b/i);
    if (m2) {
        const n = parseInt(m2[1], 10);
        if (!isNaN(n)) return { min: n };
    }
    return undefined;
}

function parseBaths(text) {
    const m = text.match(/(\d+(\.\d+)?)\s*(bath|baths|ba)\b/i);
    if (m) {
        const n = Math.floor(parseFloat(m[1]));
        if (!isNaN(n)) return { min: n };
    }
    return undefined;
}

function parsePrice(text) {
    // "under 650k", "below $700,000", "max 800k"
    const under = text.match(/\b(under|below|max(?:imum)?)\s*\$?\s*([\d,\.]+)\s*([km])?\b/i);
    if (under) {
        const max = normalizeMoney(under[2], under[3]);
        if (max) return { max };
    }

    // "over 500k", "min 400k"
    const over = text.match(/\b(over|above|min(?:imum)?)\s*\$?\s*([\d,\.]+)\s*([km])?\b/i);
    if (over) {
        const min = normalizeMoney(over[2], over[3]);
        if (min) return { min };
    }

    // "between 500k and 800k"
    const between = text.match(/\bbetween\s*\$?\s*([\d,\.]+)\s*([km])?\s*(and|to|-)\s*\$?\s*([\d,\.]+)\s*([km])?\b/i);
    if (between) {
        const min = normalizeMoney(between[1], between[2]);
        const max = normalizeMoney(between[4], between[5]);
        if (min || max) return { min, max };
    }

    // Lone money-like token e.g. "$700k", "900k budget"
    const lone = text.match(/\$?\s*([\d,\.]+)\s*([km])\b/i);
    if (lone) {
        const max = normalizeMoney(lone[1], lone[2]);
        if (max) return { max };
    }

    return undefined;
}

function normalizeMoney(numStr, suffix) {
    const raw = parseFloat(String(numStr).replace(/,/g, ''));
    if (isNaN(raw)) return undefined;
    if (!suffix) return Math.round(raw);
    const s = suffix.toLowerCase();
    if (s === 'k') return Math.round(raw * 1_000);
    if (s === 'm') return Math.round(raw * 1_000_000);
    return Math.round(raw);
}

function parseLocation(text) {
    for (const alias of CITY_ALIASES) {
        if (alias.pattern.test(text)) return alias.value;
    }
    // generic fallback: none
    return undefined;
}

function parsePropertyTypes(text) {
    const found = new Set();
    for (const a of PT_ALIASES) {
        if (a.pattern.test(text)) found.add(a.value);
    }
    return found.size ? Array.from(found) : undefined;
}

function parseDaysOnMarket(text) {
    // phrases: "new", "this week", "last 7 days", "past 14 days"
    if (/\b(this|past|last)\s*(week|7\s*days)\b/i.test(text)) return 7;
    const m = text.match(/\b(last|past)\s*(\d{1,3})\s*days?\b/i);
    if (m) {
        const n = parseInt(m[2], 10);
        if (!isNaN(n)) return n;
    }
    if (/\bnew\b/i.test(text)) return 7;
    return undefined;
}

function parseKeywords(text) {
    // extremely simple heuristic: pick a few relevant words if present
    const kws = [];
    if (/\bgarage\b/i.test(text)) kws.push('garage');
    if (/\byard|garden\b/i.test(text)) kws.push('yard');
    if (/\bbeach\b/i.test(text)) kws.push('beach');
    if (/\bdowntown\b/i.test(text)) kws.push('downtown');
    if (/\bmodern\b/i.test(text)) kws.push('modern');
    return kws.length ? kws : undefined;
}

function parseSort(text) {
    if (/\blow(est)?\s*price\b/i.test(text)) return 'price_asc';
    if (/\bhigh(est)?\s*price\b/i.test(text)) return 'price_desc';
    if (/\bnew(est)?|recent\b/i.test(text)) return 'dom_desc';
    return undefined; // default relevance
}

function parsePage(text) {
    const m = text.match(/\bpage\s*(\d+)\b/i);
    if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > 0) return n;
    }
    return 1;
}

function parseQuery(message) {
    const text = String(message || '').trim();
    const filters = {
        location: parseLocation(text),
        price: parsePrice(text),
        beds: parseBeds(text),
        baths: parseBaths(text),
        propertyTypes: parsePropertyTypes(text),
        daysOnMarket: parseDaysOnMarket(text),
        keywords: parseKeywords(text),
        sortBy: parseSort(text),
        page: parsePage(text),
    };

    // Clean empty objects like {min: undefined, max: undefined}
    if (filters.price && filters.price.min == null && filters.price.max == null) delete filters.price;
    if (filters.beds && filters.beds.min == null && filters.beds.max == null) delete filters.beds;
    if (filters.baths && filters.baths.min == null && filters.baths.max == null) delete filters.baths;

    return filters;
}

module.exports = {
    parseQuery,
    KNOWN_CITIES,
};
