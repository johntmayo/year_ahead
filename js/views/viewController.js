/**
 * View Controller - orchestrates view switching and event handling
 */

import { store } from '../store.js';
import { VIEWS } from '../constants.js';
import { getById, qsa, qs } from '../utils/dom.js';
import { saveData, loadData } from '../storage/persistence.js';
import { openModal } from '../ui/modal.js';
import {
    handleDayMouseDown,
    handleDayMouseEnter,
    handleEventMouseDown,
    handleGlobalMouseMove,
    handleGlobalMouseUp,
    justFinishedDrag,
    isDragging
} from '../drag/dragManager.js';

import { renderYear, showYearView } from './yearView.js';
import { renderMonth, showMonthView } from './monthView.js';
import { renderTimeline, showTimelineView } from './timelineView.js';
import { renderYearString } from '../ui/yearString.js';

/**
 * Set the current view
 * @param {string} view - View name ('year', 'month', 'timeline')
 * @param {HTMLElement} buttonElement - Clicked button element (optional)
 */
export function setView(view, buttonElement) {
    store.set('currentView', view);

    // Update toggle slider position
    const toggle = getById('viewToggle');
    const slider = getById('viewToggleSlider');
    const options = toggle?.querySelectorAll('.view-toggle-option');

    if (!toggle || !slider || !options) return;

    // Remove active class from all options
    options.forEach(opt => opt.classList.remove('active'));

    // Find the clicked option and add active class
    const activeOption = buttonElement || toggle.querySelector(`[data-view="${view}"]`);
    if (activeOption) {
        activeOption.classList.add('active');

        // Calculate slider position
        const optionWidth = activeOption.offsetWidth;
        const optionLeft = activeOption.offsetLeft;
        slider.style.width = optionWidth + 'px';
        slider.style.left = optionLeft + 'px';
        slider.style.transform = 'translateX(0)';
    }

    // Show appropriate view
    switch (view) {
        case VIEWS.YEAR:
            showYearView();
            renderYear();
            break;
        case VIEWS.MONTH:
            showMonthView();
            break;
        case VIEWS.TIMELINE:
            showTimelineView();
            break;
    }
}

/**
 * Refresh the current view
 */
export function refreshView() {
    const currentView = store.get('currentView');

    switch (currentView) {
        case VIEWS.YEAR:
            renderYear();
            renderYearString();
            break;
        case VIEWS.MONTH:
            renderMonth(store.get('currentMonth'));
            break;
        case VIEWS.TIMELINE:
            renderTimeline();
            break;
    }
}

// Callback for category key re-render (set by main.js to avoid circular deps)
let onYearChangeCallback = null;

/**
 * Set callback for year change
 * @param {Function} callback - Callback function
 */
export function setYearChangeCallback(callback) {
    onYearChangeCallback = callback;
}

/**
 * Change the current year
 */
export function changeYear() {
    // Save current year's data before switching
    saveData();

    // Switch to new year
    const yearSelect = getById('yearSelect');
    if (yearSelect) {
        store.set('currentYear', parseInt(yearSelect.value));
    }

    // Update year display
    updateYearDisplay();

    // Load new year's data
    loadData();

    // Refresh view
    refreshView();

    // Re-render category key via callback
    if (onYearChangeCallback) {
        onYearChangeCallback();
    }
}

/**
 * Update year display in header
 */
export function updateYearDisplay() {
    const currentYear = store.get('currentYear');
    const yearDisplay = getById('currentYearDisplay');
    const notepadHeader = getById('notepadHeader');

    if (yearDisplay) yearDisplay.textContent = currentYear;
    if (notepadHeader) notepadHeader.textContent = `Notes ${currentYear}`;
}

/**
 * Attach drag/click event handlers to day elements
 * @param {HTMLElement} container - Container element
 */
export function attachDayEventHandlers(container) {
    // Day handlers
    qsa('.day:not(.empty), .timeline-day', container).forEach(dayEl => {
        const dateKey = dayEl.dataset.date;

        dayEl.onmousedown = (e) => handleDayMouseDown(e, dateKey);
        dayEl.onmouseenter = (e) => handleDayMouseEnter(e, dateKey);
        dayEl.onclick = (e) => handleDayClick(e, dateKey);
    });

    // Event handlers
    qsa('.event, .timeline-event', container).forEach(eventEl => {
        const eventIdx = parseInt(eventEl.dataset.eventIdx);
        const dayEl = eventEl.closest('.day, .timeline-day');
        const dateKey = dayEl?.dataset.date;

        eventEl.onmousedown = (e) => handleEventMouseDown(e, eventIdx);
        eventEl.onclick = (e) => handleEventClick(e, eventIdx, dateKey);
    });
}

/**
 * Attach event handlers to event elements (for dynamic content)
 * @param {HTMLElement} container - Container element
 */
export function attachEventHandlers(container) {
    qsa('.event, .timeline-event', container).forEach(eventEl => {
        const eventIdx = parseInt(eventEl.dataset.eventIdx);
        const dayEl = eventEl.closest('.day, .timeline-day');
        const dateKey = dayEl?.dataset.date;

        eventEl.onmousedown = (e) => handleEventMouseDown(e, eventIdx);
        eventEl.onclick = (e) => handleEventClick(e, eventIdx, dateKey);
    });
}

/**
 * Handle click on a day
 * @param {MouseEvent} e - Mouse event
 * @param {string} dateKey - Date key
 */
function handleDayClick(e, dateKey) {
    // Only open modal if we didn't just finish a drag
    if (!isDragging() && !justFinishedDrag()) {
        openModal(dateKey);
    }
}

/**
 * Handle click on an event
 * @param {MouseEvent} e - Mouse event
 * @param {number} eventIdx - Event index
 * @param {string} dateKey - Date key
 */
function handleEventClick(e, eventIdx, dateKey) {
    // Open modal for the day containing this event
    // Only if we didn't actually drag
    if (!isDragging() && !justFinishedDrag()) {
        e.stopPropagation();
        openModal(dateKey);
    }
}

/**
 * Initialize global event listeners for drag operations
 */
export function initGlobalDragListeners() {
    document.addEventListener('mouseup', (e) => {
        handleGlobalMouseUp(e, refreshView);
    });

    document.addEventListener('mousemove', (e) => {
        handleGlobalMouseMove(e);
    });
}

/**
 * Initialize view toggle slider position
 */
export function initViewToggleSlider() {
    setTimeout(() => {
        const toggle = getById('viewToggle');
        const slider = getById('viewToggleSlider');
        const activeOption = toggle?.querySelector('.view-toggle-option.active');

        if (activeOption && slider) {
            const optionWidth = activeOption.offsetWidth;
            const optionLeft = activeOption.offsetLeft;
            slider.style.width = optionWidth + 'px';
            slider.style.left = optionLeft + 'px';
            slider.style.transform = 'translateX(0)';
        }
    }, 0);

    // Update slider position on window resize
    window.addEventListener('resize', () => {
        const toggle = getById('viewToggle');
        const slider = getById('viewToggleSlider');
        const activeOption = toggle?.querySelector('.view-toggle-option.active');

        if (activeOption && slider) {
            const optionWidth = activeOption.offsetWidth;
            const optionLeft = activeOption.offsetLeft;
            slider.style.width = optionWidth + 'px';
            slider.style.left = optionLeft + 'px';
            slider.style.transform = 'translateX(0)';
        }
    });
}
