/**
 * Unified drag-and-drop manager for calendar and timeline views
 */

import { store } from '../store.js';
import { DRAG_TYPES } from '../constants.js';
import { dateToString } from '../utils/date.js';
import { qsa, addClass, removeClass } from '../utils/dom.js';
import { createEventFromDrag, moveEvent } from '../events/eventManager.js';

/**
 * Handle mousedown on a day cell
 * @param {MouseEvent} e - Mouse event
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 */
export function handleDayMouseDown(e, dateKey) {
    // Only start drag if clicking on empty day area (not on an event)
    if (!e.target.classList.contains('event') && 
        !e.target.classList.contains('timeline-event') && 
        !e.target.classList.contains('paragraph-event')) {
        e.preventDefault(); // Prevent text selection
        store.updateDrag({
            mouseDownX: e.clientX,
            mouseDownY: e.clientY,
            startDate: dateKey,
            endDate: dateKey
        });
    }
}

/**
 * Handle mouseenter on a day cell during drag
 * @param {MouseEvent} e - Mouse event
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 */
export function handleDayMouseEnter(e, dateKey) {
    const drag = store.get('drag');

    if (drag.isDragging) {
        if (drag.dragType === DRAG_TYPES.CREATE) {
            store.updateDrag({ endDate: dateKey });
            updateDragCreatePreview();
        } else if (drag.dragType === DRAG_TYPES.MOVE) {
            store.updateDrag({ endDate: dateKey });
            const dayEl = e.currentTarget;
            if (dayEl) {
                addClass(dayEl, 'drag-over');
            }
        }
    }
}

/**
 * Handle mousedown on an event
 * @param {MouseEvent} e - Mouse event
 * @param {number} eventIdx - Event index
 */
export function handleEventMouseDown(e, eventIdx) {
    e.preventDefault(); // Prevent text selection
    const events = store.get('events');

    store.updateDrag({
        mouseDownX: e.clientX,
        mouseDownY: e.clientY,
        draggedEvent: events[eventIdx],
        draggedEventIdx: eventIdx
    });
    e.stopPropagation();
}

/**
 * Update drag create preview visualization
 */
