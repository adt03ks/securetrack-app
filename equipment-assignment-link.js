
(function () {
  "use strict";

  const link = document.getElementById(
    "supervisorEquipmentAction"
  );

  if (!link) return;

  async function initialize() {
    const auth = window.SecureTrackAuth;

    if (!auth?.db || !auth?.user) return;

    const db = auth.db;

    try {
      // The RPC must return only shifts this user
      // is authorized to manage.
      const { data, error } = await db.rpc(
        "st_supervisor_equipment_shifts"
      );

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        link.hidden = false;

        if (data.length === 1) {
          link.href =
            "supervisor-equipment-assignment.html" +
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
    initialize();
  } else {
    document.addEventListener(
      "securetrack:authorized",
      initialize,
      { once: true }
    );
  }
})();
