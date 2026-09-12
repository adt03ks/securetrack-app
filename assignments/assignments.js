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

  if (!auth?.db || !auth?.user) {
    return;
  }

  const db = auth.db;
  const profile = auth.profile || {};
  const roles = auth.roles || [];

  const currentUserName =
    document.getElementById("currentUserName");

  const currentUserRole =
    document.getElementById("currentUserRole");

  const signOutButton =
    document.getElementById("signOutButton");

  const pageMessage =
    document.getElementById("pageMessage");

  const shiftForm =
    document.getElementById("shiftForm");

  const shiftDate =
    document.getElementById("shiftDate");

  const shiftName =
    document.getElementById("shiftName");

  const openShiftButton =
    document.getElementById("openShiftButton");

  const shiftStatus =
    document.getElementById("shiftStatus");

  const shiftStatusText =
    document.getElementById("shiftStatusText");

  const attendanceList =
    document.getElementById("attendanceList");

  const saveAttendanceButton =
    document.getElementById("saveAttendanceButton");

  const generateButton =
    document.getElementById("generateButton");

  const assignmentBody =
    document.getElementById("assignmentBody");

  const publishButton =
    document.getElementById("publishButton");

  const stationList =
    document.getElementById("stationList");

  const manualModal =
    document.getElementById("manualModal");

  const manualForm =
    document.getElementById("manualForm");

  const manualStationId =
    document.getElementById("manualStationId");

  const manualUserId =
    document.getElementById("manualUserId");

  const manualReason =
    document.getElementById("manualReason");

  const confirmManualButton =
    document.getElementById("confirmManualButton");


  let currentShift = null;
