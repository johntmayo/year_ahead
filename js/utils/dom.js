/**
 * DOM utility functions
 */

/**
 * Get element by ID
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
export function getById(id) {
    return document.getElementById(id);
}

/**
 * Query selector shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
export function qs(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Query selector all shorthand
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList}
 */
export function qsa(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * Create element with attributes and content
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes object
 * @param {string|HTMLElement|Array} children - Children to append
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = null) {
    const el = document.createElement(tag);

    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value);
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                el.dataset[dataKey] = dataValue;
            });
        } else {
            el.setAttribute(key, value);
        }
    });

    if (children !== null) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    el.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    el.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            el.textContent = children;
        } else if (children instanceof HTMLElement) {
            el.appendChild(children);
        }
    }

    return el;
}

/**
 * Add class to element
 * @param {HTMLElement} el - Element
 * @param {...string} classes - Class names
 */
export function addClass(el, ...classes) {
    if (el) {
        el.classList.add(...classes);
    }
}

/**
 * Remove class from element
 * @param {HTMLElement} el - Element
 * @param {...string} classes - Class names
 */
export function removeClass(el, ...classes) {
    if (el) {
        el.classList.remove(...classes);
    }
}

/**
 * Toggle class on element
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(el, className, force) {
    if (el) {
        el.classList.toggle(className, force);
    }
}

/**
 * Check if element has class
 * @param {HTMLElement} el - Element
 * @param {string} className - Class name
 * @returns {boolean}
 */
export function hasClass(el, className) {
    return el ? el.classList.contains(className) : false;
}

/**
 * Set element's innerHTML safely (use with escaped content)
 * @param {HTMLElement} el - Element
 * @param {string} html - HTML content (should be pre-escaped)
 */
export function setHTML(el, html) {
    if (el) {
        el.innerHTML = html;
    }
}

/**
 * Clear element's children
 * @param {HTMLElement} el - Element
 */
export function clearChildren(el) {
    if (el) {
        el.innerHTML = '';
    }
}

/**
 * Show element (remove display: none)
 * @param {HTMLElement} el - Element
 * @param {string} display - Display value (default: block)
 */
export function show(el, display = 'block') {
    if (el) {
        el.style.display = display;
    }
}

/**
 * Hide element (set display: none)
 * @param {HTMLElement} el - Element
 */
export function hide(el) {
    if (el) {
        el.style.display = 'none';
    }
}

/**
 * Add event listener with automatic cleanup tracking
 * @param {HTMLElement} el - Element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function on(el, event, handler, options) {
    if (el) {
        el.addEventListener(event, handler, options);
        return () => el.removeEventListener(event, handler, options);
    }
    return () => {};
}

/**
 * Find closest ancestor matching selector
 * @param {HTMLElement} el - Starting element
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null}
 */
export function closest(el, selector) {
    return el ? el.closest(selector) : null;
}

/**
 * Get data attribute value
 * @param {HTMLElement} el - Element
 * @param {string} key - Data key (without 'data-' prefix)
 * @returns {string|undefined}
 */
export function getData(el, key) {
    return el ? el.dataset[key] : undefined;
}

/**
 * Set data attribute value
 * @param {HTMLElement} el - Element
 * @param {string} key - Data key
 * @param {string} value - Value
 */
export function setData(el, key, value) {
    if (el) {
        el.dataset[key] = value;
    }
}
