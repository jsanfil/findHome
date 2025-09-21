const { ListingsPageSchema, PropertyTypeEnum } = require('../schema');

// In-memory mock listings covering a few metros for testing.
// Note: Photos use placeholder images; listingUrl points to Zillow searches for demonstration.
const MOCK_LISTINGS = [
    // Denver, CO
    {
        id: 'den-1001',
        address: '123 Cherry St',
        city: 'Denver',
        state: 'CO',
        zip: '80203',
        price: 625000,
        beds: 3,
        baths: 2,
        sqft: 1750,
        lotSize: 4000,
        yearBuilt: 1995,
        propertyType: 'single_family',
        daysOnMarket: 5,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/den1001/800/600'],
        heroPhoto: 'https://picsum.photos/seed/den1001/800/600',
        listingUrl: 'https://www.zillow.com/homes/Denver,-CO_rb/',
        tags: ['New'],
        excerpt: 'Charming single-family home near Cheesman Park with a fenced yard.',
    },
    {
        id: 'den-1002',
        address: '45 Elm Ave',
        city: 'Denver',
        state: 'CO',
        zip: '80210',
        price: 540000,
        beds: 2,
        baths: 2,
        sqft: 1320,
        lotSize: 2500,
        yearBuilt: 2008,
        propertyType: 'townhome',
        daysOnMarket: 14,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/den1002/800/600'],
        heroPhoto: 'https://picsum.photos/seed/den1002/800/600',
        listingUrl: 'https://www.zillow.com/homes/Denver,-CO_rb/',
        tags: ['Price drop'],
        excerpt: 'Modern townhome with attached garage in Platt Park.',
    },
    {
        id: 'den-1003',
        address: '890 Lincoln St #504',
        city: 'Denver',
        state: 'CO',
        zip: '80203',
        price: 395000,
        beds: 1,
        baths: 1,
        sqft: 850,
        lotSize: undefined,
        yearBuilt: 2012,
        propertyType: 'condo',
        daysOnMarket: 3,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/den1003/800/600'],
        heroPhoto: 'https://picsum.photos/seed/den1003/800/600',
        listingUrl: 'https://www.zillow.com/homes/Denver,-CO_rb/',
        tags: ['New'],
        excerpt: 'Downtown condo with mountain views and gym access.',
    },

    // San Diego, CA
    {
        id: 'sd-2001',
        address: '1020 Ocean Blvd',
        city: 'San Diego',
        state: 'CA',
        zip: '92109',
        price: 875000,
        beds: 3,
        baths: 2,
        sqft: 1420,
        lotSize: 3000,
        yearBuilt: 1987,
        propertyType: 'single_family',
        daysOnMarket: 10,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/sd2001/800/600'],
        heroPhoto: 'https://picsum.photos/seed/sd2001/800/600',
        listingUrl: 'https://www.zillow.com/homes/San-Diego,-CA_rb/',
        tags: ['Near beach'],
        excerpt: 'Beach-adjacent home with updated kitchen and backyard.',
    },
    {
        id: 'sd-2002',
        address: '220 Mission Blvd #B',
        city: 'San Diego',
        state: 'CA',
        zip: '92109',
        price: 699000,
        beds: 2,
        baths: 2,
        sqft: 1100,
        lotSize: undefined,
        yearBuilt: 2005,
        propertyType: 'condo',
        daysOnMarket: 2,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/sd2002/800/600'],
        heroPhoto: 'https://picsum.photos/seed/sd2002/800/600',
        listingUrl: 'https://www.zillow.com/homes/San-Diego,-CA_rb/',
        tags: ['New'],
        excerpt: 'Condo with balcony and garage parking near Mission Beach.',
    },
    {
        id: 'sd-2003',
        address: '4555 Bayview Ct',
        city: 'San Diego',
        state: 'CA',
        zip: '92117',
        price: 915000,
        beds: 3,
        baths: 2,
        sqft: 1600,
        lotSize: 5000,
        yearBuilt: 1972,
        propertyType: 'single_family',
        daysOnMarket: 20,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/sd2003/800/600'],
        heroPhoto: 'https://picsum.photos/seed/sd2003/800/600',
        listingUrl: 'https://www.zillow.com/homes/San-Diego,-CA_rb/',
        tags: ['Open house'],
        excerpt: 'Clairemont home with large yard and updated baths.',
    },

    // Austin, TX
    {
        id: 'aus-3001',
        address: '7801 Barton Skyway',
        city: 'Austin',
        state: 'TX',
        zip: '78735',
        price: 575000,
        beds: 3,
        baths: 2,
        sqft: 1680,
        lotSize: 7200,
        yearBuilt: 1998,
        propertyType: 'single_family',
        daysOnMarket: 4,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/aus3001/800/600'],
        heroPhoto: 'https://picsum.photos/seed/aus3001/800/600',
        listingUrl: 'https://www.zillow.com/homes/Austin,-TX_rb/',
        tags: ['New'],
        excerpt: 'Starter home with shaded backyard and updated HVAC.',
    },
    {
        id: 'aus-3002',
        address: '2500 Guadalupe St #120',
        city: 'Austin',
        state: 'TX',
        zip: '78705',
        price: 420000,
        beds: 2,
        baths: 2,
        sqft: 980,
        lotSize: undefined,
        yearBuilt: 2010,
        propertyType: 'condo',
        daysOnMarket: 9,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/aus3002/800/600'],
        heroPhoto: 'https://picsum.photos/seed/aus3002/800/600',
        listingUrl: 'https://www.zillow.com/homes/Austin,-TX_rb/',
        tags: ['Campus area'],
        excerpt: 'UT-adjacent condo with garage and community pool.',
    },
    {
        id: 'aus-3003',
        address: '1007 E 51st St',
        city: 'Austin',
        state: 'TX',
        zip: '78723',
        price: 760000,
        beds: 4,
        baths: 3,
        sqft: 2100,
        lotSize: 6000,
        yearBuilt: 2016,
        propertyType: 'townhome',
        daysOnMarket: 16,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/aus3003/800/600'],
        heroPhoto: 'https://picsum.photos/seed/aus3003/800/600',
        listingUrl: 'https://www.zillow.com/homes/Austin,-TX_rb/',
        tags: ['Price drop'],
        excerpt: 'Spacious townhome with 2-car garage and modern finishes.',
    },

    // Portland, OR
    {
        id: 'pdx-4001',
        address: '500 NE Alberta St',
        city: 'Portland',
        state: 'OR',
        zip: '97211',
        price: 485000,
        beds: 2,
        baths: 1,
        sqft: 1050,
        lotSize: 3500,
        yearBuilt: 1948,
        propertyType: 'single_family',
        daysOnMarket: 7,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/pdx4001/800/600'],
        heroPhoto: 'https://picsum.photos/seed/pdx4001/800/600',
        listingUrl: 'https://www.zillow.com/homes/Portland,-OR_rb/',
        tags: ['New'],
        excerpt: 'Bungalow with updated kitchen and garden beds.',
    },
    {
        id: 'pdx-4002',
        address: '2200 SW 10th Ave #702',
        city: 'Portland',
        state: 'OR',
        zip: '97201',
        price: 365000,
        beds: 1,
        baths: 1,
        sqft: 780,
        lotSize: undefined,
        yearBuilt: 2007,
        propertyType: 'condo',
        daysOnMarket: 11,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/pdx4002/800/600'],
        heroPhoto: 'https://picsum.photos/seed/pdx4002/800/600',
        listingUrl: 'https://www.zillow.com/homes/Portland,-OR_rb/',
        tags: [],
        excerpt: 'Light-filled condo near PSU with city views.',
    },
    {
        id: 'pdx-4003',
        address: '801 SE 34th Ave',
        city: 'Portland',
        state: 'OR',
        zip: '97214',
        price: 715000,
        beds: 3,
        baths: 2,
        sqft: 1650,
        lotSize: 4500,
        yearBuilt: 1925,
        propertyType: 'single_family',
        daysOnMarket: 22,
        status: 'For Sale',
        photos: ['https://picsum.photos/seed/pdx4003/800/600'],
        heroPhoto: 'https://picsum.photos/seed/pdx4003/800/600',
        listingUrl: 'https://www.zillow.com/homes/Portland,-OR_rb/',
        tags: ['Open house'],
        excerpt: 'Classic craftsman with porch and updated bath.',
    },
];

