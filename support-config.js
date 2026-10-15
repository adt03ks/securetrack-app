// PUBLIC configuration only. Do not include service-role keys or Turnstile secret keys.
window.SECURETRACK_SUPPORT = {
  functionUrl: '', // https://YOUR-PROJECT.supabase.co/functions/v1/submit-support-ticket
  turnstileSiteKey: '', // PUBLIC Cloudflare Turnstile site key
  // Optional if support.html does not already expose its logged-in Supabase client.
  supabaseUrl: '', // e.g. https://YOUR-PROJECT.supabase.co
  supabaseAnonKey: '' // Publishable/anon key (never a service-role key)
};
