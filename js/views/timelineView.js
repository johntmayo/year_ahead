/**
 * Timeline View - displays the year as a horizontal timeline
 */

import { store } from '../store.js';
import { MONTH_NAMES, EVENT_HEIGHT, TIMELINE_DAY_WIDTH } from '../constants.js';
import { escapeHtml, escapeAttr } from '../utils/sanitize.js';
import {
    dateToString,
    stringToDate,
    isMultiDayEvent,
    isEventStartDate,
    calculateEventSpan
} from '../utils/date.js';
import { getById, createElement, addClass, removeClass, clearChildren } from '../utils/dom.js';
import { getEventsForDay, getEventIndex } from '../events/eventManager.js';
import { attachDayEventHandlers, attachEventHandlers } from './viewController.js';

/**
 * Render the timeline view
 */
export function renderTimeline() {
    const timelineView = getById('timelineView');
    if (!timelineView) return;

    clearChildren(timelineView);

    const timelineLines = store.get('timelineLines');
    const currentYear = store.get('currentYear');

    // Update class based on number of lines
    removeClass(timelineView, 'lines-1', 'lines-2', 'lines-4');
    addClass(timelineView, `lines-${timelineLines}`);

    // Calculate all days in the year
    const daysInYear = [];
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        daysInYear.push(dateToString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Divide days into lines
    const daysPerLine = Math.ceil(daysInYear.length / timelineLines);
    const container = createElement('div', { className: 'timeline-container' });

    // Create timeline rows
    for (let lineIdx = 0; lineIdx < timelineLines; lineIdx++) {
        const startIdx = lineIdx * daysPerLine;
        const endIdx = Math.min(startIdx + daysPerLine, daysInYear.length);
        const lineDays = daysInYear.slice(startIdx, endIdx);

        // Create header row for this line
        const headerRow = createElement('div', { className: 'timeline-row-header' });
        lineDays.forEach((dateKey, dayIdx) => {
            const dayHeader = createElement('div', { className: 'timeline-day-header' });
            const date = stringToDate(dateKey);
            // Show day number only for first of month or every 10th day
            if (date.getDate() === 1 || (startIdx + dayIdx) % 10 === 0) {
                dayHeader.textContent = date.getDate();
            }
            headerRow.appendChild(dayHeader);
        });
        container.appendChild(headerRow);

        const row = createElement('div', { className: 'timeline-row' });

        // Add month markers
        let lastMonth = -1;
        lineDays.forEach((dateKey, dayIdx) => {
            const date = stringToDate(dateKey);
            const month = date.getMonth();
            const dayOfMonth = date.getDate();

            // Add month marker at start of each month
            if (month !== lastMonth && dayOfMonth <= 3) {
                const marker = createElement('div', {
                    className: 'timeline-month-marker',
                    style: { left: `${dayIdx * 14}px` }
                }, MONTH_NAMES[month].substring(0, 3));
                row.appendChild(marker);
                lastMonth = month;
            }
        });

        // Calculate line bounds for span calculations
        const lineStart = stringToDate(lineDays[0]);
        const lineEnd = stringToDate(lineDays[lineDays.length - 1]);

        // Create day cells
        lineDays.forEach((dateKey) => {
            const dayDiv = createTimelineDay(dateKey, lineStart, lineEnd);
            row.appendChild(dayDiv);
        });

        container.appendChild(row);
    }

    timelineView.appendChild(container);

    // Set container width for multi-line views
    if (timelineLines === 2 || timelineLines === 4) {
        const headerRows = container.querySelectorAll('.timeline-row-header');
        if (headerRows.length > 0) {
            const firstHeaderWidth = headerRows[0].offsetWidth;
            container.style.width = firstHeaderWidth + 'px';
        }
    } else {
        container.style.width = '';
    }

    // Attach event handlers
    attachDayEventHandlers(timelineView);
    attachEventHandlers(timelineView);
}

/**
 * Create a timeline day cell
 * @param {string} dateKey - Date key
 * @param {Date} lineStart - Line start date
 * @param {Date} lineEnd - Line end date
 * @returns {HTMLElement} Day element
 */
function createTimelineDay(dateKey, lineStart, lineEnd) {
    const date = stringToDate(dateKey);
    const dayEvents = getEventsForDay(dateKey);

    const dayDiv = createElement('div', {
        className: 'timeline-day',
        dataset: { date: dateKey }
    });

    // Add day number label for first of month
    if (date.getDate() === 1) {
        const label = createElement('div', { className: 'timeline-day-label' },
            `${MONTH_NAMES[date.getMonth()].substring(0, 3)} ${date.getDate()}`);
        dayDiv.appendChild(label);
    }

    // Create events container
    const eventsContainer = createElement('div', { className: 'timeline-day-events' });

    // Separate single-day and multi-day events
    const singleDayEvents = [];
    const multiDayEvents = [];

    dayEvents.forEach((evt) => {
        if (isMultiDayEvent(evt)) {
            const isStart = isEventStartDate(evt, dateKey, lineStart, lineEnd);
            if (isStart) {
                multiDayEvents.push(evt);
            }
        } else {
            singleDayEvents.push(evt);
        }
    });

    // Track vertical position for stacking events
    let eventTop = 0;
    const eventHeight = EVENT_HEIGHT.TIMELINE;

    // Render multi-day events first
    multiDayEvents.forEach((evt) => {
        const eventIdx = getEventIndex(evt);
        const span = calculateEventSpan(evt, dateKey, lineStart, lineEnd);
        const width = span * TIMELINE_DAY_WIDTH - 1;

        const eventDiv = createElement('div', {
            className: 'timeline-event timeline-multi-day',
            dataset: { eventIdx: eventIdx.toString() },
            style: {
                background: evt.color,
                width: `${width}px`,
                position: 'absolute',
                top: `${eventTop}px`,
                left: '0',
                zIndex: '2'
            }
        }, escapeHtml(evt.text));

        eventsContainer.appendChild(eventDiv);
        eventTop += eventHeight;
    });

    // Render single-day events
    singleDayEvents.forEach((evt) => {
        const eventIdx = getEventIndex(evt);

        const eventDiv = createElement('div', {
            className: 'timeline-event',
            dataset: { eventIdx: eventIdx.toString() },
            style: {
                background: evt.color,
                position: 'absolute',
                top: `${eventTop}px`,
                left: '0'
            }
        }, escapeHtml(evt.text));

        eventsContainer.appendChild(eventDiv);
        eventTop += eventHeight;
    });

    dayDiv.appendChild(eventsContainer);
    return dayDiv;
}

/**
 * Show the timeline view
 */
export function showTimelineView() {
    const yearView = getById('yearView');
    const monthView = getById('monthView');
    const timelineView = getById('timelineView');
    const monthSelect = getById('monthSelect');
    const timelineLinesSelect = getById('timelineLinesSelect');

    if (yearView) yearView.style.display = 'none';
    if (monthView) monthView.style.display = 'none';
    if (timelineView) timelineView.style.display = 'block';
    if (monthSelect) monthSelect.style.display = 'none';
    if (timelineLinesSelect) timelineLinesSelect.style.display = 'block';

    renderTimeline();
}

/**
 * Change timeline lines setting
 */
export function changeTimelineLines() {
    const timelineLinesSelect = getById('timelineLinesSelect');
    if (timelineLinesSelect) {
        store.set('timelineLines', parseInt(timelineLinesSelect.value));
        renderTimeline();
    }
}
