/**
 * Simple auth gate for Supabase email/password sign-in.
 */
import { getById } from '../utils/dom.js';
import {
    isSupabaseEnabled,
    getSignedInUser,
    signIn,
    signUp,
    signOut,
    subscribeToAuthChanges
} from '../services/supabaseService.js';

let authListenersBound = false;
let authUnsubscribe = null;

function setAuthMessage(message, isError = false) {
    const el = getById('authMessage');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('error', isError);
}

function setSignedInBadge(user) {
    const badge = getById('authUserBadge');
    const signOutBtn = getById('signOutBtn');
    if (!badge || !signOutBtn) return;

    if (user) {
        badge.textContent = `Signed in: ${user.email || 'user'}`;
        badge.style.display = 'inline-flex';
        signOutBtn.style.display = 'inline-block';
    } else {
        badge.textContent = '';
        badge.style.display = 'none';
        signOutBtn.style.display = 'none';
    }
}

function showApp(show) {
    const appShell = getById('appShell');
    const gate = getById('authGate');
    if (appShell) appShell.style.display = show ? 'block' : 'none';
    if (gate) gate.style.display = show ? 'none' : 'flex';
}

function readCredentials() {
    const email = (getById('authEmail')?.value || '').trim();
    const password = getById('authPassword')?.value || '';
    return { email, password };
}

async function handleSignIn(onAuthenticated) {
    const { email, password } = readCredentials();
    if (!email || !password) {
        setAuthMessage('Enter your email and password.', true);
        return;
    }

    setAuthMessage('Signing in...');
    const { error } = await signIn(email, password);
    if (error) {
        setAuthMessage(error.message || 'Sign in failed.', true);
        return;
    }

    const user = await getSignedInUser();
    if (user) {
        setSignedInBadge(user);
        showApp(true);
        setAuthMessage('');
        onAuthenticated();
    }
}

async function handleSignUp() {
    const { email, password } = readCredentials();
    if (!email || !password) {
        setAuthMessage('Enter your email and password first.', true);
        return;
    }

    if (password.length < 6) {
        setAuthMessage('Password must be at least 6 characters.', true);
        return;
    }

    setAuthMessage('Creating account...');
    const { error } = await signUp(email, password);
    if (error) {
        setAuthMessage(error.message || 'Sign up failed.', true);
        return;
    }

    setAuthMessage('Account created. Check your email if verification is enabled.');
}

async function handleSignOut() {
    await signOut();
    window.location.reload();
}

function bindListeners(onAuthenticated) {
    if (authListenersBound) return;
    authListenersBound = true;

    const signInBtn = getById('signInBtn');
    const signUpBtn = getById('signUpBtn');
    const signOutBtn = getById('signOutBtn');
    const passwordInput = getById('authPassword');

    if (signInBtn) {
        signInBtn.onclick = () => handleSignIn(onAuthenticated);
    }
    if (signUpBtn) {
        signUpBtn.onclick = handleSignUp;
    }
    if (signOutBtn) {
        signOutBtn.onclick = handleSignOut;
    }
    if (passwordInput) {
        passwordInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSignIn(onAuthenticated);
            }
        };
    }
}

export async function initAuthGate(onAuthenticated) {
    bindListeners(onAuthenticated);

    const enabled = await isSupabaseEnabled();
    const setupNote = getById('authSetupNote');

    if (!enabled) {
        // No Supabase env configured yet; keep app usable in local mode.
        if (setupNote) {
            setupNote.textContent = 'Supabase not configured yet. Running in local-only mode.';
        }
        showApp(true);
        setSignedInBadge(null);
        onAuthenticated();
        return;
    }

    if (setupNote) {
        setupNote.textContent = '';
    }

    const user = await getSignedInUser();
    if (user) {
        setSignedInBadge(user);
        showApp(true);
        onAuthenticated();
    } else {
        setSignedInBadge(null);
        showApp(false);
    }

    if (authUnsubscribe) authUnsubscribe();
    authUnsubscribe = await subscribeToAuthChanges(async (nextUser) => {
        setSignedInBadge(nextUser);
        if (nextUser) {
            showApp(true);
            onAuthenticated();
        } else {
            showApp(false);
        }
    });
}
