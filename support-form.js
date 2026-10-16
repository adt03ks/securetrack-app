
/*
 * SECURETRACK OP — TECHNICAL SUPPORT
 * OmniPresence Branding, LLC
 *
 * Public visitors: Manual contact information.
 * Signed-in employees: Verified Supabase profile.
 *
 * Employee names are locked.
 * Contact details remain editable.
 */

(() => {
  'use strict';

  const form = document.getElementById('st-support-form');
  if (!form) return;

  const cfg = window.SECURETRACK_SUPPORT || {};

  const message = document.getElementById('st-ticket-result');
  const button = document.getElementById('st-submit');
  const status = document.getElementById('st-profile-status');

  const field = name => form.elements.namedItem(name);

  const nameInput = field('name');
  const emailInput = field('email');
  const phoneInput = field('phone');

  let client = null;
  let accessToken = '';
  let captchaToken = '';
  let verifiedName = '';
  let authenticated = false;
  let profileReady = false;
  let submitting = false;
  let captchaReady = false;

  const say = text => {
    if (message) message.textContent = text;
  };

  const displayStatus = text => {
    if (status) status.textContent = text;
  };

  const setNameLocked = locked => {
    if (!nameInput) return;

    nameInput.readOnly = locked;

    if (locked) {
      nameInput.setAttribute('aria-readonly', 'true');
      nameInput.title =
        'Verified employee name cannot be changed.';
    } else {
      nameInput.removeAttribute('aria-readonly');
      nameInput.removeAttribute('title');
    }
  };

  function updateButton() {
    if (button) {
      button.disabled =
        submitting ||
        !profileReady ||
        !captchaReady ||
        !cfg.functionUrl ||
        !cfg.turnstileSiteKey;
    }
  }

  function getClient() {
    if (
      window.securetrackSupabaseClient?.auth?.getSession
    ) {
      return window.securetrackSupabaseClient;
    }

    if (window.supabaseClient?.auth?.getSession) {
      return window.supabaseClient;
    }

    if (
      cfg.supabaseUrl &&
      cfg.supabaseAnonKey &&
      window.supabase?.createClient
    ) {
      return window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false
          }
        }
      );
    }

    return null;
  }

  function setGuestMode() {
    authenticated = false;
    accessToken = '';
    verifiedName = '';

    setNameLocked(false);

    profileReady = true;

    displayStatus(
      'Guest support request: enter your contact information.'
    );

    updateButton();
  }

  function setProfileError(text) {
    authenticated = false;
    accessToken = '';
    verifiedName = '';

    profileReady = false;
    setNameLocked(true);

    displayStatus(text);
    updateButton();
  }

  function buildFullName(profile) {
    const name = [
      profile.first_name,
      profile.middle_initial,
      profile.last_name
    ]
      .filter(
        part =>
          typeof part === 'string' &&
          part.trim()
      )
      .map(part => part.trim())
      .join(' ')
      .trim();

    return name ||
      String(profile.display_name || '').trim();
  }

  async function profilePrefill() {
    profileReady = false;
    updateButton();

    displayStatus('Checking SecureTrack employee account…');

    try {
      client = getClient();

      if (!client) {
        setProfileError(
          'Employee account verification is unavailable. Please refresh or contact support.'
        );
        return;
      }

      const {
        data: { session },
        error: sessionError
      } = await client.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session?.access_token) {
        setGuestMode();
        return;
      }

      const {
        data: { user },
        error: authError
      } = await client.auth.getUser(
        session.access_token
      );

      if (authError || !user) {
        setProfileError(
          'Your SecureTrack session could not be verified. Please sign in again.'
        );
        return;
      }

      authenticated = true;

      const {
        data: profile,
        error: profileError
      } = await client
        .from('profiles')
        .select(`
          id,
          first_name,
          middle_initial,
          last_name,
          display_name,
          email,
          phone_number
        `)
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        setProfileError(
          'Your employee profile could not be loaded. Please contact an administrator.'
        );
        return;
      }

      const fullName = buildFullName(profile);

      if (!fullName) {
        setProfileError(
          'Your employee profile has no verified name. Please contact an administrator.'
        );
        return;
      }

      accessToken = session.access_token;
      verifiedName = fullName;
      authenticated = true;

      // Verified employee name: read-only.
      nameInput.value = fullName;
      setNameLocked(true);

      // Editable contact information.
      if (emailInput && !emailInput.value.trim()) {
        emailInput.value =
          profile.email || user.email || '';
      }

      if (phoneInput && !phoneInput.value.trim()) {
        phoneInput.value =
          profile.phone_number || '';
      }

      // Organization is not stored in profiles.
      // The field remains editable.

      profileReady = true;

      displayStatus(
        `Signed in as ${fullName}. ` +
        'Your verified name is locked. ' +
        'Email, phone, and other ticket details may be edited.'
      );

      updateButton();

    } catch (error) {
      console.warn(
        'SecureTrack profile initialization failed:',
        error?.message || error
      );

      setProfileError(
        'Unable to verify your employee profile. Please refresh the page or contact support.'
      );
    }
  }

  // Start profile detection.
  const initialProfileLoad = profilePrefill();

  // Recheck after returning to the browser tab.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !submitting && !authenticated) {
      profilePrefill();
    }
  });

  // Verify that ticket submission is configured.
  if (!cfg.functionUrl || !cfg.turnstileSiteKey) {
    profileReady = false;
    updateButton();

    say(
      'Online ticket submission is being configured. ' +
      'Email admin@opbrandingllc.com or call (877) 610-9996.'
    );

    return;
  }

  // Initialize Cloudflare Turnstile.
  function initializeTurnstile() {
    if (!window.turnstile) {
      say('Verification is unavailable. Please refresh.');
      return;
    }

    try {
      window.turnstile.render('#st-turnstile', {
        sitekey: cfg.turnstileSiteKey,

        callback: token => {
          captchaToken = token;
          captchaReady = true;
          updateButton();
        },

        'expired-callback': () => {
          captchaToken = '';
          captchaReady = false;
          updateButton();
        },

        'error-callback': () => {
          captchaToken = '';
          captchaReady = false;
          updateButton();

          say(
            'Cloudflare verification failed. Please retry.'
          );
        }
      });
    } catch (error) {
      console.error('Turnstile initialization failed', error);
      say('Verification could not initialize.');
    }
  }

  if (window.turnstile?.render) {
    initializeTurnstile();
  } else {
    const script = document.createElement('script');

    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

    script.async = true;
    script.onload = initializeTurnstile;

    script.onerror = () => {
      say(
        'Verification cannot load. Email ' +
        'admin@opbrandingllc.com or call (877) 610-9996.'
      );
    };

    document.head.appendChild(script);
  }

  // Submit support request.
  form.addEventListener('submit', async event => {
    event.preventDefault();

    await initialProfileLoad;

    if (submitting) return;

    if (!profileReady) {
      say(
        'Employee verification is incomplete. Please refresh.'
      );
      return;
    }

    if (!captchaToken) {
      say(
        'Please complete Cloudflare verification.'
      );
      return;
    }

    submitting = true;
    updateButton();

    say('Submitting support ticket securely…');

    try {
      if (authenticated) {
        const {
          data: { session },
          error: sessionError
        } = await client.auth.getSession();

        if (sessionError || !session?.access_token) {
          throw new Error(
            'Your employee session expired. Please sign in again.'
          );
        }

        accessToken = session.access_token;

        // Preserve the verified employee name.
        nameInput.value = verifiedName;
      }

      const values = Object.fromEntries(
        new FormData(form)
      );

      if (authenticated) {
        values.name = verifiedName;
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (authenticated && accessToken) {
        headers.Authorization =
          'Bearer ' + accessToken;
      }

      const response = await fetch(cfg.functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...values,
          captchaToken
        })
      });

      const payload = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        !payload.ok ||
        !payload.ticketNumber
      ) {
        throw new Error(
          payload.error ||
          'Unable to submit your request.'
        );
      }

      const ticketNumber = payload.ticketNumber;

      form.reset();

      if (authenticated) {
        nameInput.value = verifiedName;

        // Refill contact details after successful submission.
        if (client) {
          const { data: { user } } =
            await client.auth.getUser();

          const { data: profile } = await client
            .from('profiles')
            .select('email,phone_number')
            .eq('id', user?.id || '')
            .maybeSingle();

          if (emailInput) {
            emailInput.value =
              profile?.email || user?.email || '';
          }

          if (phoneInput) {
            phoneInput.value =
              profile?.phone_number || '';
          }
        }
      }

      say(
        `Request received successfully. ` +
        `Your ticket number is ${ticketNumber}. ` +
        'Please save this number for reference.'
      );

    } catch (error) {
      say(
        `Request not confirmed. ` +
        `${error.message || 'Please try again.'} ` +
        'Email admin@opbrandingllc.com or ' +
        'call (877) 610-9996 for assistance.'
      );

    } finally {
      submitting = false;
      captchaToken = '';
      captchaReady = false;

      if (window.turnstile?.reset) {
        window.turnstile.reset('#st-turnstile');
      }

      updateButton();
    }
  });

})();
