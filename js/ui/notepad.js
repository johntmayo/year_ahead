/**
 * Notepad component
 */

import { getById, toggleClass, hasClass } from '../utils/dom.js';
import { saveData, saveNotepadState } from '../storage/persistence.js';

/**
 * Toggle notepad collapsed state
 */
export function toggleNotepad() {
    const notepad = getById('notepad');
    if (!notepad) return;

    toggleClass(notepad, 'collapsed');
    const isCollapsed = hasClass(notepad, 'collapsed');
    saveNotepadState(isCollapsed);
}

/**
 * Initialize notepad event listeners
 */
export function initNotepad() {
    const notepadHeader = document.querySelector('.notepad-header');
    const notepadText = getById('notepadText');

    if (notepadHeader) {
        notepadHeader.onclick = toggleNotepad;
    }

    // Auto-save notepad on input
    if (notepadText) {
        notepadText.addEventListener('input', () => {
            saveData();
        });
    }
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
}
