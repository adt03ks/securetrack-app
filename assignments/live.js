(async function () {
  "use strict";

  function waitForAuth() {
    if (window.SecureTrackAuth) return Promise.resolve(window.SecureTrackAuth);

    return new Promise(resolve => {
      const handler = event => {
        document.removeEventListener("securetrack:authorized", handler);
        resolve(event.detail || window.SecureTrackAuth);
      };
      document.addEventListener("securetrack:authorized", handler);
    });
  }

  const auth = await waitForAuth();
  if (!auth?.db || !auth?.user) return;

  const db = auth.db;
  const profile = auth.profile || {};
  const roles = auth.roles || [];

  const currentUserName = document.getElementById("currentUserName");
  const currentUserRole = document.getElementById("currentUserRole");
  const signOutButton = document.getElementById("signOutButton");
  const assignmentAdminLink = document.getElementById("assignmentAdminLink");

  const pageMessage = document.getElementById("pageMessage");
  const boardDate = document.getElementById("boardDate");
  const boardShift = document.getElementById("boardShift");
  const publishedShiftInfo = document.getElementById("publishedShiftInfo");
  const publishedShiftText = document.getElementById("publishedShiftText");
  const dutyBoard = document.getElementById("dutyBoard");
  const refreshButton = document.getElementById("refreshButton");

  const managerOverrideCard = document.getElementById("managerOverrideCard");
  const overrideModal = document.getElementById("overrideModal");
  const overrideForm = document.getElementById("overrideForm");
  const overrideStationId = document.getElementById("overrideStationId");
  const overrideStationText = document.getElementById("overrideStationText");
  const overrideUserId = document.getElementById("overrideUserId");
  const overrideReason = document.getElementById("overrideReason");
  const confirmOverrideButton = document.getElementById("confirmOverrideButton");
  const cancelOverrideButton = document.getElementById("cancelOverrideButton");

  const isLeadership = roles.some(role =>
    ["senior_officer","team_lead","manager","admin"].includes(role)
  );
  const isManager = roles.includes("manager") || roles.includes("admin");

  let publishedShifts = [];
  let currentShift = null;
  let stations = [];
  let assignments = [];
  let presentStaff = [];
  let realtimeChannel = null;

  function roleLabel(list) {
    const order = ["admin","manager","team_lead","senior_officer","dispatcher","officer"];
    const found = order.find(role => list.includes(role));
    return (found || list[0] || "user").replaceAll("_"," ");
  }

  function todayLocal() {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
  }

  function showMessage(message, type = "info") {
    pageMessage.textContent = message;
    pageMessage.className = `message show ${type}`;
  }

  function clearMessage() {
    pageMessage.textContent = "";
    pageMessage.className = "message";
  }

  function setUserDisplay() {
    currentUserName.textContent =
      profile.display_name || auth.user.email || "SecureTrack User";
    currentUserRole.textContent = roleLabel(roles);

    assignmentAdminLink.hidden = !isLeadership;
    managerOverrideCard.hidden = !isManager;
  }

  async function loadPublishedShifts() {
    clearMessage();

    const date = boardDate.value;

    let query = db
      .from("shift_instances")
      .select("id, shift_date, shift_name, status, published_at")
      .eq("status", "published")
      .order("shift_name");

    if (date) query = query.eq("shift_date", date);

    const { data, error } = await query;
    if (error) throw error;

    publishedShifts = data || [];
    renderShiftOptions();

    if (currentShift && !publishedShifts.some(s => s.id === currentShift.id)) {
      currentShift = null;
      assignments = [];
      dutyBoard.innerHTML = '<div class="empty">Choose a published shift.</div>';
      publishedShiftInfo.hidden = true;
    }
  }

  function renderShiftOptions() {
    const previous = currentShift?.id || boardShift.value;

    boardShift.innerHTML =
      '<option value="">Select published shift</option>';

    publishedShifts.forEach(shift => {
      const option = document.createElement("option");
      option.value = shift.id;
      option.textContent = shift.shift_name;
      boardShift.appendChild(option);
    });

    if (previous && publishedShifts.some(s => s.id === previous)) {
      boardShift.value = previous;
    }

    if (!boardShift.value && publishedShifts.length === 1) {
      boardShift.value = publishedShifts[0].id;
    }
  }

  async function loadBoard() {
    const shiftId = boardShift.value;

    if (!shiftId) {
      currentShift = null;
      dutyBoard.innerHTML = '<div class="empty">Choose a published shift.</div>';
      publishedShiftInfo.hidden = true;
      subscribeToShift(null);
      return;
    }

    currentShift = publishedShifts.find(s => s.id === shiftId);

    if (!currentShift) {
      showMessage("Published shift could not be found.", "error");
      return;
    }

    publishedShiftInfo.hidden = false;
    publishedShiftText.textContent =
      `${currentShift.shift_date} • ${currentShift.shift_name}`;

    const [stationResult, assignmentResult, attendanceResult] =
      await Promise.all([
        db
          .from("duty_stations")
          .select("id, station_code, station_name, description, is_difficult, sort_order")
          .eq("is_active", true)
          .order("sort_order")
          .order("station_name"),

        db
          .from("station_assignments")
          .select("id, station_id, user_id, display_name, is_locked, assignment_source, assigned_at")
          .eq("shift_instance_id", currentShift.id),

        db
          .from("shift_attendance")
          .select("user_id, display_name, is_present")
          .eq("shift_instance_id", currentShift.id)
          .eq("is_present", true)
      ]);

    if (stationResult.error) throw stationResult.error;
    if (assignmentResult.error) throw assignmentResult.error;

    // Attendance is leadership-only under the current RLS policy.
    // Officers can still view the published board without this query.
    if (attendanceResult.error && isManager) throw attendanceResult.error;

    stations = stationResult.data || [];
    assignments = assignmentResult.data || [];
    presentStaff = attendanceResult.error ? [] : (attendanceResult.data || []);

    renderBoard();
    subscribeToShift(currentShift.id);
  }

  function renderBoard() {
    dutyBoard.innerHTML = "";

    if (!stations.length) {
      dutyBoard.innerHTML = '<div class="empty">No active duty stations are configured.</div>';
      return;
    }

    const assignmentMap = new Map(assignments.map(a => [a.station_id, a]));

    stations.forEach(station => {
      const assignment = assignmentMap.get(station.id);

      const card = document.createElement("article");
      card.className = "duty-card" + (station.is_difficult ? " difficult" : "");

      const code = document.createElement("div");
      code.className = "duty-station-code";
      code.textContent = station.station_code || "Duty Station";

      const name = document.createElement("div");
      name.className = "duty-station-name";
      name.textContent = station.station_name;

      const label = document.createElement("div");
      label.className = "duty-officer-label";
      label.textContent = "Assigned Officer";

      const officer = document.createElement("div");
      officer.className = "duty-officer-name";
      officer.textContent = assignment?.display_name || "Unassigned";

      const source = document.createElement("div");
      source.className = "duty-source";
      source.textContent = assignment
        ? `Source: ${assignment.assignment_source.replaceAll("_"," ")}`
        : "No assignment";

      card.append(code, name, label, officer, source);

      if (assignment?.assignment_source === "override") {
        const note = document.createElement("div");
        note.className = "override-note";
        note.textContent = "Manager Override";
        card.appendChild(note);
      }

      if (isManager) {
        const actions = document.createElement("div");
        actions.className = "duty-actions";

        const override = document.createElement("button");
        override.type = "button";
        override.className = "button secondary";
        override.textContent = "Override";
        override.addEventListener("click", () => openOverride(station));

        actions.appendChild(override);
        card.appendChild(actions);
      }

      dutyBoard.appendChild(card);
    });
  }

  function openOverride(station) {
    overrideStationId.value = station.id;
    overrideStationText.textContent =
      `Station: ${station.station_name}`;

    overrideUserId.innerHTML =
      '<option value="">Select officer</option>';

    presentStaff.forEach(person => {
      const option = document.createElement("option");
      option.value = person.user_id;
      option.textContent = person.display_name;
      overrideUserId.appendChild(option);
    });

    overrideReason.value = "";
    overrideModal.classList.add("show");
    overrideModal.setAttribute("aria-hidden","false");
  }

  function closeOverride() {
    overrideModal.classList.remove("show");
    overrideModal.setAttribute("aria-hidden","true");
  }

  async function refreshBoard() {
    if (!currentShift) {
      await loadPublishedShifts();
      if (boardShift.value) await loadBoard();
      return;
    }

    const { data, error } = await db
      .from("station_assignments")
      .select("id, station_id, user_id, display_name, is_locked, assignment_source, assigned_at")
      .eq("shift_instance_id", currentShift.id);

    if (error) throw error;

    assignments = data || [];

    if (isManager) {
      const attendanceResult = await db
        .from("shift_attendance")
        .select("user_id, display_name, is_present")
        .eq("shift_instance_id", currentShift.id)
        .eq("is_present", true);

      if (attendanceResult.error) throw attendanceResult.error;
      presentStaff = attendanceResult.data || [];
    }

    renderBoard();
  }

  function subscribeToShift(shiftId) {
    if (realtimeChannel) {
      db.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    if (!shiftId) return;

    realtimeChannel = db
      .channel(`duty-board-${shiftId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "station_assignments",
          filter: `shift_instance_id=eq.${shiftId}`
        },
        async () => {
          try {
            await refreshBoard();
          } catch (error) {
            console.error("Live board refresh error:", error);
          }
        }
      )
      .subscribe();
  }

  boardDate.addEventListener("change", async () => {
    try {
      currentShift = null;
      await loadPublishedShifts();
      if (boardShift.value) await loadBoard();
    } catch (error) {
      console.error("Published shift load error:", error);
      showMessage(error.message || "Unable to load published shifts.", "error");
    }
  });

  boardShift.addEventListener("change", async () => {
    try {
      await loadBoard();
    } catch (error) {
      console.error("Duty board load error:", error);
      showMessage(error.message || "Unable to load duty board.", "error");
    }
  });

  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing…";
    try {
      await refreshBoard();
    } catch (error) {
      console.error("Duty board refresh error:", error);
      showMessage(error.message || "Unable to refresh duty board.", "error");
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh";
    }
  });

  overrideForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!currentShift || !isManager) return;

    const reason = overrideReason.value.trim();
    if (!reason) return;

    const selectedName =
      overrideUserId.options[overrideUserId.selectedIndex]?.text || "selected officer";

    const confirmed = window.confirm(
      `Override ${overrideStationText.textContent} and assign ${selectedName}?`
    );

    if (!confirmed) return;

    confirmOverrideButton.disabled = true;
    confirmOverrideButton.textContent = "Saving…";

    try {
      const { data, error } = await db.rpc("override_station_assignment", {
        p_shift_id: currentShift.id,
        p_station_id: overrideStationId.value,
        p_user_id: overrideUserId.value,
        p_reason: reason
      });

      if (error) throw error;

      closeOverride();
      await refreshBoard();

      if (data?.displaced_display_name) {
        showMessage(
          `Override saved. ${data.displaced_display_name} was displaced from that station and is currently unassigned.`,
          "success"
        );
      } else {
        showMessage("Manager override saved.", "success");
      }
    } catch (error) {
      console.error("Manager override error:", error);
      showMessage(error.message || "Unable to save manager override.", "error");
    } finally {
      confirmOverrideButton.disabled = false;
      confirmOverrideButton.textContent = "Confirm Override";
    }
  });

  cancelOverrideButton.addEventListener("click", closeOverride);

  overrideModal.addEventListener("click", event => {
    if (event.target === overrideModal) closeOverride();
  });

  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    signOutButton.textContent = "Signing Out…";
    await db.auth.signOut();
    window.location.replace(new URL("login.html", auth.appRootUrl || "../").href);
  });

  setUserDisplay();
  boardDate.value = todayLocal();

  try {
    await loadPublishedShifts();

    if (boardShift.value) {
      await loadBoard();
    }
  } catch (error) {
    console.error("Duty board initialization error:", error);
    showMessage(error.message || "Unable to load the live duty board.", "error");
  }
})();
