/**
 * Temporal orientation panel: today position and countdown target.
 */

import { store } from '../store.js';
import { getById, setHTML } from '../utils/dom.js';
import { escapeHtml, escapeAttr } from '../utils/sanitize.js';
import { saveData } from '../storage/persistence.js';

function getYearLength(year) {
    const leap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    return leap ? 366 : 365;
}

function getYearProgress(currentYear) {
    const today = new Date();
    const todayYear = today.getFullYear();
    const totalDays = getYearLength(currentYear);

    if (currentYear < todayYear) {
        return { elapsed: totalDays, left: 0, status: 'Year complete' };
    }

    if (currentYear > todayYear) {
        return { elapsed: 0, left: totalDays, status: 'Year not started' };
    }

    const yearStart = new Date(currentYear, 0, 1);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const elapsed = Math.floor((todayMidnight - yearStart) / (1000 * 60 * 60 * 24)) + 1;
    const clampedElapsed = Math.min(totalDays, Math.max(0, elapsed));
    return {
        elapsed: clampedElapsed,
        left: Math.max(0, totalDays - clampedElapsed),
        status: 'Today'
    };
}

function getEventKey(event) {
    return `${event.startDate}__${event.endDate}__${event.color}__${event.text}`;
}

function getUpcomingEvents(events, currentYear) {
    const today = new Date();
    const anchor = currentYear === today.getFullYear()
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(currentYear, 0, 1);
    const anchorKey = anchor.toISOString().slice(0, 10);

    return events
        .filter((event) => event.startDate >= anchorKey)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function getCountdownText(selectedEvent) {
    if (!selectedEvent) {
        return 'Choose a target event to track a countdown.';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(`${selectedEvent.startDate}T00:00:00`);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} until ${selectedEvent.startDate}.`;
    }
    if (diffDays === 0) {
        return `Target is today (${selectedEvent.startDate}).`;
    }
    return `Target date passed ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago.`;
}

/**
 * Render temporal panel.
 */
export function renderTemporalPanel() {
    const container = getById('temporalPanel');
    if (!container) return;

    const currentYear = store.get('currentYear');
    const events = store.get('events') || [];
    const progress = getYearProgress(currentYear);
    const upcoming = getUpcomingEvents(events, currentYear);
    const selectedKey = store.get('countdownTarget') || '';
    const selectedEvent = upcoming.find((event) => getEventKey(event) === selectedKey) || upcoming[0] || null;

    if (selectedEvent && selectedKey !== getEventKey(selectedEvent)) {
        store.set('countdownTarget', getEventKey(selectedEvent));
    }

    const options = upcoming.map((event) => {
        const key = getEventKey(event);
        const selected = selectedEvent && getEventKey(selectedEvent) === key ? 'selected' : '';
        return `<option value="${escapeAttr(key)}" ${selected}>${escapeHtml(event.startDate)} - ${escapeHtml(event.text || 'Event')}</option>`;
    }).join('');

    const html = `
        <div class="temporal-stats">
            <span class="temporal-chip">${escapeHtml(progress.status)}</span>
            <span>Day ${progress.elapsed} of ${getYearLength(currentYear)}</span>
            <span>${progress.left} day${progress.left === 1 ? '' : 's'} left</span>
        </div>
        <div class="countdown-controls">
            <label for="countdownTargetSelect">Countdown target</label>
            <select id="countdownTargetSelect">
                ${options || '<option value="">No upcoming events</option>'}
            </select>
            <p>${escapeHtml(getCountdownText(selectedEvent))}</p>
        </div>
    `;

    setHTML(container, html);
}

/**
 * Initialize countdown target select behavior.
 */
export function initTemporalPanel() {
    const container = getById('temporalPanel');
    if (!container) return;

    container.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) return;
        if (target.id !== 'countdownTargetSelect') return;

        store.set('countdownTarget', target.value || '');
        saveData();
        renderTemporalPanel();
    });
}
