(() => {
  'use strict';
  const form = document.getElementById('st-support-form');
  if (!form) return;
  const message = document.getElementById('st-ticket-result');
  const button = document.getElementById('st-submit');
  const status = document.getElementById('st-profile-status');
  const nameInput = form.elements.namedItem('name');
  const cfg = window.SECURETRACK_SUPPORT || {};
  let captchaToken = '';
  let accessToken = '';
  let client = null;
  const say = text => { message.textContent = text; };
  const displayStatus = text => { status.textContent = text; };

  function getClient() {
    // Site integrations can set window.securetrackSupabaseClient to their existing client.
    if (window.securetrackSupabaseClient?.auth?.getSession) return window.securetrackSupabaseClient;
    if (window.supabaseClient?.auth?.getSession) return window.supabaseClient;
    if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient) {
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    }
    return null;
  }

  async function profilePrefill() {
    try {
      client = getClient();
      if (!client) { displayStatus('Guest support request: enter your contact information.'); return; }
      const { data: { session } = {} } = await client.auth.getSession();
      if (!session?.access_token) { displayStatus('Guest support request: enter your contact information.'); return; }
      // Validate session with Supabase Auth, not just a local copy of its metadata.
      const { data: { user } = {}, error } = await client.auth.getUser(session.access_token);
      if (error || !user) { displayStatus('Guest support request: enter your contact information.'); return; }
      // Match Supabase Auth user ID to public.profiles.id.
      // The Edge Function repeats this lookup using the verified user ID.
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('first_name,middle_initial,last_name,display_name,email,phone_number')
        .eq('id', user.id)
        .single();
      if (profileError || !profile) {
        accessToken = session.access_token;
        nameInput.value = '';
        nameInput.readOnly = true;
        button.disabled = true;
        displayStatus('Signed-in profile could not be loaded. Please contact an administrator.');
        return;
      }
      const fullName = [profile.first_name, profile.middle_initial, profile.last_name]
        .filter(part => typeof part === 'string' && part.trim())
        .map(part => part.trim()).join(' ').trim()
        || (profile.display_name || '').trim();
      if (!fullName) {
        button.disabled = true;
        nameInput.readOnly = true;
        displayStatus('Your employee profile has no verified name. Please contact an administrator.');
        return;
      }
      accessToken = session.access_token;
      nameInput.value = fullName;
      nameInput.readOnly = true;
      nameInput.setAttribute('aria-readonly', 'true');
      form.elements.namedItem('email').value = profile.email || user.email || '';
      form.elements.namedItem('phone').value = profile.phone_number || '';
      // Organization is not stored on public.profiles; leave editable.
      displayStatus('Signed in as ' + fullName.trim() + '. Your account name is locked; other fields may be changed for this ticket.');
    } catch (e) {
      console.warn('Support account prefill unavailable', e);
      displayStatus('Guest support request: enter your contact information.');
    }
  }

  const ready = profilePrefill();
  if (!cfg.functionUrl || !cfg.turnstileSiteKey) {
    button.disabled = true;
    say('Online ticket submission is being configured. Email admin@securetrackop.com or call (877) 610-9996.');
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.onload = () => window.turnstile.render('#st-turnstile', {
    sitekey: cfg.turnstileSiteKey,
    callback: token => { captchaToken = token; },
    'expired-callback': () => { captchaToken = ''; }
  });
  script.onerror = () => say('Verification cannot load. Please use our support email or phone.');
  document.head.appendChild(script);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    await ready;
    if (!captchaToken) { say('Please complete verification before submitting.'); return; }
    button.disabled = true;
    say('Submitting securely…');
    try {
      // Renew and revalidate the authenticated session before each submission.
      if (accessToken && client) {
        const {data:{session}={}} = await client.auth.getSession();
        accessToken = session?.access_token || '';
        if (!accessToken) throw new Error('Your session expired. Please sign in again before submitting.');
      }
      const values = Object.fromEntries(new FormData(form));
      const headers = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
      const response = await fetch(cfg.functionUrl, {
        method: 'POST', headers, body: JSON.stringify({...values, captchaToken})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.ticketNumber) throw new Error(payload.error || 'Unable to submit request.');
      form.reset();
      if (nameInput.readOnly) nameInput.value = payload.requesterName || nameInput.value;
      say(`Request received. Ticket number: ${payload.ticketNumber}. Save this number for reference.`);
    } catch (err) {
      say(`Request not confirmed. ${err.message || ''} Email admin@securetrackop.com or call (877) 610-9996.`);
    } finally {
      button.disabled = false;
      captchaToken = '';
      if (window.turnstile) window.turnstile.reset('#st-turnstile');
    }
  });
})();
