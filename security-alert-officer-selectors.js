(function () {

  "use strict";


  // =========================================================
  // SECURETRACK
  // SECURITY LEADERSHIP ALERT
  // OFFICER SEARCH / SELECTION CONTROLS
  //
  // Code Green:
  //   Responding Officer(s) - MULTI SELECT
  //
  // Taser Pull:
  //   Officer(s) Involved - MULTI SELECT
  //
  // Officer Injury:
  //   Injured Officer - SINGLE SELECT
  //
  // Includes:
  //   - all active local officers
  //   - approved/completed outside OT officers
  //     for occurrence date
  //   - Other / Officer Not Listed
  //   - manual fallback if roster RPC fails
  // =========================================================


  // =========================================================
  // SUPABASE
  // =========================================================

  function getDatabase() {

    /*
      Reuse an existing SecureTrack client if one
      has already been exposed by another script.
    */

    if (
      window.SecureTrackManager?.db
    ) {

      return window.SecureTrackManager.db;

    }


    if (
      window.SecureTrackDB
    ) {

      return window.SecureTrackDB;

    }


    const config =
      window.SECURETRACK_CONFIG;


    if (
      !config?.supabaseUrl ||
      !config?.supabaseAnonKey ||
      !window.supabase
    ) {

      console.error(
        "SecureTrack officer selector could not initialize Supabase."
      );

      return null;

    }


    return window.supabase.createClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    );

  }


  const db =
    getDatabase();


  // =========================================================
  // STYLE
  // =========================================================

  const style =
    document.createElement(
      "style"
    );


  style.textContent = `

    .st-officer-selector {
      margin-top: 4px;
    }


    .st-officer-search-wrap {
      position: relative;
    }


    .st-officer-search {
      width: 100%;
      box-sizing: border-box;
    }


    .st-officer-dropdown {
      position: absolute;

      top: calc(100% + 6px);
      left: 0;
      right: 0;

      z-index: 5000;

      max-height: 280px;
      overflow-y: auto;

      border:
        1px solid #3b4249;

      border-radius:
        12px;

      background:
        #101419;

      box-shadow:
        0 14px 35px
        rgba(0,0,0,.45);
    }


    .st-officer-dropdown[hidden] {
      display: none !important;
    }


    .st-officer-option {
      width: 100%;

      display: flex;
      justify-content: space-between;
      align-items: center;

      gap: 14px;

      padding:
        11px 13px;

      border: 0;
      border-bottom:
        1px solid #282e34;

      background:
        transparent;

      color:
        #f2f4f6;

      text-align: left;

      cursor: pointer;
    }


    .st-officer-option:last-child {
      border-bottom: 0;
    }


    .st-officer-option:hover,
    .st-officer-option:focus {
      background:
        rgba(255,120,0,.10);

      outline: none;
    }


    .st-officer-option-main {
      min-width: 0;
    }


    .st-officer-option-name {
      display: block;

      font-size: 13px;
      font-weight: 850;

      color:
        #ffffff;
    }


    .st-officer-option-detail {
      display: block;

      margin-top: 3px;

      font-size: 11px;

      color:
        #98a2ab;
    }


    .st-officer-option-source {
      flex: 0 0 auto;

      padding:
        4px 7px;

      border-radius:
        999px;

      font-size: 9px;
      font-weight: 850;

      text-transform: uppercase;
      letter-spacing: .04em;

      color:
        #ffb16c;

      background:
        rgba(255,120,0,.10);

      border:
        1px solid
        rgba(255,120,0,.24);
    }


    .st-officer-selected {
      display: flex;
      flex-wrap: wrap;

      gap: 7px;

      margin-top: 9px;
    }


    .st-officer-chip {
      display: inline-flex;
      align-items: center;

      gap: 7px;

      padding:
        6px 9px;

      border:
        1px solid
        rgba(255,120,0,.34);

      border-radius:
        999px;

      background:
        rgba(255,120,0,.08);

      color:
        #f0f2f4;

      font-size: 11px;
      font-weight: 750;
    }


    .st-officer-chip.outside {
      border-color:
        rgba(104,164,255,.38);

      background:
        rgba(70,130,220,.09);
    }


    .st-officer-chip button {
      width: 20px;
      height: 20px;

      display: inline-flex;
      align-items: center;
      justify-content: center;

      padding: 0;

      border: 0;
      border-radius: 50%;

      background:
        rgba(255,255,255,.08);

      color:
        #ffffff;

      cursor: pointer;

      font-size: 15px;
      line-height: 1;
    }


    .st-officer-empty {
      padding:
        12px 13px;

      color:
        #9da6af;

      font-size: 12px;
    }


    .st-officer-other {
      margin-top: 12px;

      padding-top: 11px;

      border-top:
        1px solid #2b3137;
    }


    .st-officer-other-toggle {
      display: flex;
      align-items: center;

      gap: 8px;

      cursor: pointer;

      color:
        #d9dde1;

      font-size: 12px;
      font-weight: 750;
    }


    .st-officer-other-toggle input {
      width: auto;
    }


    .st-officer-manual {
      margin-top: 9px;
    }


    .st-officer-manual[hidden] {
      display: none !important;
    }


    .st-officer-helper {
      margin-top: 7px;

      color:
        #858f98;

      font-size: 10px;
      line-height: 1.45;
    }


    .st-officer-status {
      margin-top: 7px;

      min-height: 15px;

      color:
        #8e979f;

      font-size: 10px;
    }


    .st-officer-status.warning {
      color:
        #ffc17f;
    }


    .st-officer-validation {
      margin-top: 7px;

      color:
        #ff9696;

      font-size: 11px;
      font-weight: 750;
    }

  `;


  document.head.appendChild(
    style
  );


  // =========================================================
  // FIELD FINDERS
  // =========================================================

  function findFirst(
    selectors
  ) {

    for (
      const selector of selectors
    ) {

      const element =
        document.querySelector(
          selector
        );


      if (element) {

        return element;

      }

    }


    return null;

  }


  const occurrenceDate =
    findFirst([
      "#occurrenceDate",
      "#occurrence_date",
      '[name="occurrence_date"]',
      '[data-field="occurrence_date"]'
    ]);


  const incidentType =
    findFirst([
      "#incidentType",
      "#incident_type",
      '[name="incident_type"]',
      '[data-field="incident_type"]'
    ]);


  const respondingOriginal =
    findFirst([
      "#respondingOfficers",
      "#responding_officers",
      '[name="responding_officers"]',
      '[data-field="responding_officers"]'
    ]);


  const taserOriginal =
    findFirst([
      "#deployingOfficer",
      "#deploying_officer",
      '[name="deploying_officer"]',
      '[data-field="deploying_officer"]'
    ]);


  const injuryOriginal =
    findFirst([
      "#officerName",
      "#officer_name",
      '[name="officer_name"]',
      '[data-field="officer_name"]'
    ]);


  // =========================================================
  // ROSTER CACHE
  // =========================================================

  let roster =
    [];


  let loadedForDate =
    null;


  // =========================================================
  // TEXT NORMALIZATION
  // =========================================================

  function normalize(
    value
  ) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  // =========================================================
  // ROSTER LOAD
  // =========================================================

  async function loadOfficerRoster() {

    if (!db) {

      throw new Error(
        "SecureTrack database connection is unavailable."
      );

    }


    const selectedDate =
      occurrenceDate?.value ||
      null;


    const {
      data,
      error
    } =
      await db.rpc(
        "get_security_alert_officer_options",
        {
          p_occurrence_date:
            selectedDate ||
            null
        }
      );


    if (error) {

      throw error;

    }


    roster =
      Array.isArray(data)
        ? data
        : [];


    loadedForDate =
      selectedDate;


    return roster;

  }


  // =========================================================
  // FORMAT OFFICER VALUE FOR EXISTING INCIDENT FIELDS
  // =========================================================

  function officerStoredName(
    officer
  ) {

    if (
      officer.source_type ===
      "outside_overtime"
    ) {

      return (
        officer.display_name +
        " (Outside OT)"
      );

    }


    return officer.display_name;

  }


  // =========================================================
  // CREATE SELECTOR
  // =========================================================

  function createOfficerSelector({
    original,
    label,
    mode,
    manualLabel
  }) {

    if (!original) {

      return null;

    }


    const state = {

      selected:
        [],

      rosterAvailable:
        true,

      originalRequired:
        original.required

    };


    /*
      Keep the original field for the existing
      security-alerts.js submission code.

      Convert it to hidden so it is no longer
      displayed as a separate text field.
    */

    if (
      original.tagName ===
      "INPUT"
    ) {

      original.type =
        "hidden";

    }
    else {

      original.style.display =
        "none";

    }


    original.required =
      false;


    // =======================================================
    // CHANGE EXISTING LABEL
    // =======================================================

    const oldId =
      original.id;


    if (oldId) {

      const oldLabel =
        document.querySelector(
          `label[for="${CSS.escape(oldId)}"]`
        );


      if (oldLabel) {

        oldLabel.textContent =
          label;

      }

    }


    // =======================================================
    // BUILD UI
    // =======================================================

    const container =
      document.createElement(
        "div"
      );


    container.className =
      "st-officer-selector";


    const searchWrap =
      document.createElement(
        "div"
      );


    searchWrap.className =
      "st-officer-search-wrap";


    const search =
      document.createElement(
        "input"
      );


    search.type =
      "search";


    search.className =
      "st-officer-search";


    search.placeholder =
      "Start typing an officer's name...";


    search.autocomplete =
      "off";


    search.setAttribute(
      "aria-label",
      label
    );


    const dropdown =
      document.createElement(
        "div"
      );


    dropdown.className =
      "st-officer-dropdown";


    dropdown.hidden =
      true;


    const selectedWrap =
      document.createElement(
        "div"
      );


    selectedWrap.className =
      "st-officer-selected";


    const otherWrap =
      document.createElement(
        "div"
      );


    otherWrap.className =
      "st-officer-other";


    const otherToggle =
      document.createElement(
        "label"
      );


    otherToggle.className =
      "st-officer-other-toggle";


    const otherCheckbox =
      document.createElement(
        "input"
      );


    otherCheckbox.type =
      "checkbox";


    const otherText =
      document.createElement(
        "span"
      );


    otherText.textContent =
      "Other / Officer Not Listed";


    otherToggle.append(
      otherCheckbox,
      otherText
    );


    const manualInput =
      document.createElement(
        "input"
      );


    manualInput.type =
      "text";


    manualInput.className =
      "st-officer-manual";


    manualInput.placeholder =
      manualLabel;


    manualInput.hidden =
      true;


    manualInput.autocomplete =
      "off";


    const helper =
      document.createElement(
        "div"
      );


    helper.className =
      "st-officer-helper";


    helper.textContent =
      mode === "multiple"
        ? "You may select more than one officer. Use Other if an involved officer is not listed."
        : "Use Other if the officer is not listed in SecureTrack.";


    const status =
      document.createElement(
        "div"
      );


    status.className =
      "st-officer-status";


    const validation =
      document.createElement(
        "div"
      );


    validation.className =
      "st-officer-validation";


    searchWrap.append(
      search,
      dropdown
    );


    otherWrap.append(
      otherToggle,
      manualInput
    );


    container.append(
      searchWrap,
      selectedWrap,
      otherWrap,
      helper,
      status,
      validation
    );


    original.insertAdjacentElement(
      "afterend",
      container
    );


    // =======================================================
    // OUTPUT VALUE
    // =======================================================

    function syncOriginalValue() {

      const parts =
        state.selected
          .map(
            officerStoredName
          );


      const manual =
        manualInput.value
          .trim();


      if (
        otherCheckbox.checked &&
        manual
      ) {

        parts.push(
          "Other: " +
          manual
        );

      }


      original.value =
        parts.join(
          "; "
        );


      /*
        Fire normal events so the existing alert
        script can react if it listens for them.
      */

      original.dispatchEvent(
        new Event(
          "input",
          {
            bubbles:
              true
          }
        )
      );


      original.dispatchEvent(
        new Event(
          "change",
          {
            bubbles:
              true
          }
        )
      );


      validation.textContent =
        "";

    }


    // =======================================================
    // SELECTED CHIPS
    // =======================================================

    function renderSelected() {

      selectedWrap.innerHTML =
        "";


      state.selected.forEach(
        officer => {

          const chip =
            document.createElement(
              "span"
            );


          chip.className =
            "st-officer-chip";


          if (
            officer.source_type ===
            "outside_overtime"
          ) {

            chip.classList.add(
              "outside"
            );

          }


          const text =
            document.createElement(
              "span"
            );


          text.textContent =
            officerStoredName(
              officer
            );


          const remove =
            document.createElement(
              "button"
            );


          remove.type =
            "button";


          remove.setAttribute(
            "aria-label",
            `Remove ${officer.display_name}`
          );


          remove.textContent =
            "×";


          remove.addEventListener(
            "click",
            () => {

              state.selected =
                state.selected.filter(
                  selected =>
                    selected.officer_key !==
                    officer.officer_key
                );


              renderSelected();

              renderDropdown();

              syncOriginalValue();

            }
          );


          chip.append(
            text,
            remove
          );


          selectedWrap.appendChild(
            chip
          );

        }
      );

    }


    // =======================================================
    // FILTER AVAILABLE OFFICERS
    // =======================================================

    function filteredRoster() {

      const query =
        normalize(
          search.value
        );


      return roster
        .filter(
          officer => {

            const alreadySelected =
              state.selected.some(
                selected =>
                  selected.officer_key ===
                  officer.officer_key
              );


            if (alreadySelected) {

              return false;

            }


            if (!query) {

              return true;

            }


            const searchable =
              normalize(
                [
                  officer.display_name,
                  officer.officer_rank,
                  officer.source_label,
                  officer.overtime_shift,
                  officer.overtime_location
                ]
                  .filter(
                    Boolean
                  )
                  .join(
                    " "
                  )
              );


            return searchable.includes(
              query
            );

          }
        )
        .slice(
          0,
          30
        );

    }


    // =======================================================
    // DROPDOWN
    // =======================================================

    function renderDropdown() {

      dropdown.innerHTML =
        "";


      if (
        !state.rosterAvailable
      ) {

        dropdown.hidden =
          true;

        return;

      }


      const options =
        filteredRoster();


      if (!options.length) {

        const empty =
          document.createElement(
            "div"
          );


        empty.className =
          "st-officer-empty";


        empty.textContent =
          search.value.trim()
            ? "No matching officer. Use Other / Officer Not Listed if needed."
            : "No additional officers are available.";


        dropdown.appendChild(
          empty
        );


        dropdown.hidden =
          false;


        return;

      }


      options.forEach(
        officer => {

          const option =
            document.createElement(
              "button"
            );


          option.type =
            "button";


          option.className =
            "st-officer-option";


          const main =
            document.createElement(
              "span"
            );


          main.className =
            "st-officer-option-main";


          const name =
            document.createElement(
              "span"
            );


          name.className =
            "st-officer-option-name";


          name.textContent =
            officer.display_name;


          const detail =
            document.createElement(
              "span"
            );


          detail.className =
            "st-officer-option-detail";


          const detailParts =
            [
              officer.officer_rank
            ];


          if (
            officer.source_type ===
            "outside_overtime"
          ) {

            if (
              officer.overtime_shift
            ) {

              detailParts.push(
                officer.overtime_shift
              );

            }


            if (
              officer.overtime_location
            ) {

              detailParts.push(
                officer.overtime_location
              );

            }

          }


          detail.textContent =
            detailParts
              .filter(
                Boolean
              )
              .join(
                " • "
              );


          main.append(
            name,
            detail
          );


          const source =
            document.createElement(
              "span"
            );


          source.className =
            "st-officer-option-source";


          source.textContent =
            officer.source_type ===
            "outside_overtime"
              ? "Outside • OT"
              : "Local";


          option.append(
            main,
            source
          );


          option.addEventListener(
            "click",
            () => {

              if (
                mode ===
                "single"
              ) {

                state.selected =
                  [
                    officer
                  ];

              }
              else {

                state.selected.push(
                  officer
                );

              }


              search.value =
                "";


              dropdown.hidden =
                true;


              renderSelected();

              syncOriginalValue();

            }
          );


          dropdown.appendChild(
            option
          );

        }
      );


      dropdown.hidden =
        false;

    }


    // =======================================================
    // SEARCH EVENTS
    // =======================================================

    search.addEventListener(
      "focus",
      () => {

        renderDropdown();

      }
    );


    search.addEventListener(
      "input",
      () => {

        renderDropdown();

      }
    );


    document.addEventListener(
      "click",
      event => {

        if (
          !container.contains(
            event.target
          )
        ) {

          dropdown.hidden =
            true;

        }

      }
    );


    // =======================================================
    // OTHER / MANUAL
    // =======================================================

    otherCheckbox.addEventListener(
      "change",
      () => {

        manualInput.hidden =
          !otherCheckbox.checked;


        if (
          otherCheckbox.checked
        ) {

          /*
            Do not make the reporter perform an
            unnecessary click during an urgent report.
          */

          setTimeout(
            () =>
              manualInput.focus(),
            0
          );

        }
        else {

          manualInput.value =
            "";

        }


        syncOriginalValue();

      }
    );


    manualInput.addEventListener(
      "input",
      syncOriginalValue
    );


    // =======================================================
    // ROSTER STATUS
    // =======================================================

    function setRosterStatus(
      success,
      message = ""
    ) {

      state.rosterAvailable =
        success;


      status.classList.toggle(
        "warning",
        !success
      );


      status.textContent =
        message;


      if (!success) {

        /*
          Serious incident reporting must never
          be blocked by a roster lookup problem.
        */

        otherCheckbox.checked =
          true;


        manualInput.hidden =
          false;


        search.disabled =
          true;


        search.placeholder =
          "Officer roster unavailable";


        helper.textContent =
          "Officer lookup is unavailable. Enter the officer name manually and continue the report.";

      }
      else {

        search.disabled =
          false;


        search.placeholder =
          "Start typing an officer's name...";

      }

    }


    // =======================================================
    // RECONCILE SELECTIONS AFTER DATE CHANGE
    // =======================================================

    function reconcileSelections() {

      /*
        Local officers can remain selected.

        Outside OT officers must still exist in
        the refreshed date-specific roster.
      */

      const validKeys =
        new Set(
          roster.map(
            officer =>
              officer.officer_key
          )
        );


      const previousCount =
        state.selected.length;


      state.selected =
        state.selected.filter(
          officer =>
            officer.source_type !==
              "outside_overtime" ||
            validKeys.has(
              officer.officer_key
            )
        );


      if (
        previousCount !==
        state.selected.length
      ) {

        status.textContent =
          "An Outside OT officer was removed because the occurrence date changed.";

        status.classList.add(
          "warning"
        );

      }


      renderSelected();

      syncOriginalValue();

    }


    // =======================================================
    // VALIDATION
    // =======================================================

    function validate() {

      syncOriginalValue();


      if (
        !original.value.trim()
      ) {

        validation.textContent =
          mode === "multiple"
            ? "Select at least one officer or enter an officer under Other."
            : "Select the officer or enter the officer under Other.";


        return false;

      }


      validation.textContent =
        "";


      return true;

    }


    // =======================================================
    // CLEAR
    // =======================================================

    function reset() {

      state.selected =
        [];


      search.value =
        "";


      otherCheckbox.checked =
        false;


      manualInput.value =
        "";


      manualInput.hidden =
        true;


      validation.textContent =
        "";


      renderSelected();

      syncOriginalValue();

    }


    return {

      state,

      setRosterStatus,

      reconcileSelections,

      renderDropdown,

      validate,

      reset

    };

  }


  // =========================================================
  // CREATE THE THREE OFFICER CONTROLS
  // =========================================================

  const codeGreenSelector =
    createOfficerSelector({

      original:
        respondingOriginal,

      label:
        "Responding Officer(s)",

      mode:
        "multiple",

      manualLabel:
        "Enter officer name(s)"

    });


  const taserSelector =
    createOfficerSelector({

      original:
        taserOriginal,

      label:
        "Officer(s) Involved",

      mode:
        "multiple",

      manualLabel:
        "Enter additional officer name(s)"

    });


  const injurySelector =
    createOfficerSelector({

      original:
        injuryOriginal,

      label:
        "Injured Officer",

      mode:
        "single",

      manualLabel:
        "Enter injured officer's name"

    });


  const selectors =
    [
      codeGreenSelector,
      taserSelector,
      injurySelector
    ]
      .filter(
        Boolean
      );


  // =========================================================
  // REFRESH ROSTER FOR OCCURRENCE DATE
  // =========================================================

  async function refreshRoster() {

    selectors.forEach(
      selector => {

        selector.setRosterStatus(
          true,
          "Loading officer roster..."
        );

      }
    );


    try {

      await loadOfficerRoster();


      selectors.forEach(
        selector => {

          selector.setRosterStatus(
            true,
            occurrenceDate?.value
              ? "Active local officers and eligible Outside OT officers loaded."
              : "Active local officers loaded. Select an occurrence date to include Outside OT officers."
          );


          selector.reconcileSelections();

        }
      );

    }
    catch (
      error
    ) {

      console.error(
        "SecureTrack officer roster error:",
        error
      );


      selectors.forEach(
        selector => {

          selector.setRosterStatus(
            false,
            "Roster unavailable — manual officer entry is enabled."
          );

        }
      );

    }

  }


  // =========================================================
  // DATE CHANGE
  // =========================================================

  if (
    occurrenceDate
  ) {

    occurrenceDate.addEventListener(
      "change",
      refreshRoster
    );

  }


  // =========================================================
  // FORM VALIDATION
  // =========================================================

  const form =
    respondingOriginal?.closest(
      "form"
    ) ||
    taserOriginal?.closest(
      "form"
    ) ||
    injuryOriginal?.closest(
      "form"
    ) ||
    document.querySelector(
      "form"
    );


  function currentIncidentType() {

    return String(
      incidentType?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  }


  if (
    form
  ) {

    /*
      Capture phase runs before the normal
      security-alerts.js submit handler.
    */

    form.addEventListener(
      "submit",
      event => {

        const type =
          currentIncidentType();


        let valid =
          true;


        if (
          type ===
          "code_green" &&
          codeGreenSelector
        ) {

          valid =
            codeGreenSelector.validate();

        }


        if (
          type ===
          "taser_pull" &&
          taserSelector
        ) {

          valid =
            taserSelector.validate();

        }


        if (
          type ===
          "officer_injury" &&
          injurySelector
        ) {

          valid =
            injurySelector.validate();

        }


        if (!valid) {

          event.preventDefault();

          event.stopImmediatePropagation();

        }

      },

      true
    );


    form.addEventListener(
      "reset",
      () => {

        setTimeout(
          () => {

            selectors.forEach(
              selector =>
                selector.reset()
            );


            refreshRoster();

          },
          0
        );

      }
    );

  }


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  refreshRoster();


  // =========================================================
  // DEBUG / MANUAL REFRESH
  // =========================================================

  window.SecureTrackSecurityAlertOfficers = {

    refresh:
      refreshRoster,

    getRoster() {

      return [
        ...roster
      ];

    }

  };


})();
