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
})();
