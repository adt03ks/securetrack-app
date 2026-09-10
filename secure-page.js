(() => {
  "use strict";

  // Hide protected content immediately while the session/role check runs.
  document.documentElement.classList.add("securetrack-auth-pending");

  const style = document.createElement("style");
  style.id = "securetrack-auth-guard-style";
  style.textContent = `
    html.securetrack-auth-pending body { visibility: hidden !important; }
    html.securetrack-auth-denied body { visibility: hidden !important; }
  `;
  document.head.appendChild(style);

  const config = window.SECURETRACK_CONFIG;

  function currentRelativeUrl() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    return `${path}${window.location.search}${window.location.hash}`;
  }

  function goToLogin() {
    const next = encodeURIComponent(currentRelativeUrl());
    window.location.replace(`login.html?next=${next}`);
  }

  function goToHub() {
    window.location.replace("hub.html");
  }

  function reveal() {
    document.documentElement.classList.remove(
      "securetrack-auth-pending",
      "securetrack-auth-denied"
    );
  }

  function deny() {
    document.documentElement.classList.remove("securetrack-auth-pending");
    document.documentElement.classList.add("securetrack-auth-denied");
    goToHub();
  }

  if (!window.supabase?.createClient || !config?.supabaseUrl || !config?.supabaseAnonKey) {
    // If configuration is broken, do not reveal a protected page.
    console.error("SecureTrack auth guard could not initialize.");
    goToLogin();
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

  // Example:
  // <body data-securetrack-roles="manager,admin">
  // If omitted, ANY active SecureTrack role may enter.
  const requestedRoles = String(
    document.body?.dataset?.securetrackRoles || ""
  )
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  async function authorize() {
    const { data: sessionData, error: sessionError } = await db.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      goToLogin();
      return;
    }

    const user = sessionData.session.user;

    const [profileResult, rolesResult] = await Promise.all([
      db
        .from("profiles")
        .select("id, is_active")
        .eq("id", user.id)
        .single(),

      db
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
    ]);

    if (profileResult.error || rolesResult.error) {
      console.error(
        "SecureTrack authorization lookup failed:",
        profileResult.error || rolesResult.error
      );
      deny();
      return;
    }

    if (!profileResult.data?.is_active) {
      await db.auth.signOut();
      goToLogin();
      return;
    }

    const userRoles = (rolesResult.data || []).map(row => row.role);

    if (!userRoles.length) {
      await db.auth.signOut();
      goToLogin();
      return;
    }

    if (
      requestedRoles.length &&
      !requestedRoles.some(role => userRoles.includes(role))
    ) {
      deny();
      return;
    }

    // Expose the authenticated context for page scripts that may need it later.
    window.SecureTrackAuth = {
      user,
      roles: userRoles,
      db
    };

    reveal();
  }

  authorize().catch(error => {
    console.error("SecureTrack authorization error:", error);
    goToLogin();
  });
})();