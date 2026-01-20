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
import { initTheme } from './themes/themeManager.js';
import { renderYearString } from './ui/yearString.js';

/**
 * Initialize the application
 */
function init() {
    try {
        console.log('Initializing Year Ahead Planner...');
        
        // Set callback for year change to avoid circular dependency
        setYearChangeCallback(renderCategoryKey);

        // Set year selector to current year
        const yearSelect = getById('yearSelect');
        if (yearSelect) {
            yearSelect.value = store.get('currentYear');
        } else {
            console.error('yearSelect element not found!');
        }

        // Update year display
        updateYearDisplay();

        // Load saved data
        loadData();

        // Initialize theme system
        initTheme();

        // Render initial view
        console.log('Rendering year view...');
        renderYear();
        
        // Render year string
        renderYearString();
        
        // Check if yearView was populated
        const yearView = getById('yearView');
        if (yearView && yearView.children.length === 0) {
            console.error('Year view rendered but no content!');
        } else {
            console.log(`Year view rendered with ${yearView?.children.length || 0} months`);
        }

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
        
        console.log('Initialization complete!');
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('Error initializing application. Check console for details.');
    }
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

// Error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
});

// Log initialization
console.log('Year Ahead Planner: Initializing...');

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
