/**
 * Modal component for event editing
 */

import { store } from '../store.js';
import { getById, addClass, removeClass, setHTML } from '../utils/dom.js';
import { escapeHtml, escapeAttr } from '../utils/sanitize.js';
import { formatDateForDisplay } from '../utils/date.js';
import { saveData } from '../storage/persistence.js';
import { refreshView } from '../views/viewController.js';
import {
    addEvent,
    updateEventText,
    updateEventColor,
    updateEventStartDate,
    updateEventEndDate,
    updateEventControllability,
    updateEventAnticipation,
    updateEventRecovery,
    deleteEvent,
    getEventsForDay
} from '../events/eventManager.js';
import {
    estimateEventPressure,
    predictPressureChange,
    formatPrediction
} from '../models/pressureModel.js';

/**
 * Open the modal for a specific date
 * @param {string} dateKey - Date key (YYYY-MM-DD)
 */
export function openModal(dateKey) {
    store.set('selectedDate', dateKey);

    const modal = getById('modal');
    const modalHeader = getById('modalHeader');

    if (!modal || !modalHeader) return;

    modalHeader.textContent = formatDateForDisplay(dateKey);
    renderEventList();
    addClass(modal, 'active');
}

/**
 * Close the modal
 */
export function closeModal() {
    saveData();
    const modal = getById('modal');
    if (modal) {
        removeClass(modal, 'active');
    }
}

/**
 * Handle click on modal backdrop
 * @param {MouseEvent} e - Mouse event
 */
export function handleModalClick(e) {
    if (e.target.id === 'modal') {
        closeModal();
    }
}

/**
 * Render the event list in the modal
 */
export function renderEventList() {
    const eventList = getById('eventList');
    const selectedDate = store.get('selectedDate');

    if (!eventList || !selectedDate) return;

    const dayEvents = getEventsForDay(selectedDate);
    const colors = store.get('colors');
    const events = store.get('events');

    let html = '';
    dayEvents.forEach((evt) => {
        const eventIdx = events.indexOf(evt);
        const pressureEstimate = estimateEventPressure(evt);
        const prediction = predictPressureChange(
            evt,
            evt.controllability || 'high',
            !!evt.anticipation
        );
        html += `<div class="event-item">`;
        html += `<div class="event-item-row">`;
        html += `<input type="text" value="${escapeAttr(evt.text)}" placeholder="Event name" data-event-idx="${eventIdx}" data-field="text">`;
        html += `<button data-event-idx="${eventIdx}" data-action="delete">Delete</button>`;
        html += `</div>`;
        html += `<div class="event-item-row">`;
        html += `<div class="color-picker-mini">`;
        colors.forEach(color => {
            const selected = evt.color === color ? 'selected' : '';
            html += `<div class="color-btn-mini ${selected}" style="background: ${escapeAttr(color)};" data-color="${escapeAttr(color)}" data-event-idx="${eventIdx}" data-action="color"></div>`;
        });
        html += `</div>`;
        html += `</div>`;
        html += `<div class="event-date-range">`;
        html += `<label>Start: <input type="date" value="${escapeAttr(evt.startDate)}" data-event-idx="${eventIdx}" data-field="startDate"></label>`;
        html += `<label>End: <input type="date" value="${escapeAttr(evt.endDate)}" data-event-idx="${eventIdx}" data-field="endDate"></label>`;
        html += `</div>`;
        html += `<div class="event-load-controls">`;
        html += `<label>Controllability
            <select data-event-idx="${eventIdx}" data-field="controllability">
                <option value="high" ${(evt.controllability || 'high') === 'high' ? 'selected' : ''}>High control</option>
                <option value="low" ${(evt.controllability || 'high') === 'low' ? 'selected' : ''}>Low control</option>
            </select>
        </label>`;
        html += `<label class="event-checkbox-label">
            <input type="checkbox" ${(evt.anticipation ? 'checked' : '')} data-event-idx="${eventIdx}" data-field="anticipation">
            Weighs on me beforehand
        </label>`;
        html += `<label>Recovery declaration
            <select data-event-idx="${eventIdx}" data-field="recovery">
                <option value="neutral" ${(evt.recovery || 'neutral') === 'neutral' ? 'selected' : ''}>Neutral / depends</option>
                <option value="restorative" ${(evt.recovery || 'neutral') === 'restorative' ? 'selected' : ''}>Restorative for me</option>
                <option value="draining" ${(evt.recovery || 'neutral') === 'draining' ? 'selected' : ''}>Draining for me</option>
            </select>
        </label>`;
        html += `</div>`;
        html += `<div class="pressure-prediction" data-event-idx="${eventIdx}" data-role="pressurePrediction">
            <span class="prediction-title">Predicted effect:</span> ${escapeHtml(formatPrediction(prediction))}
        </div>`;
        html += `<button class="trust-toggle-btn" type="button" data-action="toggle-trust" data-event-idx="${eventIdx}" aria-expanded="false">
            How pressure is estimated
        </button>`;
        html += `<div class="trust-panel" data-event-idx="${eventIdx}" data-role="trustPanel" hidden>
            <p><strong>Weighting:</strong> duration ${Math.round(pressureEstimate.weights.duration * 100)}%, controllability ${Math.round(pressureEstimate.weights.controllability * 100)}%, anticipation ${Math.round(pressureEstimate.weights.anticipation * 100)}%.</p>
            <p><strong>This event now:</strong> duration ${(pressureEstimate.components.duration * 100).toFixed(0)}%, controllability ${(pressureEstimate.components.controllability * 100).toFixed(0)}%, anticipation ${(pressureEstimate.components.anticipation * 100).toFixed(0)}%.</p>
            <p class="trust-panel-note">Structural estimate only. It does not infer causes. Your judgment is primary.</p>
            <p class="trust-panel-note">Open space doesn't automatically mean recovery.</p>
        </div>`;
        html += `</div>`;
    });

    setHTML(eventList, html);

    // Attach event handlers
    attachModalEventHandlers();
}

