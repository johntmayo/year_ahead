/**
 * Values declaration anchor for year-level intention.
 */

import { store } from '../store.js';
import { getById } from '../utils/dom.js';
import { saveData } from '../storage/persistence.js';

const PROMPT = 'What matters most this year?';

/**
 * Render stored values declaration into UI.
 */
export function renderValuesDeclaration() {
    const valuesInput = getById('valuesDeclarationInput');
    const promptEl = getById('valuesDeclarationPrompt');
    if (!valuesInput || !promptEl) return;

    promptEl.textContent = PROMPT;
    const currentValue = store.get('valuesDeclaration') || '';
    valuesInput.value = currentValue;
}

/**
 * Initialize values declaration events.
 */
export function initValuesDeclaration() {
    const valuesInput = getById('valuesDeclarationInput');
    if (!valuesInput) return;

    valuesInput.addEventListener('input', (event) => {
        const nextValue = event.target.value || '';
        store.set('valuesDeclaration', nextValue);
        saveData();
    });

    renderValuesDeclaration();
}
