/**
 * Shared calendar rendering utilities
 */

import { store } from '../store.js';
import { MONTH_NAMES, DAY_NAMES, EVENT_HEIGHT } from '../constants.js';
import { escapeHtml, escapeAttr } from '../utils/sanitize.js';
import {
    getDaysInMonth,
    getFirstDayOfMonth,
    getRowForDay,
    isMultiDayEvent,
    isEventStartOnRow,
    calculateEventSpanInRow,
    stringToDate
} from '../utils/date.js';
import { getEventsForDay, getEventIndex } from '../events/eventManager.js';

/**
 * Render a calendar month
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @param {HTMLElement} container - Container element
 * @param {Object} handlers - Event handlers
 */
export function renderCalendar(month, year, container, handlers) {
    const currentYear = year || store.get('currentYear');
    const daysInMonth = getDaysInMonth(month, currentYear);
    const firstDay = getFirstDayOfMonth(month, currentYear);

    let html = '<div class="month-container">';
    html += `<div class="month-header">${escapeHtml(MONTH_NAMES[month])} ${currentYear}</div>`;
    html += '<div class="calendar">';

    // Day labels
    DAY_NAMES.forEach(day => {
        html += `<div class="day-label">${escapeHtml(day)}</div>`;
    });

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="day empty"></div>';
    }

    // Calculate month bounds for span calculations
    const monthStart = new Date(currentYear, month, 1);
    const monthEnd = new Date(currentYear, month, daysInMonth);

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        html += renderDay(dateKey, day, firstDay, monthStart, monthEnd, daysInMonth);
    }

    html += '</div></div>';
    container.innerHTML = html;
}

/**
 * Render a single day cell
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 * @param {number} day - Day of month
 * @param {number} firstDay - First day of month
 * @param {Date} monthStart - Month start date
 * @param {Date} monthEnd - Month end date
 * @param {number} daysInMonth - Days in month
 * @returns {string} HTML string
 */
function renderDay(dateKey, day, firstDay, monthStart, monthEnd, daysInMonth) {
    const dayEvents = getEventsForDay(dateKey);
    const currentRow = getRowForDay(day, firstDay);

    let html = `<div class="day" data-date="${escapeAttr(dateKey)}">`;
    html += `<div class="day-number">${day}</div>`;
    html += `<div class="day-events">`;

    // Separate single-day and multi-day events
    const singleDayEvents = [];
    const multiDayEventsOnThisRow = [];

    dayEvents.forEach((evt) => {
        if (isMultiDayEvent(evt)) {
            if (isEventStartOnRow(evt, dateKey, currentRow, firstDay, monthStart, monthEnd, daysInMonth)) {
                multiDayEventsOnThisRow.push(evt);
            }
        } else {
            singleDayEvents.push(evt);
        }
    });

    // Track vertical position for stacking events
    let eventTop = 0;
    const eventHeight = EVENT_HEIGHT.CALENDAR;

    // Render multi-day events first
    multiDayEventsOnThisRow.forEach((evt) => {
        const eventIdx = getEventIndex(evt);
        const span = calculateEventSpanInRow(evt, dateKey, currentRow, firstDay, daysInMonth, monthStart, monthEnd);

        // Calculate width with border adjustment
        const borderAdjustment = (span - 1) * 1;

        // Determine if this is the first row where the event appears
        const eventStart = stringToDate(evt.startDate);
        let eventStartInMonth = eventStart;
        if (eventStart < monthStart) {
            eventStartInMonth = new Date(monthStart);
        }
        const eventStartDay = eventStartInMonth.getDate();
        const eventStartRow = getRowForDay(eventStartDay, firstDay);
        const isFirstRow = currentRow === eventStartRow;

        let eventStyle = `background: ${escapeAttr(evt.color)};`;
        eventStyle += ` width: calc(${span * 100}% + ${borderAdjustment}px);`;
        eventStyle += ` top: ${eventTop}px;`;

        // Show label on first row, or show continuation indicator
        const eventText = isFirstRow ? escapeHtml(evt.text) : '…';

        html += `<div class="event multi-day" data-event-idx="${eventIdx}" style="${eventStyle}" title="${escapeAttr(evt.text)}">${eventText}</div>`;

        eventTop += eventHeight;
    });

    // Render single-day events
    singleDayEvents.forEach((evt) => {
        const eventIdx = getEventIndex(evt);
        let eventStyle = `background: ${escapeAttr(evt.color)};`;
        eventStyle += ` position: absolute;`;
        eventStyle += ` top: ${eventTop}px;`;
        eventStyle += ` left: 0;`;
        eventStyle += ` right: 0;`;

        html += `<div class="event" data-event-idx="${eventIdx}" style="${eventStyle}">${escapeHtml(evt.text)}</div>`;

        eventTop += eventHeight;
    });

    html += `</div></div>`;
    return html;
}

/**
 * Get events styled HTML for rendering
 * @param {Array} events - Events array
 * @param {string} dateKey - Date key
 * @returns {string} HTML string
 */
export function renderEventsHtml(events, dateKey) {
    let html = '';

    events.forEach((evt) => {
        const eventIdx = getEventIndex(evt);
        html += `<div class="event" data-event-idx="${eventIdx}" style="background: ${escapeAttr(evt.color)};">${escapeHtml(evt.text)}</div>`;
    });

    return html;
}
