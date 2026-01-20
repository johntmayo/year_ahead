/**
 * Year View - displays all 12 months in a grid
 */

import { store } from '../store.js';
import { getById, clearChildren, createElement } from '../utils/dom.js';
import { renderCalendar } from './calendarRenderer.js';
import { attachDayEventHandlers } from './viewController.js';
import { renderYearString } from '../ui/yearString.js';

/**
 * Render the year view
 */
export function renderYear() {
    const yearView = getById('yearView');
    if (!yearView) {
        console.error('yearView element not found!');
        return;
    }

    console.log('Clearing year view...');
    clearChildren(yearView);

    const currentYear = store.get('currentYear');
    console.log(`Rendering year ${currentYear}...`);

    for (let month = 0; month < 12; month++) {
        const monthDiv = createElement('div');
        renderCalendar(month, currentYear, monthDiv);
        yearView.appendChild(monthDiv);
    }

    console.log(`Rendered ${yearView.children.length} months`);

    // Attach event handlers after rendering
    attachDayEventHandlers(yearView);
    
    // Render year string
    renderYearString();
}

/**
 * Show the year view
 */
export function showYearView() {
    const yearView = getById('yearView');
    const monthView = getById('monthView');
    const timelineView = getById('timelineView');
    const paragraphView = getById('paragraphView');
    const monthSelect = getById('monthSelect');
    const timelineLinesSelect = getById('timelineLinesSelect');

    if (yearView) yearView.style.display = 'grid';
    if (monthView) monthView.style.display = 'none';
    if (timelineView) timelineView.style.display = 'none';
    if (paragraphView) paragraphView.style.display = 'none';
    if (monthSelect) monthSelect.style.display = 'none';
    if (timelineLinesSelect) timelineLinesSelect.style.display = 'none';
    
    // Show/hide year string
    const yearStringContainer = getById('yearStringContainer');
    if (yearStringContainer) yearStringContainer.style.display = 'block';
    
    renderYearString();
}
