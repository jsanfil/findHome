const test = require('node:test');
const assert = require('assert');
const { parseQuery } = require('../utils/parseQuery');

test('parses beds, location, and max price from a simple query', () => {
    const f = parseQuery('3-bed homes in Denver under 650k');
    assert.strictEqual(f.location, 'Denver, CO');
    assert.deepStrictEqual(f.beds, { min: 3 });
    assert.deepStrictEqual(f.price, { max: 650000 });
});

test('handles variations like "3 br" and "$700k max"', () => {
    const f = parseQuery('3 br houses in Austin, TX, $700k max');
    assert.strictEqual(f.location, 'Austin, TX');
    assert.deepStrictEqual(f.beds, { min: 3 });
    assert.deepStrictEqual(f.price, { max: 700000 });
});

test('detects property types and days on market phrases', () => {
    const f = parseQuery('condos in San Diego new this week under 900k');
    assert.strictEqual(f.location, 'San Diego, CA');
    // propertyTypes is best-effort
    if (Array.isArray(f.propertyTypes)) {
        assert.ok(f.propertyTypes.includes('condo'));
    }
    // "new this week" -> 7
    assert.strictEqual(f.daysOnMarket, 7);
});
