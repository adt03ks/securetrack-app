
/*
  SECURETRACK OP
  Public Security Concern Reporting Form

  Routes public security reports through the
  existing Supabase support-ticket Edge Function.

  No SecureTrack user login required.
*/

(() => {
  'use strict';

  const form = document.getElementById('securityConcernForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);

  const submit = $('securitySubmit');
  const status = $('securityFormStatus');
  const captchaRoot = $('securityCaptcha');

  const config =
    window.SECURETRACK_SUPPORT ||
    window.SECURETRACK_SUPPORT_CONFIG ||
    window.SUPPORT_CONFIG ||
    {};

  const functionUrl = config.functionUrl;
  const siteKey = config.turnstileSiteKey;

  let widgetId = null;
  let captchaToken = '';
  let inFlight = false;

  function message(text, error = false) {
    status.hidden = false;
    status.classList.toggle('error', error);
    status.textContent = text;
    status.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }

  function updateButton() {
    submit.disabled =
      inFlight || !functionUrl || !captchaToken;

    submit.textContent = inFlight
      ? 'Submitting securely…'
      : 'Submit Security Concern →';
  }

  function initCaptcha() {
    if (!siteKey || !functionUrl) {
      captchaRoot.textContent =
        'Security reporting is temporarily unavailable. ' +
        'Please contact admin@securetrackop.com ' +
        'without sharing confidential details.';

      updateButton();
      return;
    }

    if (!window.turnstile?.render) {
      captchaRoot.textContent =
        'Unable to load verification. ' +
        'Please check your network settings ' +
        'and refresh this page.';
      return;
    }

    captchaRoot.replaceChildren();

    const mount = document.createElement('div');
    captchaRoot.appendChild(mount);

    widgetId = window.turnstile.render(mount, {
      sitekey: siteKey,
      theme: 'dark',

      callback(token) {
        captchaToken = token;
        updateButton();
      },

      'expired-callback'() {
        captchaToken = '';
        updateButton();
      },

      'error-callback'() {
        captchaToken = '';
        updateButton();
      }
    });
  }

  function loadCaptcha() {
    if (window.turnstile?.render) {
      return initCaptcha();
    }

    const script = document.createElement('script');

    script.src =
      'https://challenges.cloudflare.com/' +
      'turnstile/v0/api.js?render=explicit';

    script.async = true;
    script.defer = true;

    script.addEventListener('load', initCaptcha);

    script.addEventListener('error', () => {
      captchaRoot.textContent =
        'Verification could not load. ' +
        'Please retry later.';
    });

    document.head.appendChild(script);
  }

  $('concernDetails').addEventListener('input', () => {
    $('detailCount').textContent =
      String($('concernDetails').value.length);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (inFlight) return;

    status.hidden = true;

    if (!form.reportValidity()) return;

    if (!captchaToken) {
      message(
        'Complete the security verification before submitting.',
        true
      );
      return;
    }

    const type = $('concernType').value;
    const urgency = $('concernUrgency').value;
    const summary = $('concernSubject').value.trim();
    const details = $('concernDetails').value.trim();

    if (summary.length < 5 || details.length < 20) {
      message(
        'Please provide a summary of at least 5 characters ' +
        'and a description of at least 20 characters.',
        true
      );
      return;
    }

    const payload = {
      name: $('reporterName').value.trim(),
      email: $('reporterEmail').value.trim(),
      phone: $('reporterPhone').value.trim(),
      organization: $('reporterOrg').value.trim(),

      category: 'other',

      priority:
        urgency === 'Critical' || urgency === 'High'
          ? 'high'
          : 'normal',

      subject: `[SECURITY CONCERN] ${summary}`,

      description:
        `SECURITY CONCERN REPORT\n` +
        `Type: ${type}\n` +
        `Reporter-assessed urgency: ${urgency}\n\n` +
        details,

      captchaToken
    };

    if (
      payload.subject.length > 200 ||
      payload.description.length > 4000
    ) {
      message(
        'Your report is too long. ' +
        'Please shorten your description.',
        true
      );
      return;
    }

    inFlight = true;
    updateButton();

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (config.supabaseAnonKey) {
        headers.apikey = config.supabaseAnonKey;
      }

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'omit',
        cache: 'no-store'
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || data.ok !== true) {
        throw new Error('Ticket could not be accepted.');
      }

      form.reset();
      $('detailCount').textContent = '0';

      message(
        'Your security concern has been submitted successfully.\n' +
        'Reference number: ' +
        (data.ticketNumber || 'Assigned by administration') +
        '\nPlease save this reference for your records. ' +
        'Our administration team will review your concern; ' +
        'this confirmation does not indicate resolution.'
      );

    } catch (error) {
      message(
        'We could not confirm that your report was received. ' +
        'Please do not submit repeatedly. ' +
        'Contact admin@securetrackop.com or (877) 610-9996 ' +
        'and reference the time of your attempt. ' +
        'Do not send sensitive details by email.',
        true
      );

    } finally {
      inFlight = false;
      captchaToken = '';

      if (
        widgetId !== null &&
        window.turnstile?.reset
      ) {
        window.turnstile.reset(widgetId);
      }

      updateButton();
    }
  });

  updateButton();
  loadCaptcha();
})();