let stations = [];
let staff = [];
let attendance = [];
let assignments = [];
let plannedUnavailability = [];


  function roleLabel(list) {
    const order = [
      "admin",
      "manager",
      "team_lead",
      "senior_officer",
      "dispatcher",
      "officer"
    ];

    const found =
      order.find(role =>
        list.includes(role)
      );

    return (
      found ||
      list[0] ||
      "user"
    ).replaceAll("_", " ");
  }


  function showMessage(
    message,
    type = "info"
  ) {
    pageMessage.textContent =
      message;

    pageMessage.className =
      `message show ${type}`;
  }


  function clearMessage() {
    pageMessage.textContent =
      "";

    pageMessage.className =
      "message";
  }


  function formatShift(
    shift
  ) {
    if (!shift) {
      return "—";
    }

    return (
      `${shift.shift_date} • ` +
      `${shift.shift_name} • ` +
      `${shift.status}`
    );
  }


  function todayLocal() {
    const d =
      new Date();

    const offset =
      d.getTimezoneOffset();

    const local =
      new Date(
        d.getTime() -
        offset * 60000
      );

    return local
      .toISOString()
      .slice(0, 10);
  }


  function setUserDisplay() {
    currentUserName.textContent =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

    currentUserRole.textContent =
      roleLabel(roles);
  }


  async function loadStations() {
    const {
      data,
      error
    } = await db
      .from("duty_stations")
      .select(
        "id, station_code, station_name, description, is_difficult, requires_qualification, is_active, sort_order"
      )
      .eq(
        "is_active",
        true
      )
      .order(
        "sort_order"
      )
      .order(
        "station_name"
      );


    if (error) {
      throw error;
    }


    stations =
      data || [];


    renderStations();
  }


  function renderStations() {
    stationList.innerHTML =
      "";


    if (!stations.length) {
      stationList.innerHTML =
        '<div class="empty">No active duty stations found. Add stations in Supabase before generating assignments.</div>';

      return;
    }


    stations.forEach(
      station => {

        const card =
          document.createElement(
            "div"
          );

        card.className =
          "station-card";


        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          station.station_name;


        const code =
          document.createElement(
            "small"
          );

        code.textContent =
          station.station_code || "";


        const description =
          document.createElement(
            "small"
          );

        description.textContent =
          station.description ||
          "No description";


        card.append(
          name,
          code,
          description
        );


        if (
          station.is_difficult
        ) {
          const flag =
            document.createElement(
              "span"
            );

          flag.className =
            "flag";

          flag.textContent =
            "Difficult Station";

          card.appendChild(
            flag
          );
        }


        stationList.appendChild(
          card
        );
      }
    );
  }


  async function loadEligibleStaff() {

  const { data: roleRows, error: roleError } = await db
    .from("user_roles")
    .select("user_id, role");

  if (roleError) throw roleError;


  const allowed = new Set(
    (roleRows || [])
      .filter(row =>
        [
          "officer",
          "dispatcher",
          "senior_officer",
          "team_lead"
        ].includes(row.role)
      )
      .map(row => row.user_id)
  );


  if (!allowed.size) {
    staff = [];
    renderAttendance();
    return;
  }


  const [
    profileResult,
    rosterResult
  ] = await Promise.all([

    db
      .from("profiles")
      .select(
        "id, display_name, employee_number, is_active"
      )
      .eq("is_active", true)
      .order("display_name"),

    db
      .from("officer_shift_roster")
      .select(
        "user_id, shift_name, is_active"
      )
      .eq("is_active", true)

  ]);


  if (profileResult.error) {
    throw profileResult.error;
  }

  if (rosterResult.error) {
    throw rosterResult.error;
  }


  const rosterMap = new Map(
    (rosterResult.data || [])
      .map(row => [
        row.user_id,
        row.shift_name
      ])
  );


  staff =
    (profileResult.data || [])
      .filter(person =>
        allowed.has(person.id)
      )
      .map(person => ({
        ...person,
        shift_name:
          rosterMap.get(person.id) ||
          null
      }));


  function renderAttendance() {

  attendanceList.innerHTML = "";


  if (!currentShift) {

    attendanceList.innerHTML =
      '<div class="empty">Open a shift first.</div>';

    return;
  }


  /*
    Only show personnel whose normal
    roster matches the shift being opened.
  */

  const shiftStaff =
    staff.filter(person =>
      person.shift_name ===
      currentShift.shift_name
    );


  if (!shiftStaff.length) {

    attendanceList.innerHTML =
      `
        <div class="empty">
          No active officers are assigned to
          ${currentShift.shift_name}.
        </div>
      `;

    return;
  }


  const attendanceMap =
    new Map(
      attendance.map(row => [
        row.user_id,
        row
      ])
    );


  const absenceMap =
    new Map(
      plannedUnavailability.map(row => [
        row.user_id,
        row
      ])
    );


  shiftStaff.forEach(person => {

    const existing =
      attendanceMap.get(
        person.id
      );

    const planned =
      absenceMap.get(
        person.id
      );


    const row =
      document.createElement(
        "label"
      );

    row.className =
      "attendance-row";


    const checkbox =
      document.createElement(
        "input"
      );

    checkbox.type =
      "checkbox";

    checkbox.dataset.userId =
      person.id;


    /*
      Existing attendance always wins.

      Otherwise a planned absence defaults
      the officer OUT.

      Officers without an attendance record
      remain unchecked until attendance is
      actually confirmed.
    */

    checkbox.checked =
      existing
        ? Boolean(
            existing.is_present
          )
        : false;


    const text =
      document.createElement(
        "div"
      );

    text.style.flex =
      "1";


    const name =
      document.createElement(
        "strong"
      );

    name.textContent =
      person.display_name;


    const employee =
      document.createElement(
        "small"
      );

    employee.textContent =
      person.employee_number
        ? `Employee # ${person.employee_number}`
        : "SecureTrack user";


    text.append(
      name,
      employee
    );


    // =======================================================
    // PLANNED ABSENCE DISPLAY
    // =======================================================

    let statusBadge = null;
    let reasonText = null;
    let addOnSiteButton = null;


    if (planned) {

      row.dataset.plannedOut =
        "true";


      statusBadge =
        document.createElement(
          "span"
        );

      statusBadge.style.display =
        "inline-block";

      statusBadge.style.marginTop =
        "6px";

      statusBadge.style.padding =
        "4px 8px";

      statusBadge.style.borderRadius =
        "999px";

      statusBadge.style.fontSize =
        "10px";

      statusBadge.style.fontWeight =
        "800";

      statusBadge.style.letterSpacing =
        ".04em";


      reasonText =
        document.createElement(
          "small"
        );

      reasonText.style.display =
        "block";

      reasonText.style.marginTop =
        "5px";


      const typeLabel =
        String(
          planned.absence_type ||
          "other"
        )
          .replaceAll("_", " ")
          .replace(
            /\b\w/g,
            char =>
              char.toUpperCase()
          );


      reasonText.textContent =
        planned.notes
          ? `${typeLabel}: ${planned.notes}`
          : typeLabel;


      addOnSiteButton =
        document.createElement(
          "button"
        );

      addOnSiteButton.type =
        "button";

      addOnSiteButton.className =
        "button secondary";

      addOnSiteButton.style.marginLeft =
        "12px";

      addOnSiteButton.style.whiteSpace =
        "nowrap";


      function updatePlannedAppearance() {

        if (checkbox.checked) {

          row.style.opacity =
            "1";

          row.style.background =
            "rgba(255,120,0,.07)";

          statusBadge.textContent =
            "ON SITE OVERRIDE";

          statusBadge.style.background =
            "rgba(255,120,0,.14)";

          statusBadge.style.color =
            "#ffb36b";

          addOnSiteButton.textContent =
            "Marked On Site";

          addOnSiteButton.disabled =
            true;

        } else {

          row.style.opacity =
            ".58";

          row.style.background =
            "rgba(125,135,145,.08)";

          statusBadge.textContent =
            `SCHEDULED OUT • ${typeLabel.toUpperCase()}`;

          statusBadge.style.background =
            "rgba(125,135,145,.14)";

          statusBadge.style.color =
            "#c1c7ce";

          addOnSiteButton.textContent =
            "Add On Site";

          addOnSiteButton.disabled =
            currentShift.status !==
            "draft";

        }

      }


      addOnSiteButton.addEventListener(
        "click",
        event => {

          event.preventDefault();
          event.stopPropagation();

          checkbox.checked =
            true;

          updatePlannedAppearance();

        }
      );


      checkbox.addEventListener(
        "change",
        updatePlannedAppearance
      );


      text.append(
        statusBadge,
        reasonText
      );


      updatePlannedAppearance();

    }


    row.append(
      checkbox,
      text
    );


    if (addOnSiteButton) {

      row.appendChild(
        addOnSiteButton
      );

    }


    attendanceList.appendChild(
      row
    );

  });
}


  async function loadAttendance() {

    if (!currentShift) {

      attendance = [];

      renderAttendance();

      return;
    }


    const {
      data,
      error
    } = await db

      .from("shift_attendance")

      .select(
        "user_id, display_name, is_present, notes"
      )

      .eq(
        "shift_instance_id",
        currentShift.id
      );


    if (error) {
      throw error;
    }


    attendance =
      data || [];


    renderAttendance();
  }


  function renderAttendance() {

    attendanceList.innerHTML =
      "";


    if (!currentShift) {

      attendanceList.innerHTML =
        '<div class="empty">Open a shift first.</div>';

      return;
    }


    if (!staff.length) {

      attendanceList.innerHTML =
        '<div class="empty">No active SecureTrack staff profiles are available.</div>';

      return;
    }


    const attendanceMap =
      new Map(
        attendance.map(
          row => [
            row.user_id,
            row
          ]
        )
      );


    staff.forEach(
      person => {

        const row =
          document.createElement(
            "label"
          );

        row.className =
          "attendance-row";


        const checkbox =
          document.createElement(
            "input"
          );

        checkbox.type =
          "checkbox";

        checkbox.dataset.userId =
          person.id;


        const existing =
          attendanceMap.get(
            person.id
          );


        checkbox.checked =
          existing
            ? existing.is_present
            : false;


        const text =
          document.createElement(
            "div"
          );


        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          person.display_name;


        const employee =
          document.createElement(
            "small"
          );


        employee.textContent =
          person.employee_number
            ? `Employee # ${person.employee_number}`
            : "SecureTrack user";


        text.append(
          name,
          employee
        );


        row.append(
          checkbox,
          text
        );


        attendanceList.appendChild(
          row
        );
      }
    );
  }

async function loadPlannedUnavailability() {

  if (!currentShift) {
    plannedUnavailability = [];
    renderAttendance();
    return;
  }


  const { data, error } =
    await db.rpc(
      "get_shift_unavailability",
      {
        p_shift_date:
          currentShift.shift_date,

        p_shift_name:
          currentShift.shift_name
      }
    );


  if (error) {
    throw error;
  }


  plannedUnavailability =
    data || [];


  renderAttendance();
}

  async function loadAssignments() {

    if (!currentShift) {

      assignments = [];

      renderAssignments();

      return;
    }


    const {
      data,
      error
    } = await db

      .from(
        "station_assignments"
      )

      .select(
        "id, station_id, user_id, display_name, is_locked, assignment_source, assigned_at"
      )

      .eq(
        "shift_instance_id",
        currentShift.id
      );


    if (error) {
      throw error;
    }


    assignments =
      data || [];


    renderAssignments();
  }


  function currentPresentStaff() {

    const checked =
      new Set(

        [
          ...attendanceList
            .querySelectorAll(
              'input[type="checkbox"]:checked'
            )
        ]

          .map(
            input =>
              input.dataset.userId
          )

      );


    return staff.filter(
      person =>
        checked.has(
          person.id
        )
    );
  }


  function renderAssignments() {

    assignmentBody.innerHTML =
      "";


    if (!currentShift) {

      assignmentBody.innerHTML =
        '<tr><td colspan="5" class="empty">Open a shift to begin.</td></tr>';

      return;
    }


    if (!stations.length) {

      assignmentBody.innerHTML =
        '<tr><td colspan="5" class="empty">No active stations configured.</td></tr>';

      return;
    }


    const assignmentMap =
      new Map(
        assignments.map(
          a => [
            a.station_id,
            a
          ]
        )
      );


    const published =
      currentShift.status ===
      "published";


    stations.forEach(
      station => {

        const tr =
          document.createElement(
            "tr"
          );


        const assignment =
          assignmentMap.get(
            station.id
          );


        const stationTd =
          document.createElement(
            "td"
          );


        stationTd.innerHTML =
          `<strong>${station.station_name}</strong>` +
          `<br>` +
          `<span class="muted">${station.station_code || ""}</span>`;


        const officerTd =
          document.createElement(
            "td"
          );


        officerTd.textContent =
          assignment?.display_name ||
          "Unassigned";


        const sourceTd =
          document.createElement(
            "td"
          );


        const source =
          document.createElement(
            "span"
          );


        source.className =
          "source-pill";


        source.textContent =
          assignment?.assignment_source ||
          "—";


        sourceTd.appendChild(
          source
        );


        const lockTd =
          document.createElement(
            "td"
          );


        if (assignment) {

          const lock =
            document.createElement(
              "button"
            );


          lock.className =
            "button secondary lock-button";


          lock.type =
            "button";


          lock.textContent =
            assignment.is_locked
              ? "Unlock"
              : "Lock";


          lock.disabled =
            published;


          lock.addEventListener(
            "click",
            () =>
              toggleLock(
                assignment
              )
          );


          lockTd.appendChild(
            lock
          );

        } else {

          lockTd.textContent =
            "—";
        }


        const manualTd =
          document.createElement(
            "td"
          );


        const manual =
          document.createElement(
            "button"
          );


        manual.className =
          "button secondary";


        manual.type =
          "button";


        manual.textContent =
          "Change";


        manual.disabled =
          published;


        manual.addEventListener(
          "click",
          () =>
            openManualModal(
              station
            )
        );


        manualTd.appendChild(
          manual
        );


        tr.append(
          stationTd,
          officerTd,
          sourceTd,
          lockTd,
          manualTd
        );


        assignmentBody.appendChild(
          tr
        );
      }
    );


    generateButton.disabled =
      published;


    publishButton.disabled =
      published ||
      !assignments.length;
  }


  function openManualModal(
    station
  ) {

    const present =
      currentPresentStaff();


    manualUserId.innerHTML =
      "";


    const placeholder =
      document.createElement(
        "option"
      );


    placeholder.value =
      "";


    placeholder.textContent =
      "Select officer";


    manualUserId.appendChild(
      placeholder
    );


    present.forEach(
      person => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          person.id;


        option.textContent =
          person.display_name;


        manualUserId.appendChild(
          option
        );
      }
    );


    manualStationId.value =
      station.id;


    manualReason.value =
      "";


    manualModal.classList.add(
      "show"
    );


    manualModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeManualModal() {

    manualModal.classList.remove(
      "show"
    );


    manualModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  async function refreshShift() {

    if (!currentShift) {
      return;
    }


    const {
      data,
      error
    } = await db

      .from(
        "shift_instances"
      )

      .select(
        "id, shift_date, shift_name, status, published_at"
      )

      .eq(
        "id",
        currentShift.id
      )

      .single();


    if (error) {
      throw error;
    }


    currentShift =
      data;


    shiftStatusText.textContent =
      formatShift(
        currentShift
      );


   await Promise.all([
  loadAttendance(),
  loadAssignments(),
  loadPlannedUnavailability()
]);


    saveAttendanceButton.disabled =
      currentShift.status !==
      "draft";


    generateButton.disabled =
      currentShift.status !==
      "draft";
  }


  shiftForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage();


      if (
        !shiftDate.value ||
        !shiftName.value
      ) {

        showMessage(
          "Select a shift date and shift name.",
          "error"
        );

        return;
      }


      openShiftButton.disabled =
        true;


      openShiftButton.textContent =
        "Opening…";


      try {

        const {
          data,
          error
        } = await db.rpc(
          "create_shift_instance",
          {
            p_shift_date:
              shiftDate.value,

            p_shift_name:
              shiftName.value
          }
        );


        if (error) {
          throw error;
        }


        currentShift = {
          id:
            data.shift_id,

          shift_date:
            data.shift_date,

          shift_name:
            data.shift_name,

          status:
            data.status ||
            "draft",

          published_at:
            data.published_at ||
            null
        };


        shiftStatus.hidden =
          false;


        shiftStatusText.textContent =
          formatShift(
            currentShift
          );


        const isDraft =
          currentShift.status ===
          "draft";


        saveAttendanceButton.disabled =
          !isDraft;


        generateButton.disabled =
          !isDraft;


        await Promise.all([
          loadAttendance(),
          loadAssignments()
        ]);


        if (
          data.created
        ) {

          showMessage(
            "New shift created successfully.",
            "success"
          );

        } else if (
          currentShift.status ===
          "published"
        ) {

          showMessage(
            "Existing published shift loaded. Published shifts cannot be regenerated from this screen.",
            "info"
          );

        } else {

          showMessage(
            "Existing draft shift loaded successfully.",
            "success"
          );
        }

      } catch (error) {

        console.error(
          "Open shift error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to open shift.",
          "error"
        );

      } finally {

        openShiftButton.disabled =
          false;


        openShiftButton.textContent =
          "Open Shift";
      }
    }
  );


  saveAttendanceButton.addEventListener(
    "click",
    async () => {

      if (!currentShift) {
        return;
      }


      saveAttendanceButton.disabled =
        true;


      saveAttendanceButton.textContent =
        "Saving…";


      try {

        const checkboxes = [
          ...attendanceList
            .querySelectorAll(
              'input[type="checkbox"]'
            )
        ];


        for (
          const checkbox
          of checkboxes
        ) {

          const {
            error
          } = await db.rpc(
            "set_shift_attendance",
            {
              p_shift_id:
                currentShift.id,

              p_user_id:
                checkbox.dataset.userId,

              p_is_present:
                checkbox.checked,

             p_notes: (() => {

  const planned =
    plannedUnavailability.find(
      item =>
        item.user_id ===
        checkbox.dataset.userId
    );


  if (!planned) {
    return null;
  }


  const typeLabel =
    String(
      planned.absence_type ||
      "other"
    )
      .replaceAll("_", " ");


  if (checkbox.checked) {

    return planned.notes
      ? `On site override — planned ${typeLabel}: ${planned.notes}`
      : `On site override — planned ${typeLabel}`;

  }


  return planned.notes
    ? `Scheduled out — ${typeLabel}: ${planned.notes}`
    : `Scheduled out — ${typeLabel}`;

})()
            }
          );


          if (error) {
            throw error;
          }
        }


        await loadAttendance();


        showMessage(
          "Attendance saved.",
          "success"
        );

      } catch (error) {

        console.error(
          "Attendance save error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to save attendance.",
          "error"
        );

      } finally {

        saveAttendanceButton.disabled =
          currentShift?.status !==
          "draft";


        saveAttendanceButton.textContent =
          "Save Attendance";
      }
    }
  );


  generateButton.addEventListener(
    "click",
    async () => {

      if (!currentShift) {
        return;
      }


      generateButton.disabled =
        true;


      generateButton.textContent =
        "Generating…";


      try {

        const {
          data,
          error
        } = await db.rpc(
          "generate_station_assignments",
          {
            p_shift_id:
              currentShift.id
          }
        );


        if (error) {
          throw error;
        }


        await loadAssignments();


        showMessage(
          `${data.assignments_generated || 0} assignment(s) generated.`,
          "success"
        );

      } catch (error) {

        console.error(
          "Generate assignment error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to generate assignments.",
          "error"
        );

      } finally {

        generateButton.disabled =
          currentShift?.status !==
          "draft";


        generateButton.textContent =
          "Generate Assignments";
      }
    }
  );


  async function toggleLock(
    assignment
  ) {

    try {

      const {
        error
      } = await db.rpc(
        "set_assignment_lock",
        {
          p_assignment_id:
            assignment.id,

          p_locked:
            !assignment.is_locked
        }
      );


      if (error) {
        throw error;
      }


      await loadAssignments();

    } catch (error) {

      console.error(
        "Lock error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to update assignment lock.",
        "error"
      );
    }
  }


  manualForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (!currentShift) {
        return;
      }


      if (
        !manualUserId.value
      ) {

        showMessage(
          "Select an officer for the manual assignment.",
          "error"
        );

        return;
      }


      confirmManualButton.disabled =
        true;


      confirmManualButton.textContent =
        "Saving…";


      try {

        const {
          error
        } = await db.rpc(
          "assign_station_manually",
          {
            p_shift_id:
              currentShift.id,

            p_station_id:
              manualStationId.value,

            p_user_id:
              manualUserId.value,

            p_reason:
              manualReason.value.trim() ||
              null
          }
        );


        if (error) {
          throw error;
        }


        closeManualModal();


        await loadAssignments();


        showMessage(
          "Manual assignment saved.",
          "success"
        );

      } catch (error) {

        console.error(
          "Manual assignment error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to save manual assignment.",
          "error"
        );

      } finally {

        confirmManualButton.disabled =
          false;


        confirmManualButton.textContent =
          "Save Assignment";
      }
    }
  );


  publishButton.addEventListener(
    "click",
    async () => {

      if (!currentShift) {
        return;
      }


      const confirmed =
        window.confirm(
          `Publish assignments for ${currentShift.shift_date} ${currentShift.shift_name}?`
        );


      if (!confirmed) {
        return;
      }


      publishButton.disabled =
        true;


      publishButton.textContent =
        "Publishing…";


      try {

        const {
          error
        } = await db.rpc(
          "publish_shift_assignments",
          {
            p_shift_id:
              currentShift.id
          }
        );


        if (error) {
          throw error;
        }


        await refreshShift();


        showMessage(
          "Assignments published successfully.",
          "success"
        );

      } catch (error) {

        console.error(
          "Publish error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to publish assignments.",
          "error"
        );

      } finally {

        publishButton.textContent =
          "Publish Assignments";
      }
    }
  );


  document
    .querySelectorAll(
      ".modal-cancel"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          closeManualModal
        );
      }
    );


  manualModal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        manualModal
      ) {

        closeManualModal();
      }
    }
  );


  signOutButton.addEventListener(
    "click",
    async () => {

      signOutButton.disabled =
        true;


      signOutButton.textContent =
        "Signing Out…";


      await db.auth.signOut();


      window.location.replace(
        new URL(
          "login.html",
          auth.appRootUrl ||
          "../"
        ).href
      );
    }
  );


  setUserDisplay();


  shiftDate.value =
    todayLocal();


  try {

    await Promise.all([
      loadStations(),
      loadEligibleStaff()
    ]);

  } catch (error) {

    console.error(
      "Duty assignment initialization error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to load Duty Station Assignment.",
      "error"
    );
  }

})();
