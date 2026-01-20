/**
 * Category Key component
 */

import { store } from '../store.js';
import { getById, setHTML } from '../utils/dom.js';
import { escapeAttr } from '../utils/sanitize.js';
import { saveData } from '../storage/persistence.js';
import { refreshView } from '../views/viewController.js';
import { renderEventList } from './modal.js';

/**
 * Render the category key
 */
export function renderCategoryKey() {
    const container = getById('categoryItems');
    if (!container) return;

    const colors = store.get('colors');
    const categories = store.get('categories');

    let html = '';

    colors.forEach((color, idx) => {
        html += `<div class="category-item">`;
        html += `<input type="color" value="${escapeAttr(color)}" data-color-idx="${idx}">`;
        html += `<input type="text" placeholder="Category name" value="${escapeAttr(categories[color] || '')}" data-category-color="${escapeAttr(color)}">`;
        html += `</div>`;
    });

    setHTML(container, html);

    // Attach event handlers
    attachCategoryHandlers();
}

/**
 * Attach event handlers to category inputs
 */
function attachCategoryHandlers() {
    const container = getById('categoryItems');
    if (!container) return;

    // Color picker changes
    container.querySelectorAll('input[type="color"]').forEach(input => {
        input.onchange = (e) => {
            const idx = parseInt(e.target.dataset.colorIdx);
            updateCategoryColor(idx, e.target.value);
        };
    });

    // Category name changes
    container.querySelectorAll('input[type="text"]').forEach(input => {
        input.onchange = (e) => {
            const color = e.target.dataset.categoryColor;
            updateCategory(color, e.target.value);
        };
    });
}

/**
 * Update category name
 * @param {string} color - Color key
 * @param {string} name - Category name
 */
export function updateCategory(color, name) {
    store.updateCategory(color, name);
    saveData();
}

/**
 * Update category color
 * @param {number} idx - Color index
 * @param {string} newColor - New color value
 */
export function updateCategoryColor(idx, newColor) {
    store.updateColor(idx, newColor);

    // Refresh UI
    renderCategoryKey();

    // Re-render event list if modal is open
    const selectedDate = store.get('selectedDate');
    if (selectedDate) {
        renderEventList();
    }

    refreshView();
    saveData();
}
