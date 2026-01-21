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

    // Track current month for transition markers
    let currentMonth = -1;
    let allDays = [];

    // Generate all days of the year as a flat array
    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);
        const daysInMonth = monthEnd.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, month, day);
            const dateKey = dateToString(date);
            const dayOfWeek = date.getDay();
            // Map to single letter: M, T, W, H, F, S, U
            const dayLetterMap = { 0: 'U', 1: 'M', 2: 'T', 3: 'W', 4: 'H', 5: 'F', 6: 'S' };
            const dayName = dayLetterMap[dayOfWeek];
            const isFirstDayOfMonth = day === 1;

            allDays.push({
                dateKey,
                day,
                dayName,
                date,
                month,
                monthName: MONTH_NAMES[month],
                isFirstDayOfMonth,
                dayOfWeek
            });
        }
    }

    // First pass: Build event slot assignment map
    // We need to assign each event a consistent vertical slot across all days
    // Slots are assigned based on when events first appear (start date)
    const events = store.get('events');
    const eventSlotMap = new Map(); // Maps event index to slot number
    const eventStartDates = new Map(); // Maps event index to start date for sorting
    
    // Collect all events and their start dates
    events.forEach((evt) => {
        const eventIdx = getEventIndex(evt);
        eventStartDates.set(eventIdx, evt.startDate);
    });
    
    // Sort events by start date, then assign slots (earliest events get lower slots)
    const sortedEvents = Array.from(eventStartDates.entries())
        .sort((a, b) => a[1].localeCompare(b[1]));
    
    sortedEvents.forEach(([eventIdx, startDate], slot) => {
        eventSlotMap.set(eventIdx, slot);
    });

    // Render all days as direct children of paragraphView
    allDays.forEach((dayData, index) => {
        const dayCell = createElement('div');
        dayCell.className = 'paragraph-day';
        dayCell.dataset.date = dayData.dateKey;
        
        // Mark first day of month for styling
        if (dayData.isFirstDayOfMonth) {
            dayCell.classList.add('month-start');
            dayCell.dataset.month = dayData.month;
            dayCell.dataset.monthName = dayData.monthName;
        }

        // Month watermark - hidden for now (not legible when repeated)
        // Keeping the structure but hiding it with CSS

        // Day label (top-left)
        const dayLabel = createElement('div');
        dayLabel.className = 'paragraph-day-label';
        // Show month abbreviation for first day of month
        if (dayData.isFirstDayOfMonth) {
            dayLabel.textContent = `${dayData.monthName.substring(0, 3)} ${dayData.day}`;
            dayLabel.classList.add('month-label');
        } else {
            dayLabel.textContent = `${dayData.day} ${dayData.dayName}`;
        }
        dayCell.appendChild(dayLabel);

        // Events container
        const eventsContainer = createElement('div');
        eventsContainer.className = 'paragraph-day-events';

        // Get events for this day
        const dayEvents = getEventsForDay(dayData.dateKey);
        const eventCount = dayEvents.length;

        // Sort events by their slot assignment to ensure consistent ordering
        const sortedDayEvents = [...dayEvents].sort((a, b) => {
            const slotA = eventSlotMap.get(getEventIndex(a));
            const slotB = eventSlotMap.get(getEventIndex(b));
            return slotA - slotB;
        });

        // Render events as stacked vertical slices
        sortedDayEvents.forEach((evt, localIndex) => {
            const eventIdx = getEventIndex(evt);
            const isMultiDayEvent = evt.startDate !== evt.endDate;
            const colorStyle = getEventColorStyle(evt.color, false, isMultiDayEvent);

            // Check if this is the start/end of a multi-day event
            const isEventStart = evt.startDate === dayData.dateKey;
            const isEventEnd = evt.endDate === dayData.dateKey;
            const isMultiDay = evt.startDate !== evt.endDate;

            // Get the slot for this event (global slot assignment)
            const globalSlot = eventSlotMap.get(eventIdx);
            
            // Calculate height based on number of events present on THIS day
            const eventHeight = eventCount > 0 ? (100 / eventCount) : 100;
            
            // Calculate position: find where this event's slot falls among the events present today
            // We need to map the global slot to a local position
            const localSlot = sortedDayEvents.findIndex(e => getEventIndex(e) === eventIdx);
            const eventTop = localSlot * eventHeight;

            const eventEl = createElement('div');
            eventEl.className = 'paragraph-event';
            eventEl.dataset.eventIdx = eventIdx;
            eventEl.title = escapeAttr(evt.text);

            // Check if event continues to next/previous day for continuous styling
            const nextDay = new Date(dayData.date);
            nextDay.setDate(nextDay.getDate() + 1);
            const nextDateKey = dateToString(nextDay);
            const continuesNext = isDateInRange(nextDateKey, evt.startDate, evt.endDate);

            const prevDay = new Date(dayData.date);
            prevDay.setDate(prevDay.getDate() - 1);
            const prevDateKey = dateToString(prevDay);
            const continuesFromPrev = isDateInRange(prevDateKey, evt.startDate, evt.endDate);

            // Apply styling
            let style = colorStyle;
            style += ` height: ${eventHeight}%;`;
            style += ` top: ${eventTop}%;`;
            
            // For multi-day events, make them continuous across cells
            if (isMultiDay) {
                // Extend event beyond cell boundaries for seamless connection
                if (continuesFromPrev && continuesNext) {
                    // Middle of event - extend left and right
                    style += ' left: -1px; right: -1px; border-radius: 0;';
                } else if (continuesFromPrev) {
                    // End of event - extend left, round right corners
                    style += ' left: -1px; right: 0; border-radius: 0 2px 2px 0;';
                } else if (continuesNext) {
                    // Start of event - extend right, round left corners
                    style += ' left: 0; right: -1px; border-radius: 2px 0 0 2px;';
                } else {
                    // Single day (shouldn't happen for multi-day, but handle it)
                    style += ' left: 0; right: 0; border-radius: 2px;';
                }
            } else {
                // Single day event - small border radius, contained within cell
                style += ' left: 0; right: 0; border-radius: 2px;';
            }

            eventEl.style.cssText = style;
            // Only show text on the start day of multi-day events, or always for single-day events
            // textContent automatically escapes HTML safely, so we don't need escapeHtml here
            eventEl.textContent = isEventStart ? evt.text : '';

            eventsContainer.appendChild(eventEl);
        });

        dayCell.appendChild(eventsContainer);
        paragraphView.appendChild(dayCell);
    });

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

    if (paragraphView) {
        paragraphView.style.display = 'flex';
        paragraphView.style.flexDirection = 'row';
        paragraphView.style.flexWrap = 'wrap';
        setupGridlinesToggle();
    }
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

