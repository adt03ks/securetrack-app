(async function () {

  "use strict";


  // ==========================================================
  // AUTH
  // ==========================================================

  function waitForAuth() {

    if (
      window.SecureTrackAuth
    ) {

      return Promise.resolve(
        window.SecureTrackAuth
      );

    }


    return new Promise(
      resolve => {

        const handler =
          event => {

            document.removeEventListener(
              "securetrack:authorized",
              handler
            );


            resolve(

              event.detail

              ||

              window.SecureTrackAuth

            );

          };


        document.addEventListener(
          "securetrack:authorized",
          handler
        );

      }
    );

  }


  const auth =
    await waitForAuth();


  if (
    !auth?.db
    ||
    !auth?.user
  ) {

    return;

  }


  const db =
    auth.db;



  // ==========================================================
  // PAGE ELEMENTS
  // ==========================================================

  const $ =
    id =>
      document.getElementById(
        id
      );


  const el = {

   specialAssignmentMessage:
  $("specialAssignmentMessage"),

refreshSpecialAssignmentsButton:
  $("refreshSpecialAssignmentsButton"),

activeSpecialCount:
  $("activeSpecialCount"),

carryForwardSpecialCount:
  $("carryForwardSpecialCount"),

completedSpecialCount:
  $("completedSpecialCount"),

needsCoverageSpecialCount:
  $("needsCoverageSpecialCount"),

specialAssignmentList:
  $("specialAssignmentList"), 
    
alertMessage:
  $("alertMessage"),

refreshAlertsButton:
  $("refreshAlertsButton"),

totalAlerts:
  $("totalAlerts"),

resolvedAlerts:
  $("resolvedAlerts"),

pendingAlerts:
  $("pendingAlerts"),

unreviewedAlerts:
  $("unreviewedAlerts"),

codeGreenCount:
  $("codeGreenCount"),

taserPullCount:
  $("taserPullCount"),

ctwCount:
  $("ctwCount"),

officerInjuryCount:
  $("officerInjuryCount"),

slipFallCount:
  $("slipFallCount"),

staffingAlertCount:
  $("staffingAlertCount"),

securityAlertList:
  $("securityAlertList"),
    
    pageMessage:
      $("pageMessage"),

    shiftName:
      $("shiftName"),

    shiftDate:
      $("shiftDate"),

    assignedTeamLead:
      $("assignedTeamLead"),

    teamLeadSource:
      $("teamLeadSource"),

    staffingSummary:
      $("staffingSummary"),

    staffingDetails:
      $("staffingDetails"),

    priorHandoffBy:
      $("priorHandoffBy"),

    priorHandoffTime:
      $("priorHandoffTime"),

    activatedBy:
      $("activatedBy"),

    activationTime:
      $("activationTime"),

    operationalStatus:
      $("operationalStatus"),

    lastRefreshed:
      $("lastRefreshed"),

    refreshShiftStatusButton:
      $("refreshShiftStatusButton"),

    returnToAssignments:
      $("returnToAssignments")

  };



  // ==========================================================
  // URL PARAMETERS
  // ==========================================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const shiftInstanceId =
    params.get(
      "shiftInstanceId"
    );


  const returnTo =
    params.get(
      "returnTo"
    );

const returnTo =
  params.get(
    "returnTo"
  );


let specialAssignments =
  [];


let specialAssignmentNotes =
  new Map();

  // ==========================================================
  // HELPERS
  // ==========================================================

  function showMessage(
    message = "",
    type = "info"
  ) {

    if (
      !el.pageMessage
    ) {

      return;

    }


    el.pageMessage.textContent =
      message;


    el.pageMessage.className =
      message
        ? `message show ${type}`
        : "message";

  }



  function formatDate(
    value
  ) {

    if (
      !value
    ) {

      return "—";

    }


    const date =
      new Date(
        `${value}T00:00:00`
      );


    return date.toLocaleDateString(
      undefined,
      {

        weekday:
          "short",

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric"

      }
    );

  }



  function formatDateTime(
    value
  ) {

    if (
      !value
    ) {

      return "—";

    }


    const date =
      new Date(
        value
      );


    return date.toLocaleString(
      undefined,
      {

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"

      }
    );

  }



  function teamLeadSourceLabel(
    value
  ) {

    switch (
      value
    ) {

      case "team_lead":

        return "Assigned Team Lead";


      case "acting_senior":

        return "Designated Acting Team Lead";


      default:

        return "Shift Leadership";

    }

  }



  // ==========================================================
  // RENDER COMMAND SUMMARY
  // ==========================================================

  function renderShiftSummary(
    data
  ) {

    const shift =
      data?.shift || {};


    const teamLead =
      data?.team_lead || {};


    const activation =
      data?.activation || {};


    const handoff =
      data?.prior_handoff || {};


    const staffing =
      data?.staffing || {};



    // --------------------------------------------------------
    // SHIFT
    // --------------------------------------------------------

    el.shiftName.textContent =

      shift.shift_name

        ? `${shift.shift_name} Shift`

        : "Unknown Shift";


    el.shiftDate.textContent =
      formatDate(
        shift.shift_date
      );



    // --------------------------------------------------------
    // TEAM LEAD
    // --------------------------------------------------------

    el.assignedTeamLead.textContent =

      teamLead.display_name

      ||

      "Not Assigned";


    el.teamLeadSource.textContent =

      teamLead.display_name

        ? teamLeadSourceLabel(
            teamLead.source
          )

        : "Leadership resolution required";



    // --------------------------------------------------------
    // STAFFING
    // --------------------------------------------------------

    const present =
      Number(
        staffing.present_total || 0
      );


    const total =
      Number(
        staffing.attendance_total || 0
      );


    const assigned =
      Number(
        staffing.assigned_total || 0
      );


    const absent =
      Number(
        staffing.absent_total || 0
      );


    el.staffingSummary.textContent =
      `${present} of ${total} Available`;


    el.staffingDetails.textContent =

      `${assigned} assigned • ${absent} unavailable`;



    // --------------------------------------------------------
    // PRIOR HANDOFF
    // --------------------------------------------------------

    if (
      handoff.exists
    ) {

      el.priorHandoffBy.textContent =

        handoff.published_by_name

        ||

        "Published Handoff";


      el.priorHandoffTime.textContent =

        `Published ${formatDateTime(
          handoff.published_at
        )}`;

    }

    else {

      el.priorHandoffBy.textContent =
        "No Prior Handoff";


      el.priorHandoffTime.textContent =
        "Shift began without a prior published handoff";

    }



    // --------------------------------------------------------
    // ACTIVATION
    // --------------------------------------------------------

    if (
      activation.activated_at
    ) {

      el.activatedBy.textContent =

        activation.activated_by_name

        ||

        "Shift Leadership";


      if (
        activation.on_behalf_of_team_lead
        &&
        teamLead.display_name
      ) {

        el.activationTime.textContent =

          `On behalf of ${teamLead.display_name} • `

          +

          formatDateTime(
            activation.activated_at
          );

      }

      else {

        el.activationTime.textContent =

          formatDateTime(
            activation.activated_at
          );

      }

    }

    else {

      el.activatedBy.textContent =
        "Not Activated";


      el.activationTime.textContent =
        "Waiting for shift activation";

    }



    // --------------------------------------------------------
    // OPERATIONAL STATUS
    // --------------------------------------------------------

    if (
      shift.operationally_active
    ) {

      el.operationalStatus.textContent =
        "ACTIVE";

    }

    else {

      el.operationalStatus.textContent =
        "NOT ACTIVE";

    }


    el.lastRefreshed.textContent =

      `Last refreshed ${

        new Date().toLocaleTimeString(
          undefined,
          {

            hour:
              "numeric",

            minute:
              "2-digit",

            second:
              "2-digit"

          }
        )

      }`;

  }



  // ==========================================================
  // LOAD LIVE SHIFT SUMMARY
  // ==========================================================

  async function loadShiftSummary(
    showSuccess = false
  ) {

    if (
      !shiftInstanceId
    ) {

      showMessage(
        "No shift instance was supplied. Return to Duty Assignments and reopen the Daily Activity Report.",
        "error"
      );

      return;

    }


    if (
      el.refreshShiftStatusButton
    ) {

      el.refreshShiftStatusButton.disabled =
        true;


      el.refreshShiftStatusButton.textContent =
        "Refreshing…";

    }


    try {

      const {
        data,
        error
      } = await db.rpc(

        "get_daily_activity_shift_summary",

        {
          p_shift_id:
            shiftInstanceId
        }

      );


      if (
        error
      ) {

        throw error;

      }


      renderShiftSummary(
        data
      );


      if (
        showSuccess
      ) {

        showMessage(
          "Shift status refreshed successfully.",
          "success"
        );

      }

      else {

        showMessage();

      }

    }

    catch (
      error
    ) {

      console.error(
        "Daily Activity shift summary error:",
        error
      );


      showMessage(

        error?.message

        ||

        "Unable to load the current shift summary.",

        "error"

      );

    }

    finally {

      if (
        el.refreshShiftStatusButton
      ) {

        el.refreshShiftStatusButton.disabled =
          false;


        el.refreshShiftStatusButton.textContent =
          "Refresh Shift Status";

        el.refreshAlertsButton
  ?.addEventListener(

    "click",

    () =>
      loadSecurityAlerts(
        true
      )

  );
      }

    }

  }

// ==========================================================
// SECURITY ALERT HELPERS
// ==========================================================

function alertTypeLabel(
  type
) {

  const labels = {

    code_green:
      "Code Green",

    taser_pull:
      "Taser Pull",

    ctw:
      "CTW",

    officer_injury:
      "Officer Injury",

    slip_and_fall:
      "Slip & Fall",

    insufficient_staffing:
      "Insufficient Staffing"

  };


  return (

    labels[type]

    ||

    String(
      type || "Security Alert"
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        letter =>
          letter.toUpperCase()
      )

  );

}



function showAlertMessage(
  message = "",
  type = "info"
) {

  if (
    !el.alertMessage
  ) {

    return;

  }


  el.alertMessage.textContent =
    message;


  el.alertMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



function addAlertDetail(
  container,
  label,
  value
) {

  if (
    value === null
    ||
    value === undefined
    ||
    value === ""
  ) {

    return;

  }


  const box =
    document.createElement(
      "div"
    );


  box.className =
    "alert-detail";


  const name =
    document.createElement(
      "span"
    );


  name.textContent =
    label;


  const content =
    document.createElement(
      "strong"
    );


  content.textContent =

    typeof value ===
      "boolean"

      ? (
          value
            ? "Yes"
            : "No"
        )

      : String(
          value
        );


  box.append(
    name,
    content
  );


  container.appendChild(
    box
  );

}



function renderAlertSummary(
  summary = {}
) {

  el.totalAlerts.textContent =
    summary.total_alerts ?? 0;


  el.resolvedAlerts.textContent =
    summary.resolved ?? 0;


  el.pendingAlerts.textContent =
    summary.pending ?? 0;


  el.unreviewedAlerts.textContent =
    summary.unreviewed ?? 0;


  el.codeGreenCount.textContent =
    summary.code_greens ?? 0;


  el.taserPullCount.textContent =
    summary.taser_pulls ?? 0;


  el.ctwCount.textContent =
    summary.ctw ?? 0;


  el.officerInjuryCount.textContent =
    summary.officer_injuries ?? 0;


  el.slipFallCount.textContent =
    summary.slip_and_falls ?? 0;


  el.staffingAlertCount.textContent =
    summary.staffing_alerts ?? 0;

}



// ==========================================================
// SAVE ALERT REVIEW
// ==========================================================

async function saveAlertReview(
  item,
  status,
  notes,
  button
) {

  if (
    status === "pending"
    &&
    !notes.trim()
  ) {

    showAlertMessage(
      "Pending alerts require leadership notes explaining what must be carried forward.",
      "error"
    );

    return;

  }


  button.disabled =
    true;


  button.textContent =
    "Saving…";


  try {

    const {
      data,
      error
    } = await db.rpc(

      "update_daily_activity_alert_review",

      {

        p_review_id:
          item.review_id,

        p_review_status:
          status,

        p_leadership_notes:
          notes.trim()
          ||
          null

      }

    );


    if (
      error
    ) {

      throw error;

    }


    renderSecurityAlerts(
      data
    );


    showAlertMessage(
      "Alert review saved successfully.",
      "success"
    );

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity alert review error:",
      error
    );


    showAlertMessage(

      error?.message

      ||

      "Unable to save alert review.",

      "error"

    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save Review";

  }

}



// ==========================================================
// RENDER ALERTS
// ==========================================================

function renderSecurityAlerts(
  data
) {

  const summary =
    data?.summary || {};


  const items =
    data?.items || [];


  renderAlertSummary(
    summary
  );


  el.securityAlertList.innerHTML =
    "";


  if (
    !items.length
  ) {

    el.securityAlertList.innerHTML =
      `
        <div class="empty-state">
          No Security Leadership Alerts are associated with
          this shift at this time.
        </div>
      `;

    return;

  }


  items.forEach(
    item => {

      const incident =
        item.incident || {};


      const status =
        item.review_status
        ||
        "unreviewed";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `alert-card ${status}`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "alert-head";


      const headLeft =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "div"
        );


      title.className =
        "alert-title";


      title.textContent =
        alertTypeLabel(
          incident.incident_type
        );


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "alert-meta";


      const when =
        [
          incident.occurrence_date,
          incident.occurrence_time
        ]
          .filter(Boolean)
          .join(" • ");


      meta.textContent =

        `${when || "Time not recorded"}`

        +

        (
          incident.location
            ? ` • ${incident.location}`
            : ""
        );


      headLeft.append(
        title,
        meta
      );


      const statusChip =
        document.createElement(
          "span"
        );


      statusChip.className =

        status === "resolved"

          ? "status-chip good"

          : status === "pending"

            ? "status-chip warn"

            : "status-chip bad";


      statusChip.textContent =

        status
          .replaceAll(
            "_",
            " "
          )
          .toUpperCase();


      head.append(
        headLeft,
        statusChip
      );



      // ------------------------------------------------------
      // BODY / SOURCE DETAILS
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "alert-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "alert-detail-grid";


      addAlertDetail(
        details,
        "Location",
        incident.location
      );


      addAlertDetail(
        details,
        "Patient Information",
        incident.patient_information
      );


      addAlertDetail(
        details,
        "Responding Officers",
        incident.responding_officers
      );


      addAlertDetail(
        details,
        "Deploying Officer",
        incident.deploying_officer
      );


      addAlertDetail(
        details,
        "Taser Number",
        incident.taser_number
      );


      addAlertDetail(
        details,
        "Trespass Subject",
        incident.trespass_subject
      );


      addAlertDetail(
        details,
        "Reported Damages",
        incident.reported_damages
      );


      addAlertDetail(
        details,
        "Law Enforcement Agency",
        incident.responding_law_enforcement_agency
      );


      addAlertDetail(
        details,
        "CTW Form Completed",
        incident.ctw_form_completed
      );


      addAlertDetail(
        details,
        "Incident Report Completed",
        incident.incident_report_completed
      );


      addAlertDetail(
        details,
        "Officer",
        incident.officer_name
      );


      addAlertDetail(
        details,
        "Officers On Duty",
        incident.total_officers_on_duty
      );


      addAlertDetail(
        details,
        "Submitted By",
        incident.submitted_by
      );


      addAlertDetail(
        details,
        "Dispatch Unit",
        incident.dispatch_unit
      );


      addAlertDetail(
        details,
        "Additional Notes",
        incident.additional_notes
      );


      addAlertDetail(
        details,
        "Submitted",
        incident.submitted_at
          ? formatDateTime(
              incident.submitted_at
            )
          : null
      );


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // LEADERSHIP REVIEW
      // ------------------------------------------------------

      const review =
        document.createElement(
          "div"
        );


      review.className =
        "alert-review";


      const reviewTitle =
        document.createElement(
          "strong"
        );


      reviewTitle.textContent =
        "Leadership Review";


      review.appendChild(
        reviewTitle
      );


      const statusRow =
        document.createElement(
          "div"
        );


      statusRow.className =
        "review-status-row";


      let selectedStatus =
        status;


      const buttons = {};


      [
        [
          "resolved",
          "✓ Resolved"
        ],

        [
          "pending",
          "◷ Pending / Carry Forward"
        ],

        [
          "unreviewed",
          "Reset to Unreviewed"
        ]

      ].forEach(
        ([value, label]) => {

          const choice =
            document.createElement(
              "button"
            );


          choice.type =
            "button";


          choice.className =
            `review-choice ${value}`;


          choice.textContent =
            label;


          if (
            value ===
            selectedStatus
          ) {

            choice.classList.add(
              "active"
            );

          }


          choice.addEventListener(
            "click",
            () => {

              selectedStatus =
                value;


              Object
                .values(
                  buttons
                )
                .forEach(
                  current =>
                    current.classList.remove(
                      "active"
                    )
                );


              choice.classList.add(
                "active"
              );

            }
          );


          buttons[value] =
            choice;


          statusRow.appendChild(
            choice
          );

        }
      );


      const note =
        document.createElement(
          "textarea"
        );


      note.className =
        "review-notes";


      note.placeholder =
        "Document resolution details, follow-up needed, or instructions for the incoming shift.";


      note.value =
        item.leadership_notes
        ||
        "";


      const save =
        document.createElement(
          "button"
        );


      save.type =
        "button";


      save.className =
        "button primary";


      save.textContent =
        "Save Review";


      save.style.marginTop =
        "10px";


      save.addEventListener(
        "click",
        () => {

          saveAlertReview(

            item,

            selectedStatus,

            note.value,

            save

          );

        }
      );


      const reviewed =
        document.createElement(
          "div"
        );


      reviewed.className =
        "review-meta";


      reviewed.textContent =

        item.reviewed_by_name

          ? (
              `Last reviewed by ${item.reviewed_by_name}`

              +

              (
                item.reviewed_at
                  ? ` • ${formatDateTime(
                      item.reviewed_at
                    )}`
                  : ""
              )
            )

          : "Not yet reviewed by shift leadership.";


      review.append(
        statusRow,
        note,
        save,
        reviewed
      );


      body.appendChild(
        review
      );


      card.append(
        head,
        body
      );


      el.securityAlertList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD SECURITY ALERTS
// ==========================================================

async function loadSecurityAlerts(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshAlertsButton
  ) {

    el.refreshAlertsButton.disabled =
      true;


    el.refreshAlertsButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_security_alerts",

      {
        p_shift_id:
          shiftInstanceId
      }

    );


    if (
      error
    ) {

      throw error;

    }


    renderSecurityAlerts(
      data
    );


    if (
      showSuccess
    ) {

      showAlertMessage(
        "Security alerts refreshed successfully.",
        "success"
      );

    }

    else {

      showAlertMessage();

    }

  }

  // ==========================================================
// SPECIAL ASSIGNMENT HELPERS
// ==========================================================

function showSpecialAssignmentMessage(
  message = "",
  type = "info"
) {

  if (
    !el.specialAssignmentMessage
  ) {

    return;

  }


  el.specialAssignmentMessage.textContent =
    message;


  el.specialAssignmentMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



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
      "5 — GOOD TO HAVE"

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



function formatClockTime(
  value
) {

  if (
    !value
  ) {

    return "—";

  }


  const parts =
    String(
      value
    )
      .split(
        ":"
      );


  const hour =
    Number(
      parts[0]
    );


  const minute =
    parts[1] || "00";


  if (
    !Number.isFinite(
      hour
    )
  ) {

    return value;

  }


  return (

    `${hour % 12 || 12}:`

    +

    `${minute} `

    +

    `${hour >= 12 ? "PM" : "AM"}`

  );

}



function addSpecialDetail(
  container,
  label,
  value
) {

  const box =
    document.createElement(
      "div"
    );


  box.className =
    "special-detail-box";


  const name =
    document.createElement(
      "span"
    );


  name.textContent =
    label;


  const content =
    document.createElement(
      "strong"
    );


  content.textContent =
    value || "—";


  box.append(
    name,
    content
  );


  container.appendChild(
    box
  );

}



// ==========================================================
// SPECIAL ASSIGNMENT COUNTERS
// ==========================================================

function renderSpecialAssignmentSummary() {

  const active =
    specialAssignments
      .filter(
        post =>
          post.assignment_status ===
          "active"
      )
      .length;


  const carryForward =
    specialAssignments
      .filter(
        post =>
          post.assignment_status ===
          "carry_forward"
      )
      .length;


  const completed =
    specialAssignments
      .filter(
        post =>
          post.assignment_status ===
          "completed"
      )
      .length;


  const needsCoverage =
    specialAssignments
      .filter(
        post =>

          [
            "active",
            "carry_forward"
          ].includes(
            post.assignment_status
          )

          &&

          !post.assigned_user_id

      )
      .length;


  el.activeSpecialCount.textContent =
    active;


  el.carryForwardSpecialCount.textContent =
    carryForward;


  el.completedSpecialCount.textContent =
    completed;


  el.needsCoverageSpecialCount.textContent =
    needsCoverage;

}



// ==========================================================
// SAVE OPERATIONAL NOTE
// ==========================================================

async function saveSpecialAssignmentNote(
  post,
  textarea,
  button
) {

  button.disabled =
    true;


  button.textContent =
    "Saving…";


  try {

    const {
      data,
      error
    } = await db.rpc(

      "save_daily_activity_special_assignment_note",

      {

        p_shift_id:
          shiftInstanceId,

        p_special_assignment_id:
          post.special_assignment_id,

        p_notes:
          textarea.value.trim()
          ||
          null

      }

    );


    if (
      error
    ) {

      throw error;

    }


    specialAssignmentNotes.set(

      post.special_assignment_id,

      {

        special_assignment_id:
          post.special_assignment_id,

        operational_notes:
          data?.operational_notes || null,

        updated_by_name:
          data?.updated_by_name || null,

        updated_at:
          data?.updated_at || null

      }

    );


    renderSpecialAssignments();


    showSpecialAssignmentMessage(
      "Operational notes saved successfully.",
      "success"
    );

  }

  catch (
    error
  ) {

    console.error(
      "Special Assignment note error:",
      error
    );


    showSpecialAssignmentMessage(

      error?.message

      ||

      "Unable to save Special Assignment notes.",

      "error"

    );

  }

  finally {

    button.disabled =
      false;


    button.textContent =
      "Save Operational Notes";

  }

}



// ==========================================================
// RENDER SPECIAL ASSIGNMENTS
// ==========================================================

function renderSpecialAssignments() {

  renderSpecialAssignmentSummary();


  el.specialAssignmentList.innerHTML =
    "";


  if (
    !specialAssignments.length
  ) {

    el.specialAssignmentList.innerHTML =
      `
        <div class="empty-state">
          No Special Assignments are associated with
          this shift.
        </div>
      `;

    return;

  }


  for (
    const post
    of specialAssignments
  ) {

    const status =
      post.assignment_status
      ||
      "active";


    const needsCoverage =

      [
        "active",
        "carry_forward"
      ].includes(
        status
      )

      &&

      !post.assigned_user_id;


    const card =
      document.createElement(
        "article"
      );


    card.className =
      "special-activity-card";


    if (
      needsCoverage
    ) {

      card.classList.add(
        "needs-coverage"
      );

    }

    else if (
      status ===
      "carry_forward"
    ) {

      card.classList.add(
        "carry-forward"
      );

    }

    else if (
      status ===
      "completed"
    ) {

      card.classList.add(
        "completed"
      );

    }

    else {

      card.classList.add(
        "active"
      );

    }



    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    const head =
      document.createElement(
        "div"
      );


    head.className =
      "special-activity-head";


    const left =
      document.createElement(
        "div"
      );


    const title =
      document.createElement(
        "h3"
      );


    title.textContent =
      post.assignment_name
      ||
      "Special Assignment";


    const meta =
      document.createElement(
        "div"
      );


    meta.className =
      "special-card-meta";


    const priority =
      document.createElement(
        "span"
      );


    priority.className =
      `priority-chip priority-${
        Number(
          post.priority_rating
        )
        ||
        5
      }`;


    priority.textContent =

      post.priority_label

      ||

      specialPriorityLabel(
        post.priority_rating
      );


    const statusChip =
      document.createElement(
        "span"
      );


    statusChip.className =

      status === "completed"

        ? "status-chip good"

        : status === "cancelled"

          ? "status-chip bad"

          : status === "carry_forward"

            ? "status-chip warn"

            : "status-chip info";


    statusChip.textContent =
      status
        .replaceAll(
          "_",
          " "
        )
        .toUpperCase();


    meta.append(
      priority,
      statusChip
    );


    if (
      post.carried_from_assignment_id
    ) {

      const carried =
        document.createElement(
          "span"
        );


      carried.className =
        "status-chip warn";


      carried.textContent =
        "RECEIVED FROM PRIOR SHIFT";


      meta.appendChild(
        carried
      );

    }


    if (
      needsCoverage
    ) {

      const uncovered =
        document.createElement(
          "span"
        );


      uncovered.className =
        "status-chip bad";


      uncovered.textContent =
        "COVERAGE REQUIRED";


      meta.appendChild(
        uncovered
      );

    }


    left.append(
      title,
      meta
    );


    const coverage =
      document.createElement(
        "div"
      );


    coverage.className =
      "coverage-name";


    const coverageLabel =
      document.createElement(
        "span"
      );


    coverageLabel.textContent =
      "Assigned Officer";


    const coveragePerson =
      document.createElement(
        "strong"
      );


    coveragePerson.textContent =

      post.assigned_user_name

      ||

      "UNASSIGNED";


    coverage.append(
      coverageLabel,
      coveragePerson
    );


    head.append(
      left,
      coverage
    );



    // --------------------------------------------------------
    // BODY
    // --------------------------------------------------------

    const body =
      document.createElement(
        "div"
      );


    body.className =
      "special-activity-body";


    const details =
      document.createElement(
        "div"
      );


    details.className =
      "special-detail-grid";


    addSpecialDetail(
      details,
      "Location",
      post.location
    );


    addSpecialDetail(

      details,

      "Requested By / Unit",

      post.requested_by_name

      ||

      post.requesting_unit

    );


    addSpecialDetail(
      details,
      "Approved By",
      post.approved_by_name
    );


    addSpecialDetail(

      details,

      "Bill To / Cost Center",

      post.bill_to

      ||

      post.cost_center

    );


    addSpecialDetail(

      details,

      "Coverage Window",

      (
        post.start_time
        ||
        post.end_time
      )

        ? (
            `${formatClockTime(
              post.start_time
            )} — ${formatClockTime(
              post.end_time
            )}`
          )

        : "—"

    );


    addSpecialDetail(

      details,

      "Scheduled Hours",

      post.scheduled_hours != null

        ? String(
            post.scheduled_hours
          )

        : "—"

    );


    body.appendChild(
      details
    );



    // --------------------------------------------------------
    // ORIGINAL REQUEST NOTES
    // --------------------------------------------------------

    if (
      post.notes
    ) {

      const original =
        document.createElement(
          "div"
        );


      original.className =
        "special-source-note";


      const label =
        document.createElement(
          "span"
        );


      label.className =
        "special-note-label";


      label.textContent =
        "Original Assignment Notes";


      const text =
        document.createElement(
          "div"
        );


      text.textContent =
        post.notes;


      original.append(
        label,
        text
      );


      body.appendChild(
        original
      );

    }



    // --------------------------------------------------------
    // HANDOFF INSTRUCTIONS
    // --------------------------------------------------------

    if (
      post.handoff_notes
    ) {

      const handoff =
        document.createElement(
          "div"
        );


      handoff.className =
        "special-handoff-note";


      const label =
        document.createElement(
          "span"
        );


      label.className =
        "special-note-label";


      label.textContent =
        "Handoff Instructions";


      const text =
        document.createElement(
          "div"
        );


      text.textContent =
        post.handoff_notes;


      handoff.append(
        label,
        text
      );


      body.appendChild(
        handoff
      );

    }



    // --------------------------------------------------------
    // DAILY ACTIVITY OPERATIONAL NOTES
    // --------------------------------------------------------

    const savedNote =
      specialAssignmentNotes.get(
        post.special_assignment_id
      );


    const noteArea =
      document.createElement(
        "div"
      );


    noteArea.className =
      "operational-note-area";


    const noteLabel =
      document.createElement(
        "label"
      );


    noteLabel.textContent =
      "Daily Activity Operational Notes";


    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.placeholder =
      "Document activity, changes, significant events, coverage concerns, or other operational information for this Special Assignment.";


    textarea.value =
      savedNote?.operational_notes
      ||
      "";


    const save =
      document.createElement(
        "button"
      );


    save.type =
      "button";


    save.className =
      "button primary";


    save.style.marginTop =
      "10px";


    save.textContent =
      "Save Operational Notes";


    save.addEventListener(
      "click",
      () => {

        saveSpecialAssignmentNote(

          post,

          textarea,

          save

        );

      }
    );


    const noteMeta =
      document.createElement(
        "div"
      );


    noteMeta.className =
      "special-note-meta";


    noteMeta.textContent =

      savedNote?.updated_by_name

        ? (
            `Last updated by ${savedNote.updated_by_name}`

            +

            (
              savedNote.updated_at

                ? ` • ${formatDateTime(
                    savedNote.updated_at
                  )}`

                : ""
            )
          )

        : "No Daily Activity operational notes recorded.";


    noteArea.append(
      noteLabel,
      textarea,
      save,
      noteMeta
    );


    body.appendChild(
      noteArea
    );


    card.append(
      head,
      body
    );


    el.specialAssignmentList
      .appendChild(
        card
      );

  }

}



// ==========================================================
// LOAD SPECIAL ASSIGNMENTS + NOTES
// ==========================================================

async function loadSpecialAssignments(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshSpecialAssignmentsButton
  ) {

    el.refreshSpecialAssignmentsButton.disabled =
      true;


    el.refreshSpecialAssignmentsButton.textContent =
      "Refreshing…";

  }


  try {

    const [
      specialResult,
      noteResult
    ] = await Promise.all([

      db.rpc(

        "get_shift_special_assignments",

        {
          p_shift_id:
            shiftInstanceId
        }

      ),


      db.rpc(

        "get_daily_activity_special_assignment_notes",

        {
          p_shift_id:
            shiftInstanceId
        }

      )

    ]);


    if (
      specialResult.error
    ) {

      throw specialResult.error;

    }


    if (
      noteResult.error
    ) {

      throw noteResult.error;

    }


    specialAssignments =
      specialResult.data
      ||
      [];


    specialAssignmentNotes =
      new Map(

        (
          noteResult.data
          ||
          []
        )
          .map(
            note => [

              note.special_assignment_id,

              note

            ]
          )

      );


    renderSpecialAssignments();


    if (
      showSuccess
    ) {

      showSpecialAssignmentMessage(
        "Special Assignments refreshed successfully.",
        "success"
      );

    }

    else {

      showSpecialAssignmentMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity Special Assignment error:",
      error
    );


    showSpecialAssignmentMessage(

      error?.message

      ||

      "Unable to load Special Assignments.",

      "error"

    );

  }

  finally {

    if (
      el.refreshSpecialAssignmentsButton
    ) {

      el.refreshSpecialAssignmentsButton.disabled =
        false;


      el.refreshSpecialAssignmentsButton.textContent =
        "Refresh Special Assignments";

    }

  }

}  

  catch (
    error
  ) {

    console.error(
      "Daily Activity security alert error:",
      error
    );


    showAlertMessage(

      error?.message

      ||

      "Unable to load Security Alerts.",

      "error"

    );

  }

  finally {

    if (
      el.refreshAlertsButton
    ) {

      el.refreshAlertsButton.disabled =
        false;


      el.refreshAlertsButton.textContent =
        "Refresh Alerts";

    }

  }

}

  // ==========================================================
  // RETURN LINK
  // ==========================================================

  if (
    el.returnToAssignments
  ) {

    if (
      returnTo
    ) {

      el.returnToAssignments.href =
        returnTo;

    }

    else {

      el.returnToAssignments.href =
        "duty-assignments/";

    }

  }



  // ==========================================================
  // REFRESH
  // ==========================================================

  el.refreshShiftStatusButton
    ?.addEventListener(

      "click",

      () =>
        loadShiftSummary(
          true
        )

    );

el.refreshSpecialAssignmentsButton
  ?.addEventListener(

    "click",

    () =>
      loadSpecialAssignments(
        true
      )

  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

 await Promise.all([

  loadShiftSummary(),

  loadSecurityAlerts(),

  loadSpecialAssignments()

]);

})();
