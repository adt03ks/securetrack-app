(async function () {

  "use strict";


  // =========================================================
  // SECURETRACK MANAGER AUTH
  // =========================================================

  const STM =
    window.SecureTrackManager;

  if (!STM) {

    console.error(
      "SecureTrack Manager authentication is not available."
    );

    return;

  }


  const manager =
    await STM.requireManager();

  if (!manager) {
    return;
  }


  const db =
    STM.db;


  // =========================================================
  // PAGE ELEMENTS
  // =========================================================

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  const officerSearch =
    document.getElementById(
      "officerSearch"
    );

  const shiftFilter =
    document.getElementById(
      "shiftFilter"
    );

  const officerPicker =
    document.getElementById(
      "officerPicker"
    );

  const selectedOfficer =
    document.getElementById(
      "selectedOfficer"
    );

  const selectedOfficerName =
    document.getElementById(
      "selectedOfficerName"
    );

  const selectedOfficerDetails =
    document.getElementById(
      "selectedOfficerDetails"
    );


  const unavailabilityForm =
    document.getElementById(
      "unavailabilityForm"
    );

  const absenceType =
    document.getElementById(
      "absenceType"
    );

  const startDate =
    document.getElementById(
      "startDate"
    );

  const endDate =
    document.getElementById(
      "endDate"
    );

  const absenceShift =
    document.getElementById(
      "absenceShift"
    );

  const absenceNotes =
    document.getElementById(
      "absenceNotes"
    );

  const saveAbsenceButton =
    document.getElementById(
      "saveAbsenceButton"
    );

  const formMessage =
    document.getElementById(
      "formMessage"
    );


  const reviewDate =
    document.getElementById(
      "reviewDate"
    );

  const reviewShift =
    document.getElementById(
      "reviewShift"
    );

  const outCount =
    document.getElementById(
      "outCount"
    );

  const trainingCount =
    document.getElementById(
      "trainingCount"
    );

  const timeOffCount =
    document.getElementById(
      "timeOffCount"
    );

  const absenceTableBody =
    document.getElementById(
      "absenceTableBody"
    );


  const rosterOfficer =
    document.getElementById(
      "rosterOfficer"
    );

  const rosterShift =
    document.getElementById(
      "rosterShift"
    );

  const knownShiftNames =
    document.getElementById(
      "knownShiftNames"
    );

  const saveRosterButton =
    document.getElementById(
      "saveRosterButton"
    );

  const rosterMessage =
    document.getElementById(
      "rosterMessage"
    );


  // =========================================================
  // STATE
  // =========================================================

  let staff = [];

  let roster = [];

  let absences = [];

  let shiftNames = [];

  let selectedOfficerId =
    null;


  // =========================================================
  // HELPERS
  // =========================================================

  function todayLocal() {

    const date =
      new Date();

    const offset =
      date.getTimezoneOffset();

    return new Date(
      date.getTime() -
      offset * 60000
    )
      .toISOString()
      .slice(0, 10);

  }


  function normalizeText(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  function titleCaseType(value) {

    switch (value) {

      case "time_off":
        return "Time Off";

      case "training":
        return "Training";

      case "other":
        return "Other";

      default:
        return value || "—";

    }

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }

    const parts =
      value.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const date =
      new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
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


  function formatDateRange(
    start,
    end
  ) {

    if (!start) {
      return "—";
    }

    if (
      !end ||
      start === end
    ) {

      return formatDate(start);

    }

    return (
      `${formatDate(start)} – ` +
      `${formatDate(end)}`
    );

  }


  function getRosterForUser(
    userId
  ) {

    return roster.find(
      row =>
        row.user_id === userId &&
        row.is_active !== false
    ) || null;

  }


  function getStaffMember(
    userId
  ) {

    return staff.find(
      person =>
        person.id === userId
    ) || null;

  }


  function showMessage(
    element,
    message,
    type = "success"
  ) {

    element.textContent =
      message;

    element.className =
      `staffing-message show ${type}`;

  }


  function clearMessage(
    element
  ) {

    element.textContent =
      "";

    element.className =
      "staffing-message";

  }


  // =========================================================
  // LOAD ELIGIBLE STAFF
  // =========================================================

  async function loadStaff() {

    /*
      Use the same operational roles as
      Duty Station Assignment.
    */

    const {
      data: roleRows,
      error: roleError
    } =
      await db
        .from("user_roles")
        .select("user_id, role");


    if (roleError) {
      throw roleError;
    }


    const operationalRoles =
      new Set([
        "officer",
        "dispatcher",
        "senior_officer",
        "team_lead"
      ]);


    const allowedIds =
      new Set(
        (roleRows || [])
          .filter(
            row =>
              operationalRoles.has(
                row.role
              )
          )
          .map(
            row =>
              row.user_id
          )
      );


    if (!allowedIds.size) {

      staff = [];

      renderOfficerPicker();
      renderRosterOfficerSelect();

      return;

    }


    const {
      data: profileRows,
      error: profileError
    } =
      await db
        .from("profiles")
        .select(
          "id, display_name, employee_number, email, is_active"
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "display_name"
        );


    if (profileError) {
      throw profileError;
    }


    staff =
      (profileRows || [])
        .filter(
          person =>
            allowedIds.has(
              person.id
            )
        )
        .sort(
          (a, b) =>
            String(
              a.display_name || ""
            )
              .localeCompare(
                String(
                  b.display_name || ""
                )
              )
        );


    renderOfficerPicker();

    renderRosterOfficerSelect();

  }


  // =========================================================
  // LOAD NORMAL SHIFT ROSTER
  // =========================================================

  async function loadRoster() {

    const {
      data,
      error
    } =
      await db
        .from(
          "officer_shift_roster"
        )
        .select(
          "user_id, shift_name, is_active, updated_at"
        );


    if (error) {
      throw error;
    }


    roster =
      data || [];

  }


  // =========================================================
  // DISCOVER KNOWN SHIFT NAMES
  // =========================================================

  async function loadShiftNames() {

    const names =
      new Set();


    /*
      First pull any shifts managers have
      assigned to officers.
    */

    roster.forEach(
      row => {

        if (
          row.is_active !== false &&
          row.shift_name
        ) {

          names.add(
            row.shift_name.trim()
          );

        }

      }
    );


    /*
      Also attempt to use historical
      Shift Operations names.

      If the current database policy does
      not allow this read, the page still
      works using roster shift names.
    */

    try {

      const {
        data,
        error
      } =
        await db
          .from(
            "shift_instances"
          )
          .select(
            "shift_name"
          );


      if (!error) {

        (data || [])
          .forEach(
            row => {

              if (row.shift_name) {

                names.add(
                  row.shift_name.trim()
                );

              }

            }
          );

      }

    } catch (error) {

      console.warn(
        "Existing shift names could not be loaded:",
        error
      );

    }


    /*
      Existing active absence records may
      contain additional shift names.
    */

    absences.forEach(
      row => {

        if (row.shift_name) {

          names.add(
            row.shift_name.trim()
          );

        }

      }
    );


    shiftNames =
      [...names]
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.localeCompare(b)
        );


    renderShiftOptions();

  }


  // =========================================================
  // RENDER SHIFT FILTERS / OPTIONS
  // =========================================================

  function renderShiftOptions() {

    const currentFilter =
      shiftFilter.value;

    const currentAbsence =
      absenceShift.value;

    const currentReview =
      reviewShift.value;


    shiftFilter.innerHTML =
      "";

    absenceShift.innerHTML =
      "";

    reviewShift.innerHTML =
      "";

    knownShiftNames.innerHTML =
      "";


    const filterAll =
      document.createElement(
        "option"
      );

    filterAll.value =
      "";

    filterAll.textContent =
      "All Shifts";

    shiftFilter.appendChild(
      filterAll
    );


    const absenceAll =
      document.createElement(
        "option"
      );

    absenceAll.value =
      "";

    absenceAll.textContent =
      "All / Any Shift";

    absenceShift.appendChild(
      absenceAll
    );


    const reviewAll =
      document.createElement(
        "option"
      );

    reviewAll.value =
      "";

    reviewAll.textContent =
      "All Shifts";

    reviewShift.appendChild(
      reviewAll
    );


    shiftNames.forEach(
      shiftName => {

        const filterOption =
          document.createElement(
            "option"
          );

        filterOption.value =
          shiftName;

        filterOption.textContent =
          shiftName;

        shiftFilter.appendChild(
          filterOption
        );


        const absenceOption =
          document.createElement(
            "option"
          );

        absenceOption.value =
          shiftName;

        absenceOption.textContent =
          shiftName;

        absenceShift.appendChild(
          absenceOption
        );


        const reviewOption =
          document.createElement(
            "option"
          );

        reviewOption.value =
          shiftName;

        reviewOption.textContent =
          shiftName;

        reviewShift.appendChild(
          reviewOption
        );


        const dataOption =
          document.createElement(
            "option"
          );

        dataOption.value =
          shiftName;

        knownShiftNames.appendChild(
          dataOption
        );

      }
    );


    if (
      [...shiftFilter.options]
        .some(
          option =>
            option.value === currentFilter
        )
    ) {

      shiftFilter.value =
        currentFilter;

    }


    if (
      [...absenceShift.options]
        .some(
          option =>
            option.value === currentAbsence
        )
    ) {

      absenceShift.value =
        currentAbsence;

    }


    if (
      [...reviewShift.options]
        .some(
          option =>
            option.value === currentReview
        )
    ) {

      reviewShift.value =
        currentReview;

    }


    renderOfficerPicker();

  }


  // =========================================================
  // OFFICER PICKER
  // =========================================================

  function renderOfficerPicker() {

    officerPicker.innerHTML =
      "";


    const search =
      normalizeText(
        officerSearch.value
      );

    const selectedShift =
      normalizeText(
        shiftFilter.value
      );


    const filtered =
      staff.filter(
        person => {

          const rosterRow =
            getRosterForUser(
              person.id
            );

          const personName =
            normalizeText(
              person.display_name
            );

          const employeeNumber =
            normalizeText(
              person.employee_number
            );

          const matchesSearch =
            !search ||
            personName.includes(
              search
            ) ||
            employeeNumber.includes(
              search
            );


          const matchesShift =
            !selectedShift ||
            normalizeText(
              rosterRow?.shift_name
            ) === selectedShift;


          return (
            matchesSearch &&
            matchesShift
          );

        }
      );


    if (!filtered.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "staffing-empty";

      empty.textContent =
        "No officers match the current search and shift filter.";

      officerPicker.appendChild(
        empty
      );

      return;

    }


    filtered.forEach(
      person => {

        const rosterRow =
          getRosterForUser(
            person.id
          );


        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "officer-option";


        if (
          selectedOfficerId ===
          person.id
        ) {

          button.classList.add(
            "selected"
          );

        }


        const name =
          document.createElement(
            "strong"
          );

        name.textContent =
          person.display_name ||
          "SecureTrack Officer";


        const details =
          document.createElement(
            "small"
          );


        const detailParts =
          [];


        if (
          person.employee_number
        ) {

          detailParts.push(
            `Employee # ${person.employee_number}`
          );

        }


        if (
          rosterRow?.shift_name
        ) {

          detailParts.push(
            rosterRow.shift_name
          );

        } else {

          detailParts.push(
            "Shift not assigned"
          );

        }


        details.textContent =
          detailParts.join(
            " • "
          );


        button.append(
          name,
          details
        );


        button.addEventListener(
          "click",
          () => {

            selectOfficer(
              person.id
            );

          }
        );


        officerPicker.appendChild(
          button
        );

      }
    );

  }


  // =========================================================
  // SELECT OFFICER
  // =========================================================

  function selectOfficer(
    userId
  ) {

    const person =
      getStaffMember(
        userId
      );


    if (!person) {
      return;
    }


    selectedOfficerId =
      userId;


    const rosterRow =
      getRosterForUser(
        userId
      );


    selectedOfficerName.textContent =
      person.display_name ||
      "SecureTrack Officer";


    const detailParts =
      [];


    if (
      person.employee_number
    ) {

      detailParts.push(
        `Employee # ${person.employee_number}`
      );

    }


    detailParts.push(
      rosterRow?.shift_name ||
      "Normal shift not assigned"
    );


    selectedOfficerDetails.textContent =
      detailParts.join(
        " • "
      );


    selectedOfficer.hidden =
      false;


    /*
      If the officer has a normal shift and
      the manager has not already selected
      another shift, prefill that shift.
    */

    if (
      rosterRow?.shift_name &&
      [...absenceShift.options]
        .some(
          option =>
            option.value ===
            rosterRow.shift_name
        )
    ) {

      absenceShift.value =
        rosterRow.shift_name;

    }


    rosterOfficer.value =
      userId;


    rosterShift.value =
      rosterRow?.shift_name ||
      "";


    renderOfficerPicker();

  }


  // =========================================================
  // ROSTER OFFICER DROPDOWN
  // =========================================================

  function renderRosterOfficerSelect() {

    const current =
      rosterOfficer.value;


    rosterOfficer.innerHTML =
      "";


    const placeholder =
      document.createElement(
        "option"
      );

    placeholder.value =
      "";

    placeholder.textContent =
      "Select officer";

    rosterOfficer.appendChild(
      placeholder
    );


    staff.forEach(
      person => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          person.id;

        option.textContent =
          person.display_name ||
          "SecureTrack Officer";

        rosterOfficer.appendChild(
          option
        );

      }
    );


    if (
      staff.some(
        person =>
          person.id === current
      )
    ) {

      rosterOfficer.value =
        current;

    }

  }


  // =========================================================
  // LOAD ACTIVE ABSENCES
  // =========================================================

  async function loadAbsences() {

    const {
      data,
      error
    } =
      await db
        .from(
          "officer_unavailability"
        )
        .select(
          "id, user_id, absence_type, start_date, end_date, shift_name, notes, status, created_at"
        )
        .eq(
          "status",
          "active"
        )
        .order(
          "start_date",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    absences =
      data || [];


    renderAbsenceReview();

  }


  // =========================================================
  // REVIEW FILTER
  // =========================================================

  function absenceAppliesToReview(
    absence
  ) {

    const date =
      reviewDate.value;

    const shift =
      normalizeText(
        reviewShift.value
      );


    if (!date) {
      return true;
    }


    const dateMatches =
      date >= absence.start_date &&
      date <= absence.end_date;


    if (!dateMatches) {
      return false;
    }


    /*
      An absence with no shift selected
      applies to every shift.
    */

    const absenceShiftName =
      normalizeText(
        absence.shift_name
      );


    const shiftMatches =
      !shift ||
      !absenceShiftName ||
      shift === absenceShiftName;


    return shiftMatches;

  }


  // =========================================================
  // RENDER ABSENCE REVIEW
  // =========================================================

  function renderAbsenceReview() {

    absenceTableBody.innerHTML =
      "";


    const filtered =
      absences.filter(
        absence =>
          absenceAppliesToReview(
            absence
          )
      );


    /*
      Count officers, not records.

      If someone somehow has overlapping
      active records on the same date,
      the "Officers Out" total should
      still count that person once.
    */

    const uniqueOut =
      new Set(
        filtered.map(
          row =>
            row.user_id
        )
      );


    const uniqueTraining =
      new Set(
        filtered
          .filter(
            row =>
              row.absence_type ===
              "training"
          )
          .map(
            row =>
              row.user_id
          )
      );


    const uniqueTimeOff =
      new Set(
        filtered
          .filter(
            row =>
              row.absence_type ===
              "time_off"
          )
          .map(
            row =>
              row.user_id
          )
      );


    outCount.textContent =
      String(
        uniqueOut.size
      );


    trainingCount.textContent =
      String(
        uniqueTraining.size
      );


    timeOffCount.textContent =
      String(
        uniqueTimeOff.size
      );


    if (!filtered.length) {

      const tr =
        document.createElement(
          "tr"
        );

      const td =
        document.createElement(
          "td"
        );

      td.colSpan =
        6;

      td.className =
        "staffing-empty";

      td.textContent =
        "No planned absences match this date and shift.";

      tr.appendChild(
        td
      );

      absenceTableBody.appendChild(
        tr
      );

      return;

    }


    filtered.forEach(
      absence => {

        const person =
          getStaffMember(
            absence.user_id
          );


        const tr =
          document.createElement(
            "tr"
          );


        // Officer
        const officerTd =
          document.createElement(
            "td"
          );

        const officerName =
          document.createElement(
            "strong"
          );

        officerName.textContent =
          person?.display_name ||
          "SecureTrack Officer";

        officerTd.appendChild(
          officerName
        );


        if (
          person?.employee_number
        ) {

          const employee =
            document.createElement(
              "div"
            );

          employee.className =
            "subtle";

          employee.textContent =
            `Employee # ${person.employee_number}`;

          officerTd.appendChild(
            employee
          );

        }


        // Type
        const typeTd =
          document.createElement(
            "td"
          );

        const badge =
          document.createElement(
            "span"
          );

        badge.className =
          `absence-type ${absence.absence_type}`;

        badge.textContent =
          titleCaseType(
            absence.absence_type
          );

        typeTd.appendChild(
          badge
        );


        // Dates
        const dateTd =
          document.createElement(
            "td"
          );

        dateTd.textContent =
          formatDateRange(
            absence.start_date,
            absence.end_date
          );


        // Shift
        const shiftTd =
          document.createElement(
            "td"
          );

        shiftTd.textContent =
          absence.shift_name ||
          "Any Shift";


        // Notes
        const notesTd =
          document.createElement(
            "td"
          );

        notesTd.textContent =
          absence.notes ||
          "—";


        // Action
        const actionTd =
          document.createElement(
            "td"
          );

        const cancelButton =
          document.createElement(
            "button"
          );

        cancelButton.type =
          "button";

        cancelButton.className =
          "small-button danger";

        cancelButton.textContent =
          "Cancel Entry";


        cancelButton.addEventListener(
          "click",
          () => {

            cancelAbsence(
              absence
            );

          }
        );


        actionTd.appendChild(
          cancelButton
        );


        tr.append(
          officerTd,
          typeTd,
          dateTd,
          shiftTd,
          notesTd,
          actionTd
        );


        absenceTableBody.appendChild(
          tr
        );

      }
    );

  }


  // =========================================================
  // SAVE TIME OFF / TRAINING
  // =========================================================

  unavailabilityForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearMessage(
        formMessage
      );


      if (!selectedOfficerId) {

        showMessage(
          formMessage,
          "Select an officer before marking the officer out.",
          "error"
        );

        officerSearch.focus();

        return;

      }


      if (!absenceType.value) {

        showMessage(
          formMessage,
          "Select Time Off, Training, or Other.",
          "error"
        );

        absenceType.focus();

        return;

      }


      if (
        !startDate.value ||
        !endDate.value
      ) {

        showMessage(
          formMessage,
          "Select the start and end dates.",
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

        endDate.focus();

        return;

      }


      const person =
        getStaffMember(
          selectedOfficerId
        );


      saveAbsenceButton.disabled =
        true;

      saveAbsenceButton.textContent =
        "Saving…";


      try {

        const {
          data,
          error
        } =
          await db.rpc(
            "create_officer_unavailability",
            {

              p_user_id:
                selectedOfficerId,

              p_absence_type:
                absenceType.value,

              p_start_date:
                startDate.value,

              p_end_date:
                endDate.value,

              p_shift_name:
                absenceShift.value ||
                null,

              p_notes:
                absenceNotes.value
                  .trim() ||
                null

            }
          );


        if (error) {
          throw error;
        }


        await loadAbsences();

        await loadShiftNames();


        /*
          Move the review screen to the
          date just entered so the manager
          immediately sees the impact.
        */

        reviewDate.value =
          startDate.value;


        if (
          absenceShift.value &&
          [...reviewShift.options]
            .some(
              option =>
                option.value ===
                absenceShift.value
            )
        ) {

          reviewShift.value =
            absenceShift.value;

        }


        renderAbsenceReview();


        showMessage(
          formMessage,
          `${person?.display_name || "Officer"} has been marked out successfully.`,
          "success"
        );


        absenceType.value =
          "";

        absenceNotes.value =
          "";


        /*
          Keep the officer and dates selected
          to make consecutive manager entries
          faster if necessary.
        */


        console.log(
          "SecureTrack unavailability saved:",
          data
        );


      } catch (error) {

        console.error(
          "SecureTrack unavailability save error:",
          error
        );


        showMessage(
          formMessage,
          error.message ||
          "Unable to save Time Off / Training.",
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
  // CANCEL TIME OFF / TRAINING
  // =========================================================

  async function cancelAbsence(
    absence
  ) {

    const person =
      getStaffMember(
        absence.user_id
      );


    const confirmed =
      window.confirm(
        `Cancel the ${titleCaseType(absence.absence_type)} entry for ${person?.display_name || "this officer"}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "cancel_officer_unavailability",
          {
            p_unavailability_id:
              absence.id
          }
        );


      if (error) {
        throw error;
      }


      await loadAbsences();


    } catch (error) {

      console.error(
        "SecureTrack absence cancellation error:",
        error
      );


      window.alert(
        error.message ||
        "Unable to cancel this entry."
      );

    }

  }


  // =========================================================
  // SAVE NORMAL OFFICER SHIFT
  // =========================================================

  saveRosterButton.addEventListener(
    "click",
    async () => {

      clearMessage(
        rosterMessage
      );


      const userId =
        rosterOfficer.value;

      const shiftName =
        rosterShift.value.trim();


      if (!userId) {

        showMessage(
          rosterMessage,
          "Select an officer.",
          "error"
        );

        rosterOfficer.focus();

        return;

      }


      if (!shiftName) {

        showMessage(
          rosterMessage,
          "Enter the officer's normal shift.",
          "error"
        );

        rosterShift.focus();

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
                shiftName

            }
          );


        if (error) {
          throw error;
        }


        await loadRoster();

        await loadShiftNames();


        const person =
          getStaffMember(
            userId
          );


        /*
          Keep the main selected officer
          display in sync if it is the same
          officer.
        */

        if (
          selectedOfficerId ===
          userId
        ) {

          selectOfficer(
            userId
          );

        }


        showMessage(
          rosterMessage,
          `${person?.display_name || "Officer"} is assigned to ${shiftName}.`,
          "success"
        );


      } catch (error) {

        console.error(
          "SecureTrack roster save error:",
          error
        );


        showMessage(
          rosterMessage,
          error.message ||
          "Unable to save the officer's normal shift.",
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
  // ROSTER OFFICER CHANGED
  // =========================================================

  rosterOfficer.addEventListener(
    "change",
    () => {

      clearMessage(
        rosterMessage
      );


      const userId =
        rosterOfficer.value;


      if (!userId) {

        rosterShift.value =
          "";

        return;

      }


      const rosterRow =
        getRosterForUser(
          userId
        );


      rosterShift.value =
        rosterRow?.shift_name ||
        "";

    }
  );


  // =========================================================
  // OFFICER SEARCH / FILTER EVENTS
  // =========================================================

  officerSearch.addEventListener(
    "input",
    renderOfficerPicker
  );


  shiftFilter.addEventListener(
    "change",
    renderOfficerPicker
  );


  // =========================================================
  // REVIEW FILTER EVENTS
  // =========================================================

  reviewDate.addEventListener(
    "change",
    renderAbsenceReview
  );


  reviewShift.addEventListener(
    "change",
    renderAbsenceReview
  );


  // =========================================================
  // DATE RANGE CONVENIENCE
  // =========================================================

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
  // SIGN OUT
  // =========================================================

  logoutButton.addEventListener(
    "click",
    async () => {

      logoutButton.disabled =
        true;

      logoutButton.textContent =
        "Signing Out…";


      await STM.signOut();

    }
  );


  // =========================================================
  // INITIALIZE PAGE
  // =========================================================

  const today =
    todayLocal();


  startDate.value =
    today;

  endDate.value =
    today;

  reviewDate.value =
    today;


  try {

    /*
      Load the officer directory first,
      then roster information, then
      planned absences.

      The second render after roster load
      adds the normal shift next to each
      officer's name.
    */

    await loadStaff();

    await loadRoster();

    renderOfficerPicker();

    renderRosterOfficerSelect();

    await loadAbsences();

    await loadShiftNames();

    renderAbsenceReview();


  } catch (error) {

    console.error(
      "SecureTrack Time Off / Training initialization error:",
      error
    );


    officerPicker.innerHTML =
      "";


    const errorBox =
      document.createElement(
        "div"
      );

    errorBox.className =
      "staffing-empty";

    errorBox.textContent =
      error.message ||
      "Time Off / Training could not be loaded.";

    officerPicker.appendChild(
      errorBox
    );


    showMessage(
      formMessage,
      error.message ||
      "Time Off / Training could not be loaded.",
      "error"
    );

  }


})();
