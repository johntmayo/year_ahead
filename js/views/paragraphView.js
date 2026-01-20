/**
 * Paragraph Flow View - displays the year as a continuous stream of days
 */

import { store } from '../store.js';
import { getById, clearChildren, createElement, qsa } from '../utils/dom.js';
import { MONTH_NAMES, DAY_NAMES } from '../constants.js';
import { getEventsForDay } from '../events/eventManager.js';
import { getEventIndex } from '../events/eventManager.js';
import { getEventColorStyle } from '../themes/themeManager.js';
import { stringToDate, dateToString, isDateInRange } from '../utils/date.js';
import { escapeHtml, escapeAttr } from '../utils/sanitize.js';
import {
    handleDayMouseDown,
    handleDayMouseEnter,
    handleEventMouseDown,
    justFinishedDrag,
    isDragging
} from '../drag/dragManager.js';
import { openModal } from '../ui/modal.js';

/**
 * Render the paragraph flow view
 */
export function renderParagraph() {
    const paragraphView = getById('paragraphView');
    if (!paragraphView) {
        console.error('paragraphView element not found!');
        return;
    }

    clearChildren(paragraphView);

    const currentYear = store.get('currentYear');

    // Check if it's a leap year
    const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
    const daysInYear = isLeapYear ? 366 : 365;

    // Create container for the paragraph flow
    const container = createElement('div');
    container.className = 'paragraph-container';

    // Create month groups
    const monthGroups = [];
    let dayIndex = 0;

    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);
        const daysInMonth = monthEnd.getDate();

        const monthGroup = {
            month,
            monthName: MONTH_NAMES[month],
            startIndex: dayIndex,
            endIndex: dayIndex + daysInMonth - 1,
            days: []
        };

        // Create days for this month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, month, day);
            const dateKey = dateToString(date);
            const dayOfWeek = date.getDay();
            const dayName = DAY_NAMES[dayOfWeek].charAt(0); // First letter

            monthGroup.days.push({
                dateKey,
                day,
                dayName,
                date
            });

            dayIndex++;
        }

        monthGroups.push(monthGroup);
    }

    // Render month groups with watermarks
    monthGroups.forEach((monthGroup, groupIndex) => {
        const monthContainer = createElement('div');
        monthContainer.className = 'paragraph-month-group';
        monthContainer.dataset.month = monthGroup.month;

        // Month watermark
        const watermark = createElement('div');
        watermark.className = 'paragraph-month-watermark';
        watermark.textContent = monthGroup.monthName.toUpperCase();
        monthContainer.appendChild(watermark);

        // Days container
        const daysContainer = createElement('div');
        daysContainer.className = 'paragraph-days';

        // Render each day
        monthGroup.days.forEach((dayData) => {
            const dayCell = createElement('div');
            dayCell.className = 'paragraph-day';
            dayCell.dataset.date = dayData.dateKey;

            // Day label (top-left)
            const dayLabel = createElement('div');
            dayLabel.className = 'paragraph-day-label';
            dayLabel.textContent = `${dayData.day} ${dayData.dayName}`;
            dayCell.appendChild(dayLabel);

            // Events container
            const eventsContainer = createElement('div');
            eventsContainer.className = 'paragraph-day-events';

            // Get events for this day
            const dayEvents = getEventsForDay(dayData.dateKey);

            // Render events as highlighter sweeps
            dayEvents.forEach((evt) => {
                const eventIdx = getEventIndex(evt);
                const colorStyle = getEventColorStyle(evt.color, false);

                // Check if this is the start of a multi-day event
                const isEventStart = evt.startDate === dayData.dateKey;
                const isEventEnd = evt.endDate === dayData.dateKey;
                const isMultiDay = evt.startDate !== evt.endDate;

                const eventEl = createElement('div');
                eventEl.className = 'paragraph-event';
                eventEl.dataset.eventIdx = eventIdx;
                eventEl.title = escapeAttr(evt.text);

                // Apply styling
                let style = colorStyle;
                
                // For multi-day events, we need to handle the flow across line breaks
                if (isMultiDay) {
                    // Check if event continues to next day
                    const nextDay = new Date(dayData.date);
                    nextDay.setDate(nextDay.getDate() + 1);
                    const nextDateKey = dateToString(nextDay);
                    const continuesNext = isDateInRange(nextDateKey, evt.startDate, evt.endDate);

                    // Check if event continues from previous day
                    const prevDay = new Date(dayData.date);
                    prevDay.setDate(prevDay.getDate() - 1);
                    const prevDateKey = dateToString(prevDay);
                    const continuesFromPrev = isDateInRange(prevDateKey, evt.startDate, evt.endDate);

                    if (isEventStart && !continuesNext) {
                        // Single day or end of event
                        style += ' border-radius: var(--radius-sm);';
                    } else if (isEventStart) {
                        // Start of event - round left corners
                        style += ' border-radius: var(--radius-sm) 0 0 var(--radius-sm);';
                    } else if (isEventEnd) {
                        // End of event - round right corners
                        style += ' border-radius: 0 var(--radius-sm) var(--radius-sm) 0;';
                    } else {
                        // Middle of event - no border radius
                        style += ' border-radius: 0;';
                    }
                } else {
                    // Single day event - full border radius
                    style += ' border-radius: var(--radius-sm);';
                }

                eventEl.style.cssText = style;
                // Only show text on the start day of multi-day events, or always for single-day events
                eventEl.textContent = isEventStart ? escapeHtml(evt.text) : '';

                eventsContainer.appendChild(eventEl);
            });

            dayCell.appendChild(eventsContainer);
            daysContainer.appendChild(dayCell);
        });

        monthContainer.appendChild(daysContainer);
        container.appendChild(monthContainer);
    });

    paragraphView.appendChild(container);

    // Attach event handlers
    attachParagraphEventHandlers(paragraphView);
}

