/**
 * LocalStorage persistence and export/import functionality
 */

import { store } from '../store.js';
import { STORAGE_KEY_PREFIX, AVAILABLE_YEARS } from '../constants.js';
import { getById } from '../utils/dom.js';
import {
    isSupabaseEnabled,
    loadYearDataFromCloud,
    saveYearDataToCloud
} from '../services/supabaseService.js';

/**
 * Get storage key for a year
 * @param {number} year - Year
 * @returns {string} Storage key
 */
function getStorageKey(year) {
    return `${STORAGE_KEY_PREFIX}${year}`;
}

function normalizeEvents(data, currentYear) {
    let events = [];

    if (Array.isArray(data.events)) {
        events = data.events.filter(evt => {
            const eventYear = new Date(evt.startDate + 'T00:00:00').getFullYear();
            return eventYear === currentYear;
        }).map(evt => ({
            ...evt,
            controllability: evt.controllability || 'high',
            anticipation: !!evt.anticipation,
            recovery: evt.recovery || 'neutral'
        }));
    } else if (data.events && typeof data.events === 'object') {
        Object.keys(data.events).forEach(dateKey => {
            const eventYear = new Date(dateKey + 'T00:00:00').getFullYear();
            if (eventYear === currentYear) {
                data.events[dateKey].forEach(evt => {
                    events.push({
                        text: evt.text,
                        color: evt.color,
                        startDate: dateKey,
                        endDate: dateKey,
                        controllability: evt.controllability || 'high',
                        anticipation: !!evt.anticipation,
                        recovery: evt.recovery || 'neutral'
                    });
                });
            }
        });
    }

    return events;
}

function applyLoadedData(data) {
    const currentYear = store.get('currentYear');

    const events = normalizeEvents(data, currentYear);
    store.setEvents(events);

    const categories = data.categories || {};
    store.set('categories', categories);

    const colors = store.get('colors');
    if (data.colors && Array.isArray(data.colors) && data.colors.length === colors.length) {
        store.set('colors', data.colors);
    }

    const currentColors = store.get('colors');
    const currentCategories = store.get('categories');
    currentColors.forEach(color => {
        if (!currentCategories[color]) {
            currentCategories[color] = '';
        }
    });
    store.set('categories', currentCategories);
    store.set('valuesDeclaration', data.valuesDeclaration || '');

    const notepadEl = getById('notepadText');
    if (notepadEl) {
        notepadEl.value = data.notepadText || '';
    }

    const notepad = getById('notepad');
    if (notepad) {
        if (data.notepadCollapsed === false) {
            notepad.classList.remove('collapsed');
        } else {
            notepad.classList.add('collapsed');
        }
    }
}

function clearCurrentYearData() {
    store.setEvents([]);
    store.set('valuesDeclaration', '');
    const notepadEl = getById('notepadText');
    if (notepadEl) {
        notepadEl.value = '';
    }
    const notepad = getById('notepad');
    if (notepad) {
        notepad.classList.add('collapsed');
    }
}

/**
 * Save current data to localStorage
 */
export function saveData() {
    const notepadText = getById('notepadText')?.value || '';
    const notepad = getById('notepad');
    const isCollapsed = notepad?.classList.contains('collapsed') || false;

    const data = {
        events: store.get('events'),
        categories: store.get('categories'),
        colors: store.get('colors'),
        valuesDeclaration: store.get('valuesDeclaration'),
        notepadText,
        notepadCollapsed: isCollapsed
    };

    const currentYear = store.get('currentYear');
    localStorage.setItem(getStorageKey(currentYear), JSON.stringify(data));

    // Fire-and-forget cloud save. localStorage remains a fallback backup.
    isSupabaseEnabled()
        .then(enabled => {
            if (!enabled) return false;
            return saveYearDataToCloud(currentYear, data);
        })
        .catch(error => {
            console.warn('Cloud save skipped:', error);
        });

    showSaveIndicator();
}

/**
 * Load data from localStorage for current year
 */
export async function loadData() {
    const currentYear = store.get('currentYear');
    let data = null;

    try {
        if (await isSupabaseEnabled()) {
            data = await loadYearDataFromCloud(currentYear);
            // Keep local backup in sync for offline fallback and exports.
            if (data) {
                localStorage.setItem(getStorageKey(currentYear), JSON.stringify(data));
            }
        }
    } catch (error) {
        console.warn('Cloud load failed, falling back to local data.', error);
    }

    if (!data) {
        const saved = localStorage.getItem(getStorageKey(currentYear));
        if (saved) {
            data = JSON.parse(saved);
        }
    }

    if (data) {
        applyLoadedData(data);
        return;
    }

    clearCurrentYearData();
}

