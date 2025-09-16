import React from 'react';
import './FilterPanel.css';

function formatFilterLabel(key, value) {
    console.log('Formatting filter:', { key, value }); // Debug log

    const labels = {
        location: () => `Location: ${value}`,
        price: () => {
            const parts = [];
            if (value.min) parts.push(`Min $${value.min.toLocaleString()}`);
            if (value.max) parts.push(`Max $${value.max.toLocaleString()}`);
            return `Price: ${parts.join(' ')}`;
        },
        beds: () => `Beds: ${value.min}+`,
        baths: () => `Baths: ${value.min}+`,
        propertyTypes: () => `Types: ${Array.isArray(value) ? value.join(', ') : value}`,
        daysOnMarket: () => `Listed in last ${value} days`,
        keywords: () => `Keywords: ${Array.isArray(value) ? value.join(', ') : value}`,
        sortBy: () => `Sort: ${value}`
    };

    console.log('Formatted label:', labels[key] ? labels[key]() : 'No label'); // Debug log

    return labels[key] ? labels[key]() : key;
}

export default function FilterPanel({ filters, onRemoveFilter }) {
    console.log('Received filters:', filters); // Debug log

    if (!filters || Object.keys(filters).length === 0) return null;

    return (
        <div className="filterPanel">
            {Object.entries(filters)
                .filter(([key]) => key !== 'page')
                .map(([key, value]) => (
                    <div key={key} className="chip filterChip">
                        {formatFilterLabel(key, value)}
                        <button
                            className="filterRemoveBtn"
                            onClick={() => onRemoveFilter(key)}
                            aria-label={`Remove ${key} filter`}
                        >
                            ✕
                        </button>
                    </div>
                ))
            }
        </div>
    );
}
