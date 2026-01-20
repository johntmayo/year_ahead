/**
 * Theme Manager - handles theme switching and persistence
 */

import { store } from '../store.js';
import { refreshView } from '../views/viewController.js';

const THEMES = {
    'glass-glow': 'Glass & Glow',
    'tactile': 'Tactile Impressionism'
};

const DEFAULT_THEME = 'glass-glow';
const STORAGE_KEY = 'yearAheadTheme';

/**
 * Get current theme
 * @returns {string} Current theme name
 */
export function getCurrentTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && THEMES[saved] ? saved : DEFAULT_THEME;
}

/**
 * Set theme
 * @param {string} themeName - Theme name
 */
export function setTheme(themeName) {
    if (!THEMES[themeName]) {
        console.warn(`Unknown theme: ${themeName}`);
        return;
    }

    localStorage.setItem(STORAGE_KEY, themeName);
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Update theme toggle buttons
    updateThemeToggleButtons(themeName);
    
    // Refresh view to apply theme-specific rendering
    refreshView();
}

/**
 * Initialize theme system
 */
export function initTheme() {
    const theme = getCurrentTheme();
    setTheme(theme);
    
    // Setup theme toggle handlers
    setupThemeToggle();
}

/**
 * Update theme toggle button states
 * @param {string} activeTheme - Active theme name
 */
function updateThemeToggleButtons(activeTheme) {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    
    toggle.querySelectorAll('.theme-btn').forEach(btn => {
        const theme = btn.dataset.theme;
        if (theme === activeTheme) {
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
            const theme = btn.dataset.theme;
            setTheme(theme);
        };
    });
}

/**
 * Get event color style for current theme
 * @param {string} baseColor - Base hex color
 * @param {boolean} isHover - Whether this is for hover state
 * @returns {string} CSS style string
 */
export function getEventColorStyle(baseColor, isHover = false) {
    const theme = getCurrentTheme();
    
    if (theme === 'glass-glow') {
        // Glass & Glow: soft gradient with glow effect
        const rgb = hexToRgb(baseColor);
        if (!rgb) return `background: ${baseColor};`;
        
        const { r, g, b } = rgb;
        const alpha = isHover ? 0.3 : 0.15;
        const alphaBorder = 0.8;
        
        return `
            background: linear-gradient(135deg, 
                rgba(${r}, ${g}, ${b}, ${alpha * 2}) 0%, 
                rgba(${r}, ${g}, ${b}, ${alpha}) 100%);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 8px rgba(${r}, ${g}, ${b}, ${isHover ? 0.4 : 0.2}),
                        0 2px 4px rgba(0, 0, 0, 0.1);
            color: ${getContrastColor(baseColor)};
        `.trim();
    } else {
        // Tactile Impressionism: painterly wash with organic color bleeding
        const rgb = hexToRgb(baseColor);
        if (!rgb) return `background: ${baseColor};`;
        
        const { r, g, b } = rgb;
        // Create a more sophisticated wash - desaturate and warm slightly
        const washR = Math.min(255, Math.floor(r * 0.55 + 65));
        const washG = Math.min(255, Math.floor(g * 0.55 + 60));
        const washB = Math.min(255, Math.floor(b * 0.55 + 55));
        
        // Edge color - slightly darker for definition
        const edgeR = Math.max(0, Math.floor(r * 0.45 + 40));
        const edgeG = Math.max(0, Math.floor(g * 0.45 + 35));
        const edgeB = Math.max(0, Math.floor(b * 0.45 + 30));
        
        return `
            background: 
                radial-gradient(ellipse at 30% 50%, rgba(${washR}, ${washG}, ${washB}, 0.45) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 50%, rgba(${washR + 10}, ${washG + 8}, ${washB + 5}, 0.35) 0%, transparent 60%),
                linear-gradient(135deg, 
                    rgba(${washR}, ${washG}, ${washB}, 0.4) 0%, 
                    rgba(${washR - 5}, ${washG - 3}, ${washB - 3}, 0.3) 50%,
                    rgba(${washR - 10}, ${washG - 8}, ${washB - 5}, 0.2) 100%);
            border: 1px solid rgba(${edgeR}, ${edgeG}, ${edgeB}, 0.4);
            box-shadow: 
                inset 0 2px 4px rgba(${edgeR}, ${edgeG}, ${edgeB}, 0.15),
                inset 0 -1px 2px rgba(${washR}, ${washG}, ${washB}, 0.2),
                0 2px 4px rgba(0, 0, 0, 0.08);
            mix-blend-mode: multiply;
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
    if (!rgb) return '#000000';
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#1A1A1B' : '#F5F5F7';
}

/**
 * Map color to natural pigment (for tactile theme)
 * @param {string} hexColor - Hex color string
 * @returns {string} Natural color name
 */
export function getNaturalColorName(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return 'Neutral';
    
    const { r, g, b } = rgb;
    
    // Simple color classification
    if (r > g && r > b) {
        if (g > 100) return 'Ochre';
        return 'Terracotta';
    } else if (b > r && b > g) {
        return 'Indigo';
    } else if (g > r && g > b) {
        return 'Sage';
    }
    
    return 'Charcoal';
}

