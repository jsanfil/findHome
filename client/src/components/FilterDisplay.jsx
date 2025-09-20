import React from 'react';
import './FilterDisplay.css';

const formatFilter = (key, value) => {
    if (!value) return null;

    switch (key) {
        case 'location':
            return `Location: ${value}`;
        case 'price':
            const priceText = [];
            if (value.min) priceText.push(`Min: $${value.min.toLocaleString()}`);
            if (value.max) priceText.push(`Max: $${value.max.toLocaleString()}`);
            return `Price: ${priceText.join(' - ')}`;
        case 'beds':
            return `Beds: ${value.min}+`;
        case 'baths':
            return `Baths: ${value.min}+`;
        case 'propertyTypes':
            return `Property Types: ${value.join(', ')}`;
        case 'daysOnMarket':
            return `Listed in last ${value} days`;
        default:
            return null;
    }
};

const FilterDisplay = ({ filters }) => {
    if (!filters || Object.keys(filters).length === 0) {
        return null;
    }

    const displayFilters = Object.entries(filters)
        .map(([key, value]) => formatFilter(key, value))
        .filter(Boolean);

    if (displayFilters.length === 0) {
        return null;
    }

    return (
        <div className="filter-display">
            {displayFilters.map((filterText, index) => (
                <span key={index} className="filter-tag">
                    {filterText}
                </span>
            ))}
        </div>
    );
};

export default FilterDisplay;