const PAGE_SIZE = 10;

function matchesKeywords(listing, keywords) {
    if (!keywords || !keywords.length) return true;
    const hay = [
        listing.address,
        listing.city,
        listing.state,
        listing.zip,
        listing.excerpt || '',
        ...(listing.tags || []),
    ]
        .join(' ')
        .toLowerCase();

    return keywords.every((kw) => hay.includes(String(kw).toLowerCase()));
}

function matchesPropertyType(listing, propertyTypes) {
    if (!propertyTypes || !propertyTypes.length) return true;
    return propertyTypes.includes(listing.propertyType);
}

function matchesBeds(listing, beds) {
    if (!beds) return true;
    const min = beds.min ?? -Infinity;
    const max = beds.max ?? Infinity;
    return listing.beds >= min && listing.beds <= max;
}

function matchesBaths(listing, baths) {
    if (!baths) return true;
    const min = baths.min ?? -Infinity;
    const max = baths.max ?? Infinity;
    // Some listings might not have baths (undefined) — treat as 0
    const b = listing.baths ?? 0;
    return b >= min && b <= max;
}

function matchesPrice(listing, price) {
    if (!price) return true;
    const min = price.min ?? -Infinity;
    const max = price.max ?? Infinity;
    return listing.price >= min && listing.price <= max;
}

