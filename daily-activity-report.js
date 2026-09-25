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



  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  await loadShiftSummary();

})();