/**
 * Show the paragraph view
 */
export function showParagraphView() {
    const paragraphView = getById('paragraphView');
    const yearView = getById('yearView');
    const monthView = getById('monthView');
    const timelineView = getById('timelineView');
    const monthSelect = getById('monthSelect');
    const timelineLinesSelect = getById('timelineLinesSelect');

    if (paragraphView) paragraphView.style.display = 'block';
    if (yearView) yearView.style.display = 'none';
    if (monthView) monthView.style.display = 'none';
    if (timelineView) timelineView.style.display = 'none';
    if (monthSelect) monthSelect.style.display = 'none';
    if (timelineLinesSelect) timelineLinesSelect.style.display = 'none';
    
    // Hide year string for paragraph view
    const yearStringContainer = getById('yearStringContainer');
    if (yearStringContainer) yearStringContainer.style.display = 'none';
}

/**
 * Attach event handlers for paragraph view
 * @param {HTMLElement} container - Container element
 */
function attachParagraphEventHandlers(container) {
    // Day handlers
    qsa('.paragraph-day', container).forEach(dayEl => {
        const dateKey = dayEl.dataset.date;

        dayEl.onmousedown = (e) => handleDayMouseDown(e, dateKey);
        dayEl.onmouseenter = (e) => handleDayMouseEnter(e, dateKey);
        dayEl.onclick = (e) => {
            if (!isDragging() && !justFinishedDrag()) {
                openModal(dateKey);
            }
        };
    });

    // Event handlers
    qsa('.paragraph-event', container).forEach(eventEl => {
        const eventIdx = parseInt(eventEl.dataset.eventIdx);
        const dayEl = eventEl.closest('.paragraph-day');
        const dateKey = dayEl?.dataset.date;

        eventEl.onmousedown = (e) => {
            e.stopPropagation();
            handleEventMouseDown(e, eventIdx);
        };
        eventEl.onclick = (e) => {
            if (!isDragging() && !justFinishedDrag()) {
                e.stopPropagation();
                openModal(dateKey);
            }
        };
    });
}

