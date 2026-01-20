/**
 * Instructions panel component
 */

import { getById, toggleClass } from '../utils/dom.js';

/**
 * Toggle instructions panel collapsed state
 */
export function toggleInstructions() {
    const instructions = getById('instructionsPanel');
    if (instructions) {
        toggleClass(instructions, 'collapsed');
    }
}

/**
 * Initialize instructions panel event listeners
 */
export function initInstructions() {
    const instructionsHeader = document.querySelector('.instructions-header');

    if (instructionsHeader) {
        instructionsHeader.onclick = toggleInstructions;
    }
}
