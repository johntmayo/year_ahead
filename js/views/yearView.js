/**
 * Year View - displays all 12 months in a grid
 */

import { store } from '../store.js';
import { getById, clearChildren, createElement } from '../utils/dom.js';
import { renderCalendar } from './calendarRenderer.js';
import { attachDayEventHandlers } from './viewController.js';

/**
 * Render the year view
 */
export function renderYear() {
    const yearView = getById('yearView');
    if (!yearView) return;

    clearChildren(yearView);

    const currentYear = store.get('currentYear');

    for (let month = 0; month < 12; month++) {
        const monthDiv = createElement('div');
        renderCalendar(month, currentYear, monthDiv);
        yearView.appendChild(monthDiv);
    }

    // Attach event handlers after rendering
    attachDayEventHandlers(yearView);
}

/**
 * Show the year view
 */
export function showYearView() {
    const yearView = getById('yearView');
    const monthView = getById('monthView');
    const timelineView = getById('timelineView');
    const monthSelect = getById('monthSelect');
    const timelineLinesSelect = getById('timelineLinesSelect');

    if (yearView) yearView.style.display = 'grid';
    if (monthView) monthView.style.display = 'none';
    if (timelineView) timelineView.style.display = 'none';
    if (monthSelect) monthSelect.style.display = 'none';
    if (timelineLinesSelect) timelineLinesSelect.style.display = 'none';
}
