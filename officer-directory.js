(async function () {

  "use strict";


  // =========================================================
  // SECURETRACK OFFICER DIRECTORY
  // =========================================================

  const STM =
    window.SecureTrackManager;

  if (!STM) {

    console.error(
      "SecureTrack Manager authentication is unavailable."
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


  const currentUserId =
    manager.session.user.id;


  const currentRoles =
    manager.roles || [];


  const isAdmin =
    currentRoles.includes("admin");


  const isDirector =
    currentRoles.includes("director");


  const hasSystemWideAuthority =
    isAdmin || isDirector;


  const ALL_SHIFTS = [
    "Alpha",
    "Bravo",
    "Charlie",
    "Delta"
  ];


  // =========================================================
  // ELEMENTS
  // =========================================================

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  const directorySearch =
    document.getElementById(
      "directorySearch"
    );

  const directoryShiftFilter =
    document.getElementById(
      "directoryShiftFilter"
    );

  const directoryQualificationFilter =
    document.getElementById(
      "directoryQualificationFilter"
    );

  const directoryList =
    document.getElementById(
      "directoryList"
    );


  const noOfficerSelected =
    document.getElementById(
      "noOfficerSelected"
    );

  const officerProfilePanel =
    document.getElementById(
      "officerProfilePanel"
    );


  const profileArmedShield =
    document.getElementById(
      "profileArmedShield"
    );

  const profileDisplayName =
    document.getElementById(
      "profileDisplayName"
    );

  const profileEmployeeNumber =
    document.getElementById(
      "profileEmployeeNumber"
    );

  const profileShiftBadge =
    document.getElementById(
      "profileShiftBadge"
    );

  const profileTransferBadge =
    document.getElementById(
      "profileTransferBadge"
    );


  const refreshDirectoryButton =
    document.getElementById(
      "refreshDirectoryButton"
    );


  const profileForm =
    document.getElementById(
      "profileForm"
    );

  const firstName =
    document.getElementById(
      "firstName"
    );

  const middleInitial =
    document.getElementById(
      "middleInitial"
    );

  const lastName =
    document.getElementById(
      "lastName"
    );

  const nickname =
    document.getElementById(
      "nickname"
    );

  const birthDate =
    document.getElementById(
      "birthDate"
    );

  const hireDate =
    document.getElementById(
      "hireDate"
    );

  const profileEmail =
    document.getElementById(
      "profileEmail"
    );

  const saveProfileButton =
    document.getElementById(
      "saveProfileButton"
    );

  const profileMessage =
    document.getElementById(
      "profileMessage"
    );


  const currentShift =
    document.getElementById(
      "currentShift"
    );

  const newShift =
    document.getElementById(
      "newShift"
    );

  const changeShiftButton =
    document.getElementById(
      "changeShiftButton"
    );

  const shiftMessage =
    document.getElementById(
      "shiftMessage"
    );


  const armedStatus =
    document.getElementById(
      "armedStatus"
    );

  const armedNotes =
    document.getElementById(
      "armedNotes"
    );

  const grantArmedButton =
    document.getElementById(
      "grantArmedButton"
    );

  const removeArmedButton =
    document.getElementById(
      "removeArmedButton"
    );

  const armedMessage =
    document.getElementById(
      "armedMessage"
    );


  const transferCard =
    document.getElementById(
      "transferCard"
    );

  const receivingManager =
    document.getElementById(
      "receivingManager"
    );

  const transferReason =
    document.getElementById(
      "transferReason"
    );

  const requestTransferButton =
    document.getElementById(
      "requestTransferButton"
    );

  const transferMessage =
    document.getElementById(
      "transferMessage"
    );


  const pendingTransferCount =
    document.getElementById(
      "pendingTransferCount"
    );

  const pendingTransfers =
    document.getElementById(
      "pendingTransfers"
    );


  const shiftHistoryBody =
    document.getElementById(
      "shiftHistoryBody"
    );


  // =========================================================
  // STATE
  // =========================================================

  let officers = [];

  let referenceProfiles = [];

  let supervisors = [];

  let transfers = [];

  let selectedOfficerId =
    null;


  // =========================================================
  // HELPERS
  // =========================================================

  function normalize(value) {

    return String(
      value || ""
    )
      .trim()
      .toLowerCase();

  }


  function showMessage(
    element,
    message,
    type = "success"
  ) {

    element.textContent =
      message;

    element.className =
      `directory-message show ${type}`;

  }


  function clearMessage(
    element
  ) {

    element.textContent =
      "";

    element.className =
      "directory-message";

  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

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


  function formatDateTime(value) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return value;

    }


    return date.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  }


  function formatChangeType(value) {

    switch (value) {

      case "initial_assignment":
        return "Initial Assignment";

      case "internal_move":
        return "Internal Move";

      case "transfer_approved":
        return "Approved Transfer";

      case "director_move":
        return "Director Move";

      case "admin_move":
        return "Admin Move";

      default:
        return value || "—";

    }

  }


  function profileName(userId) {

    return (
      referenceProfiles.find(
        profile =>
          profile.id === userId
      )?.display_name ||
      "SecureTrack User"
    );

  }


  function getOfficer(userId) {

    return officers.find(
      officer =>
        officer.user_id === userId
    ) || null;

  }


  function selectedOfficer() {

    if (!selectedOfficerId) {
      return null;
    }

    return getOfficer(
      selectedOfficerId
    );

  }


  // =========================================================
  // MANAGEMENT AUTHORITY
  // =========================================================

  function myManagedShifts() {

    if (hasSystemWideAuthority) {
      return [...ALL_SHIFTS];
    }


    return supervisors
      .filter(
        row =>
          row.manager_user_id ===
            currentUserId &&
          row.is_active !== false
      )
      .map(
        row =>
          row.shift_name
      )
      .filter(Boolean);

  }


  function managerShifts(
    managerUserId
  ) {

    return supervisors
      .filter(
        row =>
          row.manager_user_id ===
            managerUserId &&
          row.is_active !== false
      )
      .map(
        row =>
          row.shift_name
      )
      .filter(Boolean)
      .sort(
        (a, b) =>
          ALL_SHIFTS.indexOf(a) -
          ALL_SHIFTS.indexOf(b)
      );

  }


  function canDirectlyManageOfficer(
    officer
  ) {

    if (!officer) {
      return false;
    }


    if (hasSystemWideAuthority) {
      return true;
    }


    /*
      Managers may initially configure
      unassigned officers.

      Once assigned, they must belong
      to one of that manager's shifts.
    */

    if (!officer.shift_name) {
      return true;
    }


    return myManagedShifts()
      .includes(
        officer.shift_name
      );

  }


  function canChangeQualification(
    officer
  ) {

    if (!officer) {
      return false;
    }


    if (hasSystemWideAuthority) {
      return true;
    }


    if (!officer.shift_name) {
      return false;
    }


    return myManagedShifts()
      .includes(
        officer.shift_name
      );

  }


  // =========================================================
  // LOAD REFERENCE PROFILES
  // =========================================================

  async function loadReferenceProfiles() {

    const {
      data,
      error
    } =
      await db
        .from("profiles")
        .select(
          "id, display_name, email, is_active"
        )
        .eq(
          "is_active",
          true
        );


    if (error) {
      throw error;
    }


    referenceProfiles =
      data || [];

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
        .from(
          "shift_supervisors"
        )
        .select(
          "shift_name, manager_user_id, manager_title, is_active"
        )
        .eq(
          "is_active",
          true
        );


    if (error) {
      throw error;
    }


    supervisors =
      data || [];

  }


  // =========================================================
  // LOAD DIRECTORY
  // =========================================================

  async function loadDirectory() {

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


    officers =
      data || [];


    /*
      If selected officer disappeared from
      this manager's command after a transfer,
      clear the profile panel.
    */

    if (
      selectedOfficerId &&
      !officers.some(
        officer =>
          officer.user_id ===
          selectedOfficerId
      )
    ) {

      selectedOfficerId =
        null;

    }


    renderDirectory();

    renderSelectedOfficer();

  }


  // =========================================================
  // DIRECTORY RENDER
  // =========================================================

  function renderDirectory() {

    directoryList.innerHTML =
      "";


    const search =
      normalize(
        directorySearch.value
      );


    const shiftFilter =
      directoryShiftFilter.value;


    const qualificationFilter =
      directoryQualificationFilter.value;


    const filtered =
      officers.filter(
        officer => {

          const searchable =
            normalize(
              [
                officer.display_name,
                officer.first_name,
                officer.middle_initial,
                officer.last_name,
                officer.nickname,
                officer.employee_number
              ].join(" ")
            );


          if (
            search &&
            !searchable.includes(
              search
            )
          ) {

            return false;

          }


          if (
            shiftFilter ===
            "UNASSIGNED"
          ) {

            if (officer.shift_name) {
              return false;
            }

          } else if (
            shiftFilter &&
            officer.shift_name !==
              shiftFilter
          ) {

            return false;

          }


          if (
            qualificationFilter ===
              "ARMED" &&
            !officer.is_armed
          ) {

            return false;

          }


          if (
            qualificationFilter ===
              "UNARMED" &&
            officer.is_armed
          ) {

            return false;

          }


          if (
            qualificationFilter ===
              "TRANSFER" &&
            !officer.transfer_pending
          ) {

            return false;

          }


          return true;

        }
      );


    if (!filtered.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "directory-empty";

      empty.textContent =
        "No officers match the current filters.";

      directoryList.appendChild(
        empty
      );

      return;

    }


    filtered.forEach(
      officer => {

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "officer-row";


        if (
          officer.user_id ===
          selectedOfficerId
        ) {

          button.classList.add(
            "selected"
          );

        }


        const main =
          document.createElement(
            "div"
          );

        main.className =
          "officer-main";


        if (officer.is_armed) {

          const shield =
            document.createElement(
              "span"
            );

          shield.className =
            "armed-shield";

          shield.textContent =
            "A";

          shield.title =
            "Armed Officer";

          main.appendChild(
            shield
          );

        }


        const nameWrap =
          document.createElement(
            "div"
          );

        nameWrap.className =
          "officer-name-wrap";


        const name =
          document.createElement(
            "div"
          );

        name.className =
          "officer-name";

        name.textContent =
          officer.display_name ||
          "SecureTrack Officer";


        const meta =
          document.createElement(
            "div"
          );

        meta.className =
          "officer-meta";


        const metaParts =
          [];


        if (
          officer.employee_number
        ) {

          metaParts.push(
            `Employee # ${officer.employee_number}`
          );

        }


        metaParts.push(
          officer.shift_name ||
          "Unassigned"
        );


        meta.textContent =
          metaParts.join(
            " • "
          );


        nameWrap.append(
          name,
          meta
        );


        if (
          officer.transfer_pending
        ) {

          const transfer =
            document.createElement(
              "span"
            );

          transfer.className =
            "transfer-pill";

          transfer.textContent =
            "Transfer Pending";

          nameWrap.appendChild(
            transfer
          );

        }


        main.appendChild(
          nameWrap
        );


        const shift =
          document.createElement(
            "span"
          );

        shift.className =
          officer.shift_name
            ? "shift-pill"
            : "shift-pill unassigned";

        shift.textContent =
          officer.shift_name ||
          "Unassigned";


        button.append(
          main,
          shift
        );


        button.addEventListener(
          "click",
          () => {

            selectOfficer(
              officer.user_id
            );

          }
        );


        directoryList.appendChild(
          button
        );

      }
    );

  }


  // =========================================================
  // SELECT OFFICER
  // =========================================================

  async function selectOfficer(
    userId
  ) {

    selectedOfficerId =
      userId;


    clearMessage(
      profileMessage
    );

    clearMessage(
      shiftMessage
    );

    clearMessage(
      armedMessage
    );

    clearMessage(
      transferMessage
    );


    renderDirectory();

    renderSelectedOfficer();


    await loadShiftHistory();

  }


  // =========================================================
  // RENDER SELECTED PROFILE
  // =========================================================

  function renderSelectedOfficer() {

    const officer =
      selectedOfficer();


    if (!officer) {

      noOfficerSelected.hidden =
        false;

      officerProfilePanel.hidden =
        true;

      renderEmptyHistory();

      return;

    }


    noOfficerSelected.hidden =
      true;

    officerProfilePanel.hidden =
      false;


    profileDisplayName.textContent =
      officer.display_name ||
      "SecureTrack Officer";


    profileEmployeeNumber.textContent =
      officer.employee_number
        ? `Employee # ${officer.employee_number}`
        : "Employee number not assigned";


    profileArmedShield.hidden =
      !officer.is_armed;


    profileShiftBadge.textContent =
      officer.shift_name ||
      "Unassigned";


    profileShiftBadge.className =
      officer.shift_name
        ? "shift-pill"
        : "shift-pill unassigned";


    profileTransferBadge.hidden =
      !officer.transfer_pending;


    // =======================================================
    // PROFILE FIELDS
    // =======================================================

    firstName.value =
      officer.first_name ||
      "";

    middleInitial.value =
      officer.middle_initial ||
      "";

    lastName.value =
      officer.last_name ||
      "";

    nickname.value =
      officer.nickname ||
      "";

    birthDate.value =
      officer.birth_date ||
      "";

    hireDate.value =
      officer.hire_date ||
      "";

    profileEmail.value =
      officer.email ||
      "";


    const directAuthority =
      canDirectlyManageOfficer(
        officer
      );


    [
      firstName,
      middleInitial,
      lastName,
      nickname,
      birthDate,
      hireDate
    ].forEach(
      input => {

        input.disabled =
          !directAuthority;

      }
    );


    saveProfileButton.disabled =
      !directAuthority;


    // =======================================================
    // SHIFT
    // =======================================================

    currentShift.value =
      officer.shift_name ||
      "Unassigned";


    renderShiftChoices(
      officer
    );


    /*
      Pending transfer must be resolved
      instead of silently bypassed by
      a direct shift change.
    */

    changeShiftButton.disabled =
      !directAuthority ||
      officer.transfer_pending;


    // =======================================================
    // ARMED
    // =======================================================

    armedStatus.textContent =
      officer.is_armed
        ? "Armed"
        : "Not Armed";


    const armedAuthority =
      canChangeQualification(
        officer
      );


    armedNotes.disabled =
      !armedAuthority;


    grantArmedButton.disabled =
      !armedAuthority ||
      officer.is_armed;


    removeArmedButton.disabled =
      !armedAuthority ||
      !officer.is_armed;


    // =======================================================
    // TRANSFER
    // =======================================================

    renderTransferControls(
      officer
    );

  }


  // =========================================================
  // DIRECT SHIFT CHOICES
  // =========================================================

  function renderShiftChoices(
    officer
  ) {

    const previous =
      newShift.value;


    newShift.innerHTML =
      "";


    const placeholder =
      document.createElement(
        "option"
      );

    placeholder.value =
      "";

    placeholder.textContent =
      "Select shift";

    newShift.appendChild(
      placeholder
    );


    const allowedShifts =
      hasSystemWideAuthority
        ? [...ALL_SHIFTS]
        : myManagedShifts();


    allowedShifts.forEach(
      shiftName => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          shiftName;

        option.textContent =
          shiftName;


        if (
          officer.shift_name ===
          shiftName
        ) {

          option.textContent +=
            " — Current";

        }


        newShift.appendChild(
          option
        );

      }
    );


    if (
      allowedShifts.includes(
        previous
      )
    ) {

      newShift.value =
        previous;

    }

  }


  // =========================================================
  // PROFILE SAVE
  // =========================================================

  profileForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const officer =
        selectedOfficer();


      if (!officer) {
        return;
      }


      clearMessage(
        profileMessage
      );


      if (
        !firstName.value.trim()
      ) {

        showMessage(
          profileMessage,
          "First name is required.",
          "error"
        );

        firstName.focus();

        return;

      }


      if (
        !lastName.value.trim()
      ) {

        showMessage(
          profileMessage,
          "Last name is required.",
          "error"
        );

        lastName.focus();

        return;

      }


      const middle =
        middleInitial.value
          .trim();


      if (
        middle &&
        !/^[A-Za-z]$/.test(
          middle
        )
      ) {

        showMessage(
          profileMessage,
          "Middle initial must be one letter.",
          "error"
        );

        middleInitial.focus();

        return;

      }


      saveProfileButton.disabled =
        true;

      saveProfileButton.textContent =
        "Saving…";


      try {

        const {
          error
        } =
          await db.rpc(
            "update_officer_directory_profile",
            {

              p_user_id:
                officer.user_id,

              p_first_name:
                firstName.value.trim(),

              p_middle_initial:
                middle || null,

              p_last_name:
                lastName.value.trim(),

              p_nickname:
                nickname.value.trim() ||
                null,

              p_birth_date:
                birthDate.value ||
                null,

              p_hire_date:
                hireDate.value ||
                null

            }
          );


        if (error) {
          throw error;
        }


        await Promise.all([
          loadReferenceProfiles(),
          loadDirectory()
        ]);


        showMessage(
          profileMessage,
          "Officer profile saved successfully."
        );


      } catch (error) {

        console.error(
          "SecureTrack officer profile save error:",
          error
        );


        showMessage(
          profileMessage,
          error.message ||
          "Unable to save officer profile.",
          "error"
        );


      } finally {

        saveProfileButton.disabled =
          !canDirectlyManageOfficer(
            selectedOfficer()
          );

        saveProfileButton.textContent =
          "Save Profile";

      }

    }
  );


  // =========================================================
  // CHANGE SHIFT
  // =========================================================

  changeShiftButton.addEventListener(
    "click",
    async () => {

      const officer =
        selectedOfficer();


      if (!officer) {
        return;
      }


      clearMessage(
        shiftMessage
      );


      const destination =
        newShift.value;


      if (!destination) {

        showMessage(
          shiftMessage,
          "Select a destination shift.",
          "error"
        );

        newShift.focus();

        return;

      }


      if (
        destination ===
        officer.shift_name
      ) {

        showMessage(
          shiftMessage,
          `${officer.display_name} is already assigned to ${destination}.`,
          "error"
        );

        return;

      }


      if (
        officer.transfer_pending
      ) {

        showMessage(
          shiftMessage,
          "Resolve the pending transfer request before changing this officer's shift.",
          "error"
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Move ${officer.display_name} from ${officer.shift_name || "Unassigned"} to ${destination}?`
        );


      if (!confirmed) {
        return;
      }


      changeShiftButton.disabled =
        true;

      changeShiftButton.textContent =
        "Updating…";


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


        await loadDirectory();

        await loadShiftHistory();


        showMessage(
          shiftMessage,
          `${selectedOfficer()?.display_name || officer.display_name} is now assigned to ${destination}.`
        );


      } catch (error) {

        console.error(
          "SecureTrack shift change error:",
          error
        );


        showMessage(
          shiftMessage,
          error.message ||
          "Unable to change the officer's shift.",
          "error"
        );


      } finally {

        changeShiftButton.textContent =
          "Change Shift";

        renderSelectedOfficer();

      }

    }
  );


  // =========================================================
  // ARMED QUALIFICATION
  // =========================================================

  grantArmedButton.addEventListener(
    "click",
    async () => {

      await saveArmedStatus(
        true
      );

    }
  );


  removeArmedButton.addEventListener(
    "click",
    async () => {

      const officer =
        selectedOfficer();


      if (!officer) {
        return;
      }


      const confirmed =
        window.confirm(
          `Remove Armed status from ${officer.display_name}?`
        );


      if (!confirmed) {
        return;
      }


      await saveArmedStatus(
        false
      );

    }
  );


  async function saveArmedStatus(
    isArmed
  ) {

    const officer =
      selectedOfficer();


    if (!officer) {
      return;
    }


    clearMessage(
      armedMessage
    );


    grantArmedButton.disabled =
      true;

    removeArmedButton.disabled =
      true;


    try {

      const {
        error
      } =
        await db.rpc(
          "set_officer_armed_qualification",
          {

            p_user_id:
              officer.user_id,

            p_is_armed:
              isArmed,

            p_notes:
              armedNotes.value
                .trim() ||
              null

          }
        );


      if (error) {
        throw error;
      }


      armedNotes.value =
        "";


      await loadDirectory();


      showMessage(
        armedMessage,
        isArmed
          ? `${selectedOfficer()?.display_name || officer.display_name} is now marked as an Armed Officer.`
          : `Armed status was removed from ${selectedOfficer()?.display_name || officer.display_name}.`
      );


    } catch (error) {

      console.error(
        "SecureTrack armed qualification error:",
        error
      );


      showMessage(
        armedMessage,
        error.message ||
        "Unable to update Armed qualification.",
        "error"
      );


    } finally {

      renderSelectedOfficer();

    }

  }


  // =========================================================
  // RECEIVING MANAGER OPTIONS
  // =========================================================

  function renderTransferControls(
    officer
  ) {

    receivingManager.innerHTML =
      "";


    const placeholder =
      document.createElement(
        "option"
      );

    placeholder.value =
      "";

    placeholder.textContent =
      "Select receiving manager";

    receivingManager.appendChild(
      placeholder
    );


    /*
      Director/Admin can move officers
      directly across commands.

      The request workflow is primarily
      Archie <-> Cory.
    */

    if (hasSystemWideAuthority) {

      transferCard.hidden =
        true;

      return;

    }


    const directlyManaged =
      canDirectlyManageOfficer(
        officer
      );


    if (
      !directlyManaged ||
      !officer.shift_name
    ) {

      transferCard.hidden =
        true;

      return;

    }


    transferCard.hidden =
      false;


    const managerMap =
      new Map();


    supervisors.forEach(
      row => {

        if (
          !row.is_active ||
          row.manager_user_id ===
            currentUserId
        ) {

          return;

        }


        if (
          !managerMap.has(
            row.manager_user_id
          )
        ) {

          managerMap.set(
            row.manager_user_id,
            []
          );

        }


        managerMap
          .get(
            row.manager_user_id
          )
          .push(
            row.shift_name
          );

      }
    );


    managerMap.forEach(
      (
        shifts,
        managerId
      ) => {

        const option =
          document.createElement(
            "option"
          );


        const managerName =
          profileName(
            managerId
          );


        const ordered =
          [...shifts]
            .sort(
              (a, b) =>
                ALL_SHIFTS.indexOf(a) -
                ALL_SHIFTS.indexOf(b)
            );


        option.value =
          managerId;

        option.textContent =
          `${managerName} — ${ordered.join(" / ")}`;


        receivingManager.appendChild(
          option
        );

      }
    );


    requestTransferButton.disabled =
      Boolean(
        officer.transfer_pending
      );


    if (
      officer.transfer_pending
    ) {

      showMessage(
        transferMessage,
        "This officer already has a pending transfer request.",
        "error"
      );

    } else {

      clearMessage(
        transferMessage
      );

    }

  }


  // =========================================================
  // REQUEST TRANSFER
  // =========================================================

  requestTransferButton.addEventListener(
    "click",
    async () => {

      const officer =
        selectedOfficer();


      if (!officer) {
        return;
      }


      clearMessage(
        transferMessage
      );


      if (
        !receivingManager.value
      ) {

        showMessage(
          transferMessage,
          "Select the receiving manager.",
          "error"
        );

        receivingManager.focus();

        return;

      }


      if (
        officer.transfer_pending
      ) {

        showMessage(
          transferMessage,
          "This officer already has a pending transfer request.",
          "error"
        );

        return;

      }


      const receiverName =
        profileName(
          receivingManager.value
        );


      const confirmed =
        window.confirm(
          `Send a transfer request for ${officer.display_name} to ${receiverName}?`
        );


      if (!confirmed) {
        return;
      }


      requestTransferButton.disabled =
        true;

      requestTransferButton.textContent =
        "Submitting…";


      try {

        const {
          error
        } =
          await db.rpc(
            "request_officer_transfer",
            {

              p_officer_user_id:
                officer.user_id,

              p_receiving_manager:
                receivingManager.value,

              p_reason:
                transferReason.value
                  .trim() ||
                null

            }
          );


        if (error) {
          throw error;
        }


        transferReason.value =
          "";


        await Promise.all([
          loadTransfers(),
          loadDirectory()
        ]);


        showMessage(
          transferMessage,
          `Transfer request sent to ${receiverName}.`
        );


      } catch (error) {

        console.error(
          "SecureTrack transfer request error:",
          error
        );


        showMessage(
          transferMessage,
          error.message ||
          "Unable to submit transfer request.",
          "error"
        );


      } finally {

        requestTransferButton.textContent =
          "Submit Transfer Request";

        renderSelectedOfficer();

      }

    }
  );


  // =========================================================
  // LOAD TRANSFERS
  // =========================================================

  async function loadTransfers() {

    const {
      data,
      error
    } =
      await db
        .from(
          "officer_transfer_requests"
        )
        .select(
          "id, officer_user_id, from_shift, requested_by, requested_to_manager, reason, status, approved_shift, reviewed_by, reviewed_at, review_notes, created_at"
        )
        .eq(
          "status",
          "pending"
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (error) {
      throw error;
    }


    transfers =
      data || [];


    renderTransfers();

  }


  // =========================================================
  // RENDER TRANSFERS
  // =========================================================

  function renderTransfers() {

    pendingTransfers.innerHTML =
      "";


    pendingTransferCount.textContent =
      `${transfers.length} Pending`;


    if (!transfers.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "directory-empty";

      empty.textContent =
        "No pending transfer requests.";

      pendingTransfers.appendChild(
        empty
      );

      return;

    }


    transfers.forEach(
      transfer => {

        const card =
          document.createElement(
            "article"
          );

        card.className =
          "incoming-transfer";


        const top =
          document.createElement(
            "div"
          );

        top.className =
          "incoming-transfer-top";


        const info =
          document.createElement(
            "div"
          );


        const eyebrow =
          document.createElement(
            "div"
          );

        eyebrow.className =
          "eyebrow";


        if (
          transfer.requested_to_manager ===
          currentUserId
        ) {

          eyebrow.textContent =
            "Incoming Transfer";

        } else if (
          transfer.requested_by ===
          currentUserId
        ) {

          eyebrow.textContent =
            "Outgoing Transfer";

        } else {

          eyebrow.textContent =
            "Transfer Oversight";

        }


        const title =
          document.createElement(
            "h3"
          );

        title.textContent =
          profileName(
            transfer.officer_user_id
          );


        const details =
          document.createElement(
            "div"
          );

        details.className =
          "subtle";


        details.textContent =
          `From ${transfer.from_shift} • Requested by ${profileName(transfer.requested_by)} • Sent to ${profileName(transfer.requested_to_manager)}`;


        info.append(
          eyebrow,
          title,
          details
        );


        if (
          transfer.reason
        ) {

          const reason =
            document.createElement(
              "p"
            );

          reason.textContent =
            `Reason: ${transfer.reason}`;

          info.appendChild(
            reason
          );

        }


        const date =
          document.createElement(
            "div"
          );

        date.className =
          "subtle";

        date.textContent =
          formatDateTime(
            transfer.created_at
          );


        top.append(
          info,
          date
        );


        card.appendChild(
          top
        );


        const actions =
          document.createElement(
            "div"
          );

        actions.className =
          "incoming-transfer-actions";


        const mayReview =
          hasSystemWideAuthority ||
          transfer.requested_to_manager ===
            currentUserId;


        if (mayReview) {

          const destination =
            document.createElement(
              "select"
            );

          destination.className =
            "directory-button";


          const placeholder =
            document.createElement(
              "option"
            );

          placeholder.value =
            "";

          placeholder.textContent =
            "Assign approved shift";

          destination.appendChild(
            placeholder
          );


          /*
            Even when Dennis/Admin reviews,
            keep the destination choices
            within the receiving manager's
            actual command.
          */

          const receivingShifts =
            managerShifts(
              transfer.requested_to_manager
            );


          receivingShifts.forEach(
            shiftName => {

              const option =
                document.createElement(
                  "option"
                );

              option.value =
                shiftName;

              option.textContent =
                shiftName;

              destination.appendChild(
                option
              );

            }
          );


          const approve =
            document.createElement(
              "button"
            );

          approve.type =
            "button";

          approve.className =
            "directory-button primary";

          approve.textContent =
            "Approve Transfer";


          approve.addEventListener(
            "click",
            async () => {

              if (!destination.value) {

                window.alert(
                  "Select the officer's destination shift before approving."
                );

                return;

              }


              await approveTransfer(
                transfer,
                destination.value
              );

            }
          );


          const deny =
            document.createElement(
              "button"
            );

          deny.type =
            "button";

          deny.className =
            "directory-button danger";

          deny.textContent =
            "Deny";


          deny.addEventListener(
            "click",
            async () => {

              await denyTransfer(
                transfer
              );

            }
          );


          actions.append(
            destination,
            approve,
            deny
          );

        }


        const mayCancel =
          hasSystemWideAuthority ||
          transfer.requested_by ===
            currentUserId;


        if (mayCancel) {

          const cancel =
            document.createElement(
              "button"
            );

          cancel.type =
            "button";

          cancel.className =
            "directory-button";

          cancel.textContent =
            "Cancel Request";


          cancel.addEventListener(
            "click",
            async () => {

              await cancelTransfer(
                transfer
              );

            }
          );


          actions.appendChild(
            cancel
          );

        }


        card.appendChild(
          actions
        );


        pendingTransfers.appendChild(
          card
        );

      }
    );

  }


  // =========================================================
  // APPROVE TRANSFER
  // =========================================================

  async function approveTransfer(
    transfer,
    destination
  ) {

    const officerName =
      profileName(
        transfer.officer_user_id
      );


    const confirmed =
      window.confirm(
        `Approve ${officerName}'s transfer and assign them to ${destination}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "approve_officer_transfer",
          {

            p_request_id:
              transfer.id,

            p_destination_shift:
              destination,

            p_review_notes:
              null

          }
        );


      if (error) {
        throw error;
      }


      await refreshAll();


    } catch (error) {

      console.error(
        "SecureTrack transfer approval error:",
        error
      );


      window.alert(
        error.message ||
        "Unable to approve this transfer."
      );

    }

  }


  // =========================================================
  // DENY TRANSFER
  // =========================================================

  async function denyTransfer(
    transfer
  ) {

    const officerName =
      profileName(
        transfer.officer_user_id
      );


    const confirmed =
      window.confirm(
        `Deny the transfer request for ${officerName}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "deny_officer_transfer",
          {

            p_request_id:
              transfer.id,

            p_review_notes:
              null

          }
        );


      if (error) {
        throw error;
      }


      await refreshAll();


    } catch (error) {

      console.error(
        "SecureTrack transfer denial error:",
        error
      );


      window.alert(
        error.message ||
        "Unable to deny this transfer."
      );

    }

  }


  // =========================================================
  // CANCEL TRANSFER REQUEST
  // =========================================================

  async function cancelTransfer(
    transfer
  ) {

    const officerName =
      profileName(
        transfer.officer_user_id
      );


    const confirmed =
      window.confirm(
        `Cancel the pending transfer request for ${officerName}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "cancel_officer_transfer_request",
          {

            p_request_id:
              transfer.id

          }
        );


      if (error) {
        throw error;
      }


      await refreshAll();


    } catch (error) {

      console.error(
        "SecureTrack transfer cancellation error:",
        error
      );


      window.alert(
        error.message ||
        "Unable to cancel this transfer request."
      );

    }

  }


  // =========================================================
  // SHIFT HISTORY
  // =========================================================

  async function loadShiftHistory() {

    const officer =
      selectedOfficer();


    if (!officer) {

      renderEmptyHistory();

      return;

    }


    const {
      data,
      error
    } =
      await db
        .from(
          "officer_shift_history"
        )
        .select(
          "id, from_shift, to_shift, change_type, reason, changed_at"
        )
        .eq(
          "officer_user_id",
          officer.user_id
        )
        .order(
          "changed_at",
          {
            ascending: false
          }
        );


    if (error) {

      console.warn(
        "SecureTrack shift history could not be loaded:",
        error
      );

      renderEmptyHistory(
        "No accessible shift history."
      );

      return;

    }


    renderShiftHistory(
      data || []
    );

  }


  function renderEmptyHistory(
    message =
      "Select an officer to view shift history."
  ) {

    shiftHistoryBody.innerHTML =
      "";


    const tr =
      document.createElement(
        "tr"
      );

    const td =
      document.createElement(
        "td"
      );

    td.colSpan =
      5;

    td.className =
      "directory-empty";

    td.textContent =
      message;


    tr.appendChild(
      td
    );

    shiftHistoryBody.appendChild(
      tr
    );

  }


  function renderShiftHistory(
    history
  ) {

    shiftHistoryBody.innerHTML =
      "";


    if (!history.length) {

      renderEmptyHistory(
        "No recorded shift changes for this officer."
      );

      return;

    }


    history.forEach(
      row => {

        const tr =
          document.createElement(
            "tr"
          );


        const date =
          document.createElement(
            "td"
          );

        date.textContent =
          formatDateTime(
            row.changed_at
          );


        const from =
          document.createElement(
            "td"
          );

        from.textContent =
          row.from_shift ||
          "Unassigned";


        const to =
          document.createElement(
            "td"
          );

        to.textContent =
          row.to_shift ||
          "—";


        const type =
          document.createElement(
            "td"
          );

        type.textContent =
          formatChangeType(
            row.change_type
          );


        const reason =
          document.createElement(
            "td"
          );

        reason.textContent =
          row.reason ||
          "—";


        tr.append(
          date,
          from,
          to,
          type,
          reason
        );


        shiftHistoryBody.appendChild(
          tr
        );

      }
    );

  }


  // =========================================================
  // REFRESH
  // =========================================================

  async function refreshAll() {

    const previousSelection =
      selectedOfficerId;


    await Promise.all([
      loadReferenceProfiles(),
      loadSupervisors()
    ]);


    await Promise.all([
      loadTransfers(),
      loadDirectory()
    ]);


    if (
      previousSelection &&
      officers.some(
        officer =>
          officer.user_id ===
          previousSelection
      )
    ) {

      selectedOfficerId =
        previousSelection;

      renderDirectory();

      renderSelectedOfficer();

      await loadShiftHistory();

    } else {

      selectedOfficerId =
        null;

      renderDirectory();

      renderSelectedOfficer();

    }

  }


  refreshDirectoryButton.addEventListener(
    "click",
    async () => {

      refreshDirectoryButton.disabled =
        true;

      refreshDirectoryButton.textContent =
        "Refreshing…";


      try {

        await refreshAll();

      } catch (error) {

        console.error(
          "SecureTrack directory refresh error:",
          error
        );

      } finally {

        refreshDirectoryButton.disabled =
          false;

        refreshDirectoryButton.textContent =
          "Refresh";

      }

    }
  );


  // =========================================================
  // FILTER EVENTS
  // =========================================================

  directorySearch.addEventListener(
    "input",
    renderDirectory
  );


  directoryShiftFilter.addEventListener(
    "change",
    renderDirectory
  );


  directoryQualificationFilter.addEventListener(
    "change",
    renderDirectory
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
  // INITIALIZE
  // =========================================================

  try {

    await Promise.all([
      loadReferenceProfiles(),
      loadSupervisors()
    ]);


    await Promise.all([
      loadTransfers(),
      loadDirectory()
    ]);


  } catch (error) {

    console.error(
      "SecureTrack Officer Directory initialization error:",
      error
    );


    directoryList.innerHTML =
      "";


    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "directory-empty";

    empty.textContent =
      error.message ||
      "Officer Directory could not be loaded.";


    directoryList.appendChild(
      empty
    );

  }


})();
