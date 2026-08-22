(async function () {

  const STM =
    window.SecureTrackManager;


  const form =
    document.getElementById(
      "resetPasswordForm"
    );


  const newPassword =
    document.getElementById(
      "newPassword"
    );


  const confirmPassword =
    document.getElementById(
      "confirmPassword"
    );


  const button =
    document.getElementById(
      "updatePasswordButton"
    );


  const result =
    document.getElementById(
      "passwordResetResult"
    );


  // ==================================================
  // WAIT FOR SUPABASE RECOVERY SESSION
  // ==================================================

  let recoveryReady =
    false;


  const {
    data: {
      session
    }
  } =
    await STM.db.auth
      .getSession();


  if (session) {

    recoveryReady =
      true;

  }


  STM.db.auth.onAuthStateChange(
    (event, session) => {

      if (
        event ===
          "PASSWORD_RECOVERY" ||
        session
      ) {

        recoveryReady =
          true;

      }

    }
  );


  // ==================================================
  // UPDATE PASSWORD
  // ==================================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      result.className =
        "result";

      result.textContent =
        "";


      const password =
        newPassword.value;


      const confirmation =
        confirmPassword.value;


      if (
        password.length < 12
      ) {

        result.className =
          "result show error";

        result.textContent =
          "Your new password must contain at least 12 characters.";

        return;

      }


      if (
        password !==
        confirmation
      ) {

        result.className =
          "result show error";

        result.textContent =
          "The passwords do not match.";

        return;

      }


      if (!recoveryReady) {

        result.className =
          "result show error";

        result.textContent =
          "This password recovery link is invalid or has expired. Please request a new reset email.";

        return;

      }


      button.disabled =
        true;

      button.textContent =
        "Updating Password…";


      try {

        const {
          error
        } =
          await STM.db.auth
            .updateUser({
              password
            });


        if (error) {
          throw error;
        }


        result.className =
          "result show success";


        result.textContent =
          "Your SecureTrack password has been updated successfully. Returning to manager sign in…";


        /*
          Sign out the recovery session so
          the manager explicitly signs in
          with the new password.
        */

        await STM.db.auth
          .signOut();


        setTimeout(
          () => {

            window.location.replace(
              "manager-login.html"
            );

          },
          1800
        );


      } catch (error) {

        console.error(
          "SecureTrack password update error:",
          error
        );


        result.className =
          "result show error";


        result.textContent =
          error.message ||
          "Unable to update the password.";

      } finally {

        button.disabled =
          false;

        button.textContent =
          "Update Password";

      }

    }
  );

})();
