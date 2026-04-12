/**
 * Supabase Configuration — copy this file to supabase-config.js and fill in values.
 * Dashboard: https://app.supabase.com/project/_/settings/api
 */

const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
