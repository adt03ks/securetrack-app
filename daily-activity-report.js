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
    
    propertyMessage:
  $("propertyMessage"),

refreshPropertyButton:
  $("refreshPropertyButton"),

propertyCollectedCount:
  $("propertyCollectedCount"),

propertyReleasedCount:
  $("propertyReleasedCount"),

propertyDisposalRequestedCount:
  $("propertyDisposalRequestedCount"),

propertyDisposedCount:
  $("propertyDisposedCount"),

propertyActivityList:
  $("propertyActivityList"),

deviceExceptionsMessage:
  $("deviceExceptionsMessage"),

refreshDeviceExceptionsButton:
  $("refreshDeviceExceptionsButton"),

failedInspectionCount:
  $("failedInspectionCount"),

reportedDeviceIssueCount:
  $("reportedDeviceIssueCount"),

openDeviceIssueCount:
  $("openDeviceIssueCount"),

highCriticalDeviceCount:
  $("highCriticalDeviceCount"),

deviceExceptionList:
  $("deviceExceptionList"),

   tsiMessage:
  $("tsiMessage"),

refreshTsiRequestsButton:
  $("refreshTsiRequestsButton"),

tsiTotalCount:
  $("tsiTotalCount"),

tsiOpenCount:
  $("tsiOpenCount"),

tsiInProgressCount:
  $("tsiInProgressCount"),

tsiResolvedCount:
  $("tsiResolvedCount"),

tsiUrgentCount:
  $("tsiUrgentCount"),

tsiRequestForm:
  $("tsiRequestForm"),

tsiRequestId:
  $("tsiRequestId"),

tsiFormTitle:
  $("tsiFormTitle"),

tsiTicketNumber:
  $("tsiTicketNumber"),

tsiRequestType:
  $("tsiRequestType"),

tsiLocation:
  $("tsiLocation"),

tsiPriority:
  $("tsiPriority"),

tsiStatus:
  $("tsiStatus"),

tsiDescription:
  $("tsiDescription"),

tsiOperationalNotes:
  $("tsiOperationalNotes"),

saveTsiRequestButton:
  $("saveTsiRequestButton"),

cancelTsiEditButton:
  $("cancelTsiEditButton"),

tsiRequestList:
  $("tsiRequestList"), 

supplyMessage:
  $("supplyMessage"),

refreshSupplyRequestsButton:
  $("refreshSupplyRequestsButton"),

supplyTotalCount:
  $("supplyTotalCount"),

supplyRequestedCount:
  $("supplyRequestedCount"),

supplyOrderedCount:
  $("supplyOrderedCount"),

supplyPartialCount:
  $("supplyPartialCount"),

supplyFulfilledCount:
  $("supplyFulfilledCount"),

supplyUrgentCount:
  $("supplyUrgentCount"),

supplyRequestForm:
  $("supplyRequestForm"),

supplyRequestId:
  $("supplyRequestId"),

supplyFormTitle:
  $("supplyFormTitle"),

supplyItemName:
  $("supplyItemName"),

supplyCategory:
  $("supplyCategory"),

supplyQuantityRequested:
  $("supplyQuantityRequested"),

supplyUnit:
  $("supplyUnit"),

supplyRequestingArea:
  $("supplyRequestingArea"),

supplyRequestedFor:
  $("supplyRequestedFor"),

supplyPriority:
  $("supplyPriority"),

supplyStatus:
  $("supplyStatus"),

supplyQuantityFulfilled:
  $("supplyQuantityFulfilled"),

supplyFulfillmentNotes:
  $("supplyFulfillmentNotes"),

supplyOperationalNotes:
  $("supplyOperationalNotes"),

saveSupplyRequestButton:
  $("saveSupplyRequestButton"),

cancelSupplyEditButton:
  $("cancelSupplyEditButton"),

supplyRequestList:
  $("supplyRequestList"),

managerConfidentialSection:
  $("managerConfidentialSection"),

refreshConfidentialButton:
  $("refreshConfidentialButton"),

confidentialMessage:
  $("confidentialMessage"),

confidentialTotalCount:
  $("confidentialTotalCount"),

confidentialOpenCount:
  $("confidentialOpenCount"),

confidentialMonitoringCount:
  $("confidentialMonitoringCount"),

confidentialFollowUpCount:
  $("confidentialFollowUpCount"),

confidentialCompletedCount:
  $("confidentialCompletedCount"),

confidentialForm:
  $("confidentialForm"),

confidentialLogId:
  $("confidentialLogId"),

confidentialSubjectUserId:
  $("confidentialSubjectUserId"),

confidentialFormTitle:
  $("confidentialFormTitle"),

confidentialEntryType:
  $("confidentialEntryType"),

confidentialSubjectName:
  $("confidentialSubjectName"),

confidentialEmployeeNumber:
  $("confidentialEmployeeNumber"),

confidentialStatus:
  $("confidentialStatus"),

confidentialOccurredAt:
  $("confidentialOccurredAt"),

confidentialTitle:
  $("confidentialTitle"),

confidentialDetails:
  $("confidentialDetails"),

confidentialActionTaken:
  $("confidentialActionTaken"),

confidentialFollowUpRequired:
  $("confidentialFollowUpRequired"),

confidentialFollowUpDateField:
  $("confidentialFollowUpDateField"),

confidentialFollowUpDate:
  $("confidentialFollowUpDate"),

saveConfidentialButton:
  $("saveConfidentialButton"),

cancelConfidentialEditButton:
  $("cancelConfidentialEditButton"),

confidentialEntryList:
  $("confidentialEntryList"),
    
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
// MANAGER CONFIDENTIAL ACCESS
// ==========================================================

const managerConfidentialRoles =
  [
    "manager",
    "director",
    "admin"
  ];


const hasManagerConfidentialAccess =
  (
    auth.roles
    ||
    []
  ).some(
    role =>
      managerConfidentialRoles.includes(
        role
      )
  );


