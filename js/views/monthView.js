/**
 * Month View - displays a single month in detail
 */

import { store } from '../store.js';
import { getById } from '../utils/dom.js';
import { renderCalendar } from './calendarRenderer.js';
import { attachDayEventHandlers } from './viewController.js';

/**
 * Render the month view for a specific month
 * @param {number} month - Month to render (0-11)
 */
export function renderMonth(month) {
    const monthView = getById('monthView');
    if (!monthView) return;

    const currentYear = store.get('currentYear');
    renderCalendar(month, currentYear, monthView);

    // Attach event handlers after rendering
    attachDayEventHandlers(monthView);
}

/**
 * Show the month view
 */
export function showMonthView() {
    const yearView = getById('yearView');
    const monthView = getById('monthView');
    const timelineView = getById('timelineView');
    const paragraphView = getById('paragraphView');
    const monthSelect = getById('monthSelect');
    const timelineLinesSelect = getById('timelineLinesSelect');
    const yearStringContainer = getById('yearStringContainer');

    if (yearView) yearView.style.display = 'none';
    if (monthView) monthView.style.display = 'flex';
    if (timelineView) timelineView.style.display = 'none';
    if (paragraphView) paragraphView.style.display = 'none';
    if (monthSelect) monthSelect.style.display = 'block';
    if (timelineLinesSelect) timelineLinesSelect.style.display = 'none';
    if (yearStringContainer) yearStringContainer.style.display = 'none';

    // Render current month
    renderMonth(store.get('currentMonth'));
}

/**
 * Change to a different month
 */
export function changeMonth() {
    const monthSelect = getById('monthSelect');
    if (monthSelect) {
        store.set('currentMonth', parseInt(monthSelect.value));
        renderMonth(store.get('currentMonth'));
    }
}
