(() => {
  'use strict';
  const form = document.getElementById('st-support-form');
  if (!form) return;
  const message = document.getElementById('st-ticket-result');
  const button = document.getElementById('st-submit');
  const cfg = window.SECURETRACK_SUPPORT || {};
  let captchaToken = '';
  const say = (s) => { message.textContent = s; };
  if (!cfg.functionUrl || !cfg.turnstileSiteKey) {
    button.disabled = true;
    say('Online ticket submission is being configured. For immediate assistance, email admin@securetrackop.com or call (877) 610-9996.');
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
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!captchaToken) { say('Please complete the verification before submitting.'); return; }
    button.disabled = true;
    say('Submitting securely…');
    try {
      const values = Object.fromEntries(new FormData(form));
      const response = await fetch(cfg.functionUrl, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({...values, captchaToken})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.ok || !payload.ticketNumber) throw new Error(payload.error || 'Unable to submit request.');
      form.reset();
      say(`Your request was received. Ticket number: ${payload.ticketNumber}. Please save this number for reference.`);
    } catch (err) {
      say(`Your request was not confirmed. ${err.message || ''} Please email admin@securetrackop.com or call (877) 610-9996.`);
    } finally {
      button.disabled = false;
      captchaToken = '';
      if (window.turnstile) window.turnstile.reset('#st-turnstile');
    }
  });
})();
