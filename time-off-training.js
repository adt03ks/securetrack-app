(async function () {
  "use strict";

  // =========================================================
  // SECURETRACK
  // TIME OFF / TRAINING
  // COMMAND-AWARE MANAGEMENT
  // =========================================================

  const STM = window.SecureTrackManager;

  if (!STM) {
    console.error(
      "SecureTrackManager is not available."
    );
    return;
  }

  const manager =
    await STM.requireManager();

  if (!manager) {
    return;
  }

  const db = STM.db;

  const currentUserId =
    manager.session.user.id;

  const currentRoles =
    manager.roles || [];

  const isAdmin =
    currentRoles.includes("admin");

  const isDirector =
    currentRoles.includes("director");

  const systemWideAuthority =
    isAdmin || isDirector;

  const ALL_SHIFTS = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta"
  ];


  // =========================================================
  // ELEMENT HELPERS
  // =========================================================

  function byId(...ids) {

    for (const id of ids) {

      const element =
        document.getElementById(id);

      if (element) {
        return element;
      }

    }

    return null;
  }


  const elements = {

    logoutButton:
      byId("logoutButton"),

    managerName:
      byId(
        "managerName",
        "currentManagerName",
        "userName"
      ),

    search:
      byId(
        "officerSearch",
        "staffSearch",
        "availabilitySearch"
      ),

    shiftFilter:
      byId(
        "shiftFilter",
        "officerShiftFilter",
        "availabilityShiftFilter"
      ),

    officerList:
      byId(
        "officerList",
        "staffList",
        "availabilityOfficerList"
      ),

    selectedOfficerName:
      byId(
        "selectedOfficerName",
        "absenceOfficerName",
        "currentOfficerName"
      ),

    selectedEmployeeNumber:
      byId(
        "selectedEmployeeNumber",
        "officerEmployeeNumber"
      ),

    currentShift:
      byId(
        "currentShift",
        "normalShift",
        "selectedOfficerShift"
      ),

    normalShiftSelect:
      byId(
        "normalShiftSelect",
        "officerShift",
        "newShift"
      ),

    saveShiftButton:
      byId(
        "saveShiftButton",
        "updateShiftButton",
        "changeShiftButton"
      ),

    shiftMessage:
      byId(
        "shiftMessage",
        "normalShiftMessage"
      ),

    absenceForm:
      byId(
        "absenceForm",
        "unavailabilityForm"
      ),

    absenceType:
      byId(
        "absenceType",
        "unavailabilityType"
      ),

    startDate:
      byId(
        "startDate",
        "absenceStartDate"
      ),

    endDate:
      byId(
        "endDate",
        "absenceEndDate"
      ),

    absenceShift:
      byId(
        "absenceShift",
        "absenceShiftName"
      ),

    notes:
      byId(
        "absenceNotes",
        "unavailabilityNotes",
        "notes"
      ),

    saveAbsenceButton:
      byId(
        "saveAbsenceButton",
        "addUnavailabilityButton",
        "saveUnavailabilityButton"
      ),

    absenceMessage:
      byId(
        "absenceMessage",
        "unavailabilityMessage",
        "formMessage"
      ),

    reviewFromDate:
      byId(
        "reviewFromDate",
        "fromDate"
      ),

    reviewToDate:
      byId(
        "reviewToDate",
        "toDate"
      ),

    reviewShiftFilter:
      byId(
        "reviewShiftFilter",
        "recordShiftFilter"
      ),

    recordsBody:
      byId(
        "unavailabilityTableBody",
        "absenceTableBody",
        "reviewTableBody",
        "unavailabilityList",
        "absenceList"
      ),

    refreshButton:
      byId(
        "refreshButton",
        "refreshAvailabilityButton"
      ),

    officerCount:
      byId(
        "officerCount",
        "managedOfficerCount",
        "visibleOfficerCount"
      ),

    activeCount:
      byId(
        "activeAbsenceCount",
        "absenceCount",
        "unavailabilityCount"
      ),

    timeOffCount:
      byId("timeOffCount"),

    trainingCount:
      byId("trainingCount"),

    otherCount:
      byId("otherCount"),

    outTodayCount:
      byId(
        "outTodayCount",
        "officersOutCount",
        "outCount"
      )

  };


  // =========================================================
  // STATE
  // =========================================================

  const state = {

    supervisors: [],

    managedShifts: [],

    officers: [],

    records: [],

    selectedOfficer: null

  };


  // =========================================================
  // GENERAL HELPERS
  // =========================================================

  function escapeHTML(value) {

    return String(
      value ?? ""
    )
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  function humanize(value) {

    if (!value) {
      return "—";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, char =>
        char.toUpperCase()
      );

  }


  function localDateString(date) {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;

  }


  function addDays(
    dateString,
    numberOfDays
  ) {

    const date =
      new Date(
        `${dateString}T12:00:00`
      );

    date.setDate(
      date.getDate() +
      numberOfDays
    );

    return localDateString(date);

  }


  function formatDate(dateString) {

    if (!dateString) {
      return "—";
    }

    const date =
      new Date(
        `${dateString}T12:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString;
    }

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

    element.textContent =
      message;

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


  function getToday() {

    return localDateString(
      new Date()
    );

  }


  function recordCoversDate(
    record,
    date
  ) {

    return (
      record.start_date <= date &&
      record.end_date >= date
    );

  }


  // =========================================================
  // PAGE HEADER
  // =========================================================

  if (elements.managerName) {

    elements.managerName.textContent =
      manager.profile?.display_name ||
      manager.session.user.email ||
      "Manager";

  }


  if (elements.logoutButton) {

    elements.logoutButton
      .addEventListener(
        "click",
        async () => {

          elements.logoutButton.disabled =
            true;

          elements.logoutButton.textContent =
            "Signing Out…";

          await STM.signOut();

        }
      );

  }


  // =========================================================
  // DEFAULT DATE RANGE
  // =========================================================

  const today =
    getToday();

  if (
    elements.startDate &&
    !elements.startDate.value
  ) {

    elements.startDate.value =
      today;

  }


  if (
    elements.endDate &&
    !elements.endDate.value
  ) {

    elements.endDate.value =
      today;

  }


  if (
    elements.reviewFromDate &&
    !elements.reviewFromDate.value
  ) {

    elements.reviewFromDate.value =
      today;

  }


  if (
    elements.reviewToDate &&
    !elements.reviewToDate.value
  ) {

    elements.reviewToDate.value =
      addDays(
        today,
        90
      );

  }


  // =========================================================
  // LOAD SHIFT SUPERVISORS
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
      (data || [])
        .filter(row =>
          row.is_active !== false
        );


    if (systemWideAuthority) {

      state.managedShifts =
        [...ALL_SHIFTS];

    } else {

      state.managedShifts =
        state.supervisors
          .filter(row =>
            row.manager_user_id ===
            currentUserId
          )
          .map(row =>
            row.shift_name
          )
          .filter(
            shift =>
              ALL_SHIFTS.includes(
                shift
              )
          );

    }

  }


  // =========================================================
  // SHIFT DROPDOWN OPTIONS
  // =========================================================

  function setShiftOptions(
    select,
    includeAllOption = true
  ) {

    if (!select) {
      return;
    }

    const previousValue =
      select.value;


    const permittedShifts =
      systemWideAuthority
        ? ALL_SHIFTS
        : state.managedShifts;


    select.innerHTML = "";


    if (includeAllOption) {

      const all =
        document.createElement(
          "option"
        );

      all.value = "";

      all.textContent =
        systemWideAuthority
          ? "All Shifts"
          : "All Managed Shifts";

      select.appendChild(all);

    }


    permittedShifts
      .forEach(shift => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          shift;

        option.textContent =
          shift;

        select.appendChild(
          option
        );

      });


    if (
      [...select.options]
        .some(
          option =>
            option.value ===
            previousValue
        )
    ) {

      select.value =
        previousValue;

    }

  }


  // =========================================================
  // LOAD OFFICER DIRECTORY
  // =========================================================

  async function loadOfficers() {

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


    let officers =
      data || [];


    /*
      get_officer_directory also allows
      managers to see certain incoming
      transfer records.

      Time Off / Training is stricter:
      managers may manage only officers
      CURRENTLY assigned to their command.
    */

    if (!systemWideAuthority) {

      officers =
        officers.filter(
          officer =>
            officer.shift_name &&
            state.managedShifts.includes(
              officer.shift_name
            )
        );

    }


    officers.sort(
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


    state.officers =
      officers;


    if (
      state.selectedOfficer
    ) {

      state.selectedOfficer =
        state.officers.find(
          officer =>
            officer.user_id ===
            state.selectedOfficer.user_id
        ) ||
        null;

    }


    renderOfficerList();

    renderSelectedOfficer();

    updateCounts();

  }


  // =========================================================
  // FILTER OFFICERS
  // =========================================================

  function getFilteredOfficers() {

    const search =
      String(
        elements.search?.value ||
        ""
      )
        .trim()
        .toLowerCase();


    const shift =
      elements.shiftFilter?.value ||
      "";


    return state.officers.filter(
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


        const haystack =
          [
            officer.display_name,
            officer.first_name,
            officer.last_name,
            officer.nickname,
            officer.employee_number,
            officer.shift_name
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return haystack.includes(
          search
        );

      }
    );

  }


  // =========================================================
  // OFFICER CURRENT ABSENCE
  // =========================================================

  function getOfficerCurrentRecord(
    officerId
  ) {

    return state.records.find(
      record =>
        record.user_id ===
          officerId &&
        recordCoversDate(
          record,
          today
        )
    );

  }


  // =========================================================
  // RENDER OFFICER LIST
  // =========================================================

  function renderOfficerList() {

    if (!elements.officerList) {
      return;
    }


    const officers =
      getFilteredOfficers();


    elements.officerList.innerHTML =
      "";


    if (!officers.length) {

      elements.officerList.innerHTML =
        `
          <div class="directory-empty">
            No officers match the current filters.
          </div>
        `;

      return;

    }


    officers.forEach(
      officer => {

        const activeRecord =
          getOfficerCurrentRecord(
            officer.user_id
          );


        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "officer-row";


        if (
          state.selectedOfficer?.user_id ===
          officer.user_id
        ) {

          button.classList.add(
            "selected"
          );

        }


        button.innerHTML =
          `
            <div class="officer-main">

              <div class="officer-name">
                ${escapeHTML(
                  officer.display_name ||
                  "Officer"
                )}
              </div>

              <div class="officer-meta">

                ${
                  officer.employee_number
                    ? `#${escapeHTML(
                        officer.employee_number
                      )} • `
                    : ""
                }

                ${
                  escapeHTML(
                    officer.shift_name ||
                    "Unassigned"
                  )
                }

              </div>

              ${
                activeRecord
                  ? `
                    <div class="subtle">
                      OUT:
                      ${escapeHTML(
                        humanize(
                          activeRecord.absence_type
                        )
                      )}
                      ${
                        activeRecord.notes
                          ? ` — ${escapeHTML(
                              activeRecord.notes
                            )}`
                          : ""
                      }
                    </div>
                  `
                  : ""
              }

            </div>
          `;


        button.addEventListener(
          "click",
          () => {

            state.selectedOfficer =
              officer;

            renderOfficerList();

            renderSelectedOfficer();

            clearMessage(
              elements.absenceMessage
            );

            clearMessage(
              elements.shiftMessage
            );

          }
        );


        elements.officerList
          .appendChild(
            button
          );

      }
    );

  }


  // =========================================================
  // RENDER SELECTED OFFICER
  // =========================================================

  function renderSelectedOfficer() {

    const officer =
      state.selectedOfficer;


    if (
      elements.selectedOfficerName
    ) {

      elements.selectedOfficerName
        .textContent =
          officer?.display_name ||
          "Select an officer";

    }


    if (
      elements.selectedEmployeeNumber
    ) {

      elements.selectedEmployeeNumber
        .textContent =
          officer?.employee_number
            ? `#${officer.employee_number}`
            : "—";

    }


    if (
      elements.currentShift
    ) {

      elements.currentShift
        .textContent =
          officer?.shift_name ||
          "Unassigned";

    }


    if (
      elements.absenceShift
    ) {

      if (
        elements.absenceShift
          .tagName ===
        "SELECT"
      ) {

        elements.absenceShift
          .innerHTML = "";

        const option =
          document.createElement(
            "option"
          );

        option.value =
          officer?.shift_name ||
          "";

        option.textContent =
          officer?.shift_name ||
          "Unassigned";

        elements.absenceShift
          .appendChild(
            option
          );

      } else {

        elements.absenceShift.value =
          officer?.shift_name ||
          "";

        elements.absenceShift
          .textContent =
          officer?.shift_name ||
          "Unassigned";

      }

    }


    renderNormalShiftControls();

  }


  // =========================================================
  // OPTIONAL NORMAL SHIFT CONTROLS
  // =========================================================

  function renderNormalShiftControls() {

    if (
      !elements.normalShiftSelect
    ) {
      return;
    }


    const officer =
      state.selectedOfficer;


    elements.normalShiftSelect
      .innerHTML = "";


    const permitted =
      systemWideAuthority
        ? ALL_SHIFTS
        : state.managedShifts;


    permitted.forEach(
      shift => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          shift;

        option.textContent =
          shift;

        elements.normalShiftSelect
          .appendChild(
            option
          );

      }
    );


    if (
      officer &&
      permitted.includes(
        officer.shift_name
      )
    ) {

      elements.normalShiftSelect.value =
        officer.shift_name;

    }


    if (
      elements.saveShiftButton
    ) {

      elements.saveShiftButton.disabled =
        !officer;

    }

  }


  // =========================================================
  // CHANGE NORMAL SHIFT
  // =========================================================

  if (
    elements.saveShiftButton &&
    elements.normalShiftSelect
  ) {

    elements.saveShiftButton
      .addEventListener(
        "click",
        async () => {

          const officer =
            state.selectedOfficer;


          if (!officer) {

            showMessage(
              elements.shiftMessage,
              "Select an officer first.",
              "error"
            );

            return;

          }


          const destination =
            elements.normalShiftSelect
              .value;


          if (!destination) {

            showMessage(
              elements.shiftMessage,
              "Select a shift.",
              "error"
            );

            return;

          }


          elements.saveShiftButton
            .disabled =
              true;


          try {

            const {
              error
            } =
              await db.rpc(
                "set_officer_shift",
                {
                  p_user_id:
                    officer.user_id,

                  p_shift_name:
                    destination
                }
              );


            if (error) {
              throw error;
            }


            showMessage(
              elements.shiftMessage,
              `Shift updated to ${destination}.`
            );


            await loadOfficers();


          } catch (error) {

            console.error(
              "SecureTrack shift update error:",
              error
            );


            showMessage(
              elements.shiftMessage,
              error.message ||
              "Shift could not be updated.",
              "error"
            );


          } finally {

            elements.saveShiftButton
              .disabled =
                false;

          }

        }
      );

  }


  // =========================================================
  // LOAD UNAVAILABILITY
  // =========================================================

  async function loadRecords() {

    const fromDate =
      elements.reviewFromDate?.value ||
      today;


    const toDate =
      elements.reviewToDate?.value ||
      addDays(
        today,
        90
      );


    const {
      data,
      error
    } =
      await db.rpc(
        "get_managed_unavailability",
        {
          p_from_date:
            fromDate,

          p_to_date:
            toDate,

          /*
            Load all records available to
            this manager.

            Filtering by shift happens
            in the browser after the
            secure RPC has already scoped
            the command.
          */
          p_shift_name:
            null
        }
      );


    if (error) {

      throw error;

    }


    state.records =
      data || [];


    renderRecords();

    renderOfficerList();

    updateCounts();

  }


  // =========================================================
  // FILTER RECORDS
  // =========================================================

  function getFilteredRecords() {

    const shift =
      elements.reviewShiftFilter?.value ||
      elements.shiftFilter?.value ||
      "";


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
  // RENDER UNAVAILABILITY
  // =========================================================

  function renderRecords() {

    if (!elements.recordsBody) {
      return;
    }


    const records =
      getFilteredRecords();


    elements.recordsBody.innerHTML =
      "";


    if (!records.length) {

      if (
        elements.recordsBody.tagName ===
        "TBODY"
      ) {

        elements.recordsBody.innerHTML =
          `
            <tr>
              <td colspan="7">
                No active time-off or training records
                were found for this period.
              </td>
            </tr>
          `;

      } else {

        elements.recordsBody.innerHTML =
          `
            <div class="directory-empty">
              No active time-off or training records
              were found for this period.
            </div>
          `;

      }

      return;

    }


    records.forEach(
      record => {

        if (
          elements.recordsBody.tagName ===
          "TBODY"
        ) {

          const row =
            document.createElement(
              "tr"
            );


          row.innerHTML =
            `
              <td>
                <strong>
                  ${escapeHTML(
                    record.display_name
                  )}
                </strong>

                ${
                  record.employee_number
                    ? `<div class="subtle">
                        #${escapeHTML(
                          record.employee_number
                        )}
                       </div>`
                    : ""
                }
              </td>

              <td>
                ${escapeHTML(
                  record.shift_name ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHTML(
                  humanize(
                    record.absence_type
                  )
                )}
              </td>

              <td>
                ${escapeHTML(
                  formatDate(
                    record.start_date
                  )
                )}
              </td>

              <td>
                ${escapeHTML(
                  formatDate(
                    record.end_date
                  )
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
                  class="back-link cancel-unavailability"
                  data-unavailability-id="${escapeHTML(
                    record.unavailability_id
                  )}"
                >
                  Cancel
                </button>
              </td>
            `;


          elements.recordsBody
            .appendChild(
              row
            );


        } else {

          const card =
            document.createElement(
              "article"
            );

          card.className =
            "activity-item";


          card.innerHTML =
            `
              <div>

                <strong>
                  ${escapeHTML(
                    record.display_name
                  )}
                </strong>

                <span class="shift-pill">
                  ${escapeHTML(
                    record.shift_name ||
                    "—"
                  )}
                </span>

              </div>

              <div>
                ${escapeHTML(
                  humanize(
                    record.absence_type
                  )
                )}
              </div>

              <div class="subtle">
                ${escapeHTML(
                  formatDate(
                    record.start_date
                  )
                )}
                →
                ${escapeHTML(
                  formatDate(
                    record.end_date
                  )
                )}
              </div>

              ${
                record.notes
                  ? `
                    <div class="subtle">
                      ${escapeHTML(
                        record.notes
                      )}
                    </div>
                  `
                  : ""
              }

              <button
                type="button"
                class="back-link cancel-unavailability"
                data-unavailability-id="${escapeHTML(
                  record.unavailability_id
                )}"
              >
                Cancel Planned Absence
              </button>
            `;


          elements.recordsBody
            .appendChild(
              card
            );

        }

      }
    );

  }


  // =========================================================
  // CANCEL UNAVAILABILITY
  // =========================================================

  if (elements.recordsBody) {

    elements.recordsBody
      .addEventListener(
        "click",
        async event => {

          const button =
            event.target.closest(
              ".cancel-unavailability"
            );


          if (!button) {
            return;
          }


          const id =
            button.dataset
              .unavailabilityId;


          if (!id) {
            return;
          }


          const confirmed =
            window.confirm(
              "Cancel this planned time-off/training record?"
            );


          if (!confirmed) {
            return;
          }


          button.disabled =
            true;

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
              "The record could not be cancelled."
            );


            button.disabled =
              false;

            button.textContent =
              "Cancel";

          }

        }
      );

  }


  // =========================================================
  // CREATE TIME OFF / TRAINING
  // =========================================================

  async function submitAbsence(
    event
  ) {

    event?.preventDefault();


    clearMessage(
      elements.absenceMessage
    );


    const officer =
      state.selectedOfficer;


    if (!officer) {

      showMessage(
        elements.absenceMessage,
        "Select an officer first.",
        "error"
      );

      return;

    }


    const absenceType =
      elements.absenceType?.value ||
      "";


    const startDate =
      elements.startDate?.value ||
      "";


    const endDate =
      elements.endDate?.value ||
      "";


    const notes =
      String(
        elements.notes?.value ||
        ""
      ).trim();


    if (
      ![
        "time_off",
        "training",
        "other"
      ].includes(
        absenceType
      )
    ) {

      showMessage(
        elements.absenceMessage,
        "Select Time Off, Training, or Other.",
        "error"
      );

      return;

    }


    if (
      !startDate ||
      !endDate
    ) {

      showMessage(
        elements.absenceMessage,
        "Enter both the start and end dates.",
        "error"
      );

      return;

    }


    if (
      endDate <
      startDate
    ) {

      showMessage(
        elements.absenceMessage,
        "The end date cannot be before the start date.",
        "error"
      );

      return;

    }


    if (
      !systemWideAuthority &&
      !officer.shift_name
    ) {

      showMessage(
        elements.absenceMessage,
        "The officer must have a shift assignment before planned unavailability can be recorded.",
        "error"
      );

      return;

    }


    if (
      elements.saveAbsenceButton
    ) {

      elements.saveAbsenceButton
        .disabled =
          true;

      elements.saveAbsenceButton
        .textContent =
          "Saving…";

    }


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
              absenceType,

            p_start_date:
              startDate,

            p_end_date:
              endDate,

            p_shift_name:
              officer.shift_name ||
              null,

            p_notes:
              notes ||
              null
          }
        );


      if (error) {
        throw error;
      }


      showMessage(
        elements.absenceMessage,
        `${humanize(
          absenceType
        )} recorded for ${officer.display_name}.`
      );


      if (elements.notes) {

        elements.notes.value =
          "";

      }


      await loadRecords();


    } catch (error) {

      console.error(
        "SecureTrack time-off/training save error:",
        error
      );


      showMessage(
        elements.absenceMessage,
        error.message ||
        "The record could not be saved.",
        "error"
      );


    } finally {

      if (
        elements.saveAbsenceButton
      ) {

        elements.saveAbsenceButton
          .disabled =
            false;

        elements.saveAbsenceButton
          .textContent =
            "Save";

      }

    }

  }


  if (elements.absenceForm) {

    elements.absenceForm
      .addEventListener(
        "submit",
        submitAbsence
      );

  } else if (
    elements.saveAbsenceButton
  ) {

    elements.saveAbsenceButton
      .addEventListener(
        "click",
        submitAbsence
      );

  }


  // =========================================================
  // COUNTS
  // =========================================================

  function updateCounts() {

    const records =
      getFilteredRecords();


    if (elements.officerCount) {

      elements.officerCount
        .textContent =
          getFilteredOfficers()
            .length;

    }


    if (elements.activeCount) {

      elements.activeCount
        .textContent =
          records.length;

    }


    if (elements.timeOffCount) {

      elements.timeOffCount
        .textContent =
          records.filter(
            record =>
              record.absence_type ===
              "time_off"
          ).length;

    }


    if (elements.trainingCount) {

      elements.trainingCount
        .textContent =
          records.filter(
            record =>
              record.absence_type ===
              "training"
          ).length;

    }


    if (elements.otherCount) {

      elements.otherCount
        .textContent =
          records.filter(
            record =>
              record.absence_type ===
              "other"
          ).length;

    }


    if (elements.outTodayCount) {

      const uniqueOfficers =
        new Set(
          records
            .filter(record =>
              recordCoversDate(
                record,
                today
              )
            )
            .map(record =>
              record.user_id
            )
        );


      elements.outTodayCount
        .textContent =
          uniqueOfficers.size;

    }

  }


  // =========================================================
  // FILTER EVENTS
  // =========================================================

  if (elements.search) {

    elements.search
      .addEventListener(
        "input",
        () => {

          renderOfficerList();

          updateCounts();

        }
      );

  }


  if (elements.shiftFilter) {

    elements.shiftFilter
      .addEventListener(
        "change",
        () => {

          renderOfficerList();

          renderRecords();

          updateCounts();

        }
      );

  }


  if (
    elements.reviewShiftFilter
  ) {

    elements.reviewShiftFilter
      .addEventListener(
        "change",
        () => {

          renderRecords();

          updateCounts();

        }
      );

  }


  if (
    elements.reviewFromDate
  ) {

    elements.reviewFromDate
      .addEventListener(
        "change",
        loadRecords
      );

  }


  if (
    elements.reviewToDate
  ) {

    elements.reviewToDate
      .addEventListener(
        "change",
        loadRecords
      );

  }


  if (
    elements.startDate &&
    elements.endDate
  ) {

    elements.startDate
      .addEventListener(
        "change",
        () => {

          if (
            !elements.endDate.value ||
            elements.endDate.value <
            elements.startDate.value
          ) {

            elements.endDate.value =
              elements.startDate.value;

          }

        }
      );

  }


  // =========================================================
  // REFRESH
  // =========================================================

  async function refreshAll() {

    try {

      if (
        elements.refreshButton
      ) {

        elements.refreshButton
          .disabled =
            true;

      }


      await loadSupervisors();


      setShiftOptions(
        elements.shiftFilter,
        true
      );


      setShiftOptions(
        elements.reviewShiftFilter,
        true
      );


      await loadOfficers();

      await loadRecords();


    } catch (error) {

      console.error(
        "SecureTrack Time Off / Training initialization error:",
        error
      );


      showMessage(
        elements.absenceMessage,
        error.message ||
        "Time Off / Training could not be loaded.",
        "error"
      );


    } finally {

      if (
        elements.refreshButton
      ) {

        elements.refreshButton
          .disabled =
            false;

      }

    }

  }


  if (
    elements.refreshButton
  ) {

    elements.refreshButton
      .addEventListener(
        "click",
        refreshAll
      );

  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  await refreshAll();


  // =========================================================
  // REALTIME REFRESH
  // =========================================================

  db.channel(
    "securetrack-time-off-training"
  )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "officer_unavailability"
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
        table: "officer_shift_roster"
      },
      async () => {

        try {
          await loadOfficers();
        } catch (error) {
          console.error(error);
        }

      }
    )
    .subscribe();

})();
