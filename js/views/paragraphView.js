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
import { getPressureVisualStyle } from '../models/pressureModel.js';
import {
    handleDayMouseDown,
    handleDayMouseEnter,
    handleEventMouseDown,
    justFinishedDrag,
    isDragging
} from '../drag/dragManager.js';
import { openModal } from '../ui/modal.js';

function getParagraphDayWidth() {
    const width = window.innerWidth;
    if (width <= 480) return 30;
    if (width <= 768) return 35;
    if (width <= 900) return 40;
    if (width <= 1200) return 45;
    return 50;
}

function calculateTrackMetrics(dayEvents, eventSlotMap) {
    if (!dayEvents.length) {
        return { trackCount: 1, eventHeight: 100 };
    }

    const maxSlot = dayEvents.reduce((max, evt) => {
        const eventIdx = getEventIndex(evt);
        const slot = eventSlotMap.get(eventIdx) ?? 0;
        return Math.max(max, slot);
    }, 0);

    const trackCount = maxSlot + 1;
    return { trackCount, eventHeight: 100 / trackCount };
}

function assignStableEventSlots(events) {
    const slotsEndDate = [];
    const eventSlotMap = new Map();

    const sortedEvents = events
        .map((evt, idx) => ({ evt, idx }))
        .sort((a, b) => {
            if (a.evt.startDate !== b.evt.startDate) {
                return a.evt.startDate.localeCompare(b.evt.startDate);
            }
            return a.evt.endDate.localeCompare(b.evt.endDate);
        });

    sortedEvents.forEach(({ evt, idx }) => {
        let assignedSlot = -1;
        for (let slot = 0; slot < slotsEndDate.length; slot++) {
            // Slot can be reused if previous event ended before this one starts.
            if (slotsEndDate[slot] < evt.startDate) {
                assignedSlot = slot;
                break;
            }
        }

        if (assignedSlot === -1) {
            assignedSlot = slotsEndDate.length;
            slotsEndDate.push(evt.endDate);
        } else {
            slotsEndDate[assignedSlot] = evt.endDate;
        }

        eventSlotMap.set(idx, assignedSlot);
    });

    return eventSlotMap;
}

function renderParagraphTextOverlays(
    allDays,
    eventsByStartDate,
    eventSlotMap,
    eventsContainerByDate,
    dayWidth,
    borderWidth,
    columnsPerRow
) {
    const dayIndexByDate = new Map(allDays.map((day, idx) => [day.dateKey, idx]));

    eventsByStartDate.forEach((startingEvents, startDateKey) => {
        const startIndex = dayIndexByDate.get(startDateKey);
        if (startIndex === undefined) return;

        startingEvents.forEach((evt) => {
            const eventIdx = getEventIndex(evt);
            const slot = eventSlotMap.get(eventIdx) ?? 0;
            const startDate = stringToDate(evt.startDate);
            const endDate = stringToDate(evt.endDate);
            let remainingDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
            let segmentStartIndex = startIndex;

            while (remainingDays > 0 && segmentStartIndex < allDays.length) {
                const rowOffset = segmentStartIndex % columnsPerRow;
                const segmentDays = Math.max(1, Math.min(remainingDays, columnsPerRow - rowOffset));
                const segmentDay = allDays[segmentStartIndex];
                const container = eventsContainerByDate.get(segmentDay.dateKey);
                if (!container) break;

                const dayEvents = getEventsForDay(segmentDay.dateKey);
                const { eventHeight } = calculateTrackMetrics(dayEvents, eventSlotMap);
                const top = slot * eventHeight;
                const width = (segmentDays * dayWidth) - ((segmentDays - 1) * borderWidth);

                const textOverlay = createElement('div');
                textOverlay.className = 'paragraph-event-text-overlay';
                textOverlay.textContent = evt.text;
                textOverlay.dataset.eventIdx = eventIdx;
                textOverlay.title = escapeAttr(evt.text);
                textOverlay.style.cssText = `
                    position: absolute;
                    top: ${top}%;
                    left: 0;
                    width: ${width}px;
                    height: ${eventHeight}%;
                    display: flex;
                    align-items: center;
                    padding: 2px 4px;
                    pointer-events: none;
                    z-index: 10;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    box-sizing: border-box;
                    font-size: clamp(7px, 1vw, 9px);
                    font-weight: 500;
                    font-family: var(--font-family-mono);
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                `;
                container.appendChild(textOverlay);

                remainingDays -= segmentDays;
                segmentStartIndex += segmentDays;
            }
        });
    });
}

/**
 * Render the paragraph flow view
 */
