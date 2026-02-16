/**
 * Instructions panel component
 */

import { getById, toggleClass } from '../utils/dom.js';

const INSTRUCTIONS_STATE_KEY = 'instructionsCollapsed';
const INSTRUCTIONS_AUTO_COLLAPSE_MS = 45000;
let instructionsInactivityTimer = null;

function clearInstructionsInactivityTimer() {
    if (instructionsInactivityTimer) {
        clearTimeout(instructionsInactivityTimer);
        instructionsInactivityTimer = null;
    }
}

function scheduleInstructionsAutoCollapse() {
    clearInstructionsInactivityTimer();

    const instructions = getById('instructionsPanel');
    if (!instructions || instructions.classList.contains('collapsed')) return;

    instructionsInactivityTimer = setTimeout(() => {
        if (!instructions.classList.contains('collapsed')) {
            instructions.classList.add('collapsed');
            localStorage.setItem(INSTRUCTIONS_STATE_KEY, 'true');
        }
    }, INSTRUCTIONS_AUTO_COLLAPSE_MS);
}

/**
 * Toggle instructions panel collapsed state
 */
export function toggleInstructions() {
    const instructions = getById('instructionsPanel');
    if (instructions) {
        toggleClass(instructions, 'collapsed');
        const isCollapsed = instructions.classList.contains('collapsed');
        localStorage.setItem(INSTRUCTIONS_STATE_KEY, isCollapsed ? 'true' : 'false');

        if (isCollapsed) {
            clearInstructionsInactivityTimer();
        } else {
            scheduleInstructionsAutoCollapse();
        }
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

    if (instructions) {
        ['mouseenter', 'mousemove', 'keydown', 'focusin', 'click', 'wheel'].forEach(eventName => {
            instructions.addEventListener(eventName, () => {
                if (!instructions.classList.contains('collapsed')) {
                    scheduleInstructionsAutoCollapse();
                }
            });
        });

        if (!instructions.classList.contains('collapsed')) {
            scheduleInstructionsAutoCollapse();
        }
    }
}
