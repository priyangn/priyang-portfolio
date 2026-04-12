/**
 * Supabase browser client (anon key). Safe to deploy: protect data with RLS, not by hiding this file.
 * Dashboard: https://app.supabase.com/project/_/settings/api
 */

const SUPABASE_URL = "https://pzxofxdhcivrkpbdeaup.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6eG9meGRoY2l2cmtwYmRlYXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTA2NjEsImV4cCI6MjA5MTU2NjY2MX0.GB86pONuR1OW-_DEt9Q4unG71QNlL7qj8LNXVuVk-II";

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