export function renderParagraph() {
    const paragraphView = getById('paragraphView');
    if (!paragraphView) {
        console.error('paragraphView element not found!');
        return;
    }

    // Preserve the controls container when clearing
    const controlsContainer = paragraphView.querySelector('.paragraph-controls');
    clearChildren(paragraphView);
    
    // Restore controls if they existed
    if (controlsContainer) {
        paragraphView.appendChild(controlsContainer);
    } else {
        // Create controls if they don't exist
        const controls = createElement('div', { className: 'paragraph-controls' });
        const toggle = createElement('button', { 
            className: 'paragraph-toggle',
            id: 'paragraphGridlinesToggle',
            title: 'Toggle Gridlines'
        });
        toggle.innerHTML = '<span class="toggle-icon">⊞</span><span class="toggle-label">Gridlines</span>';
        controls.appendChild(toggle);
        paragraphView.appendChild(controls);
    }

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

    const events = store.get('events');
    const eventSlotMap = assignStableEventSlots(events);

    // Separate single-day and multi-day events
    const multiDayEvents = events.filter(evt => evt.startDate !== evt.endDate);
    const singleDayEvents = events.filter(evt => evt.startDate === evt.endDate);

    // Build a map of which events start on which day (for text overlay)
    const eventsByStartDate = new Map();
    multiDayEvents.forEach(evt => {
        const startDate = evt.startDate;
        if (!eventsByStartDate.has(startDate)) {
            eventsByStartDate.set(startDate, []);
        }
        eventsByStartDate.get(startDate).push(evt);
    });
    
    // Check if gridlines are hidden (used for width calculations)
    const gridlinesHidden = paragraphView && paragraphView.classList.contains('gridlines-hidden');
    const dayWidth = getParagraphDayWidth();
    const borderWidth = gridlinesHidden ? 0 : 0.5; // Border width when visible
    const paragraphStyle = window.getComputedStyle(paragraphView);
    const horizontalPadding =
        (parseFloat(paragraphStyle.paddingLeft) || 0) +
        (parseFloat(paragraphStyle.paddingRight) || 0);
    const contentWidth = Math.max(0, paragraphView.clientWidth - horizontalPadding);
    const columnsPerRow = Math.max(1, Math.floor(contentWidth / dayWidth));
    const eventsContainerByDate = new Map();

    // Render all days as direct children of paragraphView
    allDays.forEach((dayData, index) => {
        const now = new Date();
        const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const isToday = dayData.dateKey === todayKey;
        const isPast = dayData.dateKey < todayKey;
        const dayCell = createElement('div');
        dayCell.className = `paragraph-day${isPast ? ' past-day' : ''}${isToday ? ' today-day' : ''}`;
        dayCell.dataset.date = dayData.dateKey;
        
        // Mark first day of month for styling
        if (dayData.isFirstDayOfMonth) {
            dayCell.classList.add('month-start');
            dayCell.dataset.month = dayData.month;
            dayCell.dataset.monthName = dayData.monthName;
        }

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

        // Get ALL events for this day (including multi-day events that continue here)
        const allEventsForDay = getEventsForDay(dayData.dateKey);
        
        // Separate into single-day and multi-day events
        const daySingleDayEvents = allEventsForDay.filter(
            evt => evt.startDate === evt.endDate
        );
        
        const dayMultiDayEvents = allEventsForDay.filter(
            evt => evt.startDate !== evt.endDate
        );
        
        // For stacking calculation, we need ALL events that appear on this day
        const allDayEvents = allEventsForDay;
        const { eventHeight } = calculateTrackMetrics(allDayEvents, eventSlotMap);

        // Render multi-day events on EACH day they appear (for proper stacking)
        dayMultiDayEvents.forEach((evt) => {
            const eventIdx = getEventIndex(evt);
            const isMultiDay = true;
            const colorStyle = getEventColorStyle(evt.color, false, isMultiDay);

            // Check if this is the start/end of the event
            const isEventStart = evt.startDate === dayData.dateKey;
            const isEventEnd = evt.endDate === dayData.dateKey;

            const slot = eventSlotMap.get(eventIdx) ?? 0;
            const currentEventTop = slot * eventHeight;

            const eventEl = createElement('div');
            eventEl.className = 'paragraph-event paragraph-event-multi-day';
            eventEl.dataset.eventIdx = eventIdx;
            eventEl.title = escapeAttr(evt.text);
            
            // Don't add text content here - we'll add it as a separate overlay on start day
            
            // Apply styling - each piece fills its day cell
            let style = colorStyle;
            style += ` ${getPressureVisualStyle(evt)}`;
            style += ` height: ${eventHeight}%;`;
            style += ` top: ${currentEventTop}%;`;
            
            // Keep each segment inside its own day cell to avoid overlap seams.
            style += ` left: 0; right: 0;`;
            // Paragraph view should render event bars seam-free with no border artifacts.
            style += ` border: none; box-shadow: none;`;
            
            // Add border-radius based on position in the event (more rounded for visibility)
            if (isEventStart && isEventEnd) {
                // Single day (shouldn't happen for multi-day, but handle it)
                style += ` border-radius: 8px;`;
            } else if (isEventStart) {
                style += ` border-radius: 8px 0 0 8px;`; // Round left corners
            } else if (isEventEnd) {
                style += ` border-radius: 0 8px 8px 0;`; // Round right corners
            } else {
                style += ` border-radius: 0;`; // No rounding in middle
            }

            eventEl.style.cssText = style;
            eventsContainer.appendChild(eventEl);
        });
        
        // Render single-day events
        daySingleDayEvents.forEach((evt) => {
            const eventIdx = getEventIndex(evt);
            const colorStyle = getEventColorStyle(evt.color, false, false);

            const slot = eventSlotMap.get(eventIdx) ?? 0;
            const currentEventTop = slot * eventHeight;

            const eventEl = createElement('div');
            eventEl.className = 'paragraph-event';
            eventEl.dataset.eventIdx = eventIdx;
            eventEl.title = escapeAttr(evt.text);

            // Apply styling
            let style = colorStyle;
            style += ` ${getPressureVisualStyle(evt)}`;
            style += ` height: ${eventHeight}%;`;
            style += ` top: ${currentEventTop}%;`;
            style += ` left: 0; right: 0; border-radius: 2px; border: none; box-shadow: none;`;

            eventEl.style.cssText = style;
            eventEl.textContent = evt.text;

            eventsContainer.appendChild(eventEl);
        });

        eventsContainerByDate.set(dayData.dateKey, eventsContainer);
        dayCell.appendChild(eventsContainer);
        paragraphView.appendChild(dayCell);
    });

    renderParagraphTextOverlays(
        allDays,
        eventsByStartDate,
        eventSlotMap,
        eventsContainerByDate,
        dayWidth,
        borderWidth,
        columnsPerRow
    );

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

