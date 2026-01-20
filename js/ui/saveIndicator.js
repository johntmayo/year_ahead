/**
 * Save indicator component
 */

import { getById, addClass, removeClass, setHTML } from '../utils/dom.js';

/**
 * Show saving state
 */
export function showSaving() {
    const indicator = getById('saveIndicator');
    if (!indicator) return;

    addClass(indicator, 'saving');
    setHTML(indicator, '<span class="icon">⏳</span><span>Saving...</span>');
}

/**
 * Show saved state
 */
export function showSaved() {
    const indicator = getById('saveIndicator');
    if (!indicator) return;

    removeClass(indicator, 'saving');
    setHTML(indicator, '<span class="icon">✓</span><span>Saved</span>');
}

/**
 * Show save indicator animation (saving -> saved)
 */
export function showSaveIndicator() {
    showSaving();

    setTimeout(() => {
        showSaved();
    }, 500);
}
