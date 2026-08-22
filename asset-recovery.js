(async function () {

  "use strict";


  // =========================================================
  // SECURETRACK
  // MANAGER ADMINISTRATIVE DEVICE RECOVERY
  // =========================================================


  const STM =
    window.SecureTrackManager;


  if (!STM || !STM.db) {

    console.error(
      "SecureTrack Manager client is unavailable."
    );

    return;

  }


  const db =
    STM.db;


  // =========================================================
  // PAGE ELEMENTS
  // =========================================================

  const recoveryCard =
    document.getElementById(
      "managerRecoveryCard"
    );


  const openRecoveryButton =
    document.getElementById(
      "openRecoveryButton"
    );


  const recoveryModal =
    document.getElementById(
      "recoveryModal"
    );


  const recoveryForm =
    document.getElementById(
      "recoveryForm"
    );


  const physicallyPresent =
    document.getElementById(
      "devicePhysicallyPresent"
    );


  const recoveryReason =
    document.getElementById(
      "recoveryReason"
    );


  const recoveryNotes =
    document.getElementById(
      "recoveryNotes"
    );


  const cancelRecoveryButton =
    document.getElementById(
      "cancelRecoveryButton"
    );


  const confirmRecoveryButton =
    document.getElementById(
      "confirmRecoveryButton"
    );


  const recoveryResult =
    document.getElementById(
      "recoveryResult"
    );


  const recoveryCustodianName =
    document.getElementById(
      "recoveryCustodianName"
    );


  const backdrop =
    recoveryModal?.querySelector(
      ".recovery-modal-backdrop"
    );


  // =========================================================
  // DEVICE STATE
  // =========================================================

  let currentDevice =
    null;


  let currentCustodian =
    null;


  // =========================================================
  // GET DEVICE ID FROM URL
  //
  // asset-history.html?device=<uuid>
  // =========================================================

  const params =
    new URLSearchParams(
      window.location.search
    );


  const deviceId =
    params.get(
      "device"
    );


  if (!deviceId) {

    console.error(
      "SecureTrack recovery: Device ID is missing from the page URL."
    );

    return;

  }


  // =========================================================
  // RESULT MESSAGE
  // =========================================================

  function showRecoveryResult(
    message,
    type = "success"
  ) {

    recoveryResult.className =
      `result show ${type}`;

    recoveryResult.textContent =
      message;

  }


  function clearRecoveryResult() {

    recoveryResult.className =
      "result";

    recoveryResult.textContent =
      "";

  }


  // =========================================================
  // HUMANIZE RECOVERY REASON
  // =========================================================

  function humanizeReason(
    value
  ) {

    const labels = {

      left_end_of_shift:
        "Left at end of shift",

      found_unattended:
        "Device found unattended",

      officer_unavailable:
        "Officer unavailable",

      administrative_recovery:
        "Administrative recovery",

      other:
        "Other"

    };


    return labels[value] ||
      value ||
      "Administrative recovery";

  }


  // =========================================================
  // VERIFY MANAGER SESSION
  // =========================================================

  async function requireManagerSession() {

    const {
      data,
      error
    } =
      await db.auth
        .getSession();


    if (error) {
      throw error;
    }


    if (!data?.session) {

      window.location.replace(
        "manager-login.html"
      );

      return false;

    }


    return true;

  }


  // =========================================================
  // LOAD DEVICE
  // =========================================================

  async function loadRecoveryDevice() {

    try {

      const authenticated =
        await requireManagerSession();


      if (!authenticated) {
        return;
      }


      const {
        data: device,
        error: deviceError
      } =
        await db
          .from(
            "devices"
          )
          .select(
            `
              id,
              public_token,
              asset_code,
              status,
              current_custodian_id
            `
          )
          .eq(
            "id",
            deviceId
          )
          .single();


      if (deviceError) {
        throw deviceError;
      }


      currentDevice =
        device;


      // =====================================================
      // ONLY DISPLAY RECOVERY WHEN DEVICE IS CHECKED OUT
      // =====================================================

      if (
        device.status !==
        "checked_out"
      ) {

        recoveryCard.hidden =
          true;

        currentCustodian =
          null;

        return;

      }


      recoveryCard.hidden =
        false;


      // =====================================================
      // LOAD CURRENT CUSTODIAN
      // =====================================================

      if (
        device.current_custodian_id
      ) {

        const {
          data: employee,
          error: employeeError
        } =
          await db
            .from(
              "employees"
            )
            .select(
              `
                id,
                display_name
              `
            )
            .eq(
              "id",
              device.current_custodian_id
            )
            .single();


        if (
          employeeError
        ) {

          console.warn(
            "SecureTrack could not load current custodian:",
            employeeError
          );


          currentCustodian = {
            display_name:
              "Current Assigned Officer"
          };


        } else {

          currentCustodian =
            employee;

        }


      } else {

        currentCustodian = {
          display_name:
            "No custodian name available"
        };

      }


      recoveryCustodianName.textContent =
        currentCustodian
          ?.display_name ||
        "Current Assigned Officer";


    } catch (error) {

      console.error(
        "SecureTrack recovery device load error:",
        error
      );


      /*
        Recovery controls remain hidden if
        SecureTrack cannot confidently
        determine the device state.
      */

      recoveryCard.hidden =
        true;

    }

  }


  // =========================================================
  // OPEN RECOVERY MODAL
  // =========================================================

  function openRecoveryModal() {

    if (
      !currentDevice ||
      currentDevice.status !==
        "checked_out"
    ) {

      return;

    }


    clearRecoveryResult();


    recoveryForm.reset();


    recoveryCustodianName.textContent =
      currentCustodian
        ?.display_name ||
      "Current Assigned Officer";


    recoveryModal.hidden =
      false;


    document.body.style.overflow =
      "hidden";


    physicallyPresent.focus();

  }


  // =========================================================
  // CLOSE RECOVERY MODAL
  // =========================================================

  function closeRecoveryModal() {

    recoveryModal.hidden =
      true;


    document.body.style.overflow =
      "";


    recoveryForm.reset();


    clearRecoveryResult();


    confirmRecoveryButton.disabled =
      false;


    confirmRecoveryButton.textContent =
      "Confirm Administrative Return";

  }


  // =========================================================
  // OPEN BUTTON
  // =========================================================

  openRecoveryButton
    ?.addEventListener(
      "click",
      openRecoveryModal
    );


  // =========================================================
  // CANCEL BUTTON
  // =========================================================

  cancelRecoveryButton
    ?.addEventListener(
      "click",
      closeRecoveryModal
    );


  // =========================================================
  // BACKDROP CLICK
  // =========================================================

  backdrop
    ?.addEventListener(
      "click",
      closeRecoveryModal
    );


  // =========================================================
  // ESCAPE KEY
  // =========================================================

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Escape" &&
        !recoveryModal.hidden
      ) {

        closeRecoveryModal();

      }

    }
  );


  // =========================================================
  // OTHER = NOTES REQUIRED
  // =========================================================

  recoveryReason
    ?.addEventListener(
      "change",
      () => {

        clearRecoveryResult();


        if (
          recoveryReason.value ===
          "other"
        ) {

          recoveryNotes.required =
            true;


          recoveryNotes.placeholder =
            "Required: describe the circumstances for this recovery…";


        } else {

          recoveryNotes.required =
            false;


          recoveryNotes.placeholder =
            "Document circumstances surrounding the administrative recovery...";

        }

      }
    );


  // =========================================================
  // RECOVERY SUBMIT
  // =========================================================

  recoveryForm
    ?.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        clearRecoveryResult();


        // ===================================================
        // DEVICE MUST STILL BE CHECKED OUT
        // ===================================================

        if (
          !currentDevice ||
          currentDevice.status !==
            "checked_out"
        ) {

          showRecoveryResult(
            "This device is no longer eligible for administrative recovery.",
            "error"
          );

          return;

        }


        // ===================================================
        // PHYSICAL PRESENCE REQUIRED
        // ===================================================

        if (
          !physicallyPresent.checked
        ) {

          showRecoveryResult(
            "You must confirm that the device is physically present before performing an administrative return.",
            "error"
          );


          physicallyPresent.focus();

          return;

        }


        // ===================================================
        // REASON REQUIRED
        // ===================================================

        const reason =
          recoveryReason.value;


        if (!reason) {

          showRecoveryResult(
            "Select the reason for this administrative recovery.",
            "error"
          );


          recoveryReason.focus();

          return;

        }


        // ===================================================
        // NOTES
        // ===================================================

        const notes =
          recoveryNotes.value
            .trim();


        if (
          reason === "other" &&
          !notes
        ) {

          showRecoveryResult(
            "Recovery notes are required when Other is selected.",
            "error"
          );


          recoveryNotes.focus();

          return;

        }


        // ===================================================
        // FINAL SUBMISSION
        // ===================================================

        confirmRecoveryButton.disabled =
          true;


        confirmRecoveryButton.textContent =
          "Recording Recovery…";


        try {

          /*
            Re-read the device immediately
            before recovery.

            This reduces the chance that the
            manager acts on stale browser data.
          */

          const {
            data: freshDevice,
            error: freshError
          } =
            await db
              .from(
                "devices"
              )
              .select(
                `
                  id,
                  public_token,
                  asset_code,
                  status,
                  current_custodian_id
                `
              )
              .eq(
                "id",
                deviceId
              )
              .single();


          if (freshError) {
            throw freshError;
          }


          if (
            freshDevice.status !==
            "checked_out"
          ) {

            throw new Error(
              "This device is no longer checked out. The recovery was not performed."
            );

          }


          // =================================================
          // CALL MANAGER-ONLY RPC
          // =================================================

          const {
            data,
            error
          } =
            await db.rpc(
              "recover_checked_out_device",
              {

                p_public_token:
                  freshDevice.public_token,

                p_reason:
                  reason,

                p_physically_present:
                  true,

                p_notes:
                  notes || null

              }
            );


          if (error) {
            throw error;
          }


          // =================================================
          // UPDATE LOCAL STATE
          // =================================================

          currentDevice = {
            ...freshDevice,

            status:
              "available",

            current_custodian_id:
              null
          };


          // =================================================
          // UPDATE VISIBLE DEVICE HEADER IMMEDIATELY
          // =================================================

          const historyStatus =
            document.getElementById(
              "historyStatus"
            );


          const historyCustodian =
            document.getElementById(
              "historyCustodian"
            );


          const historyAttention =
            document.getElementById(
              "historyAttention"
            );


          if (historyStatus) {

            historyStatus.textContent =
              "AVAILABLE";

          }


          if (historyCustodian) {

            historyCustodian.textContent =
              "None";

          }


          if (historyAttention) {

            historyAttention.textContent =
              "INSPECTION REQUIRED";

          }


          // =================================================
          // HIDE FORCE RETURN CONTROL
          // =================================================

          recoveryCard.hidden =
            true;


          // =================================================
          // SUCCESS
          // =================================================

          const previousOfficer =
            data?.previous_custodian ||
            currentCustodian
              ?.display_name ||
            "previous custodian";


          const assetCode =
            data?.asset_code ||
            freshDevice.asset_code ||
            "Device";


          showRecoveryResult(

            `${assetCode} was administratively returned from ${previousOfficer}. The device is now AVAILABLE and requires a new passing inspection before checkout.`

          );


          confirmRecoveryButton.textContent =
            "✓ Administrative Return Recorded";


          /*
            Give the manager enough time to
            read the confirmation.

            Then reload Asset History so the
            timeline is rebuilt from the
            database using the latest records.
          */

          setTimeout(
            () => {

              window.location.reload();

            },
            2200
          );


        } catch (error) {

          console.error(
            "SecureTrack administrative recovery error:",
            error
          );


          showRecoveryResult(

            error.message ||
            "Administrative recovery could not be completed.",

            "error"

          );


          confirmRecoveryButton.disabled =
            false;


          confirmRecoveryButton.textContent =
            "Confirm Administrative Return";

        }

      }
    );


  // =========================================================
  // REALTIME DEVICE CHANGE
  //
  // If another manager/officer changes this device while
  // this page is open, reload recovery eligibility.
  // =========================================================

  const recoveryChannel =
    db
      .channel(
        `securetrack-recovery-${deviceId}`
      )
      .on(
        "postgres_changes",
        {

          event:
            "UPDATE",

          schema:
            "public",

          table:
            "devices",

          filter:
            `id=eq.${deviceId}`

        },

        async () => {

          await loadRecoveryDevice();

        }
      )
      .subscribe();


  // =========================================================
  // INITIALIZE
  // =========================================================

  await loadRecoveryDevice();


})();
