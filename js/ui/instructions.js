/**
 * Instructions panel component
 */

import { getById, toggleClass } from '../utils/dom.js';

const INSTRUCTIONS_STATE_KEY = 'instructionsCollapsed';

/**
 * Toggle instructions panel collapsed state
 */
export function toggleInstructions() {
    const instructions = getById('instructionsPanel');
    if (instructions) {
        toggleClass(instructions, 'collapsed');
        const isCollapsed = instructions.classList.contains('collapsed');
        localStorage.setItem(INSTRUCTIONS_STATE_KEY, isCollapsed ? 'true' : 'false');
    }
}

/**
 * Initialize instructions panel event listeners
 */
export function initInstructions() {
    const instructionsHeader = document.querySelector('.instructions-header');
    const instructions = getById('instructionsPanel');

    if (instructions) {
        const savedState = localStorage.getItem(INSTRUCTIONS_STATE_KEY);
        if (savedState === 'false') {
            instructions.classList.remove('collapsed');
        } else {
            instructions.classList.add('collapsed');
        }
    }

    if (instructionsHeader) {
        instructionsHeader.onclick = toggleInstructions;
    }
}
