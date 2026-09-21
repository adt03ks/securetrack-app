(async function () {
  "use strict";

  // =========================================================
  // SECURETRACK DUTY ASSIGNMENT BUILD
  // =========================================================

  const BUILD_ID =
    "2026-09-20-duty-auth-fix-1";

  console.log(
    `SecureTrack Duty Assignment build ${BUILD_ID}`
  );


  // =========================================================
  // AUTH FALLBACK
  //
  // secure-page.js normally supplies SecureTrackAuth.
  // If its authorized event fires before this file begins
  // listening, or does not populate the global object,
  // rebuild the session directly from Supabase.
  // =========================================================

  async function buildAuthFallback() {

    const cfg =
      window.SECURETRACK_CONFIG || {};


    if (
      !window.supabase ||
      !cfg.supabaseUrl ||
      !cfg.supabaseAnonKey
    ) {

      throw new Error(
        "SecureTrack configuration is unavailable."
      );

    }


    const fallbackDb =
      window.supabase.createClient(
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


    const {
      data: {
        session
      },
      error: sessionError
    } =
      await fallbackDb.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {
      return null;
    }


    const [
      profileResult,
      rolesResult
    ] =
      await Promise.all([

        fallbackDb
          .from("profiles")
          .select(
            "id, display_name, employee_number, is_active"
          )
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle(),

        fallbackDb
          .from("user_roles")
          .select("role")
          .eq(
            "user_id",
            session.user.id
          )

      ]);


    if (profileResult.error) {
      throw profileResult.error;
    }


    if (rolesResult.error) {
      throw rolesResult.error;
    }


    const profile =
      profileResult.data || {};


    const roles =
      (rolesResult.data || [])
        .map(
          row =>
            row.role
        );


    const fallbackAuth = {
      db:
        fallbackDb,

      session,

      user:
        session.user,

      profile,

      roles
    };


    window.SecureTrackAuth =
      window.SecureTrackAuth ||
      fallbackAuth;


    return fallbackAuth;
  }


  // =========================================================
  // WAIT FOR SECURE-PAGE AUTH, THEN FALL BACK
  // =========================================================

  function waitForAuth() {

    if (
      window.SecureTrackAuth?.db &&
      window.SecureTrackAuth?.user
    ) {

      return Promise.resolve(
        window.SecureTrackAuth
      );

    }


    return new Promise(
      (resolve, reject) => {

        let settled =
          false;


        const finish =
          authValue => {

            if (settled) {
              return;
            }


            settled =
              true;


            document.removeEventListener(
              "securetrack:authorized",
              handler
            );


            resolve(
              authValue
            );

          };


        const handler =
          event => {

            const authValue =
              event.detail ||
              window.SecureTrackAuth;


            if (
              authValue?.db &&
              authValue?.user
            ) {

              finish(
                authValue
              );

            }

          };


        document.addEventListener(
          "securetrack:authorized",
          handler
        );


        // ---------------------------------------------------
        // Do not allow this page to remain on "Loading..."
        // forever if the authorization event is missed.
        // ---------------------------------------------------

        setTimeout(
          async () => {

            if (settled) {
              return;
            }


            try {

              if (
                window.SecureTrackAuth?.db &&
                window.SecureTrackAuth?.user
              ) {

                finish(
                  window.SecureTrackAuth
                );

                return;
              }


              console.warn(
                "Duty Assignment: secure-page auth event not received. Using session fallback."
              );


              const fallbackAuth =
                await buildAuthFallback();


              if (!fallbackAuth) {

                throw new Error(
                  "No active SecureTrack session was found."
                );

              }


              finish(
                fallbackAuth
              );

            }
            catch (error) {

              if (!settled) {

                settled =
                  true;


                document.removeEventListener(
                  "securetrack:authorized",
                  handler
                );


                reject(
                  error
                );

              }

            }

          },
          2000
        );

      }
    );
  }


  // =========================================================
  // INITIALIZE AUTH
  // =========================================================

  let auth;


  try {

    auth =
      await waitForAuth();

  }
  catch (error) {

    console.error(
      "SecureTrack Duty Assignment authentication failed:",
      error
    );


    const nameElement =
      document.getElementById(
        "currentUserName"
      );


    const messageElement =
      document.getElementById(
        "pageMessage"
      );


    const stationElement =
      document.getElementById(
        "stationList"
      );


    if (nameElement) {

      nameElement.textContent =
        "Authentication unavailable";

    }


    if (messageElement) {

      messageElement.textContent =
        error.message ||
        "Unable to initialize SecureTrack authentication.";

      messageElement.className =
        "message show error";

    }


    if (stationElement) {

      stationElement.innerHTML =
        '<div class="empty">Unable to initialize SecureTrack authentication.</div>';

    }


    return;
  }


  if (
    !auth?.db ||
    !auth?.user
  ) {

    console.error(
      "Duty Assignment authentication returned without a database client or user.",
      auth
    );

    return;
  }


  console.log(
    "Duty Assignment authenticated:",
    auth.user.id,
    auth.roles
  );


  const db =
    auth.db;
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
const supervisorPanel =
  document.getElementById(
    "supervisorPanel"
  );

const supervisorBadge =
  document.getElementById(
    "supervisorBadge"
  );

const designatedTeamLead =
  document.getElementById(
    "designatedTeamLead"
  );

const teamLeadAttendance =
  document.getElementById(
    "teamLeadAttendance"
  );

const currentSupervisorName =
  document.getElementById(
    "currentSupervisorName"
  );

const currentSupervisorSource =
  document.getElementById(
    "currentSupervisorSource"
  );

const actingSupervisorSection =
  document.getElementById(
    "actingSupervisorSection"
  );

const actingSupervisorSelect =
  document.getElementById(
    "actingSupervisorSelect"
  );

const saveActingSupervisorButton =
  document.getElementById(
    "saveActingSupervisorButton"
  );

let currentShift = null;
let stations = [];
let staff = [];
let attendance = [];
let assignments = [];
let plannedUnavailability = [];
let supervisorContext = null;


  function roleLabel(list) {
    const order = [
      "admin",
      "director",
      "manager",
      "team_lead",
      "senior_officer",
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
// ========================================================
// SECURETRACK CANONICAL SHIFT SCHEDULE
// ========================================================

function validShiftsForDate(
  dateValue
) {

  if (!dateValue) {
    return [];
  }


  // Noon prevents timezone conversion from
  // accidentally moving the selected calendar date.

  const date =
    new Date(
      `${dateValue}T12:00:00`
    );


  const day =
    date.getDay();

  // JavaScript:
  // 0 = Sunday
  // 1 = Monday
  // 2 = Tuesday
  // 3 = Wednesday
  // 4 = Thursday
  // 5 = Friday
  // 6 = Saturday


  // Sunday / Monday / Tuesday

  if (
    day === 0 ||
    day === 1 ||
    day === 2
  ) {

    return [

      {
        value: "Alpha",
        label:
          "Alpha Shift • 6:37 AM – 7:11 PM"
      },

      {
        value: "Charlie",
        label:
          "Charlie Shift • 6:37 PM – 7:11 AM"
      }

    ];

  }


  // Wednesday — all four split schedules

  if (
    day === 3
  ) {

    return [

      {
        value: "Delta",
        label:
          "Delta Shift • 12:37 AM – 7:11 AM"
      },

      {
        value: "Bravo",
        label:
          "Bravo Shift • 6:37 AM – 1:11 PM"
      },

      {
        value: "Alpha",
        label:
          "Alpha Shift • 12:37 PM – 7:11 PM"
      },

      {
        value: "Charlie",
        label:
          "Charlie Shift • 6:37 PM – 12:11 AM"
      }

    ];

  }


  // Thursday / Friday / Saturday

  return [

    {
      value: "Bravo",
      label:
        "Bravo Shift • 6:37 AM – 7:11 PM"
    },

    {
      value: "Delta",
      label:
        "Delta Shift • 6:37 PM – 7:11 AM"
    }

  ];

}


// ========================================================
// REFRESH SHIFT DROPDOWN WHEN DATE CHANGES
// ========================================================

function refreshShiftChoices() {

  if (
    !shiftDate ||
    !shiftName
  ) {
    return;
  }


  const previousValue =
    shiftName.value;


  const availableShifts =
    validShiftsForDate(
      shiftDate.value
    );


  shiftName.innerHTML =
    "";


  const placeholder =
    document.createElement(
      "option"
    );


  placeholder.value =
    "";


  placeholder.textContent =
    shiftDate.value
      ? "Select scheduled shift"
      : "Select date first";


  shiftName.appendChild(
    placeholder
  );


  availableShifts.forEach(
    shift => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        shift.value;


      option.textContent =
        shift.label;


      shiftName.appendChild(
        option
      );

    }
  );


  // Preserve the current selection only if
  // it remains valid for the selected date.

  if (
    availableShifts.some(
      shift =>
        shift.value ===
        previousValue
    )
  ) {

    shiftName.value =
      previousValue;

  }
  else {

    shiftName.value =
      "";

  }

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
  "id, station_code, station_name, description, is_difficult, requires_qualification, is_active, sort_order, priority_number, station_type"
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


renderAttendance();

}


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
// =========================================================
// SHIFT SUPERVISOR
// =========================================================

async function loadSupervisorContext() {

  if (!currentShift) {

    supervisorContext = null;

    if (supervisorPanel) {
      supervisorPanel.hidden =
        true;
    }

    return;
  }


  const {
    data,
    error
  } = await db.rpc(
    "get_shift_supervisor_context",
    {
      p_shift_id:
        currentShift.id
    }
  );


  if (error) {
    throw error;
  }


  supervisorContext =
    data || null;


  renderSupervisorContext();
}


function renderSupervisorContext() {

  if (!supervisorPanel) {
    return;
  }


  if (
    !currentShift ||
    !supervisorContext
  ) {

    supervisorPanel.hidden =
      true;

    return;
  }


  supervisorPanel.hidden =
    false;


  const context =
    supervisorContext;


  if (!context.configured) {

    designatedTeamLead.textContent =
      "Not configured";

    teamLeadAttendance.textContent =
      "Shift leadership configuration incomplete";

    currentSupervisorName.textContent =
      "—";

    currentSupervisorSource.textContent =
      "Configure shift leadership before generating";

    supervisorBadge.textContent =
      "CONFIGURATION REQUIRED";

    supervisorBadge.className =
      "supervisor-badge warning";

    actingSupervisorSection.hidden =
      true;

    return;
  }


  designatedTeamLead.textContent =
    context.designated_team_lead_name ||
    "Not configured";


  if (
    !context.designated_team_lead_user_id
  ) {

    teamLeadAttendance.textContent =
      "No designated Team Lead";

    supervisorBadge.textContent =
      "CONFIGURATION REQUIRED";

    supervisorBadge.className =
      "supervisor-badge warning";

    actingSupervisorSection.hidden =
      true;

    return;
  }


  if (
    context.designated_team_lead_present
  ) {

    teamLeadAttendance.textContent =
      "Present • Supervisor";

    currentSupervisorName.textContent =
      context.designated_team_lead_name ||
      "Team Lead";

    currentSupervisorSource.textContent =
      "Designated Team Lead";

    supervisorBadge.textContent =
      "SUPERVISOR READY";

    supervisorBadge.className =
      "supervisor-badge ready";

    actingSupervisorSection.hidden =
      true;

    return;
  }


  teamLeadAttendance.textContent =
    "Not marked present";


  const actingName =
    context.supervisor_source ===
      "acting_senior"
      ? context.supervisor_display_name
      : null;


  currentSupervisorName.textContent =
    actingName ||
    "Acting Supervisor Required";


  currentSupervisorSource.textContent =
    actingName
      ? "Acting Senior Officer"
      : "Awaiting selection";


  supervisorBadge.textContent =
    actingName
      ? "ACTING SUPERVISOR READY"
      : "SUPERVISOR REQUIRED";


  supervisorBadge.className =
    actingName
      ? "supervisor-badge ready"
      : "supervisor-badge warning";


  actingSupervisorSection.hidden =
    false;


  actingSupervisorSelect.innerHTML =
    '<option value="">Select Senior Officer</option>';


  const candidates =
    Array.isArray(
      context.acting_candidates
    )
      ? context.acting_candidates
      : [];


  candidates.forEach(
    candidate => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        candidate.user_id;

      option.textContent =
        candidate.display_name;

      if (
        candidate.user_id ===
        context.supervisor_user_id
      ) {
        option.selected =
          true;
      }

      actingSupervisorSelect
        .appendChild(
          option
        );
    }
  );


  saveActingSupervisorButton.disabled =
    currentShift.status !==
      "draft" ||
    candidates.length ===
      0;
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
        assignment => [
          assignment.station_id,
          assignment
        ]
      )
    );


  const published =
    currentShift.status ===
    "published";


  stations.forEach(
    station => {

      const assignment =
        assignmentMap.get(
          station.id
        );


      const isSupervisor =
        station.station_type ===
          "supervisor" ||
        station.station_code ===
          "SUPERVISOR";


      const tr =
        document.createElement(
          "tr"
        );


      if (isSupervisor) {
        tr.classList.add(
          "supervisor-row"
        );
      }


      // =====================================================
      // STATION
      // =====================================================

      const stationTd =
        document.createElement(
          "td"
        );


      const priority =
        station.priority_number
          ? `<span class="priority-pill">#${station.priority_number}</span>`
          : "";


      stationTd.innerHTML =
        `${priority}<strong>${station.station_name}</strong>` +
        `<br>` +
        `<span class="muted">${station.station_code || ""}</span>` +
        (
          station.description
            ? `<br><small class="muted">${station.description}</small>`
            : ""
        );


      // =====================================================
      // OFFICER
      // =====================================================

      const officerTd =
        document.createElement(
          "td"
        );


      if (assignment) {

        officerTd.textContent =
          assignment.display_name;

      }
      else {

        officerTd.textContent =
          isSupervisor
            ? "SUPERVISOR REQUIRED"
            : "UNFILLED — STAFFING REQUIRED";

        officerTd.classList.add(
          "unfilled-post"
        );
      }


      // =====================================================
      // SOURCE
      // =====================================================

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


      if (
        isSupervisor &&
        assignment
      ) {

        source.textContent =
          supervisorContext
            ?.supervisor_source ===
            "acting_senior"
              ? "ACTING SENIOR"
              : "TEAM LEAD";

      }
      else {

        source.textContent =
          assignment
            ?.assignment_source ||
          "—";

      }


      sourceTd.appendChild(
        source
      );


      // =====================================================
      // LOCK
      // =====================================================

      const lockTd =
        document.createElement(
          "td"
        );


      if (
        assignment &&
        isSupervisor
      ) {

        lockTd.textContent =
          "Locked";

      }
      else if (assignment) {

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

      }
      else {

        lockTd.textContent =
          "—";

      }


      // =====================================================
      // CHANGE / OVERRIDE
      // =====================================================

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


      if (isSupervisor) {

        manual.textContent =
          "Supervisor";

        manual.disabled =
          true;

      }
      else {

        manual.textContent =
          assignment
            ? "Change"
            : "Assign";

        manual.disabled =
          published;


        manual.addEventListener(
          "click",
          () =>
            openManualModal(
              station
            )
        );

      }


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
  loadPlannedUnavailability(),
  loadSupervisorContext()
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
  loadAssignments(),
  loadPlannedUnavailability(),
  loadSupervisorContext()
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


       await Promise.all([
  loadAttendance(),
  loadSupervisorContext()
]);

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


       await Promise.all([
  loadAssignments(),
  loadSupervisorContext()
]);


const generated =
  data?.assignments_generated ||
  0;


const unfilled =
  data?.unfilled_standard_posts ||
  0;


let message =
  `${generated} assignment(s) generated.`;


if (unfilled > 0) {

  message +=
    ` ${unfilled} standard post(s) remain unfilled due to staffing.`;

}


showMessage(
  message,
  unfilled > 0
    ? "info"
    : "success"
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

if (
  saveActingSupervisorButton
) {

  saveActingSupervisorButton
    .addEventListener(
      "click",
      async () => {

        if (!currentShift) {
          return;
        }


        const selectedUserId =
          actingSupervisorSelect.value;


        if (!selectedUserId) {

          showMessage(
            "Select a Senior Officer to serve as Acting Supervisor.",
            "error"
          );

          return;
        }


        saveActingSupervisorButton.disabled =
          true;

        saveActingSupervisorButton.textContent =
          "Saving…";


        try {

          const {
            error
          } = await db.rpc(
            "set_shift_acting_supervisor",
            {
              p_shift_id:
                currentShift.id,

              p_user_id:
                selectedUserId
            }
          );


          if (error) {
            throw error;
          }


          await loadSupervisorContext();


          showMessage(
            "Acting Supervisor confirmed.",
            "success"
          );

        }
        catch (error) {

          console.error(
            "Acting Supervisor error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to confirm Acting Supervisor.",
            "error"
          );

        }
        finally {

          saveActingSupervisorButton.textContent =
            "Confirm Acting Supervisor";

          saveActingSupervisorButton.disabled =
            currentShift?.status !==
            "draft";

        }

      }
    );
}
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


// Build the correct shift choices
// for today's date when the page opens.

refreshShiftChoices();


// Rebuild the shift list whenever
// the user chooses another date.

shiftDate.addEventListener(
  "change",
  () => {

    refreshShiftChoices();

    clearMessage();

  }
);


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
