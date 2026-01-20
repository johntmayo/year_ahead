/**
 * XSS protection utilities
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - Input string
 * @returns {string} Escaped string safe for HTML content
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const string = String(str);
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return string.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Escape string for use in HTML attributes
 * @param {string} str - Input string
 * @returns {string} Escaped string safe for HTML attributes
 */
export function escapeAttr(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const string = String(str);
    return string
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Sanitize a string for safe display (combines escaping with trimming)
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
export function sanitize(str) {
    return escapeHtml(str).trim();
}