if (
  el.managerConfidentialSection
) {

  el.managerConfidentialSection.hidden =
    !hasManagerConfidentialAccess;

}

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

  }  finally {

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

// ==========================================================
// PROPERTY ACCOUNTABILITY HELPERS
// ==========================================================

function showPropertyMessage(
  message = "",
  type = "info"
) {

  if (
    !el.propertyMessage
  ) {

    return;

  }


  el.propertyMessage.textContent =
    message;


  el.propertyMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



function propertyActivityLabel(
  type
) {

  const labels = {

    collected:
      "Collected",

    released:
      "Released",

    disposal_requested:
      "Marked for Disposal",

    disposed:
      "Disposed"

  };


  return (
    labels[type]
    ||
    "Property Activity"
  );

}



function propertyActivityClass(
  type
) {

  if (
    type ===
    "disposal_requested"
  ) {

    return "disposal-requested";

  }


  return (
    type
    ||
    "collected"
  );

}



function addPropertyDetail(
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
    "property-detail-box";


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
    String(
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



// ==========================================================
// RENDER PROPERTY ACCOUNTABILITY
// ==========================================================

function renderPropertyAccountability(
  data
) {

  const summary =
    data?.summary
    ||
    {};


  const items =
    data?.items
    ||
    [];


  el.propertyCollectedCount.textContent =
    summary.collected
    ??
    0;


  el.propertyReleasedCount.textContent =
    summary.released
    ??
    0;


  el.propertyDisposalRequestedCount.textContent =
    summary.marked_for_disposal
    ??
    0;


  el.propertyDisposedCount.textContent =
    summary.disposed
    ??
    0;


  el.propertyActivityList.innerHTML =
    "";


  if (
    !items.length
  ) {

    el.propertyActivityList.innerHTML =
      `
        <div class="empty-state">
          No Property Accountability activity is associated
          with this shift at this time.
        </div>
      `;

    return;

  }


  items.forEach(
    item => {

      const activityType =
        item.activity_type
        ||
        "collected";


      const activityClass =
        propertyActivityClass(
          activityType
        );


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `property-activity-card ${activityClass}`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "property-activity-head";


      const left =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "h3"
        );


      title.className =
        "property-activity-title";


      title.textContent =

        item.property_number

        ||

        "Property Record";


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "property-activity-meta";


      meta.textContent =

        `${propertyActivityLabel(
          activityType
        )}`

        +

        (
          item.occurred_at

            ? ` • ${formatDateTime(
                item.occurred_at
              )}`

            : ""
        );


      left.append(
        title,
        meta
      );


      const chip =
        document.createElement(
          "span"
        );


      chip.className =
        `property-status-chip ${activityClass}`;


      chip.textContent =
        propertyActivityLabel(
          activityType
        );


      head.append(
        left,
        chip
      );



      // ------------------------------------------------------
      // DETAILS
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "property-activity-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "property-detail-grid";


      addPropertyDetail(
        details,
        "Property ID",
        item.property_number
      );


      addPropertyDetail(
        details,
        "DG Number",
        item.dg_number
      );


      addPropertyDetail(
        details,
        "MRN Number",
        item.mrn_number
      );


      addPropertyDetail(
        details,
        "Description",
        item.description
      );


      addPropertyDetail(
        details,
        "Category",
        item.category
      );


      addPropertyDetail(
        details,
        "Current Status",
        item.status
          ? String(
              item.status
            ).toUpperCase()
          : null
      );


      addPropertyDetail(
        details,
        "Location Received",
        item.location_received
      );


      addPropertyDetail(
        details,
        "Storage Location",
        item.current_storage_location
      );


      addPropertyDetail(
        details,
        "Receiving Officer",
        item.received_by_name
      );


      addPropertyDetail(
        details,
        "Action By",
        item.actor_name
      );


      addPropertyDetail(
        details,
        "Released To",
        item.released_to
      );


      addPropertyDetail(
        details,
        "Witness",
        item.witness
      );


      addPropertyDetail(
        details,
        "Requested By",
        item.requested_by_name
      );


      addPropertyDetail(
        details,
        "Disposal Request Status",
        item.disposal_request_status
          ? String(
              item.disposal_request_status
            ).replaceAll(
              "_",
              " "
            ).toUpperCase()
          : null
      );


      addPropertyDetail(
        details,
        "Reviewed By",
        item.reviewed_by_name
      );


      addPropertyDetail(
        details,
        "Disposed By",
        item.disposed_by_name
      );


      addPropertyDetail(
        details,
        "Disposal Method",
        item.disposal_method
      );


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // NOTES
      // ------------------------------------------------------

      const notes = [

        item.request_notes,

        item.review_notes,

        item.event_notes,

        item.initial_notes

      ]
        .filter(Boolean)
        .join("\n");


      if (
        notes
      ) {

        const noteBox =
          document.createElement(
            "div"
          );


        noteBox.className =
          "property-notes";


        const noteLabel =
          document.createElement(
            "strong"
          );


        noteLabel.textContent =
          "Property Notes";


        const noteText =
          document.createElement(
            "div"
          );


        noteText.textContent =
          notes;


        noteBox.append(
          noteLabel,
          noteText
        );


        body.appendChild(
          noteBox
        );

      }



      // ------------------------------------------------------
      // FULL PROPERTY RECORD
      // ------------------------------------------------------

      if (
        item.property_item_id
      ) {

        const link =
          document.createElement(
            "a"
          );


        link.className =
          "property-record-link";


        link.href =
          `property/record.html?id=${
            encodeURIComponent(
              item.property_item_id
            )
          }`;


        link.textContent =
          "Open Full Property Record →";


        body.appendChild(
          link
        );

      }


      card.append(
        head,
        body
      );


      el.propertyActivityList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD PROPERTY ACCOUNTABILITY
// ==========================================================

async function loadPropertyAccountability(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshPropertyButton
  ) {

    el.refreshPropertyButton.disabled =
      true;


    el.refreshPropertyButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_property_accountability",

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


    renderPropertyAccountability(
      data
    );


    if (
      showSuccess
    ) {

      showPropertyMessage(
        "Property Accountability refreshed successfully.",
        "success"
      );

    }

    else {

      showPropertyMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity Property Accountability error:",
      error
    );


    showPropertyMessage(

      error?.message

      ||

      "Unable to load Property Accountability.",

      "error"

    );

  }

  finally {

    if (
      el.refreshPropertyButton
    ) {

      el.refreshPropertyButton.disabled =
        false;


      el.refreshPropertyButton.textContent =
        "Refresh Property";

    }

  }

}

// ==========================================================
// DEVICE EXCEPTION HELPERS
// ==========================================================

function showDeviceExceptionsMessage(
  message = "",
  type = "info"
) {

  if (
    !el.deviceExceptionsMessage
  ) {

    return;

  }


  el.deviceExceptionsMessage.textContent =
    message;


  el.deviceExceptionsMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



function humanizeDeviceValue(
  value
) {

  return String(
    value
    ??
    ""
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}



function addDeviceExceptionDetail(
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
    "device-exception-detail";


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
    String(
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



function deviceChecklistClass(
  value
) {

  const normalized =
    String(
      value
      ??
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "pass",
      "passed",
      "true",
      "ok"
    ].includes(
      normalized
    )
  ) {

    return "pass";

  }


  if (
    [
      "fail",
      "failed",
      "false"
    ].includes(
      normalized
    )
  ) {

    return "fail";

  }


  return "";

}



// ==========================================================
// RENDER DEVICE EXCEPTIONS
// ==========================================================

function renderDeviceExceptions(
  data
) {

  const summary =
    data?.summary
    ||
    {};


  const items =
    data?.items
    ||
    [];


  el.failedInspectionCount.textContent =
    summary.failed_inspections
    ??
    0;


  el.reportedDeviceIssueCount.textContent =
    summary.issues_reported
    ??
    0;


  el.openDeviceIssueCount.textContent =
    summary.open_issues
    ??
    0;


  el.highCriticalDeviceCount.textContent =
    summary.high_critical
    ??
    0;


  el.deviceExceptionList.innerHTML =
    "";


  if (
    !items.length
  ) {

    el.deviceExceptionList.innerHTML =
      `
        <div class="empty-state">
          No Device Exceptions are associated
          with this shift at this time.
        </div>
      `;

    return;

  }


  items.forEach(
    item => {

      const isInspection =
        item.activity_type ===
        "failed_inspection";


      const cardClass =
        isInspection

          ? "failed-inspection"

          : "reported-issue";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `device-exception-card ${cardClass}`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "device-exception-head";


      const left =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "h3"
        );


      title.className =
        "device-exception-title";


      title.textContent =

        item.asset_code

        ||

        "Device";


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "device-exception-meta";


      meta.textContent =

        (
          isInspection

            ? "Failed Inspection"

            : "Reported Equipment Issue"
        )

        +

        (
          item.occurred_at

            ? ` • ${formatDateTime(
                item.occurred_at
              )}`

            : ""
        );


      left.append(
        title,
        meta
      );


      const chip =
        document.createElement(
          "span"
        );


      if (
        isInspection
      ) {

        chip.className =
          "device-exception-chip failed-inspection";


        chip.textContent =
          "FAILED";

      }

      else {

        const severity =
          String(
            item.severity
            ||
            "reported"
          )
            .toLowerCase();


        chip.className =
          `device-exception-chip ${severity}`;


        chip.textContent =
          item.severity

            ? `${String(
                item.severity
              ).toUpperCase()} ISSUE`

            : "ISSUE";

      }


      head.append(
        left,
        chip
      );



      // ------------------------------------------------------
      // DETAILS
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "device-exception-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "device-exception-detail-grid";


      addDeviceExceptionDetail(
        details,
        "Asset Number",
        item.asset_code
      );


      addDeviceExceptionDetail(
        details,
        "Device Type",
        humanizeDeviceValue(
          item.device_type
        )
      );


      addDeviceExceptionDetail(
        details,
        "Manufacturer",
        item.manufacturer
      );


      addDeviceExceptionDetail(
        details,
        "Model",
        item.model
      );


      addDeviceExceptionDetail(
        details,
        "Serial",
        item.serial_last4
          ? `••••${item.serial_last4}`
          : null
      );


      addDeviceExceptionDetail(
        details,
        "Device Status",
        item.device_status
          ? humanizeDeviceValue(
              item.device_status
            )
          : null
      );


      addDeviceExceptionDetail(
        details,
        "Reported / Inspected By",
        item.employee_name
      );


      addDeviceExceptionDetail(
        details,
        "Employee Number",
        item.employee_number
          ? `#${item.employee_number}`
          : null
      );


      if (
        isInspection
      ) {

        addDeviceExceptionDetail(
          details,
          "Inspection Result",
          "FAIL"
        );

      }

      else {

        addDeviceExceptionDetail(
          details,
          "Category",
          humanizeDeviceValue(
            item.category
          )
        );


        addDeviceExceptionDetail(
          details,
          "Severity",
          humanizeDeviceValue(
            item.severity
          )
        );


        addDeviceExceptionDetail(
          details,
          "Issue Status",
          humanizeDeviceValue(
            item.issue_status
          )
        );

      }


      addDeviceExceptionDetail(
        details,
        "Attention Required",
        item.attention_required
          ? "YES"
          : "NO"
      );


      if (
        item.resolved_at
      ) {

        addDeviceExceptionDetail(
          details,
          "Resolved",
          formatDateTime(
            item.resolved_at
          )
        );

      }


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // INSPECTION CHECKLIST
      // ------------------------------------------------------

      if (
        isInspection
        &&
        item.checklist
        &&
        typeof item.checklist ===
          "object"
      ) {

        const checklistEntries =
          Object.entries(
            item.checklist
          );


        if (
          checklistEntries.length
        ) {

          const checklistBox =
            document.createElement(
              "div"
            );


          checklistBox.className =
            "device-checklist";


          const checklistTitle =
            document.createElement(
              "strong"
            );


          checklistTitle.textContent =
            "Inspection Checklist";


          const checklistItems =
            document.createElement(
              "div"
            );


          checklistItems.className =
            "device-checklist-items";


          checklistEntries.forEach(
            ([
              key,
              value
            ]) => {

              const check =
                document.createElement(
                  "span"
                );


              const statusClass =
                deviceChecklistClass(
                  value
                );


              check.className =
                `device-check-item ${statusClass}`;


              check.textContent =
                `${humanizeDeviceValue(
                  key
                )}: ${String(
                  value
                ).toUpperCase()}`;


              checklistItems.appendChild(
                check
              );

            }
          );


          checklistBox.append(
            checklistTitle,
            checklistItems
          );


          body.appendChild(
            checklistBox
          );

        }

      }



      // ------------------------------------------------------
      // ISSUE / INSPECTION NOTES
      // ------------------------------------------------------

      const noteValue =

        isInspection

          ? item.notes

          : item.description;


      if (
        noteValue
      ) {

        const noteBox =
          document.createElement(
            "div"
          );


        noteBox.className =
          "device-exception-notes";


        const noteLabel =
          document.createElement(
            "strong"
          );


        noteLabel.textContent =

          isInspection

            ? "Inspection Notes"

            : "Issue Description";


        const noteText =
          document.createElement(
            "div"
          );


        noteText.textContent =
          noteValue;


        noteBox.append(
          noteLabel,
          noteText
        );


        body.appendChild(
          noteBox
        );

      }



      // ------------------------------------------------------
      // ASSET HISTORY LINK
      // ------------------------------------------------------

      if (
        item.device_id
      ) {

        const link =
          document.createElement(
            "a"
          );


        link.className =
          "device-history-link";


        link.href =
          `asset-history.html?device=${
            encodeURIComponent(
              item.device_id
            )
          }`;


        link.textContent =
          "Open Full Asset History →";


        body.appendChild(
          link
        );

      }


      card.append(
        head,
        body
      );


      el.deviceExceptionList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD DEVICE EXCEPTIONS
// ==========================================================

async function loadDeviceExceptions(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshDeviceExceptionsButton
  ) {

    el.refreshDeviceExceptionsButton.disabled =
      true;


    el.refreshDeviceExceptionsButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_device_exceptions",

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


    renderDeviceExceptions(
      data
    );


    if (
      showSuccess
    ) {

      showDeviceExceptionsMessage(
        "Device Exceptions refreshed successfully.",
        "success"
      );

    }

    else {

      showDeviceExceptionsMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity Device Exceptions error:",
      error
    );


    showDeviceExceptionsMessage(

      error?.message

      ||

      "Unable to load Device Exceptions.",

      "error"

    );

  }

  finally {

    if (
      el.refreshDeviceExceptionsButton
    ) {

      el.refreshDeviceExceptionsButton.disabled =
        false;


      el.refreshDeviceExceptionsButton.textContent =
        "Refresh Devices";

    }

  }

}

  // ==========================================================
// TSI REQUEST STATE
// ==========================================================

let tsiRequests =
  [];



// ==========================================================
// TSI MESSAGE
// ==========================================================

function showTsiMessage(
  message = "",
  type = "info"
) {

  if (
    !el.tsiMessage
  ) {

    return;

  }


  el.tsiMessage.textContent =
    message;


  el.tsiMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



// ==========================================================
// TSI HELPERS
// ==========================================================

function tsiStatusClass(
  status
) {

  return String(
    status
    ||
    "open"
  )
    .replaceAll(
      "_",
      "-"
    );

}



function tsiLabel(
  value
) {

  return String(
    value
    ??
    ""
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}



function addTsiDetail(
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
    "tsi-detail-box";


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
    String(
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



// ==========================================================
// RESET TSI FORM
// ==========================================================

function resetTsiForm() {

  if (
    el.tsiRequestId
  ) {

    el.tsiRequestId.value =
      "";

  }


  if (
    el.tsiTicketNumber
  ) {

    el.tsiTicketNumber.value =
      "";

  }


  if (
    el.tsiRequestType
  ) {

    el.tsiRequestType.value =
      "";

  }


  if (
    el.tsiLocation
  ) {

    el.tsiLocation.value =
      "";

  }


  if (
    el.tsiPriority
  ) {

    el.tsiPriority.value =
      "normal";

  }


  if (
    el.tsiStatus
  ) {

    el.tsiStatus.value =
      "open";

  }


  if (
    el.tsiDescription
  ) {

    el.tsiDescription.value =
      "";

  }


  if (
    el.tsiOperationalNotes
  ) {

    el.tsiOperationalNotes.value =
      "";

  }


  if (
    el.tsiFormTitle
  ) {

    el.tsiFormTitle.textContent =
      "Add TSI Request";

  }


  if (
    el.saveTsiRequestButton
  ) {

    el.saveTsiRequestButton.textContent =
      "Add TSI Request";

  }


  if (
    el.cancelTsiEditButton
  ) {

    el.cancelTsiEditButton.hidden =
      true;

  }

}



// ==========================================================
// BEGIN TSI EDIT
// ==========================================================

function beginTsiEdit(
  requestId
) {

  const request =
    tsiRequests.find(

      item =>
        item.tsi_request_id ===
        requestId

    );


  if (
    !request
  ) {

    showTsiMessage(
      "Unable to locate the selected TSI request.",
      "error"
    );

    return;

  }


  el.tsiRequestId.value =
    request.tsi_request_id
    ||
    "";


  el.tsiTicketNumber.value =
    request.ticket_number
    ||
    "";


  el.tsiRequestType.value =
    request.request_type
    ||
    "";


  el.tsiLocation.value =
    request.location
    ||
    "";


  el.tsiPriority.value =
    request.priority
    ||
    "normal";


  el.tsiStatus.value =
    request.status
    ||
    "open";


  el.tsiDescription.value =
    request.description
    ||
    "";


  el.tsiOperationalNotes.value =
    request.operational_notes
    ||
    "";


  el.tsiFormTitle.textContent =
    "Edit TSI Request";


  el.saveTsiRequestButton.textContent =
    "Save TSI Update";


  el.cancelTsiEditButton.hidden =
    false;


  el.tsiRequestForm
    ?.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start"

    });


  el.tsiTicketNumber
    ?.focus();

}



// ==========================================================
// RENDER TSI REQUESTS
// ==========================================================

function renderTsiRequests(
  data
) {

  const summary =
    data?.summary
    ||
    {};


  tsiRequests =
    data?.items
    ||
    [];


  el.tsiTotalCount.textContent =
    summary.total
    ??
    0;


  el.tsiOpenCount.textContent =
    summary.open
    ??
    0;


  el.tsiInProgressCount.textContent =
    summary.in_progress
    ??
    0;


  el.tsiResolvedCount.textContent =
    summary.resolved
    ??
    0;


  el.tsiUrgentCount.textContent =
    summary.urgent
    ??
    0;


  el.tsiRequestList.innerHTML =
    "";


  if (
    !tsiRequests.length
  ) {

    el.tsiRequestList.innerHTML =
      `
        <div class="empty-state">
          No TSI Requests are associated
          with this shift at this time.
        </div>
      `;

    return;

  }


  tsiRequests.forEach(
    request => {

      const statusClass =
        tsiStatusClass(
          request.status
        );


      const priorityClass =
        String(
          request.priority
          ||
          "normal"
        )
          .toLowerCase();


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `tsi-request-card ${statusClass}${
          priorityClass === "urgent"
            ? " urgent"
            : ""
        }`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "tsi-request-head";


      const left =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "h3"
        );


      title.className =
        "tsi-request-title";


      title.textContent =

        request.ticket_number

        ||

        "TSI Request";


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "tsi-request-meta";


      const metaParts =
        [];


      if (
        request.request_type
      ) {

        metaParts.push(
          request.request_type
        );

      }


      if (
        request.reported_at
      ) {

        metaParts.push(
          formatDateTime(
            request.reported_at
          )
        );

      }


      meta.textContent =
        metaParts.join(
          " • "
        );


      left.append(
        title,
        meta
      );



      // ------------------------------------------------------
      // CHIPS
      // ------------------------------------------------------

      const chips =
        document.createElement(
          "div"
        );


      chips.className =
        "tsi-request-chips";


      const statusChip =
        document.createElement(
          "span"
        );


      statusChip.className =
        `tsi-chip ${statusClass}`;


      statusChip.textContent =
        tsiLabel(
          request.status
        );


      const priorityChip =
        document.createElement(
          "span"
        );


      priorityChip.className =
        `tsi-chip ${priorityClass}`;


      priorityChip.textContent =
        `${tsiLabel(
          request.priority
        )} Priority`;


      chips.append(
        statusChip,
        priorityChip
      );


      head.append(
        left,
        chips
      );



      // ------------------------------------------------------
      // BODY
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "tsi-request-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "tsi-detail-grid";


      addTsiDetail(
        details,
        "Ticket Number",
        request.ticket_number
      );


      addTsiDetail(
        details,
        "Request Type",
        request.request_type
      );


      addTsiDetail(
        details,
        "Location",
        request.location
      );


      addTsiDetail(
        details,
        "Status",
        tsiLabel(
          request.status
        )
      );


      addTsiDetail(
        details,
        "Priority",
        tsiLabel(
          request.priority
        )
      );


      addTsiDetail(
        details,
        "Entered By",
        request.created_by_name
      );


      if (
        request.reported_at
      ) {

        addTsiDetail(
          details,
          "Reported",
          formatDateTime(
            request.reported_at
          )
        );

      }


      if (
        request.updated_by_name
      ) {

        addTsiDetail(
          details,
          "Last Updated By",
          request.updated_by_name
        );

      }


      if (
        request.updated_at
      ) {

        addTsiDetail(
          details,
          "Last Updated",
          formatDateTime(
            request.updated_at
          )
        );

      }


      if (
        request.resolved_at
      ) {

        addTsiDetail(
          details,
          "Resolved",
          formatDateTime(
            request.resolved_at
          )
        );

      }


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // DESCRIPTION
      // ------------------------------------------------------

      if (
        request.description
      ) {

        const descriptionBox =
          document.createElement(
            "div"
          );


        descriptionBox.className =
          "tsi-description-box";


        const descriptionLabel =
          document.createElement(
            "strong"
          );


        descriptionLabel.textContent =
          "Request Details";


        const descriptionText =
          document.createElement(
            "div"
          );


        descriptionText.textContent =
          request.description;


        descriptionBox.append(
          descriptionLabel,
          descriptionText
        );


        body.appendChild(
          descriptionBox
        );

      }



      // ------------------------------------------------------
      // OPERATIONAL NOTES
      // ------------------------------------------------------

      if (
        request.operational_notes
      ) {

        const notesBox =
          document.createElement(
            "div"
          );


        notesBox.className =
          "tsi-notes-box";


        const notesLabel =
          document.createElement(
            "strong"
          );


        notesLabel.textContent =
          "Operational Notes";


        const notesText =
          document.createElement(
            "div"
          );


        notesText.textContent =
          request.operational_notes;


        notesBox.append(
          notesLabel,
          notesText
        );


        body.appendChild(
          notesBox
        );

      }



      // ------------------------------------------------------
      // EDIT BUTTON
      // ------------------------------------------------------

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "tsi-card-actions";


      const editButton =
        document.createElement(
          "button"
        );


      editButton.className =
        "button secondary";


      editButton.type =
        "button";


      editButton.textContent =
        "Edit Request";


      editButton.addEventListener(

        "click",

        () =>
          beginTsiEdit(
            request.tsi_request_id
          )

      );


      actions.appendChild(
        editButton
      );


      body.appendChild(
        actions
      );


      card.append(
        head,
        body
      );


      el.tsiRequestList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD TSI REQUESTS
// ==========================================================

async function loadTsiRequests(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshTsiRequestsButton
  ) {

    el.refreshTsiRequestsButton.disabled =
      true;


    el.refreshTsiRequestsButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_tsi_requests",

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


    renderTsiRequests(
      data
    );


    if (
      showSuccess
    ) {

      showTsiMessage(
        "TSI Requests refreshed successfully.",
        "success"
      );

    }

    else {

      showTsiMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity TSI Request error:",
      error
    );


    showTsiMessage(

      error?.message

      ||

      "Unable to load TSI Requests.",

      "error"

    );

  }

  finally {

    if (
      el.refreshTsiRequestsButton
    ) {

      el.refreshTsiRequestsButton.disabled =
        false;


      el.refreshTsiRequestsButton.textContent =
        "Refresh TSI";

    }

  }

}



// ==========================================================
// SAVE TSI REQUEST
// ==========================================================

async function saveTsiRequest() {

  const description =
    el.tsiDescription
      ?.value
      ?.trim()
    ||
    "";


  if (
    description.length < 3
  ) {

    showTsiMessage(
      "Enter the TSI request details before saving.",
      "error"
    );


    el.tsiDescription
      ?.focus();


    return;

  }


  const requestId =
    el.tsiRequestId
      ?.value
      ?.trim()
    ||
    null;


  if (
    el.saveTsiRequestButton
  ) {

    el.saveTsiRequestButton.disabled =
      true;


    el.saveTsiRequestButton.textContent =
      requestId
        ? "Saving Update…"
        : "Adding Request…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "save_daily_activity_tsi_request",

      {

        p_shift_id:
          shiftInstanceId,

        p_tsi_request_id:
          requestId,

        p_ticket_number:
          el.tsiTicketNumber
            ?.value
            ?.trim()
          ||
          null,

        p_request_type:
          el.tsiRequestType
            ?.value
            ?.trim()
          ||
          null,

        p_location:
          el.tsiLocation
            ?.value
            ?.trim()
          ||
          null,

        p_description:
          description,

        p_status:
          el.tsiStatus
            ?.value
          ||
          "open",

        p_priority:
          el.tsiPriority
            ?.value
          ||
          "normal",

        p_operational_notes:
          el.tsiOperationalNotes
            ?.value
            ?.trim()
          ||
          null

      }

    );


    if (
      error
    ) {

      throw error;

    }


    resetTsiForm();


    await loadTsiRequests();


    showTsiMessage(

      requestId

        ? "TSI Request updated successfully."

        : "TSI Request added successfully.",

      "success"

    );


    return data;

  }

  catch (
    error
  ) {

    console.error(
      "Save TSI Request error:",
      error
    );


    showTsiMessage(

      error?.message

      ||

      "Unable to save the TSI Request.",

      "error"

    );

  }

  finally {

    if (
      el.saveTsiRequestButton
    ) {

      el.saveTsiRequestButton.disabled =
        false;


      el.saveTsiRequestButton.textContent =

        el.tsiRequestId
          ?.value

          ? "Save TSI Update"

          : "Add TSI Request";

    }

  }

}

// ==========================================================
// SUPPLY REQUEST STATE
// ==========================================================

let supplyRequests =
  [];



// ==========================================================
// SUPPLY MESSAGE
// ==========================================================

function showSupplyMessage(
  message = "",
  type = "info"
) {

  if (
    !el.supplyMessage
  ) {

    return;

  }


  el.supplyMessage.textContent =
    message;


  el.supplyMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



// ==========================================================
// SUPPLY HELPERS
// ==========================================================

function supplyStatusClass(
  status
) {

  return String(
    status
    ||
    "requested"
  )
    .replaceAll(
      "_",
      "-"
    );

}



function supplyLabel(
  value
) {

  return String(
    value
    ??
    ""
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}



function supplyNumber(
  value,
  fallback = 0
) {

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

}



function formatSupplyQuantity(
  value
) {

  const number =
    supplyNumber(
      value
    );


  return number.toLocaleString(
    undefined,
    {
      maximumFractionDigits:
        2
    }
  );

}



function addSupplyDetail(
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
    "supply-detail-box";


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
    String(
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



// ==========================================================
// RESET SUPPLY FORM
// ==========================================================

function resetSupplyForm() {

  if (
    el.supplyRequestId
  ) {

    el.supplyRequestId.value =
      "";

  }


  if (
    el.supplyItemName
  ) {

    el.supplyItemName.value =
      "";

  }


  if (
    el.supplyCategory
  ) {

    el.supplyCategory.value =
      "";

  }


  if (
    el.supplyQuantityRequested
  ) {

    el.supplyQuantityRequested.value =
      "1";

  }


  if (
    el.supplyUnit
  ) {

    el.supplyUnit.value =
      "each";

  }


  if (
    el.supplyRequestingArea
  ) {

    el.supplyRequestingArea.value =
      "";

  }


  if (
    el.supplyRequestedFor
  ) {

    el.supplyRequestedFor.value =
      "";

  }


  if (
    el.supplyPriority
  ) {

    el.supplyPriority.value =
      "normal";

  }


  if (
    el.supplyStatus
  ) {

    el.supplyStatus.value =
      "requested";

  }


  if (
    el.supplyQuantityFulfilled
  ) {

    el.supplyQuantityFulfilled.value =
      "0";

  }


  if (
    el.supplyFulfillmentNotes
  ) {

    el.supplyFulfillmentNotes.value =
      "";

  }


  if (
    el.supplyOperationalNotes
  ) {

    el.supplyOperationalNotes.value =
      "";

  }


  if (
    el.supplyFormTitle
  ) {

    el.supplyFormTitle.textContent =
      "Add Supply Request";

  }


  if (
    el.saveSupplyRequestButton
  ) {

    el.saveSupplyRequestButton.textContent =
      "Add Supply Request";

  }


  if (
    el.cancelSupplyEditButton
  ) {

    el.cancelSupplyEditButton.hidden =
      true;

  }

}



// ==========================================================
// BEGIN SUPPLY EDIT
// ==========================================================

function beginSupplyEdit(
  requestId
) {

  const request =
    supplyRequests.find(

      item =>
        item.supply_request_id ===
        requestId

    );


  if (
    !request
  ) {

    showSupplyMessage(
      "Unable to locate the selected Supply Request.",
      "error"
    );

    return;

  }


  el.supplyRequestId.value =
    request.supply_request_id
    ||
    "";


  el.supplyItemName.value =
    request.item_name
    ||
    "";


  el.supplyCategory.value =
    request.category
    ||
    "";


  el.supplyQuantityRequested.value =
    request.quantity_requested
    ??
    1;


  el.supplyUnit.value =
    request.unit
    ||
    "each";


  el.supplyRequestingArea.value =
    request.requesting_area
    ||
    "";


  el.supplyRequestedFor.value =
    request.requested_for
    ||
    "";


  el.supplyPriority.value =
    request.priority
    ||
    "normal";


  el.supplyStatus.value =
    request.status
    ||
    "requested";


  el.supplyQuantityFulfilled.value =
    request.quantity_fulfilled
    ??
    0;


  el.supplyFulfillmentNotes.value =
    request.fulfillment_notes
    ||
    "";


  el.supplyOperationalNotes.value =
    request.operational_notes
    ||
    "";


  el.supplyFormTitle.textContent =
    "Edit Supply Request";


  el.saveSupplyRequestButton.textContent =
    "Save Supply Update";


  el.cancelSupplyEditButton.hidden =
    false;


  el.supplyRequestForm
    ?.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start"

    });


  el.supplyItemName
    ?.focus();

}



// ==========================================================
// RENDER SUPPLY REQUESTS
// ==========================================================

function renderSupplyRequests(
  data
) {

  const summary =
    data?.summary
    ||
    {};


  supplyRequests =
    data?.items
    ||
    [];


  el.supplyTotalCount.textContent =
    summary.total
    ??
    0;


  el.supplyRequestedCount.textContent =
    summary.requested
    ??
    0;


  el.supplyOrderedCount.textContent =
    summary.ordered
    ??
    0;


  el.supplyPartialCount.textContent =
    summary.partially_fulfilled
    ??
    0;


  el.supplyFulfilledCount.textContent =
    summary.fulfilled
    ??
    0;


  el.supplyUrgentCount.textContent =
    summary.urgent
    ??
    0;


  el.supplyRequestList.innerHTML =
    "";


  if (
    !supplyRequests.length
  ) {

    el.supplyRequestList.innerHTML =
      `
        <div class="empty-state">
          No Supply Requests are associated
          with this shift at this time.
        </div>
      `;

    return;

  }


  supplyRequests.forEach(
    request => {

      const statusClass =
        supplyStatusClass(
          request.status
        );


      const priorityClass =
        String(
          request.priority
          ||
          "normal"
        )
          .toLowerCase();


      const requestedQuantity =
        supplyNumber(
          request.quantity_requested
        );


      const fulfilledQuantity =
        supplyNumber(
          request.quantity_fulfilled
        );


      const fulfillmentPercent =

        requestedQuantity > 0

          ? Math.min(
              100,
              Math.max(
                0,
                (
                  fulfilledQuantity
                  /
                  requestedQuantity
                )
                *
                100
              )
            )

          : 0;


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `supply-request-card ${statusClass}${
          priorityClass === "urgent"
            ? " urgent"
            : ""
        }`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "supply-request-head";


      const left =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "h3"
        );


      title.className =
        "supply-request-title";


      title.textContent =
        request.item_name
        ||
        "Supply Request";


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "supply-request-meta";


      const metaParts =
        [];


      if (
        request.category
      ) {

        metaParts.push(
          request.category
        );

      }


      if (
        request.requested_at
      ) {

        metaParts.push(
          formatDateTime(
            request.requested_at
          )
        );

      }


      meta.textContent =
        metaParts.join(
          " • "
        );


      left.append(
        title,
        meta
      );



      // ------------------------------------------------------
      // CHIPS
      // ------------------------------------------------------

      const chips =
        document.createElement(
          "div"
        );


      chips.className =
        "supply-request-chips";


      const statusChip =
        document.createElement(
          "span"
        );


      statusChip.className =
        `supply-chip ${statusClass}`;


      statusChip.textContent =
        supplyLabel(
          request.status
        );


      const priorityChip =
        document.createElement(
          "span"
        );


      priorityChip.className =
        `supply-chip ${priorityClass}`;


      priorityChip.textContent =
        `${supplyLabel(
          request.priority
        )} Priority`;


      chips.append(
        statusChip,
        priorityChip
      );


      head.append(
        left,
        chips
      );



      // ------------------------------------------------------
      // BODY
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "supply-request-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "supply-detail-grid";


      addSupplyDetail(
        details,
        "Supply Item",
        request.item_name
      );


      addSupplyDetail(
        details,
        "Category",
        request.category
      );


      addSupplyDetail(
        details,
        "Quantity Requested",
        `${formatSupplyQuantity(
          requestedQuantity
        )} ${request.unit || "each"}`
      );


      addSupplyDetail(
        details,
        "Quantity Fulfilled",
        `${formatSupplyQuantity(
          fulfilledQuantity
        )} ${request.unit || "each"}`
      );


      addSupplyDetail(
        details,
        "Requesting Area",
        request.requesting_area
      );


      addSupplyDetail(
        details,
        "Requested For",
        request.requested_for
      );


      addSupplyDetail(
        details,
        "Status",
        supplyLabel(
          request.status
        )
      );


      addSupplyDetail(
        details,
        "Priority",
        supplyLabel(
          request.priority
        )
      );


      addSupplyDetail(
        details,
        "Entered By",
        request.created_by_name
      );


      if (
        request.requested_at
      ) {

        addSupplyDetail(
          details,
          "Requested",
          formatDateTime(
            request.requested_at
          )
        );

      }


      if (
        request.updated_by_name
      ) {

        addSupplyDetail(
          details,
          "Last Updated By",
          request.updated_by_name
        );

      }


      if (
        request.updated_at
      ) {

        addSupplyDetail(
          details,
          "Last Updated",
          formatDateTime(
            request.updated_at
          )
        );

      }


      if (
        request.fulfilled_at
      ) {

        addSupplyDetail(
          details,
          "Fulfilled",
          formatDateTime(
            request.fulfilled_at
          )
        );

      }


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // FULFILLMENT PROGRESS
      // ------------------------------------------------------

      const progressWrap =
        document.createElement(
          "div"
        );


      progressWrap.className =
        "supply-progress-wrap";


      const progressLabel =
        document.createElement(
          "div"
        );


      progressLabel.className =
        "supply-progress-label";


      const progressText =
        document.createElement(
          "span"
        );


      progressText.textContent =
        "Fulfillment Progress";


      const progressValue =
        document.createElement(
          "span"
        );


      progressValue.textContent =
        `${formatSupplyQuantity(
          fulfilledQuantity
        )} of ${formatSupplyQuantity(
          requestedQuantity
        )} ${request.unit || "each"}`;


      progressLabel.append(
        progressText,
        progressValue
      );


      const progressTrack =
        document.createElement(
          "div"
        );


      progressTrack.className =
        "supply-progress-track";


      const progressFill =
        document.createElement(
          "div"
        );


      progressFill.className =
        "supply-progress-fill";


      progressFill.style.width =
        `${fulfillmentPercent}%`;


      progressTrack.appendChild(
        progressFill
      );


      progressWrap.append(
        progressLabel,
        progressTrack
      );


      body.appendChild(
        progressWrap
      );



      // ------------------------------------------------------
      // FULFILLMENT NOTES
      // ------------------------------------------------------

      if (
        request.fulfillment_notes
      ) {

        const box =
          document.createElement(
            "div"
          );


        box.className =
          "supply-fulfillment-box";


        const label =
          document.createElement(
            "strong"
          );


        label.textContent =
          "Fulfillment Notes";


        const text =
          document.createElement(
            "div"
          );


        text.textContent =
          request.fulfillment_notes;


        box.append(
          label,
          text
        );


        body.appendChild(
          box
        );

      }



      // ------------------------------------------------------
      // OPERATIONAL NOTES
      // ------------------------------------------------------

      if (
        request.operational_notes
      ) {

        const box =
          document.createElement(
            "div"
          );


        box.className =
          "supply-notes-box";


        const label =
          document.createElement(
            "strong"
          );


        label.textContent =
          "Operational Notes";


        const text =
          document.createElement(
            "div"
          );


        text.textContent =
          request.operational_notes;


        box.append(
          label,
          text
        );


        body.appendChild(
          box
        );

      }



      // ------------------------------------------------------
      // EDIT
      // ------------------------------------------------------

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "supply-card-actions";


      const editButton =
        document.createElement(
          "button"
        );


      editButton.className =
        "button secondary";


      editButton.type =
        "button";


      editButton.textContent =
        "Edit Request";


      editButton.addEventListener(

        "click",

        () =>
          beginSupplyEdit(
            request.supply_request_id
          )

      );


      actions.appendChild(
        editButton
      );


      body.appendChild(
        actions
      );


      card.append(
        head,
        body
      );


      el.supplyRequestList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD SUPPLY REQUESTS
// ==========================================================

async function loadSupplyRequests(
  showSuccess = false
) {

  if (
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshSupplyRequestsButton
  ) {

    el.refreshSupplyRequestsButton.disabled =
      true;


    el.refreshSupplyRequestsButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_supply_requests",

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


    renderSupplyRequests(
      data
    );


    if (
      showSuccess
    ) {

      showSupplyMessage(
        "Supply Requests refreshed successfully.",
        "success"
      );

    }

    else {

      showSupplyMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Daily Activity Supply Request error:",
      error
    );


    showSupplyMessage(

      error?.message

      ||

      "Unable to load Supply Requests.",

      "error"

    );

  }

  finally {

    if (
      el.refreshSupplyRequestsButton
    ) {

      el.refreshSupplyRequestsButton.disabled =
        false;


      el.refreshSupplyRequestsButton.textContent =
        "Refresh Supplies";

    }

  }

}



// ==========================================================
// SAVE SUPPLY REQUEST
// ==========================================================

async function saveSupplyRequest() {

  const itemName =
    el.supplyItemName
      ?.value
      ?.trim()
    ||
    "";


  const quantityRequested =
    supplyNumber(
      el.supplyQuantityRequested
        ?.value
    );


  const quantityFulfilled =
    supplyNumber(
      el.supplyQuantityFulfilled
        ?.value
    );


  if (
    itemName.length < 2
  ) {

    showSupplyMessage(
      "Enter the supply item before saving.",
      "error"
    );


    el.supplyItemName
      ?.focus();


    return;

  }


  if (
    quantityRequested <= 0
  ) {

    showSupplyMessage(
      "Requested quantity must be greater than zero.",
      "error"
    );


    el.supplyQuantityRequested
      ?.focus();


    return;

  }


  if (
    quantityFulfilled < 0
  ) {

    showSupplyMessage(
      "Fulfilled quantity cannot be negative.",
      "error"
    );


    el.supplyQuantityFulfilled
      ?.focus();


    return;

  }


  const requestId =
    el.supplyRequestId
      ?.value
      ?.trim()
    ||
    null;


  if (
    el.saveSupplyRequestButton
  ) {

    el.saveSupplyRequestButton.disabled =
      true;


    el.saveSupplyRequestButton.textContent =
      requestId
        ? "Saving Update…"
        : "Adding Request…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "save_daily_activity_supply_request",

      {

        p_shift_id:
          shiftInstanceId,

        p_supply_request_id:
          requestId,

        p_item_name:
          itemName,

        p_category:
          el.supplyCategory
            ?.value
            ?.trim()
          ||
          null,

        p_quantity_requested:
          quantityRequested,

        p_unit:
          el.supplyUnit
            ?.value
            ?.trim()
          ||
          "each",

        p_requesting_area:
          el.supplyRequestingArea
            ?.value
            ?.trim()
          ||
          null,

        p_requested_for:
          el.supplyRequestedFor
            ?.value
            ?.trim()
          ||
          null,

        p_priority:
          el.supplyPriority
            ?.value
          ||
          "normal",

        p_status:
          el.supplyStatus
            ?.value
          ||
          "requested",

        p_quantity_fulfilled:
          quantityFulfilled,

        p_fulfillment_notes:
          el.supplyFulfillmentNotes
            ?.value
            ?.trim()
          ||
          null,

        p_operational_notes:
          el.supplyOperationalNotes
            ?.value
            ?.trim()
          ||
          null

      }

    );


    if (
      error
    ) {

      throw error;

    }


    resetSupplyForm();


    await loadSupplyRequests();


    showSupplyMessage(

      requestId

        ? "Supply Request updated successfully."

        : "Supply Request added successfully.",

      "success"

    );


    return data;

  }

  catch (
    error
  ) {

    console.error(
      "Save Supply Request error:",
      error
    );


    showSupplyMessage(

      error?.message

      ||

      "Unable to save the Supply Request.",

      "error"

    );

  }

  finally {

    if (
      el.saveSupplyRequestButton
    ) {

      el.saveSupplyRequestButton.disabled =
        false;


      el.saveSupplyRequestButton.textContent =

        el.supplyRequestId
          ?.value

          ? "Save Supply Update"

          : "Add Supply Request";

    }

  }

}

// ==========================================================
// MANAGER CONFIDENTIAL STATE
// ==========================================================

let confidentialEntries =
  [];



// ==========================================================
// CONFIDENTIAL MESSAGE
// ==========================================================

function showConfidentialMessage(
  message = "",
  type = "info"
) {

  if (
    !el.confidentialMessage
  ) {

    return;

  }


  el.confidentialMessage.textContent =
    message;


  el.confidentialMessage.className =

    message

      ? `message show ${type}`

      : "message";

}



// ==========================================================
// CONFIDENTIAL HELPERS
// ==========================================================

function confidentialLabel(
  value
) {

  return String(
    value
    ??
    ""
  )
    .replaceAll(
      "_",
      " "
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}



function toLocalDateTimeInput(
  value
) {

  if (
    !value
  ) {

    return "";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const pad =
    number =>
      String(
        number
      ).padStart(
        2,
        "0"
      );


  return (
    `${date.getFullYear()}-`
    +
    `${pad(
      date.getMonth() + 1
    )}-`
    +
    `${pad(
      date.getDate()
    )}T`
    +
    `${pad(
      date.getHours()
    )}:`
    +
    `${pad(
      date.getMinutes()
    )}`
  );

}



function confidentialDateTimeToIso(
  value
) {

  if (
    !value
  ) {

    return null;

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toISOString();

}



function addConfidentialDetail(
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
    "confidential-detail-box";


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
    String(
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



// ==========================================================
// FOLLOW-UP FIELD DISPLAY
// ==========================================================

function syncConfidentialFollowUpField() {

  if (
    !el.confidentialFollowUpDateField
  ) {

    return;

  }


  const required =
    Boolean(
      el.confidentialFollowUpRequired
        ?.checked
    );


  el.confidentialFollowUpDateField.hidden =
    !required;


  if (
    !required
    &&
    el.confidentialFollowUpDate
  ) {

    el.confidentialFollowUpDate.value =
      "";

  }

}



// ==========================================================
// RESET CONFIDENTIAL FORM
// ==========================================================

function resetConfidentialForm() {

  if (
    !hasManagerConfidentialAccess
  ) {

    return;

  }


  if (
    el.confidentialLogId
  ) {

    el.confidentialLogId.value =
      "";

  }


  if (
    el.confidentialSubjectUserId
  ) {

    el.confidentialSubjectUserId.value =
      "";

  }


  if (
    el.confidentialEntryType
  ) {

    el.confidentialEntryType.value =
      "";

  }


  if (
    el.confidentialSubjectName
  ) {

    el.confidentialSubjectName.value =
      "";

  }


  if (
    el.confidentialEmployeeNumber
  ) {

    el.confidentialEmployeeNumber.value =
      "";

  }


  if (
    el.confidentialStatus
  ) {

    el.confidentialStatus.value =
      "open";

  }


  if (
    el.confidentialOccurredAt
  ) {

    el.confidentialOccurredAt.value =
      "";

  }


  if (
    el.confidentialTitle
  ) {

    el.confidentialTitle.value =
      "";

  }


  if (
    el.confidentialDetails
  ) {

    el.confidentialDetails.value =
      "";

  }


  if (
    el.confidentialActionTaken
  ) {

    el.confidentialActionTaken.value =
      "";

  }


  if (
    el.confidentialFollowUpRequired
  ) {

    el.confidentialFollowUpRequired.checked =
      false;

  }


  if (
    el.confidentialFollowUpDate
  ) {

    el.confidentialFollowUpDate.value =
      "";

  }


  syncConfidentialFollowUpField();


  if (
    el.confidentialFormTitle
  ) {

    el.confidentialFormTitle.textContent =
      "Add Confidential Entry";

  }


  if (
    el.saveConfidentialButton
  ) {

    el.saveConfidentialButton.textContent =
      "Add Confidential Entry";

  }


  if (
    el.cancelConfidentialEditButton
  ) {

    el.cancelConfidentialEditButton.hidden =
      true;

  }

}



// ==========================================================
// BEGIN CONFIDENTIAL EDIT
// ==========================================================

function beginConfidentialEdit(
  entryId
) {

  if (
    !hasManagerConfidentialAccess
  ) {

    return;

  }


  const entry =
    confidentialEntries.find(

      item =>
        item.confidential_log_id ===
        entryId

    );


  if (
    !entry
  ) {

    showConfidentialMessage(
      "Unable to locate the selected confidential entry.",
      "error"
    );

    return;

  }


  el.confidentialLogId.value =
    entry.confidential_log_id
    ||
    "";


  el.confidentialSubjectUserId.value =
    entry.subject_user_id
    ||
    "";


  el.confidentialEntryType.value =
    entry.entry_type
    ||
    "";


  el.confidentialSubjectName.value =
    entry.subject_name
    ||
    "";


  el.confidentialEmployeeNumber.value =
    entry.subject_employee_number
    ||
    "";


  el.confidentialStatus.value =
    entry.status
    ||
    "open";


  el.confidentialOccurredAt.value =
    toLocalDateTimeInput(
      entry.occurred_at
    );


  el.confidentialTitle.value =
    entry.title
    ||
    "";


  el.confidentialDetails.value =
    entry.details
    ||
    "";


  el.confidentialActionTaken.value =
    entry.action_taken
    ||
    "";


  el.confidentialFollowUpRequired.checked =
    Boolean(
      entry.follow_up_required
    );


  el.confidentialFollowUpDate.value =
    entry.follow_up_date
    ||
    "";


  syncConfidentialFollowUpField();


  el.confidentialFormTitle.textContent =
    "Edit Confidential Entry";


  el.saveConfidentialButton.textContent =
    "Save Confidential Update";


  el.cancelConfidentialEditButton.hidden =
    false;


  el.confidentialForm
    ?.scrollIntoView({

      behavior:
        "smooth",

      block:
        "start"

    });


  el.confidentialEntryType
    ?.focus();

}



// ==========================================================
// RENDER CONFIDENTIAL ENTRIES
// ==========================================================

function renderConfidentialEntries(
  data
) {

  if (
    !hasManagerConfidentialAccess
  ) {

    return;

  }


  const summary =
    data?.summary
    ||
    {};


  confidentialEntries =
    data?.items
    ||
    [];


  el.confidentialTotalCount.textContent =
    summary.total
    ??
    0;


  el.confidentialOpenCount.textContent =
    summary.open
    ??
    0;


  el.confidentialMonitoringCount.textContent =
    summary.monitoring
    ??
    0;


  el.confidentialFollowUpCount.textContent =
    summary.follow_up
    ??
    0;


  el.confidentialCompletedCount.textContent =
    summary.completed
    ??
    0;


  el.confidentialEntryList.innerHTML =
    "";


  if (
    !confidentialEntries.length
  ) {

    el.confidentialEntryList.innerHTML =
      `
        <div class="empty-state">
          No confidential management entries
          are associated with this shift.
        </div>
      `;

    return;

  }


  confidentialEntries.forEach(
    entry => {

      const status =
        entry.status
        ||
        "open";


      const card =
        document.createElement(
          "article"
        );


      card.className =
        `confidential-entry-card ${status}`;



      // ------------------------------------------------------
      // HEADER
      // ------------------------------------------------------

      const head =
        document.createElement(
          "div"
        );


      head.className =
        "confidential-entry-head";


      const left =
        document.createElement(
          "div"
        );


      const title =
        document.createElement(
          "h3"
        );


      title.className =
        "confidential-entry-title";


      title.textContent =
        entry.title
        ||
        "Confidential Entry";


      const meta =
        document.createElement(
          "div"
        );


      meta.className =
        "confidential-entry-meta";


      const metaParts =
        [];


      if (
        entry.subject_name
      ) {

        metaParts.push(
          entry.subject_name
        );

      }


      if (
        entry.entry_type
      ) {

        metaParts.push(
          confidentialLabel(
            entry.entry_type
          )
        );

      }


      if (
        entry.occurred_at
      ) {

        metaParts.push(
          formatDateTime(
            entry.occurred_at
          )
        );

      }


      meta.textContent =
        metaParts.join(
          " • "
        );


      left.append(
        title,
        meta
      );



      // ------------------------------------------------------
      // CHIPS
      // ------------------------------------------------------

      const chips =
        document.createElement(
          "div"
        );


      chips.className =
        "confidential-entry-chips";


      const restrictedChip =
        document.createElement(
          "span"
        );


      restrictedChip.className =
        "confidential-chip restricted";


      restrictedChip.textContent =
        "Restricted";


      const statusChip =
        document.createElement(
          "span"
        );


      statusChip.className =
        `confidential-chip ${status}`;


      statusChip.textContent =
        confidentialLabel(
          status
        );


      chips.append(
        restrictedChip,
        statusChip
      );


      if (
        entry.follow_up_required
        &&
        status !== "completed"
      ) {

        const followUpChip =
          document.createElement(
            "span"
          );


        followUpChip.className =
          "confidential-chip follow-up";


        followUpChip.textContent =
          "Follow-Up Required";


        chips.appendChild(
          followUpChip
        );

      }


      head.append(
        left,
        chips
      );



      // ------------------------------------------------------
      // BODY
      // ------------------------------------------------------

      const body =
        document.createElement(
          "div"
        );


      body.className =
        "confidential-entry-body";


      const details =
        document.createElement(
          "div"
        );


      details.className =
        "confidential-detail-grid";


      addConfidentialDetail(
        details,
        "Employee / Subject",
        entry.subject_name
      );


      addConfidentialDetail(
        details,
        "Employee Number",
        entry.subject_employee_number
      );


      addConfidentialDetail(
        details,
        "Entry Type",
        confidentialLabel(
          entry.entry_type
        )
      );


      addConfidentialDetail(
        details,
        "Status",
        confidentialLabel(
          entry.status
        )
      );


      if (
        entry.occurred_at
      ) {

        addConfidentialDetail(
          details,
          "Occurred",
          formatDateTime(
            entry.occurred_at
          )
        );

      }


      addConfidentialDetail(
        details,
        "Entered By",
        entry.created_by_name
      );


      if (
        entry.updated_by_name
      ) {

        addConfidentialDetail(
          details,
          "Last Updated By",
          entry.updated_by_name
        );

      }


      if (
        entry.updated_at
      ) {

        addConfidentialDetail(
          details,
          "Last Updated",
          formatDateTime(
            entry.updated_at
          )
        );

      }


      body.appendChild(
        details
      );



      // ------------------------------------------------------
      // DETAILS
      // ------------------------------------------------------

      if (
        entry.details
      ) {

        const detailsBox =
          document.createElement(
            "div"
          );


        detailsBox.className =
          "confidential-details-box";


        const detailsLabel =
          document.createElement(
            "strong"
          );


        detailsLabel.textContent =
          "Confidential Details";


        const detailsText =
          document.createElement(
            "div"
          );


        detailsText.textContent =
          entry.details;


        detailsBox.append(
          detailsLabel,
          detailsText
        );


        body.appendChild(
          detailsBox
        );

      }



      // ------------------------------------------------------
      // ACTION TAKEN
      // ------------------------------------------------------

      if (
        entry.action_taken
      ) {

        const actionBox =
          document.createElement(
            "div"
          );


        actionBox.className =
          "confidential-action-box";


        const actionLabel =
          document.createElement(
            "strong"
          );


        actionLabel.textContent =
          "Action Taken";


        const actionText =
          document.createElement(
            "div"
          );


        actionText.textContent =
          entry.action_taken;


        actionBox.append(
          actionLabel,
          actionText
        );


        body.appendChild(
          actionBox
        );

      }



      // ------------------------------------------------------
      // FOLLOW-UP
      // ------------------------------------------------------

      if (
        entry.follow_up_required
      ) {

        const followUpBox =
          document.createElement(
            "div"
          );


        followUpBox.className =
          "confidential-follow-up-box";


        const followUpLabel =
          document.createElement(
            "strong"
          );


        followUpLabel.textContent =
          "Management Follow-Up";


        const followUpText =
          document.createElement(
            "div"
          );


        followUpText.textContent =
          entry.follow_up_date

            ? `Follow-up requested for ${entry.follow_up_date}.`

            : "Follow-up is required; no date has been assigned.";


        followUpBox.append(
          followUpLabel,
          followUpText
        );


        body.appendChild(
          followUpBox
        );

      }



      // ------------------------------------------------------
      // EDIT ACTION
      // ------------------------------------------------------

      const actions =
        document.createElement(
          "div"
        );


      actions.className =
        "confidential-card-actions";


      const editButton =
        document.createElement(
          "button"
        );


      editButton.className =
        "button secondary";


      editButton.type =
        "button";


      editButton.textContent =
        "Edit Confidential Entry";


      editButton.addEventListener(

        "click",

        () =>
          beginConfidentialEdit(
            entry.confidential_log_id
          )

      );


      actions.appendChild(
        editButton
      );


      body.appendChild(
        actions
      );


      card.append(
        head,
        body
      );


      el.confidentialEntryList
        .appendChild(
          card
        );

    }
  );

}



// ==========================================================
// LOAD CONFIDENTIAL ENTRIES
// ==========================================================

async function loadConfidentialEntries(
  showSuccess = false
) {

  if (
    !hasManagerConfidentialAccess
    ||
    !shiftInstanceId
  ) {

    return;

  }


  if (
    el.refreshConfidentialButton
  ) {

    el.refreshConfidentialButton.disabled =
      true;


    el.refreshConfidentialButton.textContent =
      "Refreshing…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "get_daily_activity_manager_confidential_logs",

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


    renderConfidentialEntries(
      data
    );


    if (
      showSuccess
    ) {

      showConfidentialMessage(
        "Confidential management log refreshed successfully.",
        "success"
      );

    }

    else {

      showConfidentialMessage();

    }

  }

  catch (
    error
  ) {

    console.error(
      "Manager Confidential Log error:",
      error
    );


    showConfidentialMessage(

      error?.message

      ||

      "Unable to load the confidential management log.",

      "error"

    );

  }

  finally {

    if (
      el.refreshConfidentialButton
    ) {

      el.refreshConfidentialButton.disabled =
        false;


      el.refreshConfidentialButton.textContent =
        "Refresh Confidential Log";

    }

  }

}



// ==========================================================
// SAVE CONFIDENTIAL ENTRY
// ==========================================================

async function saveConfidentialEntry() {

  if (
    !hasManagerConfidentialAccess
  ) {

    return;

  }


  const entryType =
    el.confidentialEntryType
      ?.value
    ||
    "";


  const subjectName =
    el.confidentialSubjectName
      ?.value
      ?.trim()
    ||
    "";


  const title =
    el.confidentialTitle
      ?.value
      ?.trim()
    ||
    "";


  const details =
    el.confidentialDetails
      ?.value
      ?.trim()
    ||
    "";


  if (
    !entryType
  ) {

    showConfidentialMessage(
      "Select a confidential entry type.",
      "error"
    );


    el.confidentialEntryType
      ?.focus();


    return;

  }


  if (
    subjectName.length < 2
  ) {

    showConfidentialMessage(
      "Enter the employee or subject name.",
      "error"
    );


    el.confidentialSubjectName
      ?.focus();


    return;

  }


  if (
    title.length < 2
  ) {

    showConfidentialMessage(
      "Enter a title for the confidential entry.",
      "error"
    );


    el.confidentialTitle
      ?.focus();


    return;

  }


  if (
    details.length < 3
  ) {

    showConfidentialMessage(
      "Enter the confidential details before saving.",
      "error"
    );


    el.confidentialDetails
      ?.focus();


    return;

  }


  const entryId =
    el.confidentialLogId
      ?.value
      ?.trim()
    ||
    null;


  const followUpRequired =
    Boolean(
      el.confidentialFollowUpRequired
        ?.checked
    );


  if (
    el.saveConfidentialButton
  ) {

    el.saveConfidentialButton.disabled =
      true;


    el.saveConfidentialButton.textContent =
      entryId

        ? "Saving Update…"

        : "Adding Entry…";

  }


  try {

    const {
      data,
      error
    } = await db.rpc(

      "save_daily_activity_manager_confidential_log",

      {

        p_shift_id:
          shiftInstanceId,

        p_confidential_log_id:
          entryId,

        p_entry_type:
          entryType,

        p_subject_user_id:
          el.confidentialSubjectUserId
            ?.value
            ?.trim()
          ||
          null,

        p_subject_name:
          subjectName,

        p_subject_employee_number:
          el.confidentialEmployeeNumber
            ?.value
            ?.trim()
          ||
          null,

        p_title:
          title,

        p_details:
          details,

        p_action_taken:
          el.confidentialActionTaken
            ?.value
            ?.trim()
          ||
          null,

        p_follow_up_required:
          followUpRequired,

        p_follow_up_date:
          followUpRequired

            ? (
                el.confidentialFollowUpDate
                  ?.value
                ||
                null
              )

            : null,

        p_status:
          el.confidentialStatus
            ?.value
          ||
          "open",

        p_occurred_at:
          confidentialDateTimeToIso(
            el.confidentialOccurredAt
              ?.value
          )

      }

    );


    if (
      error
    ) {

      throw error;

    }


    resetConfidentialForm();


    await loadConfidentialEntries();


    showConfidentialMessage(

      entryId

        ? "Confidential entry updated successfully."

        : "Confidential entry added successfully.",

      "success"

    );


    return data;

  }

  catch (
    error
  ) {

    console.error(
      "Save Manager Confidential Entry error:",
      error
    );


    showConfidentialMessage(

      error?.message

      ||

      "Unable to save the confidential management entry.",

      "error"

    );

  }

  finally {

    if (
      el.saveConfidentialButton
    ) {

      el.saveConfidentialButton.disabled =
        false;


      el.saveConfidentialButton.textContent =

        el.confidentialLogId
          ?.value

          ? "Save Confidential Update"

          : "Add Confidential Entry";

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
  
el.refreshPropertyButton
  ?.addEventListener(

    "click",

    () =>
      loadPropertyAccountability(
        true
      )

  );

el.refreshDeviceExceptionsButton
  ?.addEventListener(

    "click",

    () =>
      loadDeviceExceptions(
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
// TSI FORM + CONTROLS
// ==========================================================

el.tsiRequestForm
  ?.addEventListener(

    "submit",

    async event => {

      event.preventDefault();

      await saveTsiRequest();

    }

  );


el.cancelTsiEditButton
  ?.addEventListener(

    "click",

    () => {

      resetTsiForm();

      showTsiMessage();

    }

  );


el.refreshTsiRequestsButton
  ?.addEventListener(

    "click",

    () =>
      loadTsiRequests(
        true
      )

  );

// ==========================================================
// SUPPLY FORM + CONTROLS
// ==========================================================

el.supplyRequestForm
  ?.addEventListener(

    "submit",

    async event => {

      event.preventDefault();

      await saveSupplyRequest();

    }

  );


el.cancelSupplyEditButton
  ?.addEventListener(

    "click",

    () => {

      resetSupplyForm();

      showSupplyMessage();

    }

  );


el.refreshSupplyRequestsButton
  ?.addEventListener(

    "click",

    () =>
      loadSupplyRequests(
        true
      )

  );

// ==========================================================
// MANAGER CONFIDENTIAL CONTROLS
// ==========================================================

if (
  hasManagerConfidentialAccess
) {

  el.confidentialForm
    ?.addEventListener(

      "submit",

      async event => {

        event.preventDefault();

        await saveConfidentialEntry();

      }

    );


  el.cancelConfidentialEditButton
    ?.addEventListener(

      "click",

      () => {

        resetConfidentialForm();

        showConfidentialMessage();

      }

    );


  el.refreshConfidentialButton
    ?.addEventListener(

      "click",

      () =>
        loadConfidentialEntries(
          true
        )

    );


  el.confidentialFollowUpRequired
    ?.addEventListener(

      "change",

      () => {

        syncConfidentialFollowUpField();

      }

    );

}

  // ==========================================================
// PRINT DAILY ACTIVITY REPORT
// ==========================================================

document
  .getElementById(
    "printDailyActivityButton"
  )
  ?.addEventListener(

    "click",

    () => {

      window.print();

    }

  );
  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

await Promise.all([

  loadShiftSummary(),

  loadSecurityAlerts(),

  loadSpecialAssignments(),

  loadPropertyAccountability(),

  loadDeviceExceptions(),

  loadTsiRequests(),

  loadSupplyRequests(),

  hasManagerConfidentialAccess
    ? loadConfidentialEntries()
    : Promise.resolve()

]);
})();
