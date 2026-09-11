(() => {
  "use strict";

  document.documentElement.classList.add("securetrack-auth-pending");

  const style = document.createElement("style");
  style.id = "securetrack-auth-guard-style";
  style.textContent = `
    html.securetrack-auth-pending body { visibility: hidden !important; }
    html.securetrack-auth-denied body { visibility: hidden !important; }
  `;
  document.head.appendChild(style);

  const config = window.SECURETRACK_CONFIG;

  // Determine the SecureTrack app root from where secure-page.js itself lives.
  // This allows the same guard to work on root pages AND nested module pages
  // such as property/index.html, incidents/index.html, etc.
  const guardScriptUrl = document.currentScript?.src
    ? new URL(document.currentScript.src, window.location.href)
    : new URL("secure-page.js", window.location.href);

  const appRootUrl = new URL("./", guardScriptUrl);

  function currentAppRelativeUrl() {
    const current = new URL(window.location.href);
    const rootPath = appRootUrl.pathname.endsWith("/")
      ? appRootUrl.pathname
      : `${appRootUrl.pathname}/`;

    let relativePath = current.pathname.startsWith(rootPath)
      ? current.pathname.slice(rootPath.length)
      : current.pathname.split("/").pop() || "index.html";

    if (!relativePath) relativePath = "index.html";

    return `${relativePath}${current.search}${current.hash}`;
  }

  function goToLogin() {
    const next = encodeURIComponent(currentAppRelativeUrl());
    const loginUrl = new URL("login.html", appRootUrl);
    loginUrl.search = `?next=${next}`;
    window.location.replace(loginUrl.href);
  }

  function goToHub() {
    window.location.replace(new URL("hub.html", appRootUrl).href);
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

  if (
    !window.supabase?.createClient ||
    !config?.supabaseUrl ||
    !config?.supabaseAnonKey
  ) {
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

  const requestedRoles = String(
    document.body?.dataset?.securetrackRoles || ""
  )
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  async function authorize() {
    const { data: sessionData, error: sessionError } =
      await db.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      goToLogin();
      return;
    }

    const user = sessionData.session.user;

    const [profileResult, rolesResult] = await Promise.all([
      db
        .from("profiles")
        .select("id, display_name, employee_number, email, is_active")
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

    window.SecureTrackAuth = {
      user,
      profile: profileResult.data,
      roles: userRoles,
      db,
      appRootUrl: appRootUrl.href
    };

    reveal();

    document.dispatchEvent(
      new CustomEvent("securetrack:authorized", {
        detail: window.SecureTrackAuth
      })
    );
  }

  authorize().catch(error => {
    console.error("SecureTrack authorization error:", error);
    goToLogin();
  });
})();
