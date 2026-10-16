
/*
 * SECURETRACK OP
 * Secure Password Recovery
 * OmniPresence Branding, LLC
 */

(async function () {
  'use strict';

  const form = document.getElementById('resetPasswordForm');
  const passwordInput = document.getElementById('newPassword');
  const confirmInput = document.getElementById('confirmPassword');
  const button = document.getElementById('updatePasswordButton');
  const result = document.getElementById('passwordResetResult');

  if (!form || !passwordInput || !confirmInput ||
      !button || !result) return;

  const db = window.SecureTrackManager?.db;

  function show(text, success = false) {
    result.className =
      'result show ' + (success ? 'success' : 'error');
    result.textContent = text;
  }

  let recoveryReady = false;
  let recoveryUserId = null;

  button.disabled = true;

  if (!db?.auth) {
    show('SecureTrack authentication is unavailable.');
    return;
  }

  // Prevent browser autofill.
  passwordInput.value = '';
  confirmInput.value = '';

  const query = new URLSearchParams(location.search);
  const hash = new URLSearchParams(
    location.hash.replace(/^#/, '')
  );

  const recoveryType =
    query.get('type') || hash.get('type');

  // Mark recovery as ready only after a verified session.
  async function authorizeRecovery(session) {
    if (!session?.access_token || !session?.user?.id) {
      return false;
    }

    const { data, error } =
      await db.auth.getUser(session.access_token);

    if (error || !data?.user) return false;

    recoveryUserId = data.user.id;
    recoveryReady = true;
    button.disabled = false;

    show(
      'Recovery verified. You may now create a new password.',
      true
    );

    return true;
  }

  // Supabase can emit this after processing the recovery URL.
  const { data: listener } =
    db.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Avoid awaiting Supabase calls within the callback.
        setTimeout(() => {
          authorizeRecovery(session);
        }, 0);
      }
    });

  try {
    // Supports recovery links using token_hash.
    const tokenHash = query.get('token_hash');

    if (tokenHash && recoveryType === 'recovery') {
      const { data, error } = await db.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'recovery'
      });

      if (error) throw error;

      await authorizeRecovery(data.session);

    } else if (
      hash.get('access_token') &&
      hash.get('refresh_token') &&
      recoveryType === 'recovery'
    ) {
      // Supports fragment-based recovery links.
      const { data, error } = await db.auth.setSession({
        access_token: hash.get('access_token'),
        refresh_token: hash.get('refresh_token')
      });

      if (error) throw error;

      await authorizeRecovery(data.session);

    } else if (query.get('code')) {
      // Supports PKCE authorization-code links.
      // Supabase may already have exchanged this code
      // during client initialization.
      if (!recoveryReady) {
        const { data, error } =
          await db.auth.exchangeCodeForSession(
            query.get('code')
          );

        if (error) throw error;

        await authorizeRecovery(data.session);
      }
    }

    // Give an SDK-handled PASSWORD_RECOVERY event
    // a brief opportunity to finish initialization.
    if (!recoveryReady) {
      await new Promise(resolve =>
        setTimeout(resolve, 800)
      );
    }

    if (!recoveryReady) {
      show(
        'No verified password-recovery session was found. ' +
        'Request a fresh password-reset email.'
      );
    } else {
      // Remove recovery credentials from the address bar.
      history.replaceState(
        null,
        '',
        location.pathname
      );
    }

  } catch (error) {
    console.error(
      'SecureTrack recovery initialization failed:',
      error.message
    );

    show(
      'This recovery link could not be verified. ' +
      'It may have expired or already been used. ' +
      'Please request a new password-reset email.'
    );
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!recoveryReady || !recoveryUserId) {
      show('A verified recovery link is required.');
      return;
    }

    const password = passwordInput.value;
    const confirmation = confirmInput.value;

    if (password.length < 8) {
      show('Use a password with at least 8 characters.');
      return;
    }

    if (password !== confirmation) {
      show('The passwords do not match.');
      return;
    }

    button.disabled = true;
    button.textContent = 'Updating Password…';

    try {
      const { data: { user }, error: userError } =
        await db.auth.getUser();

      if (userError || !user ||
          user.id !== recoveryUserId) {
        throw new Error(
          'Recovery session has expired or changed.'
        );
      }

      const { error } = await db.auth.updateUser({
        password
      });

      if (error) throw error;

      recoveryReady = false;

      passwordInput.value = '';
      confirmInput.value = '';

      show(
       show(
  'Your password has been updated successfully. ' +
  'You will now return to SecureTrack Login.',
  true
);
      );

      button.textContent = 'Password Updated';

      await db.auth.signOut();

      setTimeout(() => {
       window.location.replace('/login.html?password_reset=success');
      }, 1800);

    } catch (error) {
      show(
        error.message ||
        'Unable to update the password.'
      );

      button.disabled = false;
      button.textContent = 'Update Password';
    }
  });

  window.addEventListener('pagehide', () => {
    listener?.subscription?.unsubscribe();
  });

})();
