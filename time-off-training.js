(async function () {
  "use strict";

  // =========================================================
  // SECURETRACK
  // TIME OFF / TRAINING
  // =========================================================

  const STM = window.SecureTrackManager;

  if (!STM) {
    console.error("SecureTrackManager is not available.");
    return;
  }

  const manager = await STM.requireManager();

  if (!manager) {
    return;
  }

  const db = STM.db;

  const currentUserId = manager.session.user.id;
  const currentRoles = manager.roles || [];

  const isAdmin = currentRoles.includes("admin");
  const isDirector = currentRoles.includes("director");

  const systemWideAuthority =
    isAdmin || isDirector;

  const ALL_SHIFTS = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta"
  ];


  // =========================================================
  // ACTUAL HTML ELEMENTS
  // =========================================================

  const logoutButton =
    document.getElementById("logoutButton");

  const officerSearch =
    document.getElementById("officerSearch");

  const shiftFilter =
    document.getElementById("shiftFilter");

  const officerPicker =
    document.getElementById("officerPicker");

  const selectedOfficerBox =
    document.getElementById("selectedOfficer");

  const selectedOfficerName =
    document.getElementById("selectedOfficerName");

  const selectedOfficerDetails =
    document.getElementById("selectedOfficerDetails");

  const unavailabilityForm =
    document.getElementById("unavailabilityForm");

  const absenceType =
    document.getElementById("absenceType");

  const startDate =
    document.getElementById("startDate");

  const endDate =
    document.getElementById("endDate");

  const absenceShift =
    document.getElementById("absenceShift");

  const absenceNotes =
    document.getElementById("absenceNotes");

  const saveAbsenceButton =
    document.getElementById("saveAbsenceButton");

  const formMessage =
    document.getElementById("formMessage");

  const reviewDate =
    document.getElementById("reviewDate");

  const reviewShift =
    document.getElementById("reviewShift");

  const outCount =
    document.getElementById("outCount");

  const trainingCount =
    document.getElementById("trainingCount");

  const timeOffCount =
    document.getElementById("timeOffCount");

  const absenceTableBody =
    document.getElementById("absenceTableBody");

  const rosterOfficer =
    document.getElementById("rosterOfficer");

  const rosterShift =
    document.getElementById("rosterShift");

  const knownShiftNames =
    document.getElementById("knownShiftNames");

  const saveRosterButton =
    document.getElementById("saveRosterButton");

  const rosterMessage =
    document.getElementById("rosterMessage");


  // =========================================================
  // STATE
  // =========================================================

  const state = {
    supervisors: [],
    managedShifts: [],
    directoryOfficers: [],
    absenceOfficers: [],
    records: [],
    selectedOfficer: null
  };


  // =========================================================
  // HELPERS
  // =========================================================

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function humanize(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );
  }


  function todayString() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(now.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(now.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function formatDate(dateString) {
    if (!dateString) {
      return "—";
    }

    const date =
      new Date(
        `${dateString}T12:00:00`
      );

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric"
      }
    );
  }


  function showMessage(
    element,
    message,
    type = "success"
  ) {
    if (!element) {
      return;
    }

    element.textContent = message;

    element.classList.remove(
      "success",
      "error"
    );

    element.classList.add(
      "show",
      type
    );
  }


  function clearMessage(element) {
    if (!element) {
      return;
    }

    element.textContent = "";

    element.classList.remove(
      "show",
      "success",
      "error"
    );
  }


  function permittedShifts() {
    return systemWideAuthority
      ? [...ALL_SHIFTS]
      : [...state.managedShifts];
  }


  // =========================================================
  // DEFAULT DATES
  // =========================================================

  const today = todayString();

  startDate.value = today;
  endDate.value = today;
  reviewDate.value = today;


  // =========================================================
  // LOGOUT
  // =========================================================

  logoutButton.addEventListener(
    "click",
    async () => {
      logoutButton.disabled = true;
      logoutButton.textContent =
        "Signing Out…";

      await STM.signOut();
    }
  );


  // =========================================================
  // LOAD COMMAND STRUCTURE
  // =========================================================

  async function loadSupervisors() {

    const {
      data,
      error
    } =
      await db
        .from("shift_supervisors")
        .select(
          "shift_name, manager_user_id, is_active"
        );


    if (error) {
      throw error;
    }


    state.supervisors =
      (data || []).filter(
        row =>
          row.is_active !== false
      );


    if (systemWideAuthority) {

      state.managedShifts =
        [...ALL_SHIFTS];

    } else {

      state.managedShifts =
        state.supervisors
          .filter(
            row =>
              row.manager_user_id ===
              currentUserId
          )
          .map(
            row =>
              row.shift_name
          )
          .filter(
            shift =>
              ALL_SHIFTS.includes(shift)
          );

    }

  }


  // =========================================================
  // SHIFT FILTERS
  // =========================================================

  function populateShiftSelect(
    select,
    allLabel
  ) {

    select.innerHTML = "";

    const allOption =
      document.createElement("option");

    allOption.value = "";
    allOption.textContent = allLabel;

    select.appendChild(allOption);


    permittedShifts()
      .forEach(shift => {

        const option =
          document.createElement("option");

        option.value = shift;
        option.textContent = shift;

        select.appendChild(option);

      });

  }


  function populateShiftControls() {

    populateShiftSelect(
      shiftFilter,
      systemWideAuthority
        ? "All Shifts"
        : "All Managed Shifts"
    );

    populateShiftSelect(
      reviewShift,
      systemWideAuthority
        ? "All Shifts"
        : "All Managed Shifts"
    );


    knownShiftNames.innerHTML = "";

    permittedShifts()
      .forEach(shift => {

        const option =
          document.createElement("option");

        option.value = shift;

        knownShiftNames.appendChild(
          option
        );

      });

  }


  // =========================================================
  // LOAD OFFICER DIRECTORY
  // =========================================================

  async function loadOfficers() {

    officerPicker.innerHTML =
      `
        <div class="staffing-empty">
          Loading officers…
        </div>
      `;


    const {
      data,
      error
    } =
      await db.rpc(
        "get_officer_directory"
      );


    if (error) {
      throw error;
    }


    state.directoryOfficers =
      (data || []).sort(
        (a, b) => {

          const aName =
            a.last_name ||
            a.display_name ||
            "";

          const bName =
            b.last_name ||
            b.display_name ||
            "";

          return aName.localeCompare(
            bName
          );

        }
      );


    /*
      For time off/training, a manager
      can only act on officers CURRENTLY
      assigned to Alpha/Bravo or
      Charlie/Delta under that manager.

      Director/Admin see all officers.
    */

    if (systemWideAuthority) {

      state.absenceOfficers =
        [...state.directoryOfficers];

    } else {

      state.absenceOfficers =
        state.directoryOfficers.filter(
          officer =>
            officer.shift_name &&
            state.managedShifts.includes(
              officer.shift_name
            )
        );

    }


    /*
      If the currently selected officer
      is no longer visible, clear them.
    */

    if (
      state.selectedOfficer &&
      !state.absenceOfficers.some(
        officer =>
          officer.user_id ===
          state.selectedOfficer.user_id
      )
    ) {

      state.selectedOfficer = null;

    }


    renderOfficerPicker();
    renderSelectedOfficer();
    populateRosterOfficers();

  }


  // =========================================================
  // OFFICER FILTER
  // =========================================================

  function filteredOfficers() {

    const search =
      String(
        officerSearch.value || ""
      )
        .trim()
        .toLowerCase();


    const shift =
      shiftFilter.value || "";


    return state.absenceOfficers.filter(
      officer => {

        if (
          shift &&
          officer.shift_name !== shift
        ) {
          return false;
        }


        if (!search) {
          return true;
        }


        const searchable =
          [
            officer.display_name,
            officer.first_name,
            officer.middle_initial,
            officer.last_name,
            officer.nickname,
            officer.employee_number,
            officer.shift_name
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return searchable.includes(
          search
        );

      }
    );

  }


  // =========================================================
  // CURRENT PLANNED ABSENCE
  // =========================================================

  function getOfficerAbsence(
    userId
  ) {

    return state.records.find(
      record =>
        record.user_id === userId
    );

  }


  // =========================================================
  // RENDER OFFICERS
  // =========================================================

  function renderOfficerPicker() {

    const officers =
      filteredOfficers();


    officerPicker.innerHTML = "";


    if (!officers.length) {

      officerPicker.innerHTML =
        `
          <div class="staffing-empty">
            ${
              systemWideAuthority
                ? "No officers match the current filters."
                : state.managedShifts.length
                  ? "No officers are currently assigned to your managed shifts."
                  : "No shift-command assignments were found for this manager."
            }
          </div>
        `;

      return;

    }


    officers.forEach(
      officer => {

        const activeAbsence =
          getOfficerAbsence(
            officer.user_id
          );


        const button =
          document.createElement(
            "button"
          );

        button.type = "button";

        button.className =
          "officer-option";


        if (
          state.selectedOfficer?.user_id ===
          officer.user_id
        ) {

          button.classList.add(
            "selected"
          );

        }


        const details = [];

        if (officer.employee_number) {
          details.push(
            `#${officer.employee_number}`
          );
        }

        details.push(
          officer.shift_name ||
          "Unassigned"
        );


        button.innerHTML =
          `
            <strong>
              ${escapeHTML(
                officer.display_name ||
                "Officer"
              )}
            </strong>

            <small>
              ${escapeHTML(
                details.join(" • ")
              )}
            </small>

            ${
              activeAbsence
                ? `
                  <small>
                    Scheduled Out:
                    ${escapeHTML(
                      humanize(
                        activeAbsence.absence_type
                      )
                    )}
                    ${
                      activeAbsence.notes
                        ? ` — ${escapeHTML(
                            activeAbsence.notes
                          )}`
                        : ""
                    }
                  </small>
                `
                : ""
            }
          `;


        button.addEventListener(
          "click",
          () => {

            state.selectedOfficer =
              officer;

            renderOfficerPicker();
            renderSelectedOfficer();

            clearMessage(formMessage);

          }
        );


        officerPicker.appendChild(
          button
        );

      }
    );

  }


  // =========================================================
  // SELECTED OFFICER
  // =========================================================

  function renderSelectedOfficer() {

    const officer =
      state.selectedOfficer;


    if (!officer) {

      selectedOfficerBox.hidden = true;

      selectedOfficerName.textContent =
        "—";

      selectedOfficerDetails.textContent =
        "—";

      absenceShift.innerHTML =
        `
          <option value="">
            Select an officer first
          </option>
        `;

      saveAbsenceButton.disabled =
        true;

      return;

    }


    selectedOfficerBox.hidden = false;

    selectedOfficerName.textContent =
      officer.display_name ||
      "Officer";


    const details = [];

    if (officer.employee_number) {

      details.push(
        `#${officer.employee_number}`
      );

    }

    details.push(
      officer.shift_name ||
      "Unassigned"
    );


    selectedOfficerDetails.textContent =
      details.join(" • ");


    absenceShift.innerHTML = "";


    if (officer.shift_name) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        officer.shift_name;

      option.textContent =
        officer.shift_name;

      absenceShift.appendChild(
        option
      );

      saveAbsenceButton.disabled =
        false;

    } else {

      const option =
        document.createElement(
          "option"
        );

      option.value = "";

      option.textContent =
        "Officer has no assigned shift";

      absenceShift.appendChild(
        option
      );

      saveAbsenceButton.disabled =
        true;

    }

  }


  // =========================================================
  // ROSTER OFFICER OPTIONS
  // =========================================================

  function populateRosterOfficers() {

    const previousValue =
      rosterOfficer.value;


    rosterOfficer.innerHTML =
      `
        <option value="">
          Select officer
        </option>
      `;


    let officers;


    if (systemWideAuthority) {

      officers =
        [...state.directoryOfficers];

    } else {

      /*
        Managers may see:
        - officers already in their command
        - unassigned officers for initial assignment

        The database RPC still makes the
        final authorization decision.
      */

      officers =
        state.directoryOfficers.filter(
          officer =>
            !officer.shift_name ||
            state.managedShifts.includes(
              officer.shift_name
            )
        );

    }


    officers.forEach(
      officer => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          officer.user_id;

        option.textContent =
          `${officer.display_name || "Officer"} — ${
            officer.shift_name || "Unassigned"
          }`;

        rosterOfficer.appendChild(
          option
        );

      }
    );


    if (
      [...rosterOfficer.options]
        .some(
          option =>
            option.value ===
            previousValue
        )
    ) {

      rosterOfficer.value =
        previousValue;

    }

  }


  // =========================================================
  // ROSTER OFFICER CHANGE
  // =========================================================

  rosterOfficer.addEventListener(
    "change",
    () => {

      clearMessage(
        rosterMessage
      );


      const officer =
        state.directoryOfficers.find(
          item =>
            item.user_id ===
            rosterOfficer.value
        );


      if (!officer) {

        rosterShift.value = "";
        return;

      }


      rosterShift.value =
        officer.shift_name || "";

    }
  );


  // =========================================================
  // SAVE NORMAL SHIFT
  // =========================================================

  saveRosterButton.addEventListener(
    "click",
    async () => {

      clearMessage(
        rosterMessage
      );


      const userId =
        rosterOfficer.value;


      const shift =
        String(
          rosterShift.value || ""
        ).trim();


      if (!userId) {

        showMessage(
          rosterMessage,
          "Select an officer.",
          "error"
        );

        return;

      }


      if (
        !ALL_SHIFTS.includes(
          shift
        )
      ) {

        showMessage(
          rosterMessage,
          "Shift must be Alpha, Bravo, Charlie, or Delta.",
          "error"
        );

        return;

      }


      if (
        !systemWideAuthority &&
        !state.managedShifts.includes(
          shift
        )
      ) {

        showMessage(
          rosterMessage,
          "You can only assign officers to a shift within your command.",
          "error"
        );

        return;

      }


      saveRosterButton.disabled =
        true;

      saveRosterButton.textContent =
        "Saving…";


      try {

        const {
          error
        } =
          await db.rpc(
            "set_officer_shift",
            {
              p_user_id:
                userId,

              p_shift_name:
                shift
            }
          );


        if (error) {
          throw error;
        }


        showMessage(
          rosterMessage,
          `Normal shift updated to ${shift}.`
        );


        await loadOfficers();
        await loadRecords();


      } catch (error) {

        console.error(
          "SecureTrack roster update error:",
          error
        );


        showMessage(
          rosterMessage,
          error.message ||
          "The officer's shift could not be updated.",
          "error"
        );


      } finally {

        saveRosterButton.disabled =
          false;

        saveRosterButton.textContent =
          "Save Officer Shift";

      }

    }
  );


  // =========================================================
  // LOAD PLANNED ABSENCES
  // =========================================================

  async function loadRecords() {

    const date =
      reviewDate.value ||
      today;


    const {
      data,
      error
    } =
      await db.rpc(
        "get_managed_unavailability",
        {
          p_from_date:
            date,

          p_to_date:
            date,

          p_shift_name:
            null
        }
      );


    if (error) {
      throw error;
    }


    state.records =
      data || [];


    renderAbsenceTable();
    updateCounts();
    renderOfficerPicker();

  }


  // =========================================================
  // FILTER RECORDS
  // =========================================================

  function filteredRecords() {

    const shift =
      reviewShift.value || "";


    return state.records.filter(
      record => {

        if (
          shift &&
          record.shift_name !== shift
        ) {
          return false;
        }

        return true;

      }
    );

  }


  // =========================================================
  // RENDER ABSENCE TABLE
  // =========================================================

  function renderAbsenceTable() {

    const records =
      filteredRecords();


    absenceTableBody.innerHTML = "";


    if (!records.length) {

      absenceTableBody.innerHTML =
        `
          <tr>
            <td
              colspan="6"
              class="staffing-empty"
            >
              No planned absences were found
              for this date and shift.
            </td>
          </tr>
        `;

      return;

    }


    records.forEach(
      record => {

        const row =
          document.createElement(
            "tr"
          );


        const dates =
          record.start_date ===
          record.end_date
            ? formatDate(
                record.start_date
              )
            : `${formatDate(
                record.start_date
              )} – ${formatDate(
                record.end_date
              )}`;


        row.innerHTML =
          `
            <td>

              <strong>
                ${escapeHTML(
                  record.display_name ||
                  "Officer"
                )}
              </strong>

              ${
                record.employee_number
                  ? `
                    <div class="subtle">
                      #${escapeHTML(
                        record.employee_number
                      )}
                    </div>
                  `
                  : ""
              }

            </td>


            <td>

              <span
                class="absence-type ${escapeHTML(
                  record.absence_type
                )}"
              >
                ${escapeHTML(
                  humanize(
                    record.absence_type
                  )
                )}
              </span>

            </td>


            <td>
              ${escapeHTML(
                dates
              )}
            </td>


            <td>
              ${escapeHTML(
                record.shift_name ||
                "—"
              )}
            </td>


            <td>
              ${
                record.notes
                  ? escapeHTML(
                      record.notes
                    )
                  : "—"
              }
            </td>


            <td>

              <button
                type="button"
                class="small-button danger"
                data-cancel-id="${escapeHTML(
                  record.unavailability_id
                )}"
              >
                Cancel
              </button>

            </td>
          `;


        absenceTableBody.appendChild(
          row
        );

      }
    );

  }


  // =========================================================
  // COUNTS
  // =========================================================

  function updateCounts() {

    const records =
      filteredRecords();


    const uniqueOfficers =
      new Set(
        records.map(
          record =>
            record.user_id
        )
      );


    outCount.textContent =
      uniqueOfficers.size;


    trainingCount.textContent =
      records.filter(
        record =>
          record.absence_type ===
          "training"
      ).length;


    timeOffCount.textContent =
      records.filter(
        record =>
          record.absence_type ===
          "time_off"
      ).length;

  }


  // =========================================================
  // CREATE PLANNED ABSENCE
  // =========================================================

  unavailabilityForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage(
        formMessage
      );


      const officer =
        state.selectedOfficer;


      if (!officer) {

        showMessage(
          formMessage,
          "Select an officer first.",
          "error"
        );

        return;

      }


      if (!officer.shift_name) {

        showMessage(
          formMessage,
          "Assign the officer to a normal shift before recording time off or training.",
          "error"
        );

        return;

      }


      const type =
        absenceType.value;


      if (
        ![
          "time_off",
          "training",
          "other"
        ].includes(type)
      ) {

        showMessage(
          formMessage,
          "Select the type of planned absence.",
          "error"
        );

        return;

      }


      if (
        !startDate.value ||
        !endDate.value
      ) {

        showMessage(
          formMessage,
          "Enter a start and end date.",
          "error"
        );

        return;

      }


      if (
        endDate.value <
        startDate.value
      ) {

        showMessage(
          formMessage,
          "The end date cannot be before the start date.",
          "error"
        );

        return;

      }


      saveAbsenceButton.disabled =
        true;

      saveAbsenceButton.textContent =
        "Saving…";


      try {

        const {
          error
        } =
          await db.rpc(
            "create_officer_unavailability",
            {
              p_user_id:
                officer.user_id,

              p_absence_type:
                type,

              p_start_date:
                startDate.value,

              p_end_date:
                endDate.value,

              p_shift_name:
                officer.shift_name,

              p_notes:
                absenceNotes.value.trim() ||
                null
            }
          );


        if (error) {
          throw error;
        }


        showMessage(
          formMessage,
          `${humanize(type)} recorded for ${officer.display_name}.`
        );


        absenceNotes.value = "";


        /*
          Move review date to start
          date so the new record can
          immediately be seen below.
        */

        reviewDate.value =
          startDate.value;


        await loadRecords();


      } catch (error) {

        console.error(
          "SecureTrack planned absence error:",
          error
        );


        showMessage(
          formMessage,
          error.message ||
          "The planned absence could not be saved.",
          "error"
        );


      } finally {

        saveAbsenceButton.disabled =
          false;

        saveAbsenceButton.textContent =
          "Mark Officer Out";

      }

    }
  );


  // =========================================================
  // CANCEL PLANNED ABSENCE
  // =========================================================

  absenceTableBody.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-cancel-id]"
        );


      if (!button) {
        return;
      }


      const id =
        button.dataset.cancelId;


      const confirmed =
        window.confirm(
          "Cancel this planned time off/training record?"
        );


      if (!confirmed) {
        return;
      }


      button.disabled = true;
      button.textContent =
        "Cancelling…";


      try {

        const {
          error
        } =
          await db.rpc(
            "cancel_officer_unavailability",
            {
              p_unavailability_id:
                id
            }
          );


        if (error) {
          throw error;
        }


        await loadRecords();


      } catch (error) {

        console.error(
          "SecureTrack cancellation error:",
          error
        );


        window.alert(
          error.message ||
          "The planned absence could not be cancelled."
        );


        button.disabled = false;
        button.textContent =
          "Cancel";

      }

    }
  );


  // =========================================================
  // SEARCH / FILTER EVENTS
  // =========================================================

  officerSearch.addEventListener(
    "input",
    renderOfficerPicker
  );


  shiftFilter.addEventListener(
    "change",
    renderOfficerPicker
  );


  reviewShift.addEventListener(
    "change",
    () => {
      renderAbsenceTable();
      updateCounts();
    }
  );


  reviewDate.addEventListener(
    "change",
    async () => {

      try {
        await loadRecords();
      } catch (error) {
        console.error(error);
      }

    }
  );


  startDate.addEventListener(
    "change",
    () => {

      if (
        !endDate.value ||
        endDate.value <
        startDate.value
      ) {

        endDate.value =
          startDate.value;

      }

    }
  );


  // =========================================================
  // INITIALIZE
  // =========================================================

  async function initialize() {

    try {

      officerPicker.innerHTML =
        `
          <div class="staffing-empty">
            Loading officers…
          </div>
        `;


      await loadSupervisors();

      populateShiftControls();

      await loadOfficers();

      await loadRecords();


    } catch (error) {

      console.error(
        "SecureTrack Time Off / Training initialization error:",
        error
      );


      /*
        IMPORTANT:
        Never leave the user looking at
        "Loading officers..." if an error
        actually occurred.
      */

      officerPicker.innerHTML =
        `
          <div class="staffing-empty">
            Unable to load officers.<br><br>
            ${escapeHTML(
              error.message ||
              "Unknown SecureTrack error."
            )}
          </div>
        `;


      absenceTableBody.innerHTML =
        `
          <tr>
            <td
              colspan="6"
              class="staffing-empty"
            >
              Unable to load planned absences.
            </td>
          </tr>
        `;


      showMessage(
        formMessage,
        error.message ||
        "Time Off & Training could not be loaded.",
        "error"
      );

    }

  }


  await initialize();


  // =========================================================
  // REALTIME
  // =========================================================

  db.channel(
    "securetrack-time-off-training"
  )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "officer_unavailability"
      },
      async () => {

        try {
          await loadRecords();
        } catch (error) {
          console.error(error);
        }

      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table:
          "officer_shift_roster"
      },
      async () => {

        try {
          await loadOfficers();
          await loadRecords();
        } catch (error) {
          console.error(error);
        }

      }
    )

    .subscribe();

})();