function matchesDaysOnMarket(listing, dom) {
    if (!dom && dom !== 0) return true;
    return (listing.daysOnMarket ?? 0) <= dom;
}

function matchesLocation(listing, location) {
    if (!location) return true;

    // Handle location as object {city, state?}
    if (typeof location === 'object' && location.city) {
        const searchCity = location.city.toLowerCase().replace(/[^a-z0-9]/g, '');
        const searchState = location.state ? location.state.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

        const hay = `${listing.address} ${listing.city} ${listing.state} ${listing.zip}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        // Match city and optionally state
        const cityMatch = hay.includes(searchCity);
        const stateMatch = !searchState || hay.includes(searchState);

        return cityMatch && stateMatch;
    }

    // Fallback for string location (backward compatibility)
    const hay = `${listing.address} ${listing.city} ${listing.state} ${listing.zip}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    const needle = String(location).toLowerCase().replace(/[^a-z0-9]/g, '');
    return hay.includes(needle);
}

function sortListings(items, sortBy) {
    const arr = [...items];
    switch (sortBy) {
        case 'price_asc':
            return arr.sort((a, b) => a.price - b.price);
        case 'price_desc':
            return arr.sort((a, b) => b.price - a.price);
        case 'dom_desc':
            return arr.sort((a, b) => (b.daysOnMarket ?? 0) - (a.daysOnMarket ?? 0));
        case 'relevance':
        default:
            return arr; // leave as-is for mock
    }
}

async function search(filters) {
    // Validate property types are within enum (best-effort safeguard for mock)
    if (filters.propertyTypes) {
        filters.propertyTypes = filters.propertyTypes.filter((pt) =>
            PropertyTypeEnum.options.includes(pt)
        );
    }

    const items = MOCK_LISTINGS.filter((l) => {
        return (
            matchesLocation(l, filters.location) &&
            matchesPrice(l, filters.price) &&
            matchesBeds(l, filters.beds) &&
            matchesBaths(l, filters.baths) &&
            matchesPropertyType(l, filters.propertyTypes) &&
            matchesDaysOnMarket(l, filters.daysOnMarket) &&
            matchesKeywords(l, filters.keywords)
        );
    });

    const sorted = sortListings(items, filters.sortBy || 'relevance');

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const start = (page - 1) * PAGE_SIZE;
    const paged = sorted.slice(start, start + PAGE_SIZE);

    // Shape to schema
    const result = {
        items: paged,
        total: sorted.length,
        page,
        pageSize: PAGE_SIZE,
    };

    // Ensure it matches the schema; if error, throw for caller to handle
    const parsed = ListingsPageSchema.safeParse(result);
    if (!parsed.success) {
        throw new Error('MockProvider ListingsPage validation failed: ' + JSON.stringify(parsed.error.issues));
    }
    return parsed.data;
}

module.exports = {
    search,
    __data: MOCK_LISTINGS,
};
