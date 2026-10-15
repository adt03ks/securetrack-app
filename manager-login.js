
/*
 * SECURETRACK OP — MANAGER LOGIN
 * OmniPresence Branding, LLC
 *
 * Features:
 * - Secure Supabase authentication
 * - Existing manager authorization
 * - Retry after invalid credentials
 * - Prominent password reset after 2 failures
 * - Forgot Password available at all times
 * - Custom domain password recovery
 */

(async function () {
  "use strict";

  const STM = window.SecureTrackManager;

  const form = document.getElementById("managerLoginForm");
  const result = document.getElementById("loginResult");
  const button = document.getElementById("loginButton");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

  const forgotPasswordPanel =
    document.getElementById("forgotPasswordPanel");

  const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

  const resetEmail =
    document.getElementById("resetEmail");

  const sendResetButton =
    document.getElementById("sendResetButton");

  const cancelResetButton =
    document.getElementById("cancelResetButton");

  const resetRequestResult =
    document.getElementById("resetRequestResult");

  if (!STM?.db?.auth || !form || !button || !result) {
    console.error("SecureTrack login initialization failed.");
    return;
  }

  let failedAttempts = 0;
  let loginInProgress = false;

  const resetRedirectUrl =
    "https://securetrackop.com/reset-password.html";

  // ==========================================
  // DISPLAY MESSAGES
  // ==========================================

  function showLoginMessage(text, success = false) {
    result.className =
      "result show " + (success ? "success" : "error");

    result.textContent = text;
  }

  function showResetMessage(text, success = false) {
    resetRequestResult.className =
      "result show " + (success ? "success" : "error");

    resetRequestResult.textContent = text;
  }

  // ==========================================
  // PASSWORD RECOVERY PANEL
  // ==========================================

  function openPasswordRecovery() {
    forgotPasswordPanel.hidden = false;

    const email = emailInput.value.trim();

    if (email) {
      resetEmail.value = email;
    }

    resetRequestResult.className = "result";
    resetRequestResult.textContent = "";

    resetEmail.focus();

    forgotPasswordPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }

  function closePasswordRecovery() {
    forgotPasswordPanel.hidden = true;

    resetRequestResult.className = "result";
    resetRequestResult.textContent = "";
  }

  // ==========================================
  // PROMINENT RESET BUTTON
  // ==========================================

  const retryResetButton = document.createElement("button");

  retryResetButton.type = "button";
  retryResetButton.id = "retryResetPasswordButton";
  retryResetButton.className = "primary-btn";

  retryResetButton.textContent = "Reset Password";

  retryResetButton.hidden = true;

  retryResetButton.style.marginTop = "12px";
  retryResetButton.style.width = "100%";

  result.insertAdjacentElement(
    "afterend",
    retryResetButton
  );

  retryResetButton.addEventListener(
    "click",
    openPasswordRecovery
  );

  forgotPasswordButton.addEventListener(
    "click",
    openPasswordRecovery
  );

  cancelResetButton.addEventListener(
    "click",
    closePasswordRecovery
  );

  // ==========================================
  // CHECK EXISTING SESSION
  // ==========================================

  try {
    const existingSession = await STM.getSession();

    if (existingSession) {
      const userId = existingSession.user?.id;

      if (userId) {
        const { data: profile } = await STM.db
          .from("manager_profiles")
          .select("user_id, role, is_active")
          .eq("user_id", userId)
          .maybeSingle();

        if (profile?.is_active) {
          window.location.replace("manager.html");
          return;
        }
      }
    }
  } catch (error) {
    console.warn(
      "Existing manager session could not be verified.",
      error
    );
  }

  // ==========================================
  // LOGIN SUBMISSION
  // ==========================================

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (loginInProgress) return;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginMessage(
        "Enter your email address and password."
      );
      return;
    }

    loginInProgress = true;

    button.disabled = true;
    button.textContent = "Signing in…";

    result.className = "result";
    result.textContent = "";

    let credentialsRejected = false;

    try {
      const { data, error } =
        await STM.db.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        credentialsRejected =
          error.message?.toLowerCase()
            .includes("invalid login credentials") ||
          error.code === "invalid_credentials";

        throw error;
      }

      const { data: profile, error: profileError } =
        await STM.db
          .from("manager_profiles")
          .select("user_id, role, is_active")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (
        profileError ||
        !profile ||
        !profile.is_active
      ) {
        await STM.db.auth.signOut();

        showLoginMessage(
          "Your account does not have active " +
          "SecureTrack management access. " +
          "Contact your administrator."
        );

        return;
      }

      failedAttempts = 0;
      retryResetButton.hidden = true;

      window.location.replace("manager.html");

    } catch (error) {
      if (credentialsRejected) {
        failedAttempts++;

        // Clear incorrect password, preserve email.
        passwordInput.value = "";

        if (failedAttempts === 1) {
          showLoginMessage(
            "Unable to verify your credentials. " +
            "Check your email and password, then try again."
          );

          button.textContent = "Try Again";

        } else {
          showLoginMessage(
            "Your credentials could not be verified. " +
            "You may try again or use Reset Password " +
            "to recover your account."
          );

          retryResetButton.hidden = false;
          button.textContent = "Try Again";
        }

        passwordInput.focus();

      } else {
        showLoginMessage(
          "Unable to complete sign-in. " +
          "Please try again or contact support."
        );

        console.warn(
          "SecureTrack login request failed:",
          error?.message
        );
      }

    } finally {
      loginInProgress = false;
      button.disabled = false;

      if (
        failedAttempts === 0 &&
        !result.textContent
      ) {
        button.textContent = "Sign In to SecureTrack";
      } else if (failedAttempts > 0) {
        button.textContent = "Try Again";
      } else {
        button.textContent = "Sign In to SecureTrack";
      }
    }
  });

  // ==========================================
  // SEND PASSWORD RESET EMAIL
  // ==========================================

  forgotPasswordForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      const email =
        resetEmail.value.trim().toLowerCase();

      if (!email) {
        showResetMessage(
          "Enter the email address for your account."
        );
        return;
      }

      sendResetButton.disabled = true;
      sendResetButton.textContent =
        "Sending Reset Email…";

      resetRequestResult.className = "result";
      resetRequestResult.textContent = "";

      try {
        const { error } =
          await STM.db.auth.resetPasswordForEmail(
            email,
            {
              redirectTo: resetRedirectUrl
            }
          );

        if (error) {
          throw error;
        }

        showResetMessage(
          "If an account exists for that email, " +
          "password recovery instructions have been sent. " +
          "Check your inbox and spam folder.",
          true
        );

      } catch (error) {
        console.warn(
          "Password recovery request failed:",
          error?.message
        );

        showResetMessage(
          "We could not process your request right now. " +
          "Please try again later or contact " +
          "admin@securetrackop.com."
        );

      } finally {
        sendResetButton.disabled = false;

        sendResetButton.textContent =
          "Send Password Reset Email";
      }
    }
  );

})();
