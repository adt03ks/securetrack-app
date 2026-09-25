(async function () {
  "use strict";

  function waitForAuth() {
    if (window.SecureTrackAuth) return Promise.resolve(window.SecureTrackAuth);

    return new Promise(resolve => {
      const handler = event => {
        document.removeEventListener(
          "securetrack:authorized",
          handler
        );

        resolve(
          event.detail ||
          window.SecureTrackAuth
        );
      };

      document.addEventListener(
        "securetrack:authorized",
        handler
      );
    });
  }


  const auth =
    await waitForAuth();


  if (
    !auth?.db ||
    !auth?.user
  ) {
    return;
  }


  const db =
    auth.db;

  const profile =
    auth.profile || {};

  const roles =
    auth.roles || [];

  const currentUserId =
    auth.user.id;


  const $ =
    id =>
      document.getElementById(
        id
      );


  const el = {

    currentUserName:
      $("currentUserName"),

    currentUserRole:
      $("currentUserRole"),

    signOutButton:
      $("signOutButton"),

    pageMessage:
      $("pageMessage"),


    shiftForm:
      $("shiftForm"),

    shiftDate:
      $("shiftDate"),

    shiftName:
      $("shiftName"),

    openShiftButton:
      $("openShiftButton"),

    shiftStatus:
      $("shiftStatus"),

    shiftStatusText:
      $("shiftStatusText"),


    attendanceList:
      $("attendanceList"),

    saveAttendanceButton:
      $("saveAttendanceButton"),


    supervisorPanel:
      $("supervisorPanel"),

    supervisorBadge:
      $("supervisorBadge"),

    designatedTeamLead:
      $("designatedTeamLead"),

    teamLeadAttendance:
      $("teamLeadAttendance"),

    currentSupervisorName:
      $("currentSupervisorName"),

    currentSupervisorSource:
      $("currentSupervisorSource"),

    actingSupervisorSection:
      $("actingSupervisorSection"),

    actingSupervisorSelect:
      $("actingSupervisorSelect"),

    saveActingSupervisorButton:
      $("saveActingSupervisorButton"),


    handoffPanel:
      $("handoffPanel"),

    handoffStatusBadge:
      $("handoffStatusBadge"),

    handoffLeader:
      $("handoffLeader"),

    handoffPriorReport:
      $("handoffPriorReport"),

    handoffReceiptStatus:
      $("handoffReceiptStatus"),

    handoffCarryCount:
      $("handoffCarryCount"),

    handoffAdvanceNotice:
      $("handoffAdvanceNotice"),

    openHandoffButton:
      $("openHandoffButton"),

    refreshHandoffButton:
      $("refreshHandoffButton"),

   confirmHandoffButton:
  $("confirmHandoffButton"),

dailyActivityButton:
  $("dailyActivityButton"),

dailyActivityButton:
  $("dailyActivityButton"),


    specialPostPanel:
      $("specialPostPanel"),

    addSpecialPostButton:
      $("addSpecialPostButton"),

    specialPostList:
      $("specialPostList"),


    generateButton:
      $("generateButton"),

    assignmentBody:
      $("assignmentBody"),

    publishButton:
      $("publishButton"),

    postPublicationNotice:
      $("postPublicationNotice"),

    stationList:
      $("stationList"),


    manualModal:
      $("manualModal"),

    manualForm:
      $("manualForm"),

    manualStationId:
      $("manualStationId"),

    manualUserId:
      $("manualUserId"),

    manualReason:
      $("manualReason"),

    confirmManualButton:
      $("confirmManualButton"),


    specialPostModal:
      $("specialPostModal"),

    specialPostForm:
      $("specialPostForm"),

    specialAssignmentName:
      $("specialAssignmentName"),

    specialLocation:
      $("specialLocation"),

    specialPriority:
      $("specialPriority"),

    specialRequestingUnit:
      $("specialRequestingUnit"),

    specialRequestedBy:
      $("specialRequestedBy"),

    specialApprovedBy:
      $("specialApprovedBy"),

    specialBillTo:
      $("specialBillTo"),

    specialCostCenter:
      $("specialCostCenter"),

    specialStartTime:
      $("specialStartTime"),

    specialEndTime:
      $("specialEndTime"),

    specialNotes:
      $("specialNotes"),

    specialOngoing:
      $("specialOngoing"),

    saveSpecialPostButton:
      $("saveSpecialPostButton"),


    coverageModal:
      $("coverageModal"),

    coverageForm:
      $("coverageForm"),

    coverageTitle:
      $("coverageTitle"),

    coverageSummary:
      $("coverageSummary"),

    coverageSpecialAssignmentId:
      $("coverageSpecialAssignmentId"),

    coverageCandidateList:
      $("coverageCandidateList"),

    coverageReason:
      $("coverageReason"),

    saveCoverageButton:
      $("saveCoverageButton")

  };


  const END_OF_SHIFT_URL = (
    document.body.dataset.endOfShiftUrl ||
    "../end-of-shift-report.html"
  ).trim();


  const MANAGEMENT = [
    "manager",
    "director",
    "admin"
  ];


  const LEADERSHIP = [
    "senior_officer",
    "team_lead",
    "manager",
    "director",
    "admin"
  ];


  const PROTECTED =
    new Set([
      "SUPERVISOR",
      "DISPATCH-1",
      "DISPATCH-2"
    ]);


  let currentShift =
    null;

  let stations =
    [];

  let staff =
    [];

  let roleMap =
    new Map();

  let attendance =
    [];

  let plannedUnavailability =
    [];

  let assignments =
    [];

  let leadershipConfig =
    null;

  let handoffStatus =
    null;

  let specialPosts =
    [];

  let specialPostAccessError =
    null;


  const hasAnyRole =
    list =>
      roles.some(
        role =>
          list.includes(
            role
          )
      );


  const isManagement =
    () =>
      hasAnyRole(
        MANAGEMENT
      );


  const isCurrentShiftLead =
    () =>
      Boolean(
        currentShift
          ?.supervisor_user_id ===
        currentUserId
      );


  const canManagePublishedOperations =
    () =>
      isManagement() ||
      isCurrentShiftLead();


  function isConfiguredSenior() {

    if (
      !roles.includes(
        "senior_officer"
      ) ||
      !leadershipConfig
    ) {
      return false;
    }


    return [

      leadershipConfig
        .senior_officer_1_user_id,

      leadershipConfig
        .senior_officer_2_user_id

    ]

      .filter(Boolean)

      .includes(
        currentUserId
      );

  }


  function canEditAttendance() {

    if (!currentShift) {
      return false;
    }


    if (
      currentShift.status ===
      "draft"
    ) {

      return hasAnyRole(
        LEADERSHIP
      );

    }


    if (
      currentShift.status ===
      "published"
    ) {

      return (
        canManagePublishedOperations() ||
        isConfiguredSenior()
      );

    }


    return false;

  }


  function canManageSpecialPosts() {

    return Boolean(

      currentShift

      &&

      (
        isManagement() ||
        isCurrentShiftLead()
      )

    );

  }


function operationallyConfirmed() {

  return Boolean(

    currentShift
      ?.operationally_confirmed_at

    ||

    [
      "acknowledged",
      "not_required"
    ].includes(
      handoffStatus
        ?.handoff_status
    )

  );

}
  function canGenerateOrPublishDraft() {

    if (
      !currentShift ||
      currentShift.status !==
        "draft"
    ) {

      return false;

    }


    /*
      Management may prepare and
      publish a future assignment plan
      before live handoff occurs.
    */

    if (
      isManagement()
    ) {

      return true;

    }


    /*
      Working shift leadership must
      finish operational handoff first.
    */

    return (
      isCurrentShiftLead()

      &&

      operationallyConfirmed()
    );

  }


  function showMessage(
    message = "",
    type = "info"
  ) {

    el.pageMessage.textContent =
      message;


    el.pageMessage.className =
      message
        ? `message show ${type}`
        : "message";

  }


  function escapeHtml(
    value
  ) {

    return String(
      value ?? ""
    )

      .replaceAll(
        "&",
        "&amp;"
      )

      .replaceAll(
        "<",
        "&lt;"
      )

      .replaceAll(
        ">",
        "&gt;"
      )

      .replaceAll(
        '"',
        "&quot;"
      )

      .replaceAll(
        "'",
        "&#039;"
      );

  }


  function roleLabel() {

    const order = [

      "admin",

      "director",

      "manager",

      "team_lead",

      "senior_officer",

      "dispatcher",

      "officer"

    ];


    return (

      order.find(
        role =>
          roles.includes(
            role
          )
      )

      ||

      roles[0]

      ||

      "user"

    ).replaceAll(
      "_",
      " "
    );

  }


  function todayLocal() {

    const d =
      new Date();


    return new Date(

      d.getTime()

      -

      d.getTimezoneOffset()
      * 60000

    )

      .toISOString()

      .slice(
        0,
        10
      );

  }


  function formatShift(
    shift
  ) {

    return shift

      ? (
          `${shift.shift_date} • ` +
          `${shift.shift_name} • ` +
          `${shift.status}`
        )

      : "—";

  }


  function attendanceFor(
    userId
  ) {

    return (

      attendance.find(
        row =>
          row.user_id ===
          userId
      )

      ||

      null

    );

  }

   // ==========================================================
  // LIVE ATTENDANCE STATE
  //
  // Uses the checkbox currently on screen first.
  // Falls back to saved database attendance.
  // ==========================================================

  function attendanceMarkedPresent(
    userId
  ) {

    const checkbox =
      el.attendanceList
        ?.querySelector(
          `input[type="checkbox"][data-user-id="${userId}"]`
        );


    if (
      checkbox
    ) {

      return checkbox.checked;

    }


    return Boolean(
      attendanceFor(
        userId
      )
        ?.is_present
    );

  } 

  function nameForUser(
    userId
  ) {

    if (!userId) {
      return "—";
    }


    return (

      staff.find(
        person =>
          person.id ===
          userId
      )
        ?.display_name

      ||

      userId

    );

  }


  function assignmentForUser(
    userId
  ) {

    return (

      assignments.find(
        row =>
          row.user_id ===
          userId
      )

      ||

      null

    );

  }


  function stationForId(
    id
  ) {

    return (

      stations.find(
        row =>
          row.id ===
          id
      )

      ||

      null

    );

  }


  function setUserDisplay() {

    el.currentUserName.textContent =

      profile.display_name

      ||

      auth.user.email

      ||

      "SecureTrack User";


    el.currentUserRole.textContent =
      roleLabel();

  }


  async function loadStations() {

    const {
      data,
      error
    } = await db

      .from(
        "duty_stations"
      )

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

    el.stationList.innerHTML =
      "";


    if (
      !stations.length
    ) {

      el.stationList.innerHTML =
        '<div class="empty">No active duty stations found.</div>';

      return;

    }


    for (
      const station
      of stations
    ) {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "station-card";


      card.innerHTML = `

        <strong>
          ${escapeHtml(
            station.station_name
          )}
        </strong>

        <small>
          ${escapeHtml(
            station.station_code ||
            ""
          )}
        </small>

        <small>
          ${escapeHtml(
            station.description ||
            "No description"
          )}
        </small>

        <small>

          ${
            station.priority_number
              != null

              ? `Priority ${station.priority_number}`

              : "Priority not set"
          }

        </small>

      `;


      if (

        station.is_difficult

        ||

        PROTECTED.has(
          station.station_code
        )

      ) {

        const flag =
          document.createElement(
            "span"
          );


        flag.className =
          "flag";


        flag.textContent =

          PROTECTED.has(
            station.station_code
          )

            ? "Protected"

            : "Difficult Station";


        card.appendChild(
          flag
        );

      }


      el.stationList.appendChild(
        card
      );

    }

  }


  async function loadEligibleStaff() {

    const roleResult =
      await db

        .from(
          "user_roles"
        )

        .select(
          "user_id, role"
        );


    if (
      roleResult.error
    ) {

      throw roleResult.error;

    }


    roleMap =
      new Map();


    for (
      const row
      of roleResult.data || []
    ) {

      if (
        !roleMap.has(
          row.user_id
        )
      ) {

        roleMap.set(
          row.user_id,
          new Set()
        );

      }


      roleMap
        .get(
          row.user_id
        )
        .add(
          row.role
        );

    }


    const allowed =
      new Set(

        [
          ...roleMap.entries()
        ]

          .filter(
            (
              [
                ,
                set
              ]
            ) =>

              [
                ...set
              ].some(
                role =>
                  [
                    "officer",
                    "dispatcher",
                    "senior_officer",
                    "team_lead"
                  ].includes(
                    role
                  )
              )
          )

          .map(
            (
              [
                userId
              ]
            ) =>
              userId
          )

      );


    const [

      profileResult,

      rosterResult

    ] = await Promise.all([


      db

        .from(
          "profiles"
        )

        .select(
          "id, display_name, employee_number, is_active, employment_status"
        )

        .eq(
          "is_active",
          true
        )

        .order(
          "display_name"
        ),


      db

        .from(
          "officer_shift_roster"
        )

        .select(
          "user_id, shift_name, is_active"
        )

        .eq(
          "is_active",
          true
        )


    ]);


    if (
      profileResult.error
    ) {

      throw profileResult.error;

    }


    if (
      rosterResult.error
    ) {

      throw rosterResult.error;

    }


    const rosterMap =
      new Map(

        (
          rosterResult.data ||
          []
        ).map(
          row => [

            row.user_id,

            row.shift_name

          ]
        )

      );


    staff = (

      profileResult.data ||
      []

    )

      .filter(
        person =>
          allowed.has(
            person.id
          )
      )

      .map(
        person => ({

          ...person,

          shift_name:

            rosterMap.get(
              person.id
            )

            ||

            null

        })
      );


    renderAttendance();

  }


  async function loadAttendance() {

    if (
      !currentShift
    ) {

      attendance =
        [];

      renderAttendance();

      return;

    }


    const {
      data,
      error
    } = await db

      .from(
        "shift_attendance"
      )

      .select(
        "user_id, display_name, is_present, notes, confirmed_at"
      )

      .eq(
        "shift_instance_id",
        currentShift.id
      );


    if (
      error
    ) {

      throw error;

    }


    attendance =
      data || [];


    renderAttendance();

  }


  async function loadPlannedUnavailability() {

    if (
      !currentShift
    ) {

      plannedUnavailability =
        [];

      renderAttendance();

      return;

    }


    const {
      data,
      error
    } = await db.rpc(

      "get_shift_unavailability",

      {

        p_shift_date:
          currentShift.shift_date,

        p_shift_name:
          currentShift.shift_name

      }

    );


    if (
      error
    ) {

      throw error;

    }


    plannedUnavailability =
      data || [];


    renderAttendance();

  }


  function renderAttendance() {

    el.attendanceList.innerHTML =
      "";


    if (
      !currentShift
    ) {

      el.attendanceList.innerHTML =
        '<div class="empty">Open a shift first.</div>';

      return;

    }


    const shiftStaff =
      staff.filter(
        person =>
          person.shift_name ===
          currentShift.shift_name
      );


    if (
      !shiftStaff.length
    ) {

      el.attendanceList.innerHTML = `

        <div class="empty">

          No active officers are assigned to
          ${escapeHtml(
            currentShift.shift_name
          )}.

        </div>

      `;

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


    const absenceMap =
      new Map(

        plannedUnavailability.map(
          row => [

            row.user_id,

            row

          ]
        )

      );


    for (
      const person
      of shiftStaff
    ) {

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


      checkbox.checked =
        existing
          ? Boolean(
              existing.is_present
            )
          : false;


      checkbox.disabled =
        !canEditAttendance();
      checkbox.addEventListener(

        "change",

        () => {

          renderSupervisorPanel();

        }

      );
      
      const body =
        document.createElement(
          "div"
        );


      body.style.flex =
        "1";


      body.innerHTML = `

        <strong>
          ${escapeHtml(
            person.display_name
          )}
        </strong>

        <small>

          ${
            person.employee_number

              ? (
                  `Employee # ` +
                  escapeHtml(
                    person.employee_number
                  )
                )

              : "SecureTrack user"
          }

        </small>

      `;


      let addOnSite =
        null;


      if (
        planned
      ) {

        const typeLabel =
          String(

            planned.absence_type

            ||

            "other"

          )

            .replaceAll(
              "_",
              " "
            )

            .replace(
              /\b\w/g,
              char =>
                char.toUpperCase()
            );


        const badge =
          document.createElement(
            "span"
          );


        badge.style.cssText =
          "display:inline-block;margin-top:6px;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800;";


        const reason =
          document.createElement(
            "small"
          );


        reason.style.cssText =
          "display:block;margin-top:5px;";


        reason.textContent =
          planned.notes

            ? (
                `${typeLabel}: ` +
                `${planned.notes}`
              )

            : typeLabel;


        addOnSite =
          document.createElement(
            "button"
          );


        addOnSite.type =
          "button";


        addOnSite.className =
          "button secondary";


        addOnSite.style.cssText =
          "margin-left:12px;white-space:nowrap;";


        const updateAppearance =
          () => {


            if (
              checkbox.checked
            ) {

              row.style.opacity =
                "1";


              row.style.background =
                "rgba(255,120,0,.07)";


              badge.textContent =
                "ON SITE OVERRIDE";


              badge.style.color =
                "#ffb36b";


              addOnSite.textContent =
                "Marked On Site";


              addOnSite.disabled =
                true;

            }

            else {

              row.style.opacity =
                ".58";


              row.style.background =
                "rgba(125,135,145,.08)";


              badge.textContent =
                `SCHEDULED OUT • ${typeLabel.toUpperCase()}`;


              badge.style.color =
                "#c1c7ce";


              addOnSite.textContent =
                "Add On Site";


              addOnSite.disabled =
                !canEditAttendance();

            }

          };


        addOnSite.addEventListener(

          "click",

          event => {

            event.preventDefault();

            event.stopPropagation();


            checkbox.checked =
              true;


            updateAppearance();

          }

        );


        checkbox.addEventListener(

          "change",

          updateAppearance

        );


        body.append(
          badge,
          reason
        );


        updateAppearance();

      }


      row.append(
        checkbox,
        body
      );


      if (
        addOnSite
      ) {

        row.appendChild(
          addOnSite
        );

      }


      el.attendanceList.appendChild(
        row
      );

    }

  }


  function attendanceNoteFor(
    userId,
    isPresent
  ) {

    const planned =
      plannedUnavailability.find(
        item =>
          item.user_id ===
          userId
      );


    if (
      !planned
    ) {

      return null;

    }


    const typeLabel =
      String(

        planned.absence_type

        ||

        "other"

      ).replaceAll(
        "_",
        " "
      );


    if (
      isPresent
    ) {

      return planned.notes

        ? (
            `On site override — planned ` +
            `${typeLabel}: ` +
            `${planned.notes}`
          )

        : (
            `On site override — planned ` +
            `${typeLabel}`
          );

    }


    return planned.notes

      ? (
          `Scheduled out — ${typeLabel}: ` +
          `${planned.notes}`
        )

      : (
          `Scheduled out — ${typeLabel}`
        );

  }
  // ==========================================================
// SHIFT LEADERSHIP CONFIGURATION
// ==========================================================

async function loadLeadershipConfig() {

  if (!currentShift) {

    leadershipConfig = null;

    renderSupervisorPanel();

    return;
  }


  const {
    data,
    error
  } = await db.rpc(
    "get_duty_shift_leadership_config",
    {
      p_shift_name:
        currentShift.shift_name
    }
  );


  if (error) {

    console.error(
      "Leadership configuration load error:",
      {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }
    );

    leadershipConfig = null;

    renderSupervisorPanel();

    throw error;
  }


  leadershipConfig =
    data || null;


  console.log(
    "Loaded leadership configuration:",
    leadershipConfig
  );


  renderSupervisorPanel();
}



// ==========================================================
// SHIFT SUPERVISOR DISPLAY
// ==========================================================

function renderSupervisorPanel() {

  if (!currentShift) {

    el.supervisorPanel.hidden =
      true;

    return;
  }


  el.supervisorPanel.hidden =
    false;


  const teamLeadId =
    leadershipConfig
      ?.team_lead_user_id
    ||
    null;


  const teamLeadPresent =
    teamLeadId
      ? attendanceMarkedPresent(
          teamLeadId
        )
      : false;


  el.designatedTeamLead.textContent =

    teamLeadId

      ? nameForUser(
          teamLeadId
        )

      : "Not configured";


  el.teamLeadAttendance.textContent =

    !teamLeadId

      ? "Leadership configuration required"

      : teamLeadPresent

        ? "Present — Team Lead has precedence"

        : attendance.length

          ? "Not marked present"

          : "Attendance not confirmed";


  el.currentSupervisorName.textContent =

    currentShift
      .supervisor_display_name

    ||

    "Not resolved";


  el.currentSupervisorSource.textContent =

    currentShift
      .supervisor_source ===
      "team_lead"

      ? "Designated Team Lead"

      : currentShift
          .supervisor_source ===
          "acting_senior"

        ? "Senior Officer / Acting Team Lead"

        : "—";



  // ========================================================
  // REGULAR TEAM LEAD HAS ABSOLUTE PRECEDENCE
  // ========================================================

  if (teamLeadPresent) {

    el.supervisorBadge.textContent =
      "TEAM LEAD";


    el.actingSupervisorSection.hidden =
      true;


    el.actingSupervisorSelect.innerHTML =
      '<option value="">Select Senior Officer</option>';


    el.saveActingSupervisorButton.disabled =
      true;


    return;
  }



  // ========================================================
  // VALID ACTING TEAM LEAD ALREADY DESIGNATED
  // ========================================================

  if (

    currentShift
      .supervisor_source ===
      "acting_senior"

    &&

    currentShift
      .supervisor_user_id

    &&

    attendanceMarkedPresent(
      currentShift
        .supervisor_user_id
    )

  ) {

    el.supervisorBadge.textContent =
      "ACTING TEAM LEAD";


    el.actingSupervisorSection.hidden =
      true;


    return;
  }



  // ========================================================
  // TEAM LEAD ABSENT — SENIOR OFFICER MUST BE SELECTED
  // ========================================================

  el.supervisorBadge.textContent =
    "ACTING LEAD REQUIRED";


  el.actingSupervisorSection.hidden =
    false;


  el.actingSupervisorSelect.innerHTML =
    '<option value="">Select Senior Officer</option>';



  const seniorIds = [

    leadershipConfig
      ?.senior_officer_1_user_id,

    leadershipConfig
      ?.senior_officer_2_user_id

  ].filter(Boolean);



  let savedPresentCount =
    0;



  for (const userId of seniorIds) {

    const livePresent =
      attendanceMarkedPresent(
        userId
      );


    const savedPresent =
      Boolean(
        attendanceFor(
          userId
        )
          ?.is_present
      );


    const officerName =
      nameForUser(
        userId
      );


    const option =
      document.createElement(
        "option"
      );


    option.value =
      userId;


    /*
      Both configured Seniors remain visible.

      They are only selectable after being marked
      present on the attendance screen.
    */

    option.disabled =
      !livePresent;


    if (!livePresent) {

      option.textContent =
        `${officerName} — Not Marked Present`;

    }

    else if (!savedPresent) {

      option.textContent =
        `${officerName} — Save Attendance First`;

    }

    else {

      option.textContent =
        officerName;


      savedPresentCount +=
        1;

    }


    el.actingSupervisorSelect
      .appendChild(
        option
      );

  }



  /*
    If the leadership configuration itself is missing,
    make that obvious rather than silently showing
    an empty dropdown.
  */

  if (!seniorIds.length) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      "";


    option.disabled =
      true;


    option.textContent =
      "No Senior Officers configured for this shift";


    el.actingSupervisorSelect
      .appendChild(
        option
      );

  }



  el.saveActingSupervisorButton.disabled =

    !savedPresentCount

    ||

    !hasAnyRole(
      LEADERSHIP
    );

}

  // ==========================================================
  // RESOLVE TEAM LEAD AUTOMATICALLY AFTER ATTENDANCE
  // ==========================================================

  async function resolveLeaderAfterAttendance() {

    if (
      !currentShift
    ) {

      return;

    }


    const {
      data,
      error
    } = await db.rpc(

      "resolve_shift_operational_leader",

      {
        p_shift_id:
          currentShift.id
      }

    );


    if (
      error
    ) {

      throw error;

    }


    /*
      If this is an already-published roster and the
      Team Lead has now been resolved, synchronize the
      protected Supervisor duty post without reopening
      the original published plan.
    */

    if (

      currentShift.status ===
        "published"

      &&

      data?.resolved

    ) {

      const {
        error: syncError
      } = await db.rpc(

        "sync_shift_supervisor_station",

        {

          p_shift_id:
            currentShift.id,

          p_reason:
            "Supervisor synchronized after attendance update"

        }

      );


      if (
        syncError
      ) {

        throw syncError;

      }

    }

  }



  // ==========================================================
  // LOAD STANDING DUTY ASSIGNMENTS
  // ==========================================================

  async function loadAssignments() {

    if (
      !currentShift
    ) {

      assignments =
        [];

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


    if (
      error
    ) {

      throw error;

    }


    assignments =
      data || [];


    renderAssignments();

  }



  // ==========================================================
  // PRESENT STAFF
  // ==========================================================

  function currentPresentStaff() {

    const presentIds =
      new Set(

        attendance

          .filter(
            row =>
              row.is_present
          )

          .map(
            row =>
              row.user_id
          )

      );


    return staff.filter(
      person =>
        presentIds.has(
          person.id
        )
    );

  }



  // ==========================================================
  // RENDER DUTY ASSIGNMENT TABLE
  // ==========================================================

  function renderAssignments() {

    el.assignmentBody.innerHTML =
      "";


    if (
      !currentShift
    ) {

      el.assignmentBody.innerHTML =
        `
          <tr>
            <td
              colspan="5"
              class="empty"
            >
              Open a shift to begin.
            </td>
          </tr>
        `;

// ========================================================
// DAILY ACTIVITY REPORT
// Available only after the operational shift is active.
// ========================================================

const dailyActivityReady =

  operationallyConfirmed()

  &&

  isCurrentShiftLead();


el.dailyActivityButton.hidden =
  !dailyActivityReady;


el.dailyActivityButton.disabled =
  !dailyActivityReady;
      updateActionStates();

      return;

    }


    if (
      !stations.length
    ) {

      el.assignmentBody.innerHTML =
        `
          <tr>
            <td
              colspan="5"
              class="empty"
            >
              No active stations configured.
            </td>
          </tr>
        `;


      updateActionStates();

      return;

    }


    const assignmentMap =
      new Map(

        assignments.map(
          row => [

            row.station_id,

            row

          ]
        )

      );


    const published =

      currentShift.status ===
      "published";


    for (
      const station
      of stations
    ) {

      const tr =
        document.createElement(
          "tr"
        );


      const assignment =
        assignmentMap.get(
          station.id
        );


      // ======================================================
      // STATION
      // ======================================================

      const stationTd =
        document.createElement(
          "td"
        );


      stationTd.innerHTML = `

        <strong>
          ${escapeHtml(
            station.station_name
          )}
        </strong>

        <br>

        <span class="muted">
          ${escapeHtml(
            station.station_code ||
            ""
          )}
        </span>

      `;


      if (
        PROTECTED.has(
          station.station_code
        )
      ) {

        const protectedText =
          document.createElement(
            "small"
          );


        protectedText.textContent =
          "Protected post";


        protectedText.style.display =
          "block";


        protectedText.style.marginTop =
          "4px";


        stationTd.appendChild(
          protectedText
        );

      }


      // ======================================================
      // OFFICER
      // ======================================================

      const officerTd =
        document.createElement(
          "td"
        );


      officerTd.textContent =

        assignment
          ?.display_name

        ||

        "Unassigned";


      // ======================================================
      // SOURCE
      // ======================================================

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

        assignment
          ?.assignment_source

        ||

        "—";


      sourceTd.appendChild(
        source
      );


      // ======================================================
      // LOCK
      // ======================================================

      const lockTd =
        document.createElement(
          "td"
        );


      if (
        assignment
      ) {

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


        /*
          Once published, locks belong to the
          official plan and are not edited through
          the standard planning controls.
        */

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


      // ======================================================
      // ASSIGNMENT ACTION
      // ======================================================

      const actionTd =
        document.createElement(
          "td"
        );


      const action =
        document.createElement(
          "button"
        );


      action.className =
        "button secondary";


      action.type =
        "button";


      if (
        station.station_code ===
        "SUPERVISOR"
      ) {

        action.textContent =
          "Protected";


        action.disabled =
          true;

      }

      else {

        action.textContent =

          published

            ? "Operational Change"

            : "Change";


        action.disabled =

          published

            ? !canManagePublishedOperations()

            : !hasAnyRole(
                LEADERSHIP
              );


        action.addEventListener(

          "click",

          () =>
            openManualModal(
              station
            )

        );

      }


      actionTd.appendChild(
        action
      );


      tr.append(

        stationTd,

        officerTd,

        sourceTd,

        lockTd,

        actionTd

      );


      el.assignmentBody.appendChild(
        tr
      );

    }


    updateActionStates();

  }
    // ==========================================================
  // STEP 3
  // HANDOFF / OPERATIONAL SHIFT ACTIVATION
  // ==========================================================

  async function loadHandoffStatus() {

    if (
      !currentShift
    ) {

      handoffStatus =
        null;

      renderHandoffStatus();

      return;

    }


    const {
      data,
      error
    } = await db.rpc(

      "get_shift_handoff_workflow_status",

      {
        p_shift_id:
          currentShift.id
      }

    );


    if (
      error
    ) {

      throw error;

    }


    handoffStatus =
      data || null;


    renderHandoffStatus();

  }



  // ==========================================================
  // RENDER HANDOFF STATUS
  // ==========================================================

  function renderHandoffStatus() {

    if (
      !currentShift
    ) {

      el.handoffPanel.hidden =
        true;

      return;

    }


    el.handoffPanel.hidden =
      false;


    const status =
      handoffStatus || {};


    const leaderName =

      status.supervisor_display_name

      ||

      currentShift.supervisor_display_name

      ||

      "Not resolved";


    el.handoffLeader.textContent =
      leaderName;


    el.handoffPriorReport.textContent =

      status.prior_report_code

      ||

      "No prior handoff";


    el.handoffCarryCount.textContent =
      String(
        status.carry_forward_special_posts
        ||
        0
      );


    el.handoffAdvanceNotice.hidden =
      !status.advance_plan;


    // ========================================================
    // 1. LEADERSHIP MUST BE RESOLVED FIRST
    // ========================================================

    if (
      !status.leadership_resolved
    ) {

      el.handoffStatusBadge.textContent =
        "LEADERSHIP REQUIRED";


      el.handoffStatusBadge.className =
        "status-chip bad";


      el.handoffReceiptStatus.textContent =
        "Resolve Team Lead / Acting Team Lead first";

    }


    // ========================================================
    // 2. NO PRIOR HANDOFF EXISTS
    // ========================================================

  else if (
  !status.handoff_required
) {

  const alreadyActive =

    Boolean(
      currentShift
        ?.operationally_confirmed_at
    )

    ||

    status.handoff_status ===
      "not_required";


  if (
    alreadyActive
  ) {

    el.handoffStatusBadge.textContent =
      "SHIFT ACTIVE";


    el.handoffStatusBadge.className =
      "status-chip good";


    el.handoffReceiptStatus.textContent =
      "Shift activated without a prior handoff";

  }

  else if (
    status.operational_ready
  ) {

    el.handoffStatusBadge.textContent =
      "READY TO START";


    el.handoffStatusBadge.className =
      "status-chip warn";


    el.handoffReceiptStatus.textContent =
      "Leadership confirmed. Start the shift to begin operations.";

  }

  else {

    el.handoffStatusBadge.textContent =
      "NO PRIOR HANDOFF";


    el.handoffStatusBadge.className =
      "status-chip warn";


    el.handoffReceiptStatus.textContent =
      "No prior handoff is available.";

  }

}

    // ========================================================
    // 3. PRIOR HANDOFF EXISTS BUT HAS NOT BEEN RECEIVED
    // ========================================================

    else if (
      !status.handoff_acknowledged
    ) {

      el.handoffStatusBadge.textContent =
        "AWAITING RECEIPT";


      el.handoffStatusBadge.className =
        "status-chip warn";


      el.handoffReceiptStatus.textContent =
        "Prior handoff has not been acknowledged";

    }


    // ========================================================
    // 4. HANDOFF HAS BEEN ACKNOWLEDGED
    // ========================================================

    else {

      el.handoffStatusBadge.textContent =
        "HANDOFF RECEIVED";


      el.handoffStatusBadge.className =
        "status-chip good";


      el.handoffReceiptStatus.textContent =
        "Prior handoff received by incoming leadership";

    }


    // ========================================================
    // PRIOR HANDOFF BUTTON
    // Only exists when there actually IS a prior handoff.
    // ========================================================

    el.openHandoffButton.hidden =
      !status.handoff_required;


    if (
      status.handoff_required
    ) {

      el.openHandoffButton.textContent =

        status.handoff_acknowledged

          ? "Review Prior Handoff"

          : "Open Prior Handoff";

    }


    // ========================================================
    // DETERMINE WHETHER CURRENT USER MAY ACTIVATE SHIFT
    // ========================================================

    const canConfirm =

      status.leadership_resolved

      &&

      isCurrentShiftLead()

      &&

      (
        !status.handoff_required

        ||

        status.handoff_acknowledged
      );


    el.confirmHandoffButton.disabled =
      !canConfirm;


 // ========================================================
// SHIFT ACTIVATION / DAILY ACTIVITY REPORT
// ========================================================

const shiftActive =
  operationallyConfirmed();


const leadershipReady =
  Boolean(
    status.leadership_resolved
  );


const currentUserIsLeader =
  isCurrentShiftLead();



// --------------------------------------------------------
// SHIFT IS ACTIVE
// --------------------------------------------------------

if (
  shiftActive
) {

  el.confirmHandoffButton.hidden =
    true;


  el.dailyActivityButton.hidden =
    !currentUserIsLeader;


  el.dailyActivityButton.disabled =
    !currentUserIsLeader;


  el.dailyActivityButton.textContent =
    "Open Daily Activity Report";

}



// --------------------------------------------------------
// LEADERSHIP HAS NOT BEEN RESOLVED YET
// --------------------------------------------------------

else if (
  !leadershipReady
) {

  el.confirmHandoffButton.hidden =
    true;


  el.dailyActivityButton.hidden =
    true;

}



// --------------------------------------------------------
// LEADERSHIP READY — SHIFT STILL NEEDS TO BE STARTED
// --------------------------------------------------------

else {

  el.dailyActivityButton.hidden =
    true;


  el.confirmHandoffButton.hidden =
    false;


  const canStartShift =

    currentUserIsLeader

    &&

    (
      !status.handoff_required

      ||

      status.handoff_acknowledged
    );


  el.confirmHandoffButton.disabled =
    !canStartShift;


  if (
    !status.handoff_required
  ) {

    el.confirmHandoffButton.textContent =
      "Start Shift — No Prior Handoff";

  }

  else if (
    status.handoff_acknowledged
  ) {

    el.confirmHandoffButton.textContent =
      "Start Shift";

  }

  else {

    el.confirmHandoffButton.textContent =
      "Receive Prior Handoff First";

  }

}
  // ==========================================================
  // BUILD RETURN URL BACK TO THIS EXACT DUTY SHIFT
  // ==========================================================

  function dutyReturnUrl() {

    const url =
      new URL(
        window.location.href
      );


    url.search =
      "";


    url.searchParams.set(
      "shiftDate",
      currentShift.shift_date
    );


    url.searchParams.set(
      "shiftName",
      currentShift.shift_name
    );


    return url.href;

  }



  // ==========================================================
  // OPEN PRIOR END-OF-SHIFT HANDOFF
  // ==========================================================

  function openPriorHandoff() {

    if (

      !currentShift

      ||

      !handoffStatus
        ?.prior_report_id

    ) {

      return;

    }


    const target =
      new URL(

        END_OF_SHIFT_URL,

        window.location.href

      );


    target.searchParams.set(
      "reportId",
      handoffStatus.prior_report_id
    );


    target.searchParams.set(
      "source",
      "duty-assignments"
    );


    target.searchParams.set(
      "returnTo",
      dutyReturnUrl()
    );


    window.location.assign(
      target.href
    );

  }

// ==========================================================
// OPEN DAILY ACTIVITY REPORT
//
// This is the live working report for the current shift.
// The same report becomes the End-of-Shift Report when
// leadership publishes it at shift completion.
// ==========================================================

async function openDailyActivityReport() {

  if (
    !currentShift
  ) {

    return;

  }


  if (
    !operationallyConfirmed()
  ) {

    showMessage(
      "Activate the shift before opening the Daily Activity Report.",
      "error"
    );

    return;

  }


  if (
    !isCurrentShiftLead()
  ) {

    showMessage(
      "Only the current Team Lead or designated Acting Team Lead can work this shift's Daily Activity Report.",
      "error"
    );

    return;

  }


  el.dailyActivityButton.disabled =
    true;


el.dailyActivityButton.textContent =
    "Opening…";


  try {

    const {
      data,
      error
    } = await db.rpc(

      "open_end_of_shift_report",

      {

        p_shift_date:
          currentShift.shift_date,

        p_shift_name:
          currentShift.shift_name

      }

    );


    if (
      error
    ) {

      throw error;

    }


    const reportId =

      data
        ?.report
        ?.report_id;


    if (
      !reportId
    ) {

      throw new Error(
        "The Daily Activity Report was opened, but SecureTrack did not return a report ID."
      );

    }


    const target =
      new URL(

        END_OF_SHIFT_URL,

        window.location.href

      );


    target.searchParams.set(
      "reportId",
      reportId
    );


    target.searchParams.set(
      "shiftDate",
      currentShift.shift_date
    );


    target.searchParams.set(
      "shiftName",
      currentShift.shift_name
    );


    target.searchParams.set(
      "source",
      "daily-activity"
    );


    target.searchParams.set(
      "returnTo",
      dutyReturnUrl()
    );


    window.location.assign(
      target.href
    );

  }

  catch (
    error
  ) {

    console.error(
      "Open Daily Activity Report error:",
      error
    );


    showMessage(

      error?.message

      ||

      "Unable to open the Daily Activity Report.",

      "error"

    );


    el.dailyActivityButton.disabled =
      false;


    el.dailyActivityButton.textContent =
      "Open Daily Activity Report";

// ----------------------------------------------------------
// Daily Activity Report
// ----------------------------------------------------------

el.dailyActivityButton.addEventListener(

  "click",

  openDailyActivityReport

);
    
  }

}

  // ==========================================================
  // CONFIRM OPERATIONAL HANDOFF
  //
  // This does three important things:
  //
  // 1. Confirms the incoming leader has received the handoff.
  // 2. Imports ongoing Special Posts from the prior shift.
  // 3. Initializes the incoming shift's live End-of-Shift
  //    Report so it can be updated throughout the shift.
  // ==========================================================

  async function confirmOperationalHandoff() {

    if (
      !currentShift
    ) {

      return;

    }


    el.confirmHandoffButton.disabled =
      true;


    el.confirmHandoffButton.textContent =
      "Confirming…";


    try {


      // ======================================================
      // CONFIRM HANDOFF / IMPORT CARRY-FORWARD SPECIAL POSTS
      // ======================================================

      const {
        error
      } = await db.rpc(

        "confirm_shift_operational_handoff",

        {
          p_shift_id:
            currentShift.id
        }

      );


      if (
        error
      ) {

        throw error;

      }



      // ======================================================
      // CREATE / OPEN THIS SHIFT'S LIVE END-OF-SHIFT REPORT
      // ======================================================

      const liveReport =
        await db.rpc(

          "open_end_of_shift_report",

          {

            p_shift_date:
              currentShift.shift_date,

            p_shift_name:
              currentShift.shift_name

          }

        );


      if (
        liveReport.error
      ) {

        throw liveReport.error;

      }



      // ======================================================
      // REFRESH HANDOFF + SPECIAL POSTS
      // ======================================================

      await Promise.all([

        loadHandoffStatus(),

        loadSpecialPosts()

      ]);



      showMessage(

        "Operational handoff confirmed. Carry-forward Special Posts are now available for coverage review, and the live End-of-Shift Report has been initiated.",

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Confirm handoff error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to confirm operational handoff.",

        "error"

      );


      renderHandoffStatus();

    }

  }
    // ==========================================================
  // STEP 4
  // SPECIAL POST ASSIGNMENTS
  // ==========================================================

  async function loadSpecialPosts() {

    specialPostAccessError =
      null;


    if (
      !currentShift
    ) {

      specialPosts =
        [];

      renderSpecialPosts();

      return;

    }


    const {
      data,
      error
    } = await db.rpc(

      "get_shift_special_assignments",

      {
        p_shift_id:
          currentShift.id
      }

    );


    if (
      error
    ) {

      specialPosts =
        [];


      specialPostAccessError =

        error.message

        ||

        "Special Post access is not available yet.";


      renderSpecialPosts();

      return;

    }


    specialPosts =
      data || [];


    renderSpecialPosts();

  }



  // ==========================================================
  // PRIORITY LABEL
  // ==========================================================

  function specialPriorityLabel(
    value
  ) {

    const labels = {

      1:
        "1 — MUST COVER",

      2:
        "2 — HIGH PRIORITY",

      3:
        "3 — IMPORTANT",

      4:
        "4 — PREFERRED",

      5:
        "5 — GOOD TO HAVE / ROUNDS ACCEPTABLE"

    };


    return (

      labels[
        Number(
          value
        )
      ]

      ||

      `Priority ${value ?? "—"}`

    );

  }



  // ==========================================================
  // RENDER SPECIAL POSTS
  // ==========================================================

  function renderSpecialPosts() {

    el.specialPostPanel.hidden =
      !currentShift;


    el.specialPostList.innerHTML =
      "";


    if (
      !currentShift
    ) {

      el.specialPostList.innerHTML =

        '<div class="empty">Open a shift to review Special Posts.</div>';


      return;

    }



    if (
      specialPostAccessError
    ) {

      el.specialPostList.innerHTML = `

        <div class="empty">

          ${escapeHtml(
            specialPostAccessError
          )}

        </div>

      `;


      updateActionStates();

      return;

    }



    if (
      !specialPosts.length
    ) {

      el.specialPostList.innerHTML =

        '<div class="empty">No Special Posts have been added for this shift.</div>';


      updateActionStates();

      return;

    }



    for (
      const post
      of specialPosts
    ) {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "special-post-card";



      // ======================================================
      // CARRY-FORWARD BADGE
      // ======================================================

      const carried =

        post.carried_from_assignment_id

          ? (
              '<span class="status-chip warn">' +
              'CARRY-FORWARD' +
              '</span>'
            )

          : "";



      // ======================================================
      // STATUS APPEARANCE
      // ======================================================

      const statusClass =

        [
          "active",
          "carry_forward"
        ].includes(
          post.assignment_status
        )

          ? "good"

          : post.assignment_status ===
              "cancelled"

            ? "bad"

            : "";



      const priorityLabel =

        post.priority_label

        ||

        specialPriorityLabel(
          post.priority_rating
        );



      // ======================================================
      // SPECIAL POST DETAILS
      // ======================================================

      card.innerHTML = `

        <div class="special-post-head">

          <div>

            <h3>
              ${escapeHtml(
                post.assignment_name
              )}
            </h3>

            <div class="special-post-meta">

              <span class="priority-chip">

                ${escapeHtml(
                  priorityLabel
                )}

              </span>

              <span
                class="status-chip ${statusClass}"
              >

                ${escapeHtml(
                  (
                    post.assignment_status
                    ||
                    "active"
                  )
                    .replaceAll(
                      "_",
                      " "
                    )
                    .toUpperCase()
                )}

              </span>

              ${carried}

            </div>

          </div>


          <div>

            <strong>

              ${escapeHtml(
                post.assigned_user_name
                ||
                "UNASSIGNED"
              )}

            </strong>

          </div>

        </div>



        <div class="special-post-grid">


          <div class="special-detail">

            <span>
              Location
            </span>

            <strong>

              ${escapeHtml(
                post.location
                ||
                "—"
              )}

            </strong>

          </div>



          <div class="special-detail">

            <span>
              Requested By / Unit
            </span>

            <strong>

              ${escapeHtml(
                post.requested_by_name
                ||
                post.requesting_unit
                ||
                "—"
              )}

            </strong>

          </div>



          <div class="special-detail">

            <span>
              Approved By
            </span>

            <strong>

              ${escapeHtml(
                post.approved_by_name
                ||
                "—"
              )}

            </strong>

          </div>



          <div class="special-detail">

            <span>
              Bill To / Cost Center
            </span>

            <strong>

              ${escapeHtml(
                post.bill_to
                ||
                post.cost_center
                ||
                "—"
              )}

            </strong>

          </div>


        </div>



        ${
          post.start_time
          ||
          post.end_time

            ? `

              <p class="muted">

                <strong>
                  Coverage Window:
                </strong>

                ${
                  escapeHtml(
                    post.start_time
                    ||
                    "Start not specified"
                  )
                }

                —

                ${
                  escapeHtml(
                    post.end_time
                    ||
                    "Until released"
                  )
                }

              </p>

            `

            : ""
        }



        ${
          post.handoff_notes

            ? `

              <p class="muted">

                <strong>
                  Handoff:
                </strong>

                ${escapeHtml(
                  post.handoff_notes
                )}

              </p>

            `

            : ""
        }



        ${
          post.notes

            ? `

              <p class="muted">

                <strong>
                  Notes:
                </strong>

                ${escapeHtml(
                  post.notes
                )}

              </p>

            `

            : ""
        }

      `;



      // ======================================================
      // SPECIAL POST ACTIONS
      // ======================================================

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "special-actions";


      const active =

        [
          "active",
          "carry_forward"
        ].includes(
          post.assignment_status
        );



      if (
        active
      ) {


        // ====================================================
        // ASSIGN / REASSIGN COVERAGE
        // ====================================================

        const assign =
          document.createElement(
            "button"
          );


        assign.type =
          "button";


        assign.className =
          "button primary";


        assign.textContent =

          post.assigned_user_id

            ? "Reassign Coverage"

            : "Assign Coverage";


        assign.disabled =
          !canManageSpecialPosts();


        assign.addEventListener(

          "click",

          () =>
            openCoverageModal(
              post
            )

        );


        actions.appendChild(
          assign
        );



        // ====================================================
        // COMPLETE
        // ====================================================

        const complete =
          document.createElement(
            "button"
          );


        complete.type =
          "button";


        complete.className =
          "button secondary";


        complete.textContent =
          "Mark Completed";


        complete.disabled =
          !canManageSpecialPosts();


        complete.addEventListener(

          "click",

          () =>
            setSpecialPostStatus(
              post,
              "completed"
            )

        );


        actions.appendChild(
          complete
        );



        // ====================================================
        // CARRY FORWARD
        // ====================================================

        const carry =
          document.createElement(
            "button"
          );


        carry.type =
          "button";


        carry.className =
          "button secondary";


        carry.textContent =
          "Carry Forward";


        carry.disabled =
          !canManageSpecialPosts();


        carry.addEventListener(

          "click",

          () =>
            setSpecialPostStatus(
              post,
              "carry_forward"
            )

        );


        actions.appendChild(
          carry
        );



        // ====================================================
        // CANCEL
        // ====================================================

        const cancel =
          document.createElement(
            "button"
          );


        cancel.type =
          "button";


        cancel.className =
          "button ghost";


        cancel.textContent =
          "Cancel Post";


        cancel.disabled =
          !canManageSpecialPosts();


        cancel.addEventListener(

          "click",

          () =>
            setSpecialPostStatus(
              post,
              "cancelled"
            )

        );


        actions.appendChild(
          cancel
        );

      }



      card.appendChild(
        actions
      );


      el.specialPostList.appendChild(
        card
      );

    }


    updateActionStates();

  }



  // ==========================================================
  // OPEN ADD SPECIAL POST MODAL
  // ==========================================================

  function openSpecialPostModal() {

    if (

      !currentShift

      ||

      !canManageSpecialPosts()

    ) {

      return;

    }


    el.specialPostForm.reset();


    el.specialPriority.value =
      "";


    el.specialPostModal
      .classList
      .add(
        "show"
      );


    el.specialPostModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }



  // ==========================================================
  // CLOSE ADD SPECIAL POST MODAL
  // ==========================================================

  function closeSpecialPostModal() {

    el.specialPostModal
      .classList
      .remove(
        "show"
      );


    el.specialPostModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }



  // ==========================================================
  // SAVE NEW SPECIAL POST
  // ==========================================================

  async function saveSpecialPost(
    event
  ) {

    event.preventDefault();


    if (
      !currentShift
    ) {

      return;

    }



    if (
      !el.specialAssignmentName
        .value
        .trim()

      ||

      !el.specialPriority.value

      ||

      !el.specialApprovedBy
        .value
        .trim()

      ||

      !el.specialBillTo
        .value
        .trim()
    ) {

      showMessage(

        "Complete the Special Post name, priority, Approved By, and Bill To fields.",

        "error"

      );


      return;

    }



    el.saveSpecialPostButton.disabled =
      true;


    el.saveSpecialPostButton.textContent =
      "Saving…";


    try {


      const {
        data,
        error
      } = await db.rpc(

        "create_shift_special_assignment",

        {

          p_shift_id:
            currentShift.id,


          p_assignment_name:
            el.specialAssignmentName
              .value
              .trim(),


          p_priority_rating:
            Number(
              el.specialPriority.value
            ),


          p_approved_by_name:
            el.specialApprovedBy
              .value
              .trim(),


          p_bill_to:
            el.specialBillTo
              .value
              .trim(),


          p_location:
            el.specialLocation
              .value
              .trim()
            ||
            null,


          p_requesting_unit:
            el.specialRequestingUnit
              .value
              .trim()
            ||
            null,


          p_requested_by_name:
            el.specialRequestedBy
              .value
              .trim()
            ||
            null,


          p_cost_center:
            el.specialCostCenter
              .value
              .trim()
            ||
            null,


          p_start_time:
            el.specialStartTime.value
            ||
            null,


          p_end_time:
            el.specialEndTime.value
            ||
            null,


          p_scheduled_hours:
            null,


          p_ongoing_next_shift:
            el.specialOngoing.checked,


          p_notes:
            el.specialNotes
              .value
              .trim()
            ||
            null

        }

      );


      if (
        error
      ) {

        throw error;

      }



      closeSpecialPostModal();


      await loadSpecialPosts();



      showMessage(

        currentShift.status ===
          "published"

          ? (
              "Special Post added as a post-publication operational revision. Assign coverage next."
            )

          : (
              "Special Post added. Assign coverage before generating if its priority requires dedicated coverage."
            ),

        "success"

      );



      // ======================================================
      // OPEN COVERAGE REVIEW FOR NEWLY CREATED POST
      // ======================================================

      const created =
        specialPosts.find(
          row =>
            row.special_assignment_id ===
            data?.special_assignment_id
        );


      if (
        created
      ) {

        openCoverageModal(
          created
        );

      }


    }

    catch (
      error
    ) {

      console.error(
        "Special Post create error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to add Special Post.",

        "error"

      );

    }

    finally {

      el.saveSpecialPostButton.disabled =
        false;


      el.saveSpecialPostButton.textContent =
        "Save Special Post";

    }

  }



  // ==========================================================
  // OPEN SPECIAL POST COVERAGE REVIEW
  // ==========================================================

  async function openCoverageModal(
    post
  ) {

    if (
      !currentShift
    ) {

      return;

    }


    el.coverageSpecialAssignmentId.value =
      post.special_assignment_id;


    el.coverageTitle.textContent =

      `Assign Coverage — ${post.assignment_name}`;


    el.coverageSummary.textContent =

      `${
        post.priority_label
        ||
        specialPriorityLabel(
          post.priority_rating
        )
      } • Supervisor, Dispatch 1, and Dispatch 2 are protected and cannot be displaced.`;



    el.coverageReason.value =
      "";


    el.coverageCandidateList.innerHTML =

      '<div class="empty">Loading candidates…</div>';



    el.coverageModal
      .classList
      .add(
        "show"
      );


    el.coverageModal.setAttribute(
      "aria-hidden",
      "false"
    );



    try {


      const {
        data,
        error
      } = await db.rpc(

        "get_special_assignment_coverage_candidates",

        {

          p_shift_id:
            currentShift.id,

          p_special_assignment_id:
            post.special_assignment_id

        }

      );


      if (
        error
      ) {

        throw error;

      }


      renderCoverageCandidates(
        data || []
      );


    }

    catch (
      error
    ) {

      console.error(
        "Coverage candidate error:",
        error
      );


      el.coverageCandidateList.innerHTML = `

        <div class="empty">

          ${escapeHtml(
            error.message
            ||
            "Unable to load coverage candidates."
          )}

        </div>

      `;

    }

  }



  // ==========================================================
  // RENDER COVERAGE CANDIDATES
  //
  // Backend enforcement is authoritative.
  //
  // Supervisor / Team Lead,
  // Dispatch 1,
  // and Dispatch 2
  // cannot be displaced for Special Post coverage.
  // ==========================================================

  function renderCoverageCandidates(
    candidates
  ) {

    el.coverageCandidateList.innerHTML =
      "";


    if (
      !candidates.length
    ) {

      el.coverageCandidateList.innerHTML =

        '<div class="empty">No present coverage candidates are available.</div>';


      return;

    }



    for (
      const candidate
      of candidates
    ) {

      const row =
        document.createElement(
          "label"
        );


      row.className =
        "coverage-row";



      if (
        candidate.recommended
      ) {

        row.classList.add(
          "recommended"
        );

      }



      if (
        candidate.is_protected
      ) {

        row.classList.add(
          "protected"
        );

      }



      const radio =
        document.createElement(
          "input"
        );


      radio.type =
        "radio";


      radio.name =
        "coverageCandidate";


      radio.value =
        candidate.user_id;


      radio.disabled =
        !candidate.eligible;



      const body =
        document.createElement(
          "div"
        );



      const current =

        candidate.is_unassigned

          ? "Currently unassigned"

          : (

              `${
                candidate.current_station_name
                ||
                "Standing post"
              } • Priority ${
                candidate.current_station_priority
                ??
                "—"
              }`

            );



      body.innerHTML = `

        <strong>

          ${escapeHtml(
            candidate.display_name
          )}

        </strong>


        ${
          candidate.recommended

            ? (
                '<span class="status-chip good" style="margin-left:7px;">' +
                'RECOMMENDED' +
                '</span>'
              )

            : ""
        }


        ${
          candidate.is_protected

            ? (
                '<span class="status-chip bad" style="margin-left:7px;">' +
                'PROTECTED' +
                '</span>'
              )

            : ""
        }


        <small>

          ${escapeHtml(
            current
          )}

        </small>


        <small>

          ${escapeHtml(
            candidate.eligibility_note
            ||
            ""
          )}

        </small>

      `;



      row.append(
        radio,
        body
      );


      el.coverageCandidateList.appendChild(
        row
      );

    }

  }



  // ==========================================================
  // CLOSE COVERAGE MODAL
  // ==========================================================

  function closeCoverageModal() {

    el.coverageModal
      .classList
      .remove(
        "show"
      );


    el.coverageModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }



  // ==========================================================
  // SAVE SPECIAL POST COVERAGE
  // ==========================================================

  async function saveCoverage(
    event
  ) {

    event.preventDefault();



    const specialId =
      el.coverageSpecialAssignmentId.value;



    const selected =
      el.coverageCandidateList.querySelector(

        'input[name="coverageCandidate"]:checked'

      );



    if (
      !selected
    ) {

      showMessage(

        "Select an eligible officer for Special Post coverage.",

        "error"

      );


      return;

    }



    /*
      Published roster changes require a reason
      so the operational revision is auditable.
    */

    if (

      currentShift
        ?.status ===
        "published"

      &&

      !el.coverageReason
        .value
        .trim()

    ) {

      showMessage(

        "Enter a reason for this post-publication coverage revision.",

        "error"

      );


      return;

    }



    el.saveCoverageButton.disabled =
      true;


    el.saveCoverageButton.textContent =
      "Assigning…";


    try {


      const {
        data,
        error
      } = await db.rpc(

        "assign_shift_special_assignment",

        {

          p_special_assignment_id:
            specialId,

          p_user_id:
            selected.value,

          p_reason:
            el.coverageReason
              .value
              .trim()
            ||
            null

        }

      );


      if (
        error
      ) {

        throw error;

      }



      closeCoverageModal();



      /*
        Reload both sections because assigning a
        Special Post may deliberately vacate a
        lower-priority standing post.
      */

      await Promise.all([

        loadSpecialPosts(),

        loadAssignments()

      ]);



      showMessage(

        data
          ?.requires_remaining_coverage_review

          ? (
              "Special Post coverage assigned. The officer's previous standing post is now open and requires coverage review."
            )

          : (
              "Special Post coverage assigned."
            ),

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Assign coverage error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to assign Special Post coverage.",

        "error"

      );

    }

    finally {

      el.saveCoverageButton.disabled =
        false;


      el.saveCoverageButton.textContent =
        "Assign Coverage";

    }

  }



  // ==========================================================
  // SPECIAL POST STATUS
  //
  // completed
  // carry_forward
  // cancelled
  // ==========================================================

  async function setSpecialPostStatus(
    post,
    status
  ) {

    let handoffNotes =
      null;



    // ========================================================
    // CARRY FORWARD REQUIRES HANDOFF INSTRUCTIONS
    // ========================================================

    if (
      status ===
      "carry_forward"
    ) {

      handoffNotes =
        window.prompt(

          `Enter handoff instructions for ${post.assignment_name}:`,

          post.handoff_notes

          ||

          post.notes

          ||

          ""

        );


      if (
        handoffNotes ===
        null
      ) {

        return;

      }


      if (
        !handoffNotes.trim()
      ) {

        showMessage(

          "Carry Forward requires handoff instructions.",

          "error"

        );


        return;

      }

    }


    // ========================================================
    // COMPLETION / CANCELLATION CONFIRMATION
    // ========================================================

    else {

      const label =

        status ===
        "completed"

          ? "complete"

          : "cancel";


      const confirmed =
        window.confirm(

          `${
            label[0].toUpperCase()
            +
            label.slice(1)
          } ${post.assignment_name}?`

        );


      if (
        !confirmed
      ) {

        return;

      }

    }



    try {


      const {
        data,
        error
      } = await db.rpc(

        "set_shift_special_assignment_status",

        {

          p_special_assignment_id:
            post.special_assignment_id,

          p_status:
            status,

          p_handoff_notes:
            handoffNotes

        }

      );


      if (
        error
      ) {

        throw error;

      }



      await Promise.all([

        loadSpecialPosts(),

        loadAssignments()

      ]);



      showMessage(

        data
          ?.needs_duty_reassignment

          ? (
              "Special Post updated. The released officer is available for standing-post reassignment."
            )

          : (
              "Special Post status updated."
            ),

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Special Post status error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to update Special Post status.",

        "error"

      );

    }

  }
    // ==========================================================
  // STEP 5
  // STANDING DUTY ASSIGNMENTS
  // ==========================================================


  // ==========================================================
  // REQUIRED SPECIAL POST COVERAGE CHECK
  // ==========================================================

  function uncoveredRequiredSpecialPosts() {

    return specialPosts.filter(
      post =>

        post.is_active !== false

        &&

        [
          "active",
          "carry_forward"
        ].includes(
          post.assignment_status
        )

        &&

        Number(
          post.priority_rating
        ) >= 1

        &&

        Number(
          post.priority_rating
        ) <= 4

        &&

        !post.assigned_user_id
    );

  }



  // ==========================================================
  // PROTECTED STATION VACANCY CHECK
  //
  // Supervisor
  // Dispatch 1
  // Dispatch 2
  //
  // These posts may never be silently sacrificed for
  // lower-priority standing assignments.
  // ==========================================================

  function protectedStationVacancies() {

    const assignedStationIds =
      new Set(

        assignments.map(
          row =>
            row.station_id
        )

      );


    return stations.filter(
      station =>

        PROTECTED.has(
          station.station_code
        )

        &&

        !assignedStationIds.has(
          station.id
        )
    );

  }



  // ==========================================================
  // OPEN STANDING-POST ASSIGNMENT MODAL
  // ==========================================================

  function openManualModal(
    station
  ) {

    if (
      !currentShift
      ||
      !station
    ) {

      return;

    }


    if (
      station.station_code ===
      "SUPERVISOR"
    ) {

      showMessage(

        "The Supervisor post is controlled by the Team Lead / Acting Team Lead workflow.",

        "error"

      );


      return;

    }



    const present =
      currentPresentStaff();


    const targetIsDispatch =

      [
        "DISPATCH-1",
        "DISPATCH-2"
      ].includes(
        station.station_code
      );



    el.manualUserId.innerHTML =

      '<option value="">Select officer</option>';



    let eligibleCount =
      0;



    for (
      const person
      of present
    ) {

      // ------------------------------------------------------
      // CURRENT SHIFT LEADER STAYS ON SUPERVISOR
      // ------------------------------------------------------

      if (
        person.id ===
        currentShift.supervisor_user_id
      ) {

        continue;

      }



      // ------------------------------------------------------
      // ACTIVE SPECIAL POST STAFF CANNOT ALSO HOLD A
      // STANDING POST
      // ------------------------------------------------------

      const onActiveSpecialPost =
        specialPosts.some(
          post =>

            [
              "active",
              "carry_forward"
            ].includes(
              post.assignment_status
            )

            &&

            post.assigned_user_id ===
            person.id
        );


      if (
        onActiveSpecialPost
      ) {

        continue;

      }



      // ------------------------------------------------------
      // DO NOT PULL SOMEONE AWAY FROM DISPATCH TO AN
      // ORDINARY STANDING POST
      // ------------------------------------------------------

      const currentAssignment =
        assignmentForUser(
          person.id
        );


      const currentStation =
        currentAssignment

          ? stationForId(
              currentAssignment.station_id
            )

          : null;


      const currentlyDispatch =

        [
          "DISPATCH-1",
          "DISPATCH-2"
        ].includes(
          currentStation?.station_code
        );


      if (
        currentlyDispatch
        &&
        !targetIsDispatch
      ) {

        continue;

      }



      const option =
        document.createElement(
          "option"
        );


      option.value =
        person.id;


      option.textContent =

        currentStation

          ? (
              `${person.display_name} — ` +
              `${currentStation.station_name}`
            )

          : (
              `${person.display_name} — Unassigned`
            );


      el.manualUserId.appendChild(
        option
      );


      eligibleCount +=
        1;

    }



    el.manualStationId.value =
      station.id;


    el.manualReason.value =
      "";


    el.manualReason.required =

      currentShift.status ===
      "published";


    el.manualReason.placeholder =

      currentShift.status ===
      "published"

        ? (
            "Required — explain this post-publication operational revision"
          )

        : (
            "Optional note for this assignment change"
          );



    if (
      !eligibleCount
    ) {

      showMessage(

        `No eligible present officers are available for ${station.station_name}.`,

        "error"

      );


      return;

    }



    el.manualModal
      .classList
      .add(
        "show"
      );


    el.manualModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }



  // ==========================================================
  // CLOSE STANDING-POST MODAL
  // ==========================================================

  function closeManualModal() {

    el.manualModal
      .classList
      .remove(
        "show"
      );


    el.manualModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }



  // ==========================================================
  // LOCK / UNLOCK DRAFT ASSIGNMENT
  // ==========================================================

  async function toggleLock(
    assignment
  ) {

    if (
      !currentShift
      ||
      currentShift.status !==
        "draft"
    ) {

      return;

    }


    const station =
      stationForId(
        assignment.station_id
      );


    /*
      The Supervisor assignment is protected by the
      leadership workflow and should not be manually
      unlocked here.
    */

    if (
      station?.station_code ===
      "SUPERVISOR"
    ) {

      showMessage(

        "The Supervisor assignment is protected and cannot be unlocked from this control.",

        "error"

      );


      return;

    }



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


      if (
        error
      ) {

        throw error;

      }


      await loadAssignments();


      showMessage(

        assignment.is_locked

          ? "Assignment unlocked."

          : "Assignment locked.",

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Lock error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to update assignment lock.",

        "error"

      );

    }

  }



  // ==========================================================
  // GENERATE INITIAL DUTY ASSIGNMENTS
  // ==========================================================

  async function generateAssignments() {

    if (
      !currentShift
    ) {

      return;

    }



    if (
      currentShift.status !==
      "draft"
    ) {

      showMessage(

        "A published roster cannot be regenerated. Use Operational Change for live revisions.",

        "error"

      );


      return;

    }



    if (
      !canGenerateOrPublishDraft()
    ) {

      showMessage(

        "Complete the required shift-leadership and handoff steps before generating assignments.",

        "error"

      );


      return;

    }



    // ========================================================
    // PRIORITY 1-4 SPECIAL POSTS MUST HAVE COVERAGE FIRST
    // ========================================================

    const uncovered =
      uncoveredRequiredSpecialPosts();


    if (
      uncovered.length
    ) {

      const names =
        uncovered
          .map(
            post =>
              `${post.assignment_name} (${specialPriorityLabel(
                post.priority_rating
              )})`
          )
          .join(
            ", "
          );


      showMessage(

        `Assign coverage to required Special Post(s) before generating: ${names}.`,

        "error"

      );


      return;

    }



    el.generateButton.disabled =
      true;


    el.generateButton.textContent =
      "Generating…";


    try {


      const {
        data,
        error
      } = await db.rpc(

        "generate_station_assignments_operational",

        {
          p_shift_id:
            currentShift.id
        }

      );


      if (
        error
      ) {

        throw error;

      }



      /*
        The generator may also resolve / synchronize
        leadership data, so refresh the whole shift instead
        of only reloading the assignment table.
      */

      await refreshShift();



      const protectedOpen =
        protectedStationVacancies();


      if (
        protectedOpen.length
      ) {

        const names =
          protectedOpen
            .map(
              station =>
                station.station_name
            )
            .join(
              ", "
            );


        showMessage(

          `Assignments generated, but protected coverage is incomplete: ${names}. The roster cannot be published until these protected posts are filled.`,

          "error"

        );


        return;

      }



      showMessage(

        `${
          data?.assignments_generated
          ??
          assignments.length
        } assignment(s) generated. Required Special Post personnel were kept outside the standing-post pool.`,

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Generate assignment error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to generate assignments.",

        "error"

      );

    }

    finally {

      el.generateButton.textContent =
        "Generate Assignments";


      updateActionStates();

    }

  }



  // ==========================================================
  // SAVE MANUAL / OPERATIONAL STANDING-POST CHANGE
  // ==========================================================

  async function saveManualAssignment(
    event
  ) {

    event.preventDefault();


    if (
      !currentShift
    ) {

      return;

    }



    if (
      !el.manualUserId.value
    ) {

      showMessage(

        "Select an officer for the assignment.",

        "error"

      );


      return;

    }



    if (

      currentShift.status ===
        "published"

      &&

      !el.manualReason
        .value
        .trim()

    ) {

      showMessage(

        "A reason is required for a post-publication assignment revision.",

        "error"

      );


      return;

    }



    el.confirmManualButton.disabled =
      true;


    el.confirmManualButton.textContent =
      "Saving…";


    try {


      const {
        data,
        error
      } = await db.rpc(

        "assign_station_operationally",

        {

          p_shift_id:
            currentShift.id,

          p_station_id:
            el.manualStationId.value,

          p_user_id:
            el.manualUserId.value,

          p_reason:
            el.manualReason
              .value
              .trim()
            ||
            null

        }

      );


      if (
        error
      ) {

        throw error;

      }



      closeManualModal();



      await loadAssignments();



      if (
        data?.displaced_user_name
      ) {

        showMessage(

          currentShift.status ===
            "published"

            ? (
                `Operational assignment revision saved. ${data.displaced_user_name} was removed from the destination post and the change was added to assignment history.`
              )

            : (
                `Assignment saved. ${data.displaced_user_name} was removed from the destination post.`
              ),

          "success"

        );

      }

      else {

        showMessage(

          currentShift.status ===
            "published"

            ? (
                "Operational assignment revision saved and added to assignment history."
              )

            : (
                "Manual assignment saved."
              ),

          "success"

        );

      }


    }

    catch (
      error
    ) {

      console.error(
        "Assignment change error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to save assignment change.",

        "error"

      );

    }

    finally {

      el.confirmManualButton.disabled =
        false;


      el.confirmManualButton.textContent =
        "Save Assignment";

    }

  }



  // ==========================================================
  // PAGE ACTION STATES
  // ==========================================================

  function updateActionStates() {

    const hasShift =
      Boolean(
        currentShift
      );


    const published =

      currentShift
        ?.status ===
        "published";


    const draft =

      currentShift
        ?.status ===
        "draft";



    el.saveAttendanceButton.disabled =

      !hasShift

      ||

      !canEditAttendance();



    el.addSpecialPostButton.disabled =

      !hasShift

      ||

      !canManageSpecialPosts();



    el.generateButton.disabled =

      !draft

      ||

      !canGenerateOrPublishDraft();



    el.publishButton.disabled =

      !draft

      ||

      !assignments.length

      ||

      !canGenerateOrPublishDraft();



    el.postPublicationNotice.hidden =
      !published;

  }



  // ==========================================================
  // PUBLISH OFFICIAL PLANNED ROSTER
  // ==========================================================

  async function publishAssignments() {

    if (
      !currentShift
    ) {

      return;

    }



    if (
      currentShift.status !==
      "draft"
    ) {

      showMessage(

        "This roster has already been published.",

        "info"

      );


      return;

    }



    if (
      !canGenerateOrPublishDraft()
    ) {

      showMessage(

        "You do not currently have authority to publish this duty roster.",

        "error"

      );


      return;

    }



    if (
      !assignments.length
    ) {

      showMessage(

        "Generate or create duty assignments before publishing.",

        "error"

      );


      return;

    }



    // ========================================================
    // REQUIRED SPECIAL POSTS
    // ========================================================

    const uncovered =
      uncoveredRequiredSpecialPosts();


    if (
      uncovered.length
    ) {

      showMessage(

        "Priority 1-4 Special Posts must have assigned coverage before the duty roster can be published.",

        "error"

      );


      return;

    }



    // ========================================================
    // PROTECTED POST BLOCKER
    // ========================================================

    const protectedOpen =
      protectedStationVacancies();


    if (
      protectedOpen.length
    ) {

      const names =
        protectedOpen
          .map(
            station =>
              station.station_name
          )
          .join(
            ", "
          );


      showMessage(

        `Protected post coverage is incomplete: ${names}. Fill these posts before publishing.`,

        "error"

      );


      return;

    }



    const confirmed =
      window.confirm(

        `Publish assignments for ${currentShift.shift_date} ${currentShift.shift_name}? This records the official planned roster.`

      );


    if (
      !confirmed
    ) {

      return;

    }



    el.publishButton.disabled =
      true;


    el.publishButton.textContent =
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


      if (
        error
      ) {

        throw error;

      }



      await refreshShift();



      showMessage(

        "Assignments published successfully. The official plan is preserved; later attendance, Special Post, and standing-post changes are recorded as operational revisions.",

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Publish error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to publish assignments.",

        "error"

      );

    }

    finally {

      el.publishButton.textContent =
        "Publish Assignments";


      updateActionStates();

    }

  }
    // ==========================================================
  // SHIFT REFRESH
  // ==========================================================

  async function refreshShift() {

    if (
      !currentShift?.id
    ) {

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
        `
        id,
        shift_date,
        shift_name,
        status,
        published_at,
        supervisor_user_id,
        supervisor_display_name,
        supervisor_source,
        handoff_status,
        handoff_source_report_id,
        handoff_acknowledged_at,
        handoff_acknowledged_by_user_id,
        handoff_acknowledged_by_name,
        operationally_confirmed_at,
        operationally_confirmed_by_user_id,
        operationally_confirmed_by_name
        `
      )

      .eq(
        "id",
        currentShift.id
      )

      .single();


    if (
      error
    ) {

      throw error;

    }


    currentShift =
      data;


    el.shiftStatus.hidden =
      false;


    el.shiftStatusText.textContent =
      formatShift(
        currentShift
      );


    // ========================================================
    // IMPORTANT:
    // Load leadership configuration BEFORE rendering
    // attendance. This allows configured Senior Officers to
    // receive the correct attendance permissions.
    // ========================================================

    await loadLeadershipConfig();


    await Promise.all([

      loadAttendance(),

      loadAssignments(),

      loadPlannedUnavailability()

    ]);


    // Re-render once all attendance-related data is present.

    renderAttendance();

    renderSupervisorPanel();


    await Promise.all([

      loadHandoffStatus(),

      loadSpecialPosts()

    ]);


    updateActionStates();

  }



  // ==========================================================
  // OPEN / CREATE SELECTED SHIFT
  // ==========================================================

  async function openSelectedShift() {

    showMessage();


    if (

      !el.shiftDate.value

      ||

      !el.shiftName.value

    ) {

      showMessage(

        "Select a shift date and shift name.",

        "error"

      );


      return;

    }


    el.openShiftButton.disabled =
      true;


    el.openShiftButton.textContent =
      "Opening…";


    try {


      const {
        data,
        error
      } = await db.rpc(

        "create_shift_instance",

        {

          p_shift_date:
            el.shiftDate.value,

          p_shift_name:
            el.shiftName.value

        }

      );


      if (
        error
      ) {

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
          data.status
          ||
          "draft",

        published_at:
          data.published_at
          ||
          null

      };


      await refreshShift();



      if (
        data.created
      ) {

        showMessage(

          "New shift created successfully. Confirm attendance and shift leadership next.",

          "success"

        );

      }


      else if (

        currentShift.status ===
        "published"

      ) {

        showMessage(

          "Published shift loaded. Use attendance, Special Post, and Operational Change controls for live revisions. The published roster will not be regenerated.",

          "info"

        );

      }


      else {

        showMessage(

          "Existing draft shift loaded successfully.",

          "success"

        );

      }


    }

    catch (
      error
    ) {

    console.error(
  "Open shift error:",
  {
    code:
      error?.code,

    message:
      error?.message,

    details:
      error?.details,

    hint:
      error?.hint,

    fullError:
      error
  }
);


      showMessage(

        error.message

        ||

        "Unable to open shift.",

        "error"

      );

    }

    finally {

      el.openShiftButton.disabled =
        false;


      el.openShiftButton.textContent =
        "Open Shift";

    }

  }



  // ==========================================================
  // SAVE ATTENDANCE
  //
  // This uses the new operational attendance RPC for BOTH
  // draft and published rosters.
  //
  // If a published officer becomes absent:
  //   • their standing post becomes vacant
  //   • active Special Posts are reopened
  //   • Supervisor is cleared if applicable
  //   • no silent replacement occurs
  // ==========================================================

  async function saveAttendance() {

    if (
      !currentShift
    ) {

      return;

    }


    if (
      !canEditAttendance()
    ) {

      showMessage(

        "You do not currently have permission to update attendance for this shift.",

        "error"

      );


      return;

    }


    el.saveAttendanceButton.disabled =
      true;


    el.saveAttendanceButton.textContent =
      "Saving…";


    try {


      const checkboxes = [

        ...el.attendanceList
          .querySelectorAll(
            'input[type="checkbox"][data-user-id]'
          )

      ];


      const revisionNotes =
        [];


      for (
        const checkbox
        of checkboxes
      ) {


        const {
          data,
          error
        } = await db.rpc(

          "set_shift_operational_attendance",

          {

            p_shift_id:
              currentShift.id,

            p_user_id:
              checkbox.dataset.userId,

            p_is_present:
              checkbox.checked,

            p_notes:
              attendanceNoteFor(
                checkbox.dataset.userId,
                checkbox.checked
              )

          }

        );


        if (
          error
        ) {

          throw error;

        }



        // ====================================================
        // PUBLISHED ROSTER COVERAGE WARNINGS
        // ====================================================

        if (
          data?.vacated_station_name
        ) {

          revisionNotes.push(

            `${data.display_name}: ${data.vacated_station_name} now requires coverage`

          );

        }


        if (
          data?.special_posts_unassigned
        ) {

          revisionNotes.push(

            `${data.display_name}: ${data.special_posts_unassigned} Special Post assignment(s) reopened`

          );

        }


        if (
          data?.supervisor_affected
        ) {

          revisionNotes.push(

            `${data.display_name}: Shift Supervisor coverage must be resolved`

          );

        }


        if (

          [
            "DISPATCH-1",
            "DISPATCH-2"
          ].includes(
            data?.vacated_station_code
          )

        ) {

          revisionNotes.push(

            `${data.display_name}: protected ${data.vacated_station_name} coverage must be filled`

          );

        }

      }



      // ======================================================
      // RELOAD ATTENDANCE FIRST
      // ======================================================

      await loadAttendance();



      // ======================================================
      // RESOLVE TEAM LEAD / ACTING LEAD STATE
      // ======================================================

      await resolveLeaderAfterAttendance();



      // ======================================================
      // FULL REFRESH
      // ======================================================

      await refreshShift();



      showMessage(

        revisionNotes.length

          ? (
              `Attendance saved. Operational coverage review required — ${revisionNotes.join("; ")}.`
            )

          : (
              "Attendance saved and shift leadership refreshed."
            ),

        revisionNotes.length

          ? "info"

          : "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Attendance save error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to save attendance.",

        "error"

      );

    }

    finally {

      el.saveAttendanceButton.textContent =
        "Save Attendance";


      updateActionStates();

    }

  }



  // ==========================================================
  // CONFIRM ACTING TEAM LEAD
  // ==========================================================

  async function saveActingSupervisor() {

    if (

      !currentShift

      ||

      !el.actingSupervisorSelect.value

    ) {

      showMessage(

        "Select a present configured Senior Officer.",

        "error"

      );


      return;

    }


    el.saveActingSupervisorButton.disabled =
      true;


    el.saveActingSupervisorButton.textContent =
      "Saving…";


    try {


      const {
        error
      } = await db.rpc(

        "set_shift_operational_supervisor",

        {

          p_shift_id:
            currentShift.id,

          p_user_id:
            el.actingSupervisorSelect.value

        }

      );


      if (
        error
      ) {

        throw error;

      }


      await refreshShift();


      showMessage(

        "Acting Team Lead confirmed and the protected Supervisor post has been updated.",

        "success"

      );


    }

    catch (
      error
    ) {

      console.error(
        "Acting Supervisor error:",
        error
      );


      showMessage(

        error.message

        ||

        "Unable to confirm Acting Team Lead.",

        "error"

      );

    }

    finally {

      el.saveActingSupervisorButton.textContent =
        "Confirm Acting Team Lead";


      renderSupervisorPanel();

    }

  }



  // ==========================================================
  // EVENT WIRING
  // ==========================================================


  // ----------------------------------------------------------
  // Open Shift
  // ----------------------------------------------------------

  el.shiftForm.addEventListener(

    "submit",

    event => {

      event.preventDefault();

      openSelectedShift();

    }

  );



  // ----------------------------------------------------------
  // Attendance
  // ----------------------------------------------------------

  el.saveAttendanceButton.addEventListener(

    "click",

    saveAttendance

  );



  // ----------------------------------------------------------
  // Acting Team Lead
  // ----------------------------------------------------------

  el.saveActingSupervisorButton.addEventListener(

    "click",

    saveActingSupervisor

  );



  // ----------------------------------------------------------
  // Refresh Handoff
  // ----------------------------------------------------------

  el.refreshHandoffButton.addEventListener(

    "click",

    async () => {

      try {


        await refreshShift();


        showMessage(

          "Handoff and operational shift status refreshed.",

          "success"

        );


      }

      catch (
        error
      ) {

        console.error(
          "Refresh handoff error:",
          error
        );


        showMessage(

          error.message

          ||

          "Unable to refresh handoff status.",

          "error"

        );

      }

    }

  );



  // ----------------------------------------------------------
  // Prior Handoff
  // ----------------------------------------------------------

  el.openHandoffButton.addEventListener(

    "click",

    openPriorHandoff

  );



  // ----------------------------------------------------------
  // Confirm Operational Handoff
  // ----------------------------------------------------------

  el.confirmHandoffButton.addEventListener(

    "click",

    confirmOperationalHandoff

  );

// ----------------------------------------------------------
// Daily Activity Report
// ----------------------------------------------------------

el.dailyActivityButton.addEventListener(

  "click",

  openDailyActivityReport

);

  // ----------------------------------------------------------
  // Add Special Post
  // ----------------------------------------------------------

  el.addSpecialPostButton.addEventListener(

    "click",

    openSpecialPostModal

  );



  // ----------------------------------------------------------
  // Save Special Post
  // ----------------------------------------------------------

  el.specialPostForm.addEventListener(

    "submit",

    saveSpecialPost

  );



  // ----------------------------------------------------------
  // Special Post Coverage
  // ----------------------------------------------------------

  el.coverageForm.addEventListener(

    "submit",

    saveCoverage

  );



  // ----------------------------------------------------------
  // Generate
  // ----------------------------------------------------------

  el.generateButton.addEventListener(

    "click",

    generateAssignments

  );



  // ----------------------------------------------------------
  // Manual / Operational Assignment
  // ----------------------------------------------------------

  el.manualForm.addEventListener(

    "submit",

    saveManualAssignment

  );



  // ----------------------------------------------------------
  // Publish
  // ----------------------------------------------------------

  el.publishButton.addEventListener(

    "click",

    publishAssignments

  );



  // ==========================================================
  // MODAL CANCEL BUTTONS
  // ==========================================================

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


  document
    .querySelectorAll(
      ".special-modal-cancel"
    )
    .forEach(
      button => {

        button.addEventListener(

          "click",

          closeSpecialPostModal

        );

      }
    );


  document
    .querySelectorAll(
      ".coverage-modal-cancel"
    )
    .forEach(
      button => {

        button.addEventListener(

          "click",

          closeCoverageModal

        );

      }
    );



  // ==========================================================
  // CLICK OUTSIDE MODAL TO CLOSE
  // ==========================================================

  for (
    const [
      modal,
      close
    ]
    of [

      [
        el.manualModal,
        closeManualModal
      ],

      [
        el.specialPostModal,
        closeSpecialPostModal
      ],

      [
        el.coverageModal,
        closeCoverageModal
      ]

    ]
  ) {

    modal?.addEventListener(

      "click",

      event => {

        if (
          event.target ===
          modal
        ) {

          close();

        }

      }

    );

  }



  // ==========================================================
  // ESCAPE KEY CLOSES OPEN MODALS
  // ==========================================================

  document.addEventListener(

    "keydown",

    event => {

      if (
        event.key !==
        "Escape"
      ) {

        return;

      }


      if (
        el.manualModal
          .classList
          .contains(
            "show"
          )
      ) {

        closeManualModal();

      }


      if (
        el.specialPostModal
          .classList
          .contains(
            "show"
          )
      ) {

        closeSpecialPostModal();

      }


      if (
        el.coverageModal
          .classList
          .contains(
            "show"
          )
      ) {

        closeCoverageModal();

      }

    }

  );



  // ==========================================================
  // SIGN OUT
  // ==========================================================

  el.signOutButton.addEventListener(

    "click",

    async () => {

      el.signOutButton.disabled =
        true;


      el.signOutButton.textContent =
        "Signing Out…";


      await db.auth.signOut();


      window.location.replace(

        new URL(
          "../login.html",
          window.location.href
        ).href

      );

    }

  );



  // ==========================================================
  // INITIAL PAGE LOAD
  // ==========================================================

  setUserDisplay();



  const launchParams =
    new URLSearchParams(
      window.location.search
    );



  // ==========================================================
  // DATE
  // ==========================================================

  el.shiftDate.value =

    launchParams.get(
      "shiftDate"
    )

    ||

    todayLocal();



  // ==========================================================
  // SHIFT NAME
  // ==========================================================

  const requestedShift =
    launchParams.get(
      "shiftName"
    );


  if (

    [
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta"
    ].includes(
      requestedShift
    )

  ) {

    el.shiftName.value =
      requestedShift;

  }



  // ==========================================================
  // LOAD PAGE DATA
  // ==========================================================

  try {


    await Promise.all([

      loadStations(),

      loadEligibleStaff()

    ]);



    // ========================================================
    // RETURNING FROM END-OF-SHIFT HANDOFF
    //
    // If shiftDate + shiftName are in the URL, reopen that
    // exact shift automatically.
    // ========================================================

    if (

      launchParams.get(
        "shiftDate"
      )

      &&

      requestedShift

    ) {

      await openSelectedShift();

    }


  }

  catch (
    error
  ) {

    console.error(

      "Duty assignment initialization error:",

      error

    );


    showMessage(

      error.message

      ||

      "Unable to load Duty Station Assignment.",

      "error"

    );

  }


})();
