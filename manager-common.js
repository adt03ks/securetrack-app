(function () {
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
      window.location.replace("manager-login.html");
      return null;
    }

    const { data: profile, error } = await managerDB
      .from("manager_profiles")
      .select("user_id, display_name, role, is_active")
      .eq("user_id", session.user.id)
      .single();

    if (error || !profile || !profile.is_active) {
      await managerDB.auth.signOut();
      window.location.replace("manager-login.html");
      return null;
    }

    return {
      session,
      profile
    };
  }

  async function signOut() {
    await managerDB.auth.signOut();
    window.location.replace("manager-login.html");
  }

  window.SecureTrackManager = {
    db: managerDB,
    getSession,
    requireManager,
    signOut
  };
})();
