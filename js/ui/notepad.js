/**
 * Notepad component
 */

import { getById, toggleClass, hasClass } from '../utils/dom.js';
import { saveData, saveNotepadState } from '../storage/persistence.js';

const NOTEPAD_AUTO_COLLAPSE_MS = 60000;
const NOTEPAD_PINNED_KEY = 'notepadPinned';
let notepadInactivityTimer = null;

function syncNotepadHeaderState(isCollapsed) {
    const notepadHeader = document.querySelector('.notepad-header');
    if (!notepadHeader) return;
    notepadHeader.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
}

function clearNotepadInactivityTimer() {
    if (notepadInactivityTimer) {
        clearTimeout(notepadInactivityTimer);
        notepadInactivityTimer = null;
    }
}

function isNotepadPinned() {
    return localStorage.getItem(NOTEPAD_PINNED_KEY) === 'true';
}

function syncNotepadPinnedState() {
    const pinned = isNotepadPinned();
    const notepad = getById('notepad');
    const pinBtn = getById('notepadPinBtn');

    if (notepad) {
        notepad.classList.toggle('pinned', pinned);
    }
    if (pinBtn) {
        pinBtn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        pinBtn.title = pinned ? 'Unpin Notes panel' : 'Pin Notes panel';
    }
}

function scheduleNotepadAutoCollapse() {
    clearNotepadInactivityTimer();

    const notepad = getById('notepad');
    if (!notepad || hasClass(notepad, 'collapsed') || isNotepadPinned()) return;

    notepadInactivityTimer = setTimeout(() => {
        if (!hasClass(notepad, 'collapsed')) {
            notepad.classList.add('collapsed');
            saveNotepadState(true);
        }
    }, NOTEPAD_AUTO_COLLAPSE_MS);
}

/**
 * Toggle notepad collapsed state
 */
export function toggleNotepad() {
    const notepad = getById('notepad');
    if (!notepad) return;

    toggleClass(notepad, 'collapsed');
    const isCollapsed = hasClass(notepad, 'collapsed');
    saveNotepadState(isCollapsed);
    syncNotepadHeaderState(isCollapsed);

    if (isCollapsed) {
        clearNotepadInactivityTimer();
    } else {
        scheduleNotepadAutoCollapse();
    }
}

/**
 * Initialize notepad event listeners
 */
export function initNotepad() {
    const notepadHeader = document.querySelector('.notepad-header');
    const notepadText = getById('notepadText');
    const notepad = getById('notepad');
    const notepadPinBtn = getById('notepadPinBtn');

    if (notepadHeader) {
        notepadHeader.onclick = toggleNotepad;
        notepadHeader.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleNotepad();
            }
        };
    }

    if (notepadPinBtn) {
        notepadPinBtn.onclick = (e) => {
            e.stopPropagation();
            const nextPinnedState = !isNotepadPinned();
            localStorage.setItem(NOTEPAD_PINNED_KEY, nextPinnedState ? 'true' : 'false');
            syncNotepadPinnedState();

            if (nextPinnedState) {
                clearNotepadInactivityTimer();
            } else if (notepad && !hasClass(notepad, 'collapsed')) {
                scheduleNotepadAutoCollapse();
            }
        };
    }

    if (notepad) {
        ['mouseenter', 'mousemove', 'keydown', 'focusin', 'click'].forEach(eventName => {
            notepad.addEventListener(eventName, () => {
                if (!hasClass(notepad, 'collapsed')) {
                    scheduleNotepadAutoCollapse();
                }
            });
        });
    }

    // Auto-save notepad on input
    if (notepadText) {
        notepadText.addEventListener('input', () => {
            saveData();
            scheduleNotepadAutoCollapse();
        });
    }

    if (notepad && !hasClass(notepad, 'collapsed')) {
        scheduleNotepadAutoCollapse();
    }

    syncNotepadHeaderState(!!notepad && hasClass(notepad, 'collapsed'));
    syncNotepadPinnedState();
}

/**
 * Get notepad text value
 * @returns {string} Notepad content
 */
export function getNotepadText() {
    const notepadText = getById('notepadText');
    return notepadText ? notepadText.value : '';
}

/**
 * Set notepad text value
 * @param {string} text - Text to set
 */
export function setNotepadText(text) {
    const notepadText = getById('notepadText');
    if (notepadText) {
        notepadText.value = text || '';
    }
}

/**
 * Set notepad collapsed state
 * @param {boolean} collapsed - Whether notepad should be collapsed
 */
export function setNotepadCollapsed(collapsed) {
    const notepad = getById('notepad');
    if (!notepad) return;

    if (collapsed) {
        notepad.classList.add('collapsed');
    } else {
        notepad.classList.remove('collapsed');
    }

    syncNotepadHeaderState(collapsed);
}
