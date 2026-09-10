(() => {
  "use strict";

  const page = document.body?.dataset?.page || "";
  const config = window.SECURETRACK_CONFIG;

  function showFatal(message) {
    const loginMessage = document.getElementById("loginMessage");
    const hubError = document.getElementById("hubError");
    const loading = document.getElementById("loadingPanel");
    if (loginMessage) { loginMessage.textContent = message; loginMessage.classList.add("error"); }
    if (hubError) { hubError.hidden = false; hubError.textContent = message; }
    if (loading) loading.hidden = true;
  }

  if (!window.supabase?.createClient) { showFatal("SecureTrack could not load the Supabase client."); return; }
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) { showFatal("SecureTrack configuration is missing. Check the existing root config.js file."); return; }

  const db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const ROLE_LABELS = {
    officer: "Officer", dispatcher: "Dispatcher", senior_officer: "Senior Officer",
    team_lead: "Team Lead", manager: "Manager", admin: "Administrator"
  };

  const MODULE_ACCESS = {
    devices: ["officer","dispatcher","senior_officer","team_lead","manager","admin"],
    incidents: ["dispatcher","manager","admin"],
    property: ["officer","dispatcher","senior_officer","team_lead","manager","admin"],
    assignments: ["senior_officer","team_lead","manager","admin"],
    overtime: ["officer","dispatcher","senior_officer","team_lead","manager","admin"],
    manager: ["manager","admin"]
  };

  const hasAnyRole = (roles, allowed) => allowed.some(role => roles.includes(role));

  async function getSessionUser() {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;
    return data.session?.user || null;
  }

  async function loadCurrentProfile(userId) {
    const [profileResult, rolesResult] = await Promise.all([
      db.from("profiles").select("id, display_name, employee_number, email, is_active").eq("id", userId).single(),
      db.from("user_roles").select("role").eq("user_id", userId)
    ]);
    if (profileResult.error) throw profileResult.error;
    if (rolesResult.error) throw rolesResult.error;
    return { profile: profileResult.data, roles: (rolesResult.data || []).map(item => item.role) };
  }

  async function initLogin() {
    const existingUser = await getSessionUser();
    if (existingUser) { window.location.replace("hub.html"); return; }

    const form = document.getElementById("loginForm");
    const button = document.getElementById("loginButton");
    const message = document.getElementById("loginMessage");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = String(document.getElementById("email").value || "").trim();
      const password = String(document.getElementById("password").value || "");
      message.textContent = "";
      message.classList.remove("error");
      button.disabled = true;
      button.textContent = "SIGNING IN…";

      try {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("SecureTrack could not verify this account.");

        const { profile, roles } = await loadCurrentProfile(data.user.id);
        if (!profile?.is_active) { await db.auth.signOut(); throw new Error("This SecureTrack account is inactive."); }
        if (!roles.length) { await db.auth.signOut(); throw new Error("Your account does not have a SecureTrack role assigned."); }
        window.location.replace("hub.html");
      } catch (error) {
        message.textContent = error?.message || "Unable to sign in.";
        message.classList.add("error");
        button.disabled = false;
        button.textContent = "SIGN IN";
      }
    });
  }

  async function initHub() {
    const loading = document.getElementById("loadingPanel");
    const moduleGrid = document.getElementById("moduleGrid");
    const userName = document.getElementById("userName");
    const userRoles = document.getElementById("userRoles");
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Signing out…";
      await db.auth.signOut();
      window.location.replace("login.html");
    });

    try {
      const user = await getSessionUser();
      if (!user) { window.location.replace("login.html"); return; }

      const { profile, roles } = await loadCurrentProfile(user.id);
      if (!profile?.is_active) { await db.auth.signOut(); window.location.replace("login.html"); return; }
      if (!roles.length) throw new Error("No SecureTrack permissions are assigned to this account.");

      userName.textContent = profile.display_name || profile.email || user.email || "SecureTrack User";
      userRoles.textContent = roles.map(role => ROLE_LABELS[role] || role).join(" • ");

      document.querySelectorAll("[data-module]").forEach(card => {
        const allowedRoles = MODULE_ACCESS[card.dataset.module] || [];
        card.hidden = !hasAnyRole(roles, allowedRoles);
      });

      loading.hidden = true;
      moduleGrid.hidden = false;
    } catch (error) {
      showFatal(error?.message || "SecureTrack could not load your permissions.");
    }
  }

  if (page === "login") initLogin().catch(error => showFatal(error?.message || "Unable to initialize login."));
  else if (page === "hub") initHub().catch(error => showFatal(error?.message || "Unable to initialize the Operations Hub."));
})();
