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


  let recoveryReady = false;


  // ==========================================
  // CLEAR POSSIBLE BROWSER AUTOFILL
  // ==========================================

  setTimeout(() => {

    newPassword.value = "";
    confirmPassword.value = "";

  }, 200);


  // ==========================================
  // WATCH SPECIFICALLY FOR PASSWORD RECOVERY
  // ==========================================

  const {
    data: authListener
  } =
    STM.db.auth.onAuthStateChange(
      (event) => {

        console.log(
          "SecureTrack auth event:",
          event
        );


        if (
          event ===
          "PASSWORD_RECOVERY"
        ) {

          recoveryReady = true;

          result.className =
            "result show success";

          result.textContent =
            "Recovery link verified. Enter a new password for your SecureTrack manager account.";

        }

      }
    );


  // Give Supabase a moment to process
  // the recovery credentials from the URL.

  await new Promise(
    resolve =>
      setTimeout(
        resolve,
        500
      )
  );


  // ==========================================
  // CHECK RECOVERY URL
  // ==========================================

  const hash =
    new URLSearchParams(
      window.location.hash.substring(1)
    );


  const query =
    new URLSearchParams(
      window.location.search
    );


  const recoveryType =
    hash.get("type") ||
    query.get("type");


  if (
    recoveryType === "recovery"
  ) {

    recoveryReady = true;

  }


  // ==========================================
  // RESET PASSWORD
  // ==========================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      result.className =
        "result";

      result.textContent =
        "";


      const password =
        newPassword.value.trim();

      const confirmation =
        confirmPassword.value.trim();


      if (
        password.length < 8
      ) {

        result.className =
          "result show error";

        result.textContent =
          "Your new password must contain at least 8 characters.";

        return;

      }


      if (
        password !==
        confirmation
      ) {

        result.className =
          "result show error";

        result.textContent =
          "The new passwords do not match.";

        return;

      }


      if (
        !recoveryReady
      ) {

        result.className =
          "result show error";

        result.textContent =
          "This password recovery link is invalid or has expired. Return to Manager Login and request a new password reset email.";

        return;

      }


      button.disabled =
        true;

      button.textContent =
        "Updating Password…";


      try {

        const {
          data,
          error
        } =
          await STM.db.auth
            .updateUser({
              password:
                password
            });


        if (error) {

          /*
            Supabase will reject reuse of
            the account's existing password.
          */

          if (
            String(
              error.message
            )
              .toLowerCase()
              .includes(
                "different from the old password"
              )
          ) {

            throw new Error(
              "That password matches the current password on this account. Enter a completely new password that has not just been used for this manager account."
            );

          }


          throw error;

        }


        // ======================================
        // PASSWORD SUCCESSFULLY CHANGED
        // ======================================

        result.className =
          "result show success";


        result.textContent =
          "Password updated successfully. You will now return to the SecureTrack Manager Login.";


        /*
          Immediately clear the password
          fields so browser/password-manager
          autofill cannot accidentally submit
          the new value again.
        */

        newPassword.value =
          "";

        confirmPassword.value =
          "";


        button.disabled =
          true;

        button.textContent =
          "✓ Password Updated";


        // ======================================
        // END TEMPORARY RECOVERY SESSION
        // ======================================

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
          "SecureTrack password reset error:",
          error
        );


        result.className =
          "result show error";


        result.textContent =
          error.message ||
          "Unable to update the password.";


        button.disabled =
          false;

        button.textContent =
          "Update Password";

      }

    }
  );

})();