/**
 * Setup the gridlines toggle functionality
 */
function setupGridlinesToggle() {
    const toggle = getById('paragraphGridlinesToggle');
    if (!toggle) return;

    const paragraphView = getById('paragraphView');
    if (!paragraphView) return;

    // Check localStorage for saved preference
    const gridlinesVisible = localStorage.getItem('paragraphGridlines') !== 'false';
    updateGridlinesVisibility(gridlinesVisible);
    updateToggleButton(toggle, gridlinesVisible);

    toggle.onclick = () => {
        const isVisible = !paragraphView.classList.contains('gridlines-hidden');
        const newState = !isVisible;
        updateGridlinesVisibility(newState);
        updateToggleButton(toggle, newState);
        localStorage.setItem('paragraphGridlines', newState.toString());
    };
}

/**
 * Update gridlines visibility
 */
function updateGridlinesVisibility(visible) {
    const paragraphView = getById('paragraphView');
    if (!paragraphView) return;

    if (visible) {
        paragraphView.classList.remove('gridlines-hidden');
    } else {
        paragraphView.classList.add('gridlines-hidden');
    }
}

/**
 * Update toggle button appearance
 */
function updateToggleButton(button, isVisible) {
    if (isVisible) {
        button.classList.add('active');
        button.title = 'Hide Gridlines';
    } else {
        button.classList.remove('active');
        button.title = 'Show Gridlines';
    }
}

