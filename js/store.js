/**
 * Centralized state management with publish-subscribe pattern
 */

import { DEFAULT_COLORS, VIEWS, DRAG_THRESHOLD } from './constants.js';

// Initial state
const initialState = {
    colors: [...DEFAULT_COLORS],
    selectedColor: DEFAULT_COLORS[0],
    currentView: VIEWS.YEAR,
    currentMonth: 0,
    currentYear: 2026,
    selectedDate: null,
    events: [],
    categories: {},
    valuesDeclaration: '',
    timelineLines: 1,
    notes: '',
    drag: {
        isDragging: false,
        dragType: null,
        startDate: null,
        endDate: null,
        draggedEvent: null,
        draggedEventIdx: null,
        justFinishedDrag: false,
        mouseDownX: 0,
        mouseDownY: 0,
        dragThreshold: DRAG_THRESHOLD
    }
};

// Create the store
class Store {
    constructor() {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.listeners = new Map();

        // Initialize categories for default colors
        this.state.colors.forEach(color => {
            this.state.categories[color] = '';
        });
    }

    /**
     * Get current state or a specific property
     * @param {string} key - Optional key to get specific property
     * @returns {any}
     */
    get(key) {
        if (key) {
            return this.state[key];
        }
        return this.state;
    }

    /**
     * Set state property
     * @param {string} key - Property key
     * @param {any} value - New value
     */
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }

    /**
     * Update multiple state properties at once
     * @param {Object} updates - Object with key-value pairs to update
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            const oldValue = this.state[key];
            this.state[key] = value;
            this.notify(key, value, oldValue);
        });
    }

    /**
     * Update drag state
     * @param {Object} updates - Drag state updates
     */
    updateDrag(updates) {
        const oldDrag = { ...this.state.drag };
        this.state.drag = { ...this.state.drag, ...updates };
        this.notify('drag', this.state.drag, oldDrag);
    }

    /**
     * Reset drag state
     */
    resetDrag() {
        this.state.drag = {
            isDragging: false,
            dragType: null,
            startDate: null,
            endDate: null,
            draggedEvent: null,
            draggedEventIdx: null,
            justFinishedDrag: false,
            mouseDownX: 0,
            mouseDownY: 0,
            dragThreshold: DRAG_THRESHOLD
        };
        this.notify('drag', this.state.drag);
    }

    /**
     * Subscribe to state changes
     * @param {string} key - Property key to watch
     * @param {Function} callback - Callback function(newValue, oldValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * Notify listeners of state change
     * @param {string} key - Changed property key
     * @param {any} newValue - New value
     * @param {any} oldValue - Old value
     */
    notify(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                callback(newValue, oldValue);
            });
        }
    }

    /**
     * Add an event to the events array
     * @param {Object} event - Event object
     */
    addEvent(event) {
        this.state.events.push(event);
        this.notify('events', this.state.events);
    }

    /**
     * Update an event
     * @param {number} index - Event index
     * @param {Object} updates - Properties to update
     */
    updateEvent(index, updates) {
        if (this.state.events[index]) {
            Object.assign(this.state.events[index], updates);
            this.notify('events', this.state.events);
        }
    }

    /**
     * Delete an event
     * @param {number} index - Event index
     */
    deleteEvent(index) {
        this.state.events.splice(index, 1);
        this.notify('events', this.state.events);
    }

    /**
     * Set events array (for loading data)
     * @param {Array} events - Events array
     */
    setEvents(events) {
        this.state.events = events;
        this.notify('events', this.state.events);
    }

    /**
     * Update a category
     * @param {string} color - Color key
     * @param {string} name - Category name
     */
    updateCategory(color, name) {
        this.state.categories[color] = name;
        this.notify('categories', this.state.categories);
    }

    /**
     * Update color and migrate category
     * @param {number} index - Color index
     * @param {string} newColor - New color value
     */
    updateColor(index, newColor) {
        const oldColor = this.state.colors[index];
        this.state.colors[index] = newColor;

        // Migrate category
        if (this.state.categories[oldColor] !== undefined) {
            this.state.categories[newColor] = this.state.categories[oldColor];
            delete this.state.categories[oldColor];
        } else {
            this.state.categories[newColor] = '';
        }

        // Update events using the old color
        this.state.events.forEach(evt => {
            if (evt.color === oldColor) {
                evt.color = newColor;
            }
        });

        // Update selected color if needed
        if (this.state.selectedColor === oldColor) {
            this.state.selectedColor = newColor;
        }

        this.notify('colors', this.state.colors);
        this.notify('categories', this.state.categories);
        this.notify('events', this.state.events);
    }
}

// Export singleton instance
export const store = new Store();