export function updateDragCreatePreview() {
    // Clear previous preview
    clearDragCreatePreview();

    const drag = store.get('drag');
    if (!drag.startDate || !drag.endDate) return;

    const startDate = new Date(drag.startDate + 'T00:00:00');
    const endDate = new Date(drag.endDate + 'T00:00:00');

    // Ensure start is before end
    const actualStart = startDate < endDate ? startDate : endDate;
    const actualEnd = startDate < endDate ? endDate : startDate;

    // Highlight all days in the range
    const currentDate = new Date(actualStart);
    while (currentDate <= actualEnd) {
        const dateKey = dateToString(currentDate);
        const dayEl = document.querySelector(`.day[data-date="${dateKey}"], .timeline-day[data-date="${dateKey}"], .paragraph-day[data-date="${dateKey}"]`);

        if (dayEl && !dayEl.classList.contains('empty')) {
            addClass(dayEl, 'drag-creating');

            // Add preview event
            const dayEvents = dayEl.querySelector('.day-events, .timeline-day-events, .paragraph-day-events');
            if (dayEvents && !dayEvents.querySelector('.drag-preview-event')) {
                const preview = document.createElement('div');
                preview.className = 'drag-preview-event';
                preview.textContent = 'New Event';
                dayEvents.insertBefore(preview, dayEvents.firstChild);
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

/**
 * Clear drag create preview
 */
function clearDragCreatePreview() {
    qsa('.day.drag-creating, .timeline-day.drag-creating, .paragraph-day.drag-creating').forEach(day => {
        removeClass(day, 'drag-creating');
        const preview = day.querySelector('.drag-preview-event');
        if (preview) preview.remove();
    });
}

/**
 * Clear all drag visual states
 */
export function clearDragVisuals() {
    qsa('.day.drag-over, .timeline-day.drag-over, .paragraph-day.drag-over').forEach(el => removeClass(el, 'drag-over'));
    clearDragCreatePreview();
    qsa('.event.dragging, .timeline-event.dragging, .paragraph-event.dragging').forEach(el => removeClass(el, 'dragging'));
}

/**
 * Finish drag operation
 * @param {Function} onComplete - Callback when drag is complete (for view refresh)
 */
export function finishDrag(onComplete) {
    const drag = store.get('drag');

    if (!drag.isDragging) {
        // Clean up any leftover drag classes even if not dragging
        clearDragVisuals();
        return false;
    }

    let eventCreated = false;

    if (drag.dragType === DRAG_TYPES.CREATE && drag.startDate && drag.endDate) {
        // Create new event
        createEventFromDrag(drag.startDate, drag.endDate);
        eventCreated = true;
    } else if (drag.dragType === DRAG_TYPES.MOVE && drag.draggedEvent && drag.endDate) {
        // Move existing event
        moveEvent(drag.draggedEvent, drag.endDate);
        eventCreated = true;
    }

    // Reset drag state
    store.updateDrag({
        isDragging: false,
        dragType: null,
        startDate: null,
        endDate: null,
        draggedEvent: null,
        draggedEventIdx: null,
        justFinishedDrag: true
    });

    // Clear visuals
    clearDragVisuals();

    // Reset flag after a short delay to allow click events
    setTimeout(() => {
        store.updateDrag({ justFinishedDrag: false });
    }, 100);

    if (eventCreated && onComplete) {
        onComplete();
    }

    return eventCreated;
}

/**
 * Handle global mouse move for drag operations
 * @param {MouseEvent} e - Mouse event
 */
export function handleGlobalMouseMove(e) {
    const drag = store.get('drag');

    // Check if we should start dragging (mouse moved beyond threshold)
    if (!drag.isDragging && (drag.draggedEvent || drag.startDate)) {
        const dx = Math.abs(e.clientX - drag.mouseDownX);
        const dy = Math.abs(e.clientY - drag.mouseDownY);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > drag.dragThreshold) {
            // Start dragging
            if (drag.draggedEvent) {
                store.updateDrag({
                    isDragging: true,
                    dragType: DRAG_TYPES.MOVE
                });

                const eventEl = document.querySelector(`[data-event-idx="${drag.draggedEventIdx}"]`);
                if (eventEl) {
                    addClass(eventEl, 'dragging');
                }
            } else if (drag.startDate) {
                store.updateDrag({
                    isDragging: true,
                    dragType: DRAG_TYPES.CREATE
                });
                updateDragCreatePreview();
            }
        }
    }

    // Handle drag updates
    const currentDrag = store.get('drag');
    if (currentDrag.isDragging) {
        const dayEl = e.target.closest('.day, .timeline-day');

        if (currentDrag.dragType === DRAG_TYPES.CREATE) {
            if (dayEl && dayEl.dataset.date) {
                store.updateDrag({ endDate: dayEl.dataset.date });
                updateDragCreatePreview();
            }
        } else if (currentDrag.dragType === DRAG_TYPES.MOVE) {
            if (dayEl) {
                qsa('.day.drag-over, .timeline-day.drag-over').forEach(el => {
                    if (el !== dayEl) removeClass(el, 'drag-over');
                });
                addClass(dayEl, 'drag-over');
                store.updateDrag({ endDate: dayEl.dataset.date });
            }
        }
    }
}

/**
 * Handle global mouse up for drag operations
 * @param {MouseEvent} e - Mouse event
 * @param {Function} onComplete - Callback for view refresh
 */
export function handleGlobalMouseUp(e, onComplete) {
    const drag = store.get('drag');

    if (drag.isDragging) {
        // Find which day we're over
        const dayEl = e.target.closest('.day, .timeline-day');
        if (dayEl && dayEl.dataset.date) {
            store.updateDrag({ endDate: dayEl.dataset.date });
        }
        finishDrag(onComplete);
    } else {
        // Reset drag state if we didn't drag (just clicked)
        if (drag.startDate || drag.draggedEvent) {
            store.updateDrag({
                startDate: null,
                endDate: null,
                draggedEvent: null,
                draggedEventIdx: null
            });
        }
    }
}

/**
 * Check if a drag just finished (to prevent click events)
 * @returns {boolean}
 */
export function justFinishedDrag() {
    return store.get('drag').justFinishedDrag;
}

/**
 * Check if currently dragging
 * @returns {boolean}
 */
export function isDragging() {
    return store.get('drag').isDragging;
}
