/**
 * Header settings menu interactions.
 */

import { getById } from '../utils/dom.js';

/**
 * Initialize settings menu open/close behavior.
 */
export function initSettingsMenu() {
    const button = getById('settingsMenuButton');
    const menu = getById('settingsMenu');
    if (!button || !menu) return;

    const closeMenu = () => {
        menu.setAttribute('hidden', '');
        button.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
        menu.removeAttribute('hidden');
        button.setAttribute('aria-expanded', 'true');
    };

    button.onclick = (event) => {
        event.stopPropagation();
        const isOpen = !menu.hasAttribute('hidden');
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    menu.onclick = (event) => {
        event.stopPropagation();
    };

    document.addEventListener('click', () => {
        closeMenu();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });
}
