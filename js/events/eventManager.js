/**
 * Event CRUD operations
 */

import { store } from '../store.js';
import { saveData } from '../storage/persistence.js';
import { getEventsForDate } from '../utils/date.js';

/**
 * Add a new event
 * @param {Object} eventData - Event data
 * @param {string} eventData.text - Event text
 * @param {string} eventData.color - Event color
 * @param {string} eventData.startDate - Start date (YYYY-MM-DD)
 * @param {string} eventData.endDate - End date (YYYY-MM-DD)
 */
export function addEvent(eventData) {
    const newEvent = {
        text: eventData.text || 'New Event',
        color: eventData.color || store.get('selectedColor'),
        startDate: eventData.startDate,
        endDate: eventData.endDate || eventData.startDate,
        controllability: eventData.controllability || 'high',
        anticipation: eventData.anticipation || false,
        recovery: eventData.recovery || 'neutral'
    };
    store.addEvent(newEvent);
    saveData();
}

/**
 * Update event text
 * @param {number} index - Event index
 * @param {string} text - New text
 */
export function updateEventText(index, text) {
    const events = store.get('events');
    if (events[index]) {
        store.updateEvent(index, { text });
        saveData();
    }
}

/**
 * Update event color
 * @param {number} index - Event index
 * @param {string} color - New color
 */
export function updateEventColor(index, color) {
    const events = store.get('events');
    if (events[index]) {
        store.updateEvent(index, { color });
        saveData();
    }
}

/**
 * Update event controllability
 * @param {number} index - Event index
 * @param {'high' | 'low'} controllability - New controllability value
 */
export function updateEventControllability(index, controllability) {
    const events = store.get('events');
    if (events[index]) {
        store.updateEvent(index, { controllability });
        saveData();
    }
}

/**
 * Update event anticipation flag
 * @param {number} index - Event index
 * @param {boolean} anticipation - New anticipation value
 */
export function updateEventAnticipation(index, anticipation) {
    const events = store.get('events');
    if (events[index]) {
        store.updateEvent(index, { anticipation: !!anticipation });
        saveData();
    }
}

/**
 * Update event recovery declaration
 * @param {number} index - Event index
 * @param {'restorative' | 'draining' | 'neutral'} recovery - New recovery value
 */
export function updateEventRecovery(index, recovery) {
    const events = store.get('events');
    if (events[index]) {
        store.updateEvent(index, { recovery });
        saveData();
    }
}

/**
 * Update event start date
 * @param {number} index - Event index
 * @param {string} startDate - New start date (YYYY-MM-DD)
 */
export function updateEventStartDate(index, startDate) {
    const events = store.get('events');
    if (events[index]) {
        const event = events[index];
        const updates = { startDate };

        // Ensure end date is not before start date
        if (new Date(event.endDate) < new Date(startDate)) {
            updates.endDate = startDate;
        }

        store.updateEvent(index, updates);
        saveData();
    }
}

/**
 * Update event end date
 * @param {number} index - Event index
 * @param {string} endDate - New end date (YYYY-MM-DD)
 */
export function updateEventEndDate(index, endDate) {
    const events = store.get('events');
    if (events[index]) {
        const event = events[index];

        // Ensure end date is not before start date
        if (new Date(endDate) < new Date(event.startDate)) {
            store.updateEvent(index, { endDate: event.startDate });
        } else {
            store.updateEvent(index, { endDate });
        }

        saveData();
    }
}

/**
 * Delete an event
 * @param {number} index - Event index
 */
export function deleteEvent(index) {
    store.deleteEvent(index);
    saveData();
}

/**
 * Get events for a specific date
 * @param {string} dateKey - Date in YYYY-MM-DD format
 * @returns {Array} Array of events
 */
export function getEventsForDay(dateKey) {
    return getEventsForDate(store.get('events'), dateKey);
}

/**
 * Get the index of an event in the store
 * @param {Object} event - Event object
 * @returns {number} Index or -1 if not found
 */
export function getEventIndex(event) {
    return store.get('events').indexOf(event);
}

/**
 * Create event from drag operation
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Object} Created event
 */
export function createEventFromDrag(startDate, endDate) {
    // Ensure start is before end
    const startDateObj = new Date(startDate + 'T00:00:00');
    const endDateObj = new Date(endDate + 'T00:00:00');

    const actualStart = startDateObj <= endDateObj ? startDate : endDate;
    const actualEnd = startDateObj <= endDateObj ? endDate : startDate;

    const newEvent = {
        text: 'New Event',
        color: store.get('selectedColor'),
        startDate: actualStart,
        endDate: actualEnd,
        controllability: 'high',
        anticipation: false,
        recovery: 'neutral'
    };

    store.addEvent(newEvent);
    saveData();
    return newEvent;
}

/**
 * Move an event to a new date
 * @param {Object} event - Event to move
 * @param {string} newStartDate - New start date (YYYY-MM-DD)
 */
export function moveEvent(event, newStartDate) {
    const oldStartDate = new Date(event.startDate + 'T00:00:00');
    const oldEndDate = new Date(event.endDate + 'T00:00:00');
    const newStart = new Date(newStartDate + 'T00:00:00');

    // Calculate duration
    const duration = Math.floor((oldEndDate - oldStartDate) / (1000 * 60 * 60 * 24));

    // Calculate new end date
    const newEndDate = new Date(newStart);
    newEndDate.setDate(newEndDate.getDate() + duration);

    // Format new end date
    const year = newEndDate.getFullYear();
    const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(newEndDate.getDate()).padStart(2, '0');
    const newEndDateStr = `${year}-${month}-${day}`;

    // Update event
    event.startDate = newStartDate;
    event.endDate = newEndDateStr;

    saveData();
}
