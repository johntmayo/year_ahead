/**
 * Instructions panel component
 */

import { getById, toggleClass } from '../utils/dom.js';

const INSTRUCTIONS_STATE_KEY = 'instructionsCollapsed';
const INSTRUCTIONS_AUTO_COLLAPSE_MS = 45000;
const INSTRUCTIONS_PINNED_KEY = 'instructionsPinned';
let instructionsInactivityTimer = null;

function syncInstructionsHeaderState(isCollapsed) {
    const instructionsHeader = document.querySelector('.instructions-header');
    if (!instructionsHeader) return;
    instructionsHeader.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
}

function clearInstructionsInactivityTimer() {
    if (instructionsInactivityTimer) {
        clearTimeout(instructionsInactivityTimer);
        instructionsInactivityTimer = null;
    }
}

function isInstructionsPinned() {
    return localStorage.getItem(INSTRUCTIONS_PINNED_KEY) === 'true';
}

function syncInstructionsPinnedState() {
    const pinned = isInstructionsPinned();
    const instructions = getById('instructionsPanel');
    const pinBtn = getById('instructionsPinBtn');

    if (instructions) {
        instructions.classList.toggle('pinned', pinned);
    }
    if (pinBtn) {
        pinBtn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        pinBtn.title = pinned ? 'Unpin How-To panel' : 'Pin How-To panel';
    }
}

function scheduleInstructionsAutoCollapse() {
    clearInstructionsInactivityTimer();

    const instructions = getById('instructionsPanel');
    if (!instructions || instructions.classList.contains('collapsed') || isInstructionsPinned()) return;

    instructionsInactivityTimer = setTimeout(() => {
        if (!instructions.classList.contains('collapsed')) {
            instructions.classList.add('collapsed');
            localStorage.setItem(INSTRUCTIONS_STATE_KEY, 'true');
            syncInstructionsHeaderState(true);
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
        syncInstructionsHeaderState(isCollapsed);

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
    const instructionsPinBtn = getById('instructionsPinBtn');

    if (instructions) {
        const savedState = localStorage.getItem(INSTRUCTIONS_STATE_KEY);
        if (savedState === 'false') {
            instructions.classList.remove('collapsed');
            syncInstructionsHeaderState(false);
        } else {
            instructions.classList.add('collapsed');
            syncInstructionsHeaderState(true);
        }
    }

    if (instructionsHeader) {
        instructionsHeader.onclick = toggleInstructions;
        instructionsHeader.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleInstructions();
            }
        };
    }

    if (instructionsPinBtn) {
        instructionsPinBtn.onclick = (e) => {
            e.stopPropagation();
            const nextPinnedState = !isInstructionsPinned();
            localStorage.setItem(INSTRUCTIONS_PINNED_KEY, nextPinnedState ? 'true' : 'false');
            syncInstructionsPinnedState();

            if (nextPinnedState) {
                clearInstructionsInactivityTimer();
            } else if (instructions && !instructions.classList.contains('collapsed')) {
                scheduleInstructionsAutoCollapse();
            }
        };
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

    syncInstructionsPinnedState();
}
