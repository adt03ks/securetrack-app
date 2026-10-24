
/*
 * SECURETRACK OP
 * Operations Hub Authentication & Password Recovery
 * OmniPresence Branding, LLC
 *
 * Manager Portal visibility:
 * Manager, Director, Administrator only.
 */

(() => {
  "use strict";

  const page = document.body?.dataset?.page || "";
  const config = window.SECURETRACK_CONFIG;

  function showFatal(message) {
    const loginMessage =
      document.getElementById("loginMessage");
    const hubError =
      document.getElementById("hubError");
    const loading =
      document.getElementById("loadingPanel");

    if (loginMessage) {
      loginMessage.textContent = message;
      loginMessage.classList.add("error");
    }

    if (hubError) {
      hubError.hidden = false;
      hubError.textContent = message;
    }

    if (loading) {
      loading.hidden = true;
    }
  }

  if (!window.supabase?.createClient) {
    showFatal(
      "SecureTrack could not load the Supabase client."
    );
    return;
  }

  if (!config?.supabaseUrl ||
      !config?.supabaseAnonKey) {
    showFatal(
      "SecureTrack configuration is missing. Check config.js."
    );
    return;
  }

  const db = window.supabase.createClient(
    config.supabaseUrl,
    config.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  window.SECURETRACK_DB = db;

  const RESET_URL =
    "https://securetrackop.com/reset-password.html";

  // =====================================================
  // ROLES AND MODULE ACCESS
  // =====================================================

  const ROLE_LABELS = {
    officer: "Officer",
    senior_officer: "Senior Officer",
    team_lead: "Team Lead",
    manager: "Manager",
    director: "Director",
    admin: "Administrator"
  };

  const MODULE_ACCESS = {
    devices: [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    incidents: [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    endOfShift: [
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    property: [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    assignments: [
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    overtime: [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    notifications: [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ],

    // MANAGEMENT ONLY
    manager: [
      "manager",
      "director",
      "admin"
    ]
  };

  function hasAnyRole(userRoles, allowedRoles) {
    if (!Array.isArray(userRoles) ||
        !Array.isArray(allowedRoles)) {
      return false;
    }

    return allowedRoles.some(
      role => userRoles.includes(role)
    );
  }

  function normalizeRoles(roles) {
    return [...new Set(
      (Array.isArray(roles) ? roles : [])
        .map(role =>
          String(role || "")
            .trim()
            .toLowerCase()
        )
        .filter(Boolean)
    )];
  }

  // =====================================================
  // SAFE POST-LOGIN NAVIGATION
  // =====================================================

  function safeNextFromUrl() {
    const params = new URLSearchParams(
      window.location.search
    );

    const next = String(
      params.get("next") || ""
    ).trim();

    if (!next) return "";

    if (
      next.includes("://") ||
      next.startsWith("//") ||
      next.startsWith("/") ||
      next.includes("..") ||
      next.includes("\\") ||
      next.includes(":")
    ) {
      return "";
    }

    if (
      !/^[a-zA-Z0-9_/-]+\.html(?:\?[a-zA-Z0-9_=&%-]*)?$/.test(next)
    ) {
      return "";
    }

    return next;
  }

  // =====================================================
  // SESSION AND PROFILE
  // =====================================================

  async function getSessionUser() {
    const { data, error } =
      await db.auth.getSession();

    if (error) throw error;

    return data.session?.user || null;
  }

  async function loadCurrentProfile(userId) {
    const [profileResult, rolesResult] =
      await Promise.all([
        db.from("profiles")
          .select(
            "id, display_name, employee_number, email, is_active"
          )
          .eq("id", userId)
          .single(),

        db.from("user_roles")
          .select("role")
          .eq("user_id", userId)
      ]);

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (rolesResult.error) {
      throw rolesResult.error;
    }

    return {
      profile: profileResult.data,
      roles: normalizeRoles(
        (rolesResult.data || [])
          .map(item => item.role)
      )
    };
  }

  async function validateUser(user) {
    const { profile, roles } =
      await loadCurrentProfile(user.id);

    if (!profile?.is_active) {
      await db.auth.signOut();

      throw new Error(
        "This SecureTrack account is inactive."
      );
    }

    if (!roles.length) {
      await db.auth.signOut();

      throw new Error(
        "Your account does not have a SecureTrack role assigned."
      );
    }

    return { profile, roles };
  }

  // =====================================================
  // LOGIN AND PASSWORD RECOVERY
  // =====================================================

  async function initLogin() {
    const form =
      document.getElementById("loginForm");

    const button =
      document.getElementById("loginButton");

    const message =
      document.getElementById("loginMessage");

    const emailInput =
      document.getElementById("email");

    const passwordInput =
      document.getElementById("password");

    const forgotButton =
      document.getElementById(
        "forgotPasswordButton"
      );

    const retryResetButton =
      document.getElementById(
        "retryResetPasswordButton"
      );

    const recoveryPanel =
      document.getElementById(
        "forgotPasswordPanel"
      );

    const recoveryForm =
      document.getElementById(
        "forgotPasswordForm"
      );

    const resetEmail =
      document.getElementById("resetEmail");

    const sendResetButton =
      document.getElementById(
        "sendResetButton"
      );

    const cancelResetButton =
      document.getElementById(
        "cancelResetButton"
      );

    const resetResult =
      document.getElementById(
        "resetRequestResult"
      );

    if (
      !form ||
      !button ||
      !message ||
      !emailInput ||
      !passwordInput
    ) {
      throw new Error(
        "SecureTrack login form is incomplete."
      );
    }

    let failedAttempts = 0;
    let signingIn = false;

    const next = safeNextFromUrl();

    function loginMessage(text, isError = true) {
      message.textContent = text;
      message.classList.toggle(
        "error",
        isError
      );
    }

    function recoveryMessage(
      text,
      isError = false
    ) {
      if (!resetResult) return;

      resetResult.textContent = text;
      resetResult.classList.toggle(
        "error",
        isError
      );
    }

    function openRecovery() {
      if (!recoveryPanel || !resetEmail) {
        return;
      }

      recoveryPanel.hidden = false;
      resetEmail.value =
        emailInput.value.trim();

      recoveryMessage("");
      resetEmail.focus();
    }

    function closeRecovery() {
      if (recoveryPanel) {
        recoveryPanel.hidden = true;
      }

      recoveryMessage("");
    }

    if (forgotButton) {
      forgotButton.addEventListener(
        "click",
        openRecovery
      );
    }

    if (retryResetButton) {
      retryResetButton.addEventListener(
        "click",
        openRecovery
      );
    }

    if (cancelResetButton) {
      cancelResetButton.addEventListener(
        "click",
        closeRecovery
      );
    }

    // =========================================
    // SUCCESSFUL PASSWORD RESET MESSAGE
    // =========================================

    const params = new URLSearchParams(
      location.search
    );

    const passwordWasReset =
      params.get("password_reset") ===
      "success";

    if (passwordWasReset) {
      loginMessage(
        "Your password was updated successfully. " +
        "Sign in with your new password.",
        false
      );

      params.delete("password_reset");

      const remaining = params.toString();

      history.replaceState(
        null,
        "",
        location.pathname +
          (remaining ? "?" + remaining : "")
      );
    }

    // =========================================
    // EXISTING AUTHENTICATED SESSION
    // =========================================

    if (!passwordWasReset) {
      const existingUser =
        await getSessionUser();

      if (existingUser) {
        try {
          await validateUser(existingUser);

          window.location.replace(
            next || "hub.html"
          );

          return;
        } catch {
          // Keep the login form available.
        }
      }
    }

    // =========================================
    // SIGN IN
    // =========================================

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        if (signingIn) return;

        const email = emailInput.value
          .trim()
          .toLowerCase();

        const password =
          passwordInput.value;

        signingIn = true;
        button.disabled = true;
        button.textContent = "SIGNING IN…";

        loginMessage("", false);

        try {
          const { data, error } =
            await db.auth.signInWithPassword({
              email,
              password
            });

          if (error) {
            const invalidCredentials =
              error.code ===
                "invalid_credentials" ||
              /invalid login credentials/i.test(
                error.message || ""
              );

            if (invalidCredentials) {
              failedAttempts++;
              passwordInput.value = "";

              if (failedAttempts >= 2) {
                if (retryResetButton) {
                  retryResetButton.hidden = false;
                }

                loginMessage(
                  "Unable to verify your credentials. " +
                  "Try again or select Reset Password."
                );
              } else {
                loginMessage(
                  "Unable to verify your credentials. " +
                  "Check your email and password, " +
                  "then try again."
                );
              }

              passwordInput.focus();
              return;
            }

            if (error.status === 429) {
              loginMessage(
                "Too many requests. Please wait " +
                "before trying again."
              );
              return;
            }

            throw error;
          }

          if (!data.user) {
            throw new Error(
              "SecureTrack could not verify this account."
            );
          }

          await validateUser(data.user);

          failedAttempts = 0;

          if (retryResetButton) {
            retryResetButton.hidden = true;
          }

          window.location.replace(
            next || "hub.html"
          );

        } catch (error) {
          loginMessage(
            error?.message ||
            "Unable to complete sign-in."
          );

        } finally {
          signingIn = false;
          button.disabled = false;

          button.textContent =
            failedAttempts > 0
              ? "TRY AGAIN"
              : "SIGN IN";
        }
      }
    );

    // =========================================
    // SEND PASSWORD RECOVERY EMAIL
    // =========================================

    if (
      recoveryForm &&
      resetEmail &&
      sendResetButton
    ) {
      recoveryForm.addEventListener(
        "submit",
        async event => {
          event.preventDefault();

          const email = resetEmail.value
            .trim()
            .toLowerCase();

          if (!email) {
            recoveryMessage(
              "Enter your account email.",
              true
            );
            return;
          }

          sendResetButton.disabled = true;
          sendResetButton.textContent =
            "SENDING…";

          recoveryMessage("");

          try {
            const { error } =
              await db.auth.resetPasswordForEmail(
                email,
                {
                  redirectTo: RESET_URL
                }
              );

            if (error) {
              if (error.status === 429) {
                throw new Error(
                  "Too many reset requests. " +
                  "Please wait and try again."
                );
              }

              throw error;
            }

            recoveryMessage(
              "If an account exists for this email, " +
              "password recovery instructions have " +
              "been sent. Check your inbox and " +
              "spam folder."
            );

          } catch (error) {
            console.warn(
              "SecureTrack password recovery request failed:",
              error?.message
            );

            recoveryMessage(
              "Unable to complete the recovery request. " +
              "Please try again later or contact " +
              "admin@securetrackop.com.",
              true
            );

          } finally {
            sendResetButton.disabled = false;

            sendResetButton.textContent =
              "SEND PASSWORD RESET EMAIL";
          }
        }
      );
    }
  }

  // =====================================================
  // HUB MODULE VISIBILITY
  // =====================================================

  function applyModuleVisibility(roles) {
    const verifiedRoles =
      normalizeRoles(roles);

    document.querySelectorAll(
      "#moduleGrid [data-module]"
    ).forEach(card => {
      const moduleName =
        card.dataset.module;

      // No definition = no access.
      const allowedRoles =
        MODULE_ACCESS[moduleName] || [];

      const canAccess =
        hasAnyRole(
          verifiedRoles,
          allowedRoles
        );

      // Preserve the semantic hidden state.
      card.hidden = !canAccess;

      // IMPORTANT:
      // The image-card stylesheet contains
      // display rules that can override [hidden].
      // Apply an inline important rule to
      // unauthorized cards so they remain hidden.

      if (!canAccess) {
        card.style.setProperty(
          "display",
          "none",
          "important"
        );
        card.setAttribute(
          "aria-hidden",
          "true"
        );
      } else {
        // Clear the override for authorized users.
        // The original hub.css layout remains intact.
        card.style.removeProperty("display");
        card.removeAttribute("aria-hidden");
      }
    });
  }

  // =====================================================
  // OPERATIONS HUB
  // =====================================================

  async function initHub() {
    const loading =
      document.getElementById(
        "loadingPanel"
      );

    const moduleGrid =
      document.getElementById(
        "moduleGrid"
      );

    const userName =
      document.getElementById(
        "userName"
      );

    const userRoles =
      document.getElementById(
        "userRoles"
      );

    const logoutButton =
      document.getElementById(
        "logoutButton"
      );

    // =========================================
    // HIDE ALL CARDS UNTIL VERIFIED
    // =========================================

    if (moduleGrid) {
      moduleGrid.hidden = true;
    }

    // =========================================
    // SIGN OUT
    // =========================================

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        async () => {
          logoutButton.disabled = true;
          logoutButton.textContent =
            "Signing out…";

          if (
            window.SecureTrackNotifications &&
            typeof
              window.SecureTrackNotifications
                .destroy === "function"
          ) {
            window.SecureTrackNotifications
              .destroy();
          }

          try {
            const { error } =
              await db.auth.signOut();

            if (error) {
              throw error;
            }

            window.location.replace(
              "login.html"
            );

          } catch (error) {
            console.error(
              "SecureTrack logout failed:",
              error
            );

            logoutButton.disabled = false;
            logoutButton.textContent =
              "Sign Out";
          }
        }
      );
    }

    // =========================================
    // VERIFY AUTHENTICATED USER
    // =========================================

    try {
      const user = await getSessionUser();

      if (!user) {
        window.location.replace(
          "login.html"
        );
        return;
      }

      const { profile, roles } =
        await validateUser(user);

      // =======================================
      // DISPLAY USER DETAILS
      // =======================================

      if (userName) {
        userName.textContent =
          profile.display_name ||
          profile.email ||
          user.email ||
          "SecureTrack User";
      }

      if (userRoles) {
        userRoles.textContent = roles
          .map(
            role =>
              ROLE_LABELS[role] || role
          )
          .join(" • ");
      }

      // =======================================
      // APPLY ALL MODULE PERMISSIONS
      // =======================================

      applyModuleVisibility(roles);

      // Manager Portal access is defined only by:
      // MODULE_ACCESS.manager
      //
      // officer, senior_officer, and team_lead
      // alone cannot activate the Manager card.

      if (loading) {
        loading.hidden = true;
      }

      if (moduleGrid) {
        moduleGrid.hidden = false;
      }

      // =======================================
      // UNIVERSAL NOTIFICATION CENTER
      // ALL AUTHENTICATED ROLES
      // =======================================

      try {
        const notifications =
          window.SecureTrackNotifications;

        const notificationMount =
          document.getElementById(
            "securetrack-notification-mount"
          );

        if (
          notifications &&
          notificationMount
        ) {
          const initialized =
            await notifications.init({
              client: db,
              userId: user.id,
              target:
                "#securetrack-notification-mount"
            });

          if (initialized) {
            console.log(
              "SecureTrack Notification Center active."
            );
          } else {
            console.warn(
              "SecureTrack Notification Center " +
              "could not initialize."
            );
          }
        } else {
          console.warn(
            "SecureTrack notification script " +
            "or mount is unavailable."
          );
        }

      } catch (notificationError) {
        // Notification failures must not
        // prevent access to the Hub.

        console.error(
          "SecureTrack notification initialization error:",
          notificationError
        );
      }

    } catch (error) {
      // Keep the module grid hidden if
      // authentication or authorization fails.
      if (moduleGrid) {
        moduleGrid.hidden = true;
      }

      showFatal(
        error?.message ||
        "SecureTrack could not load your permissions."
      );
    }
  }

  // =====================================================
  // PAGE INITIALIZATION
  // =====================================================

  if (page === "login") {
    initLogin().catch(error =>
      showFatal(
        error?.message ||
        "Unable to initialize login."
      )
    );
  } else if (page === "hub") {
    initHub().catch(error =>
      showFatal(
        error?.message ||
        "Unable to initialize the Operations Hub."
      )
    );
  }

})();
