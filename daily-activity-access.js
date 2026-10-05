(async function () {

  "use strict";


  // =========================================================
  // WAIT FOR SECURETRACK AUTH
  // =========================================================

  function waitForAuth() {

    if (
      window.SecureTrackAuth
    ) {

      return Promise.resolve(
        window.SecureTrackAuth
      );

    }


    return new Promise(
      (
        resolve,
        reject
      ) => {

        let settled =
          false;


        const finish =
          authValue => {

            if (
              settled
            ) {
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

            finish(
              event.detail ||
              window.SecureTrackAuth
            );

          };


        document.addEventListener(
          "securetrack:authorized",
          handler
        );


        setTimeout(
          () => {

            if (
              settled
            ) {
              return;
            }


            if (
              window.SecureTrackAuth
            ) {

              finish(
                window.SecureTrackAuth
              );

              return;
            }


            settled =
              true;


            document.removeEventListener(
              "securetrack:authorized",
              handler
            );


            reject(
              new Error(
                "SecureTrack authentication could not be initialized."
              )
            );

          },
          4000
        );

      }
    );

  }


  // =========================================================
  // ELEMENTS
  // =========================================================

  const $ =
    id =>
      document.getElementById(
        id
      );


  const el = {

    pageMessage:
      $("pageMessage"),

    accessHeading:
      $("accessHeading"),

    backButton:
      $("backButton"),

    loadingState:
      $("loadingState"),

    emptyState:
      $("emptyState"),

    activeShiftList:
      $("activeShiftList")

  };


  // =========================================================
  // HELPERS
  // =========================================================

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
        "\"",
        "&quot;"
      )

      .replaceAll(
        "'",
        "&#039;"
      );

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
        `${value}T12:00:00`
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

        hour:
          "numeric",

        minute:
          "2-digit"
      }
    );

  }


  function supervisorSourceLabel(
    value
  ) {

    if (
      value ===
      "acting_senior"
    ) {

      return "Acting Team Lead";

    }


    if (
      value ===
      "team_lead"
    ) {

      return "Team Lead";

    }


    return "Shift Supervisor";

  }


  // =========================================================
  // BUILD DAILY ACTIVITY URL
  // =========================================================

  function buildDailyActivityUrl(
    shift
  ) {

    const target =
      new URL(
        "daily-activity-report.html",
        window.location.href
      );


    target.searchParams.set(
      "shiftInstanceId",
      shift.shift_instance_id
    );


    target.searchParams.set(
      "shiftDate",
      shift.shift_date
    );


    target.searchParams.set(
      "shiftName",
      shift.shift_name
    );


    target.searchParams.set(
      "source",
      "daily-activity-access"
    );


    target.searchParams.set(
      "returnTo",
      new URL(
        "daily-activity-access.html",
        window.location.href
      ).href
    );


    return target.href;

  }


  // =========================================================
  // OPEN SHIFT
  // =========================================================

  function openShift(
    shift
  ) {

    if (
      !shift
        ?.shift_instance_id
    ) {

      return;

    }


    window.location.assign(
      buildDailyActivityUrl(
        shift
      )
    );

  }


  // =========================================================
  // RENDER MANAGEMENT VIEW
  // =========================================================

  function renderManagementShifts(
    shifts
  ) {

    el.loadingState.hidden =
      true;


    if (
      !shifts.length
    ) {

      el.activeShiftList.hidden =
        true;

      el.emptyState.hidden =
        false;

      el.accessHeading.textContent =
        "No Current Operational Shifts";

      return;

    }


    el.emptyState.hidden =
      true;

    el.activeShiftList.hidden =
      false;


    el.accessHeading.textContent =
      shifts.length === 1

        ? "1 Shift Currently In Progress"

        : `${shifts.length} Shifts Currently In Progress`;


    el.activeShiftList.innerHTML =
      "";


    shifts.forEach(
      shift => {

        const card =
          document.createElement(
            "article"
          );


        card.className =
          "active-shift-card";


        card.innerHTML =
          `

            <div class="active-shift-head">

              <div>

                <div class="eyebrow">
                  ACTIVE SHIFT
                </div>

                <div class="active-shift-name">
                  ${escapeHtml(
                    shift.shift_name
                  )} Shift
                </div>

                <div class="subtle">
                  ${escapeHtml(
                    formatDate(
                      shift.shift_date
                    )
                  )}
                </div>

              </div>


              <button
                class="button primary"
                type="button"
                data-open-daily-activity
              >
                Open Daily Activity
              </button>

            </div>


            <div class="active-shift-meta">

              <div>

                <span>
                  Shift Supervisor
                </span>

                <strong>
                  ${escapeHtml(
                    shift.supervisor_name ||
                    "Not Assigned"
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Leadership Status
                </span>

                <strong>
                  ${escapeHtml(
                    supervisorSourceLabel(
                      shift.supervisor_source
                    )
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Shift Started
                </span>

                <strong>
                  ${escapeHtml(
                    formatDateTime(
                      shift.operationally_confirmed_at
                    )
                  )}
                </strong>

              </div>

            </div>

          `;


        card
          .querySelector(
            "[data-open-daily-activity]"
          )
          ?.addEventListener(
            "click",
            () => {

              openShift(
                shift
              );

            }
          );


        el.activeShiftList
          .appendChild(
            card
          );

      }
    );

  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  try {

    const auth =
      await waitForAuth();


    if (
      !auth?.db ||
      !auth?.user
    ) {

      throw new Error(
        "SecureTrack authentication is unavailable."
      );

    }


    const db =
      auth.db;


    const roles =
      auth.roles || [];


    const isManagement =
      roles.some(
        role =>
          [
            "manager",
            "director",
            "admin"
          ].includes(
            role
          )
      );


    // =======================================================
    // CHANGE RETURN BUTTON FOR MANAGEMENT
    // =======================================================

    if (
      isManagement
    ) {

      el.backButton.href =
        "manager-portal.html";

      el.backButton.textContent =
        "← Manager Portal";

    }


    // =======================================================
    // GET CURRENT DAILY ACTIVITY ACCESS
    // =======================================================

    const {
      data,
      error
    } = await db.rpc(
      "get_daily_activity_access"
    );


    if (
      error
    ) {

      throw error;

    }


    const shifts =
      Array.isArray(
        data?.shifts
      )

        ? data.shifts

        : [];


    // =======================================================
    // MANAGEMENT
    //
    // Managers / Directors / Admin select which current
    // operational shift they want to view.
    // =======================================================

    if (
      data?.is_management
    ) {

      renderManagementShifts(
        shifts
      );

      return;

    }


    // =======================================================
    // TEAM LEAD / ACTING TEAM LEAD
    // =======================================================

    if (
      shifts.length === 0
    ) {

      el.loadingState.hidden =
        true;

      el.emptyState.hidden =
        false;

      el.accessHeading.textContent =
        "No Active Shift Assigned";

      return;

    }


    // Normally there will be exactly one current shift.
    // If there somehow are multiple, allow selection rather
    // than guessing which one should open.
    if (
      shifts.length > 1
    ) {

      renderManagementShifts(
        shifts
      );

      el.accessHeading.textContent =
        "Select Your Active Shift";

      return;

    }


    // =======================================================
    // ONE ACTIVE SHIFT — OPEN IT AUTOMATICALLY
    // =======================================================

    const shift =
      shifts[0];


    el.accessHeading.textContent =
      `Opening ${shift.shift_name} Shift…`;


    el.loadingState.innerHTML =
      `
        <div
          class="daily-access-spinner"
          aria-hidden="true"
        ></div>

        Opening your Daily Activity Report…
      `;


    setTimeout(
      () => {

        openShift(
          shift
        );

      },
      400
    );

  }


  catch (
    error
  ) {

    console.error(
      "Daily Activity access error:",
      error
    );


    el.loadingState.hidden =
      true;


    el.emptyState.hidden =
      true;


    el.accessHeading.textContent =
      "Daily Activity Access Unavailable";


    el.pageMessage.textContent =
      error?.message ||
      "Unable to locate the current Daily Activity Report.";


    el.pageMessage.className =
      "message show error";

  }

})();
