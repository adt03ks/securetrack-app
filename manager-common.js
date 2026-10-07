(function () {
  "use strict";

  const cfg = window.SECURETRACK_CONFIG || {};

  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    console.error("SecureTrack Supabase configuration is missing.");
    return;
  }

  const managerDB = window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  async function getSession() {
    const {
      data: { session },
      error
    } = await managerDB.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  }

  async function requireManager() {
    const session = await getSession();

   if (!session) {

  const currentPage =
    window.location.pathname
      .split("/")
      .pop() ||
    "manager-portal.html";

  const next =
    currentPage +
    window.location.search;

  window.location.replace(
    "login.html?next=" +
    encodeURIComponent(next)
  );

  return null;
}

    const [profileResult, rolesResult] = await Promise.all([
      managerDB
        .from("profiles")
        .select("id, display_name, employee_number, email, is_active")
        .eq("id", session.user.id)
        .single(),

      managerDB
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
    ]);

    if (profileResult.error) {
      console.error(
        "SecureTrack profile lookup failed:",
        profileResult.error
      );
      return null;
    }

    if (rolesResult.error) {
      console.error(
        "SecureTrack role lookup failed:",
        rolesResult.error
      );
      return null;
    }

    const profile = profileResult.data;

    const roles = (rolesResult.data || []).map(
      row => row.role
    );

    if (!profile || !profile.is_active) {
      await managerDB.auth.signOut();
      window.location.replace("login.html");
      return null;
    }

   const hasManagerAccess =
  roles.includes("manager") ||
  roles.includes("director") ||
  roles.includes("admin");

    if (!hasManagerAccess) {
      window.location.replace("hub.html");
      return null;
    }

  const managementRole =
  roles.includes("admin")
    ? "admin"
    : roles.includes("director")
      ? "director"
      : "manager";


return {
  session,
  profile: {
    ...profile,
    role: managementRole
  },
  roles
};
  }

// =========================================================
// DISCONNECT ONESIGNAL USER DURING LOGOUT
// =========================================================

async function disconnectOneSignalForLogout() {

  try {

    // If OneSignal is already initialized on this page,
    // use the existing instance.

    if (
      window.SecureTrackOneSignal &&
      typeof window.SecureTrackOneSignal.logout ===
        "function"
    ) {

      await window.SecureTrackOneSignal.logout();

      return;

    }


    // Some SecureTrack pages do not normally load
    // OneSignal. Load it temporarily so the previous
    // user's identity can be disconnected safely.

    window.OneSignalDeferred =
      window.OneSignalDeferred || [];


    await new Promise(
      resolve => {

        let finished =
          false;


        const finish = () => {

          if (
            finished
          ) {
            return;
          }

          finished =
            true;

          resolve();

        };


        // Do not allow OneSignal cleanup to prevent
        // SecureTrack logout indefinitely.

        setTimeout(
          finish,
          4000
        );


        window.OneSignalDeferred.push(
          async function (OneSignal) {

            try {

              try {

                await OneSignal.init({
                  appId:
                    "6ceb93a4-c390-4961-ad5a-5bbbceb0e6c7",

                  safari_web_id:
                    "web.onesignal.auto.129ff751-f997-4966-a642-dcf62166c788",

                  notifyButton: {
                    enable: false
                  }
                });

              }
              catch (initError) {

                /*
                  The SDK may already be initialized.
                  That should not prevent logout.
                */

                console.warn(
                  "OneSignal logout initialization notice:",
                  initError
                );

              }


              await OneSignal.logout();

            }
            catch (error) {

              console.warn(
                "OneSignal logout was not completed:",
                error
              );

            }
            finally {

              finish();

            }

          }
        );


        const existingScript =
          document.querySelector(
            'script[src*="OneSignalSDK.page.js"]'
          );


        if (
          !existingScript
        ) {

          const script =
            document.createElement(
              "script"
            );


          script.src =
            "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";


          script.defer =
            true;


          document.head.appendChild(
            script
          );

        }

      }
    );

  }
  catch (error) {

    console.warn(
      "SecureTrack OneSignal logout cleanup failed:",
      error
    );

  }

}
  
async function signOut() {

  const subscriptionId =
    localStorage.getItem(
      "securetrack_push_subscription_id"
    );


  // =========================================
  // RELEASE THIS BROWSER FROM CURRENT USER
  // =========================================

  if (
    subscriptionId
  ) {

    try {

      const {
        error
      } =
        await managerDB.rpc(
          "revoke_my_push_subscription",
          {
            p_provider:
              "onesignal",

            p_provider_subscription_id:
              subscriptionId
          }
        );


      if (
        error
      ) {

        throw error;

      }

    }
    catch (error) {

      /*
        Logout must still continue even if
        the push-device cleanup fails.
      */

      console.warn(
        "SecureTrack push subscription could not be released during logout:",
        error
      );

    }

  }


  // =========================================
  // DISCONNECT ONESIGNAL IDENTITY
  // =========================================

  await disconnectOneSignalForLogout();


  // =========================================
  // CLEAR LOCAL SECURETRACK DEVICE REFERENCE
  // =========================================

  localStorage.removeItem(
    "securetrack_push_subscription_id"
  );


  // =========================================
  // SIGN OUT OF SECURETRACK
  // =========================================

  await managerDB.auth.signOut();


  window.location.replace(
    "login.html"
  );

}
})();
