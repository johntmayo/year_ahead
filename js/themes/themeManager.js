/**
 * Theme Manager - handles theme switching and persistence
 */

import { store } from '../store.js';
import { refreshView } from '../views/viewController.js';

const MODES = {
    'light': 'Light',
    'dark': 'Dark'
};

const DEFAULT_MODE = 'light';
const STORAGE_KEY = 'yearAheadMode';

/**
 * Get current mode
 * @returns {string} Current mode name
 */
export function getCurrentMode() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && MODES[saved] ? saved : DEFAULT_MODE;
}

/**
 * Get current theme (always glass-glow now)
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
    return 'glass-glow';
}

/**
 * Set mode (light/dark)
 * @param {string} modeName - Mode name ('light' or 'dark')
 */
export function setMode(modeName) {
    if (!MODES[modeName]) {
        console.warn(`Unknown mode: ${modeName}`);
        return;
    }

    localStorage.setItem(STORAGE_KEY, modeName);
    document.documentElement.setAttribute('data-theme', 'glass-glow');
    document.documentElement.setAttribute('data-mode', modeName);
    
    // Update theme toggle buttons
    updateThemeToggleButtons(modeName);
    
    // Refresh view to apply mode-specific rendering
    refreshView();
}

/**
 * Set theme (legacy function, now always sets glass-glow)
 * @param {string} themeName - Theme name (ignored, always uses glass-glow)
 */
export function setTheme(themeName) {
    const mode = getCurrentMode();
    document.documentElement.setAttribute('data-theme', 'glass-glow');
    document.documentElement.setAttribute('data-mode', mode);
    updateThemeToggleButtons(mode);
    refreshView();
}

/**
 * Initialize theme system
 */
export function initTheme() {
    const mode = getCurrentMode();
    setMode(mode);
    
    // Setup theme toggle handlers
    setupThemeToggle();
}

/**
 * Update theme toggle button states
 * @param {string} activeMode - Active mode name
 */
function updateThemeToggleButtons(activeMode) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    toggle.querySelectorAll('.theme-btn').forEach(btn => {
        const mode = btn.dataset.mode;
        if (mode === activeMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Setup theme toggle event handlers
 */
function setupThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    toggle.querySelectorAll('.theme-btn').forEach(btn => {
        btn.onclick = () => {
            const mode = btn.dataset.mode;
            setMode(mode);
        };
    });
}

/**
 * Get event color style for current theme
 * @param {string} baseColor - Base hex color
 * @param {boolean} isHover - Whether this is for hover state
 * @returns {string} CSS style string
 */
export function getEventColorStyle(baseColor, isHover = false, isMultiDay = false) {
    // Glass & Glow: soft gradient with glow effect
    // Reduced transparency by 30% (increased opacity)
    const rgb = hexToRgb(baseColor);
    if (!rgb) return `background: ${baseColor};`;
    
    const { r, g, b } = rgb;
    // Original: 0.15 normal, 0.3 hover. Reduced transparency by 30% means:
    // 0.15 * 1.3 = 0.195 (normal), 0.3 * 1.3 = 0.39 (hover)
    const alpha = isHover ? 0.39 : 0.195;
    const alphaBorder = 0.8;
    
    const mode = getCurrentMode();
    const borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)';
    const shadowColor = mode === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
    
    // For multi-day events, use a painterly uniform wash
    // Completely uniform color (no gradient) so it flows seamlessly across cells
    if (isMultiDay) {
        // Uniform color wash - no gradient to avoid repeating pattern
        // Remove inset shadow to prevent visible edges between cells
        const washAlpha = alpha * 1.15; // Slightly more opaque for better visibility
        return `
            background: rgba(${r}, ${g}, ${b}, ${washAlpha});
            border: none;
            box-shadow: 0 0 8px rgba(${r}, ${g}, ${b}, ${isHover ? 0.18 : 0.1});
            color: ${getContrastColor(baseColor)};
        `.trim();
    } else {
        // Single-day events keep the diagonal gradient for visual interest
        return `
            background: linear-gradient(135deg, 
                rgba(${r}, ${g}, ${b}, ${alpha * 2}) 0%, 
                rgba(${r}, ${g}, ${b}, ${alpha}) 100%);
            border: 1px solid ${borderColor};
            box-shadow: 0 0 8px rgba(${r}, ${g}, ${b}, ${isHover ? 0.4 : 0.2}),
                        0 2px 4px ${shadowColor};
            color: ${getContrastColor(baseColor)};
        `.trim();
    }
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color string
 * @returns {Object|null} RGB object or null
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Get contrast color (black or white) for text
 * @param {string} hexColor - Hex color string
 * @returns {string} '#000000' or '#ffffff'
 */
function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) {
        const mode = getCurrentMode();
        return mode === 'dark' ? '#F5F5F7' : '#1A1A1B';
    }
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    const mode = getCurrentMode();
    
    // In dark mode, use lighter text more often
    if (mode === 'dark') {
        return brightness > 100 ? '#1A1A1B' : '#F5F5F7';
    } else {
        return brightness > 128 ? '#1A1A1B' : '#F5F5F7';
    }
}


