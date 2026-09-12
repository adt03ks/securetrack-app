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

    return {
      session,
    profile: {
  ...profile,
  role: roles.includes("admin")
    ? "admin"
    : roles.includes("director")
      ? "director"
      : "manager"
},
      roles
    };
  }

  async function signOut() {
    await managerDB.auth.signOut();
    window.location.replace("login.html");
  }

  window.SecureTrackManager = {
    db: managerDB,
    getSession,
    requireManager,
    signOut
  };
})();
