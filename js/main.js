/**
 * Main entry point - initializes the Year Ahead Planner application
 */

import { store } from './store.js';
import { getById } from './utils/dom.js';
import { loadData, saveData, exportData, importData } from './storage/persistence.js';
import {
    setView,
    refreshView,
    changeYear,
    updateYearDisplay,
    initGlobalDragListeners,
    initViewToggleSlider,
    setYearChangeCallback
} from './views/viewController.js';
import { renderYear } from './views/yearView.js';
import { changeMonth } from './views/monthView.js';
import { changeTimelineLines } from './views/timelineView.js';
import { initModalListeners } from './ui/modal.js';
import { renderCategoryKey } from './ui/categoryKey.js';
import { initNotepad } from './ui/notepad.js';
import { initInstructions } from './ui/instructions.js';

/**
 * Initialize the application
 */
function init() {
    // Set callback for year change to avoid circular dependency
    setYearChangeCallback(renderCategoryKey);

    // Set year selector to current year
    const yearSelect = getById('yearSelect');
    if (yearSelect) {
        yearSelect.value = store.get('currentYear');
    }

    // Update year display
    updateYearDisplay();

    // Load saved data
    loadData();

    // Render initial view
    renderYear();

    // Render category key
    renderCategoryKey();

    // Initialize UI components
    initModalListeners();
    initNotepad();
    initInstructions();

    // Initialize drag handlers
    initGlobalDragListeners();

    // Initialize view toggle slider
    initViewToggleSlider();

    // Attach global event handlers
    attachGlobalHandlers();
}

/**
 * Attach global event handlers
 */
function attachGlobalHandlers() {
    // View toggle buttons
    const viewToggle = getById('viewToggle');
    if (viewToggle) {
        viewToggle.querySelectorAll('.view-toggle-option').forEach(button => {
            button.onclick = (e) => {
                const view = e.target.dataset.view;
                setView(view, e.target);
            };
        });
    }

    // Year select
    const yearSelect = getById('yearSelect');
    if (yearSelect) {
        yearSelect.onchange = changeYear;
    }

    // Month select
    const monthSelect = getById('monthSelect');
    if (monthSelect) {
        monthSelect.onchange = changeMonth;
    }

    // Timeline lines select
    const timelineLinesSelect = getById('timelineLinesSelect');
    if (timelineLinesSelect) {
        timelineLinesSelect.onchange = changeTimelineLines;
    }

    // Export button
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.onclick = exportData;
    }

    // Import button
    const importBtn = document.querySelector('.import-btn');
    if (importBtn) {
        importBtn.onclick = () => {
            getById('importFile')?.click();
        };
    }

    // Import file input
    const importFile = getById('importFile');
    if (importFile) {
        importFile.onchange = (e) => {
            importData(e, () => {
                updateYearDisplay();
                renderCategoryKey();
                refreshView();
            });
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for potential use in HTML onclick attributes (backward compatibility)
window.setView = setView;
window.changeMonth = changeMonth;
window.changeYear = changeYear;
window.changeTimelineLines = changeTimelineLines;
window.exportData = exportData;
window.importData = (e) => {
    importData(e, () => {
        updateYearDisplay();
        renderCategoryKey();
        refreshView();
    });
};
