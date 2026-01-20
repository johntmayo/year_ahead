/**
 * Year String visualization - shows event density across the year
 */

import { store } from '../store.js';
import { getById } from '../utils/dom.js';
import { getEventsForDay } from '../events/eventManager.js';

/**
 * Render the year string visualization
 */
export function renderYearString() {
    const container = getById('yearStringContainer');
    const yearString = getById('yearString');
    
    if (!container || !yearString) return;
    
    const currentYear = store.get('currentYear');
    const events = store.get('events');
    
    // Only show for year view
    const yearView = getById('yearView');
    if (!yearView || yearView.style.display === 'none') {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    // Calculate event density for each day of the year
    // Check if it's a leap year
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;
    
    const densityArray = new Array(daysInYear).fill(0);
    
    events.forEach(evt => {
        const start = new Date(evt.startDate + 'T00:00:00');
        const end = new Date(evt.endDate + 'T00:00:00');
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        
        if (startYear === currentYear || endYear === currentYear) {
            const yearStart = new Date(currentYear, 0, 1);
            const startDay = Math.max(0, Math.floor((start - yearStart) / (1000 * 60 * 60 * 24)));
            const endDay = Math.min(daysInYear - 1, Math.floor((end - yearStart) / (1000 * 60 * 60 * 24)));
            
            for (let day = startDay; day <= endDay; day++) {
                if (day >= 0 && day < daysInYear) {
                    densityArray[day]++;
                }
            }
        }
    });
    
    // Find max density for normalization
    const maxDensity = Math.max(...densityArray, 1);
    
    // Create gradient stops
    const gradientStops = [];
    const segmentWidth = 100 / daysInYear;
    
    densityArray.forEach((density, index) => {
        const intensity = density / maxDensity;
        const position = index * segmentWidth;
        
        // Color based on density
        const mode = document.documentElement.getAttribute('data-mode') || 'light';
        let color;
        
        if (mode === 'dark') {
            // Dark mode: lighter tones for visibility
            const base = 180 + intensity * 40; // Light gray to white
            color = `rgb(${Math.floor(base)}, ${Math.floor(base + intensity * 3)}, ${Math.floor(base + intensity * 5)})`;
        } else {
            // Light mode: sophisticated monochrome with subtle warmth
            const base = 44 + intensity * 25; // Deep charcoal to medium gray
            color = `rgb(${Math.floor(base)}, ${Math.floor(base + intensity * 3)}, ${Math.floor(base + intensity * 5)})`;
        }
        
        const opacity = 0.3 + intensity * 0.7;
        
        gradientStops.push(`${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} ${position}%`);
        if (index < daysInYear - 1) {
            gradientStops.push(`${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')} ${position + segmentWidth}%`);
        }
    });
    
    yearString.style.background = `linear-gradient(to right, ${gradientStops.join(', ')})`;
}