/**
 * Attach event handlers to modal elements
 */
function attachModalEventHandlers() {
    const eventList = getById('eventList');
    if (!eventList) return;

    // Text input changes
    eventList.querySelectorAll('input[data-field="text"]').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventText(idx, e.target.value);
            refreshView();
        };
    });

    // Start date changes
    eventList.querySelectorAll('input[data-field="startDate"]').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventStartDate(idx, e.target.value);
            renderEventList();
            refreshView();
        };
    });

    // End date changes
    eventList.querySelectorAll('input[data-field="endDate"]').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventEndDate(idx, e.target.value);
            renderEventList();
            refreshView();
        };
    });

    // Delete buttons
    eventList.querySelectorAll('button[data-action="delete"]').forEach(button => {
        button.onclick = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            deleteEvent(idx);
            renderEventList();
            refreshView();
        };
    });

    // Color buttons
    eventList.querySelectorAll('[data-action="color"]').forEach(colorBtn => {
        colorBtn.onclick = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            const color = e.target.dataset.color;
            updateEventColor(idx, color);
            renderEventList();
            refreshView();
        };
    });

    // Controllability changes
    eventList.querySelectorAll('select[data-field="controllability"]').forEach(select => {
        select.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventControllability(idx, e.target.value);
            renderEventList();
            refreshView();
        };
    });

    // Anticipation changes
    eventList.querySelectorAll('input[data-field="anticipation"]').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventAnticipation(idx, !!e.target.checked);
            renderEventList();
            refreshView();
        };
    });

    // Recovery declaration changes
    eventList.querySelectorAll('select[data-field="recovery"]').forEach(select => {
        select.onchange = (e) => {
            const idx = parseInt(e.target.dataset.eventIdx);
            updateEventRecovery(idx, e.target.value);
            renderEventList();
            refreshView();
        };
    });

    // Trust panel progressive disclosure
    eventList.querySelectorAll('[data-action="toggle-trust"]').forEach(button => {
        button.onclick = (e) => {
            const idx = e.target.dataset.eventIdx;
            const panel = eventList.querySelector(`[data-role="trustPanel"][data-event-idx="${idx}"]`);
            if (!panel) return;
            const isHidden = panel.hasAttribute('hidden');
            if (isHidden) {
                panel.removeAttribute('hidden');
                e.target.setAttribute('aria-expanded', 'true');
            } else {
                panel.setAttribute('hidden', '');
                e.target.setAttribute('aria-expanded', 'false');
            }
        };
    });
}

/**
 * Add a new event from modal
 */
export function addEventFromModal() {
    const selectedDate = store.get('selectedDate');
    if (!selectedDate) return;

    addEvent({
        text: 'New Event',
        color: store.get('selectedColor'),
        startDate: selectedDate,
        endDate: selectedDate
    });

    renderEventList();
    refreshView();
}

/**
 * Initialize modal event listeners
 */
export function initModalListeners() {
    const modal = getById('modal');
    const addEventBtn = document.querySelector('.add-event-btn');
    const closeBtn = document.querySelector('.close-btn');

    if (modal) {
        modal.onclick = handleModalClick;
    }

    if (addEventBtn) {
        addEventBtn.onclick = addEventFromModal;
    }

    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = getById('modal');
            if (modal && modal.classList.contains('active')) {
                closeModal();
            }
        }
    });

    // Prevent modal content clicks from closing modal
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.onclick = (e) => e.stopPropagation();
    }
}
