/**
 * Supabase service for auth and per-user cloud persistence.
 * Falls back gracefully when Supabase is not configured.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CONFIG_ENDPOINT = '/api/config';
const TABLE_NAME = 'planner_year_data';

let supabaseClient = null;
let initPromise = null;

async function fetchPublicConfig() {
    try {
        const response = await fetch(CONFIG_ENDPOINT, {
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (!data?.supabaseUrl || !data?.supabaseAnonKey) {
            return null;
        }

        return data;
    } catch (error) {
        console.warn('Supabase config endpoint unavailable, using local mode.', error);
        return null;
    }
}

export async function initSupabase() {
    if (supabaseClient) {
        return supabaseClient;
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = (async () => {
        const config = await fetchPublicConfig();
        if (!config) {
            return null;
        }

        supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        return supabaseClient;
    })();

    return initPromise;
}

export async function isSupabaseEnabled() {
    const client = await initSupabase();
    return !!client;
}

export async function getSignedInUser() {
    const client = await initSupabase();
    if (!client) return null;

    const { data, error } = await client.auth.getUser();
    if (error) {
        console.warn('Unable to resolve signed-in user.', error);
        return null;
    }
    return data?.user || null;
}

export async function signIn(email, password) {
    const client = await initSupabase();
    if (!client) {
        return { error: { message: 'Supabase is not configured yet.' } };
    }
    return client.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
    const client = await initSupabase();
    if (!client) {
        return { error: { message: 'Supabase is not configured yet.' } };
    }
    return client.auth.signUp({ email, password });
}

export async function signOut() {
    const client = await initSupabase();
    if (!client) return { error: null };
    return client.auth.signOut();
}

export async function subscribeToAuthChanges(callback) {
    const client = await initSupabase();
    if (!client) return () => {};

    const { data } = client.auth.onAuthStateChange((_event, session) => {
        callback(session?.user || null);
    });

    return () => {
        data?.subscription?.unsubscribe();
    };
}

export async function loadYearDataFromCloud(year) {
    const client = await initSupabase();
    if (!client) return null;

    const user = await getSignedInUser();
    if (!user) return null;

    const { data, error } = await client
        .from(TABLE_NAME)
        .select('data')
        .eq('user_id', user.id)
        .eq('year', year)
        .maybeSingle();

    if (error) {
        console.error('Cloud load failed:', error);
        return null;
    }

    return data?.data || null;
}

export async function saveYearDataToCloud(year, payload) {
    const client = await initSupabase();
    if (!client) return false;

    const user = await getSignedInUser();
    if (!user) return false;

    const { error } = await client
        .from(TABLE_NAME)
        .upsert(
            {
                user_id: user.id,
                year,
                data: payload,
                updated_at: new Date().toISOString()
            },
            { onConflict: 'user_id,year' }
        );

    if (error) {
        console.error('Cloud save failed:', error);
        return false;
    }

    return true;
}