/**
 * Save notepad collapsed state
 * @param {boolean} isCollapsed - Whether notepad is collapsed
 */
export function saveNotepadState(isCollapsed) {
    const currentYear = store.get('currentYear');
    const saved = localStorage.getItem(getStorageKey(currentYear));
    const data = saved ? JSON.parse(saved) : {};
    data.notepadCollapsed = isCollapsed;
    localStorage.setItem(getStorageKey(currentYear), JSON.stringify(data));
    saveData();
}

/**
 * Show save indicator animation
 */
export function showSaveIndicator() {
    const indicator = getById('saveIndicator');
    if (!indicator) return;

    indicator.classList.add('saving');
    indicator.innerHTML = '<span class="icon">⏳</span><span>Saving...</span>';

    setTimeout(() => {
        indicator.classList.remove('saving');
        const savedAt = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
        indicator.innerHTML = `<span class="icon">✓</span><span>Saved ${savedAt}</span>`;
    }, 500);
}

/**
 * Export all years' data to a JSON file
 */
export function exportData() {
    // Collect data for all years
    const allYearsData = {};

    AVAILABLE_YEARS.forEach(year => {
        const saved = localStorage.getItem(getStorageKey(year));
        if (saved) {
            try {
                allYearsData[year] = JSON.parse(saved);
            } catch (e) {
                console.error(`Error loading data for ${year}:`, e);
            }
        }
    });

    // Include current year's notepad state
    const notepad = getById('notepad');
    const isCollapsed = notepad?.classList.contains('collapsed') || false;
    const currentNotepadText = getById('notepadText')?.value || '';
    const currentYear = store.get('currentYear');

    // If current year data exists, update its notepad
    if (allYearsData[currentYear]) {
        allYearsData[currentYear].notepadText = currentNotepadText;
        allYearsData[currentYear].notepadCollapsed = isCollapsed;
    }

    const data = {
        allYears: allYearsData,
        currentYear: currentYear,
        exportDate: new Date().toISOString(),
        version: '2.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `year-ahead-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSaveIndicator();
}

/**
 * Import data from a JSON file
 * @param {Event} event - File input change event
 * @param {Function} onComplete - Callback when import is complete
 */
export function importData(event, onComplete) {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('This will replace all your current data for all years. Are you sure you want to continue?')) {
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const cloudEnabled = await isSupabaseEnabled();

            // Check if this is the new format (v2.0 with allYears) or old format
            if (data.allYears && data.version === '2.0') {
                const importedYears = Object.keys(data.allYears);

                // New format: import all years
                importedYears.forEach(year => {
                    const yearData = data.allYears[year];
                    localStorage.setItem(getStorageKey(year), JSON.stringify(yearData));
                });

                // Clear local data for known years not present in backup.
                AVAILABLE_YEARS.forEach(year => {
                    if (!importedYears.includes(String(year))) {
                        localStorage.removeItem(getStorageKey(year));
                    }
                });

                // Keep cloud in sync so imported data is what users see after reload.
                if (cloudEnabled) {
                    const cloudSaveTasks = importedYears.map(year => {
                        const yearData = data.allYears[year];
                        return saveYearDataToCloud(parseInt(year, 10), yearData);
                    });
                    await Promise.all(cloudSaveTasks);
                }

                // Switch to the current year from backup if available
                if (data.currentYear) {
                    store.set('currentYear', data.currentYear);
                    const yearSelect = getById('yearSelect');
                    if (yearSelect) {
                        yearSelect.value = data.currentYear;
                    }
                }

                // Load current year's data
                await loadData();
            } else if (data.events && data.colors) {
                // Old format: single year backup
                const importYear = parseInt(data.year, 10) || store.get('currentYear');

                if (data.year && data.year !== store.get('currentYear')) {
                    if (confirm(`This backup is for ${data.year}. Switch to ${data.year}?`)) {
                        store.set('currentYear', data.year);
                        const yearSelect = getById('yearSelect');
                        if (yearSelect) {
                            yearSelect.value = data.year;
                        }
                    }
                }

                // Save to the appropriate year
                localStorage.setItem(getStorageKey(importYear), JSON.stringify(data));

                // If cloud sync is active, update cloud for this imported year too.
                if (cloudEnabled) {
                    await saveYearDataToCloud(importYear, data);
                }

                // Load current year's data
                await loadData();
            } else {
                alert('Invalid file format. Please select a valid backup file.');
                event.target.value = '';
                return;
            }

            // Call completion callback
            if (onComplete) {
                onComplete();
            }

            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}
