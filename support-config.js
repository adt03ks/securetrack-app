// PUBLIC configuration only. Do not include service-role keys or Turnstile secret keys.
window.SECURETRACK_SUPPORT = {
  functionUrl: '', // https://gqmwfvezhhyukpvfbjsr.supabase.co/functions/v1/submit-support-ticket
  turnstileSiteKey: '', // 0x4AAAAAAFX4SQ3QOkxp46JT
  // Optional if support.html does not already expose its logged-in Supabase client.
  supabaseUrl: '', // https://gqmwfvezhhyukpvfbjsr.supabase.co
  supabaseAnonKey: '' // sb_publishable_g6xeeoIhbuhgpp70ugL2gg_Zafr1Lg1
};
