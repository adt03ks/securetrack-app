
(function () {
  "use strict";

  const link = document.getElementById(
    "supervisorEquipmentAction"
  );

  if (!link) return;

  const MANAGEMENT_ROLES = [
    "manager",
    "director",
    "admin"
  ];

  async function initialize(auth) {
    auth = auth || window.SecureTrackAuth;

    if (!auth?.db || !auth?.user) return;

    link.hidden = true;

    const roles = auth.roles || [];

    const isManagement = roles.some(
      role => MANAGEMENT_ROLES.includes(role)
    );

    // Management always sees the button.
    // Shift eligibility is checked on the
    // assignment page and by Supabase.
    if (isManagement) {
      link.hidden = false;
      link.href =
        "supervisor-equipment-assignment.html";
      return;
    }

    // Team Leads and Senior Officers must be
    // officially assigned as shift supervisor.
    const isLeadership = roles.some(
      role => [
        "team_lead",
        "senior_officer"
      ].includes(role)
    );

    if (!isLeadership) return;

    try {
      const { data, error } = await auth.db.rpc(
        "st_supervisor_equipment_shifts"
      );

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        link.hidden = false;

        link.href =
          "supervisor-equipment-assignment.html";

        if (data.length === 1) {
          link.href +=
            "?shiftInstanceId=" +
            encodeURIComponent(data[0].id);
        }
      }
    } catch (error) {
      console.warn(
        "Equipment assignment access check failed:",
        error
      );

      link.hidden = true;
    }
  }

  if (window.SecureTrackAuth) {
    initialize(window.SecureTrackAuth);
  } else {
    document.addEventListener(
      "securetrack:authorized",
      event => initialize(event.detail),
      { once: true }
    );
  }
})();
