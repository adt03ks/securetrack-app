(async function () {
  const STM = window.SecureTrackManager;

  const existingSession = await STM.getSession();

  if (existingSession) {
    window.location.replace("manager.html");
    return;
  }

  const form = document.getElementById("managerLoginForm");
  const result = document.getElementById("loginResult");
  const button = document.getElementById("loginButton");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const email =
      String(formData.get("email") || "")
        .trim()
        .toLowerCase();

    const password =
      String(formData.get("password") || "");

    button.disabled = true;
    button.textContent = "Signing in…";

    result.className = "result";

    try {

      const {
        data,
        error
      } = await STM.db.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      const { data: profile, error: profileError } =
        await STM.db
          .from("manager_profiles")
          .select("user_id, role, is_active")
          .eq("user_id", data.user.id)
          .single();

      if (
        profileError ||
        !profile ||
        !profile.is_active
      ) {

        await STM.db.auth.signOut();

        throw new Error(
          "This account does not have active SecureTrack management access."
        );
      }

      window.location.replace("manager.html");

    } catch (error) {

      result.className = "result show error";

      result.textContent =
        error.message ||
        "Unable to sign in.";

    } finally {

      button.disabled = false;
      button.textContent = "Sign In to SecureTrack";

    }
  });
  // ==================================================
// FORGOT PASSWORD
// ==================================================

const forgotPasswordButton =
  document.getElementById(
    "forgotPasswordButton"
  );

const forgotPasswordPanel =
  document.getElementById(
    "forgotPasswordPanel"
  );

const forgotPasswordForm =
  document.getElementById(
    "forgotPasswordForm"
  );

const resetEmail =
  document.getElementById(
    "resetEmail"
  );

const sendResetButton =
  document.getElementById(
    "sendResetButton"
  );

const cancelResetButton =
  document.getElementById(
    "cancelResetButton"
  );

const resetRequestResult =
  document.getElementById(
    "resetRequestResult"
  );


forgotPasswordButton.addEventListener(
  "click",
  () => {

    forgotPasswordPanel.hidden =
      false;

    const loginEmail =
      document.getElementById(
        "email"
      ).value.trim();

    if (loginEmail) {
      resetEmail.value =
        loginEmail;
    }

    resetEmail.focus();

  }
);


cancelResetButton.addEventListener(
  "click",
  () => {

    forgotPasswordPanel.hidden =
      true;

    resetRequestResult.className =
      "result";

    resetRequestResult.textContent =
      "";

  }
);


forgotPasswordForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      resetEmail.value
        .trim()
        .toLowerCase();


    sendResetButton.disabled =
      true;

    sendResetButton.textContent =
      "Sending Reset Email…";


    resetRequestResult.className =
      "result";

    resetRequestResult.textContent =
      "";


    try {

      const resetRedirectUrl =
        new URL(
          "reset-password.html",
          window.location.href
        ).href;


      const {
        error
      } =
        await STM.db.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                resetRedirectUrl
            }
          );


      if (error) {
        throw error;
      }


      /*
        Use a generic confirmation message
        instead of revealing whether a
        particular email exists.
      */

      resetRequestResult.className =
        "result show success";


      resetRequestResult.textContent =
        "If an active SecureTrack account exists for that email address, a password reset link has been sent. Please check your inbox and spam folder.";


    } catch (error) {

      console.error(
        "SecureTrack password reset error:",
        error
      );


      resetRequestResult.className =
        "result show error";


      resetRequestResult.textContent =
        "The password reset request could not be completed. Please try again or contact a SecureTrack administrator.";

    } finally {

      sendResetButton.disabled =
        false;

      sendResetButton.textContent =
        "Send Password Reset Email";

    }

  }
);
})();
