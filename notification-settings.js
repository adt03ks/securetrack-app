(async function () {

  "use strict";


  const STM =
    window.SecureTrackManager;


  if (
    !STM ||
    !STM.db
  ) {

    console.error(
      "SecureTrack client is unavailable."
    );

    return;

  }


  const db =
    STM.db;


  const loading =
    document.getElementById(
      "settingsLoading"
    );


  const form =
    document.getElementById(
      "notificationForm"
    );


  const accountEmail =
    document.getElementById(
      "accountEmail"
    );


  const emailEnabled =
    document.getElementById(
      "emailEnabled"
    );


  const phoneInput =
    document.getElementById(
      "notificationPhone"
    );


  const smsConsent =
    document.getElementById(
      "smsConsent"
    );


  const smsEnabled =
    document.getElementById(
      "smsEnabled"
    );

    // =========================================================
  // PUSH NOTIFICATION ELEMENTS
  // =========================================================

  const pushEnabled =
    document.getElementById(
      "pushEnabled"
    );

  const pushStatus =
    document.getElementById(
      "pushStatus"
    );

  const pushPermissionNote =
    document.getElementById(
      "pushPermissionNote"
    );

  const pushDeviceSection =
    document.getElementById(
      "pushDeviceSection"
    );

  const pushDeviceList =
    document.getElementById(
      "pushDeviceList"
    );

  const enablePushButton =
    document.getElementById(
      "enablePushButton"
    );

  const codeGreenAlerts =
    document.getElementById(
      "codeGreenAlerts"
    );


  const taserPullAlerts =
    document.getElementById(
      "taserPullAlerts"
    );


  const ctwAlerts =
    document.getElementById(
      "ctwAlerts"
    );


  const officerInjuryAlerts =
    document.getElementById(
      "officerInjuryAlerts"
    );


  const insufficientStaffingAlerts =
    document.getElementById(
      "insufficientStaffingAlerts"
    );


  const failedInspectionAlerts =
    document.getElementById(
      "failedInspectionAlerts"
    );


  const criticalIssueAlerts =
    document.getElementById(
      "criticalIssueAlerts"
    );


  const saveButton =
    document.getElementById(
      "saveNotificationButton"
    );


  const result =
    document.getElementById(
      "notificationResult"
    );


  let loadedPhone =
    "";


  function showResult(
    text,
    type = "success"
  ) {

    result.textContent =
      text;


    result.className =
      `notification-result show ${type}`;

  }


  function clearResult() {

    result.textContent =
      "";


    result.className =
      "notification-result";

  }


  function normalizePhone(
    value
  ) {

    const raw =
      String(
        value || ""
      ).trim();


    if (!raw) {
      return "";
    }


    if (
      /^\+[1-9][0-9]{7,14}$/
        .test(
          raw
        )
    ) {

      return raw;

    }


    const digits =
      raw.replace(
        /\D/g,
        ""
      );


    if (
      digits.length ===
      10
    ) {

      return `+1${digits}`;

    }


    if (
      digits.length ===
      11 &&
      digits.startsWith(
        "1"
      )
    ) {

      return `+${digits}`;

    }


    return raw;

  }


  function updateSmsControls() {

    if (
      !smsConsent.checked
    ) {

      smsEnabled.checked =
        false;

    }


    smsEnabled.disabled =
      !smsConsent.checked;

  }


  function populate(
    settings
  ) {

    const email =
      String(
        settings.email ||
        ""
      ).trim();


    accountEmail.textContent =
      email ||
      "No email address on file";


    emailEnabled.checked =
      Boolean(
        settings.email_enabled
      );


    if (!email) {

      emailEnabled.checked =
        false;


      emailEnabled.disabled =
        true;

    }
    else {

      emailEnabled.disabled =
        false;

    }


    phoneInput.value =
      settings.phone_number ||
      "";


    loadedPhone =
      normalizePhone(
        settings.phone_number ||
        ""
      );


    smsConsent.checked =
      Boolean(
        settings.sms_consent
      );


    smsEnabled.checked =
      Boolean(
        settings.sms_enabled
      );


    codeGreenAlerts.checked =
      settings.code_green_alerts !==
      false;


    taserPullAlerts.checked =
      settings.taser_pull_alerts !==
      false;


    ctwAlerts.checked =
      settings.ctw_alerts !==
      false;


    officerInjuryAlerts.checked =
      settings.officer_injury_alerts !==
      false;


    insufficientStaffingAlerts.checked =
      settings
        .insufficient_staffing_alerts !==
      false;


    failedInspectionAlerts.checked =
      settings
        .failed_inspection_alerts !==
      false;


    criticalIssueAlerts.checked =
      settings
        .critical_issue_alerts !==
      false;


    updateSmsControls();

  }

  // =========================================================
  // LOAD PUSH NOTIFICATION STATUS
  // =========================================================

  async function loadPushStatus() {

    if (
      !pushEnabled ||
      !pushStatus
    ) {
      return;
    }


    pushEnabled.disabled =
      true;

    pushEnabled.checked =
      false;

    enablePushButton.hidden =
      true;

    pushPermissionNote.hidden =
      true;

    pushStatus.textContent =
      "Checking SecureTrack push status…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "get_my_push_notification_status"
        );


      if (error) {
        throw error;
      }


      const state =
        data || {};


      const devices =
        Array.isArray(
          state.devices
        )
          ? state.devices
          : [];


      const activeDevices =
        devices.filter(
          device =>
            device.is_active === true &&
            device.permission_status ===
              "granted"
        );


      // =========================================
      // MASTER PUSH STATUS
      // =========================================

      pushEnabled.checked =
        Boolean(
          state.push_enabled &&
          activeDevices.length > 0
        );


      // =========================================
      // DEVICE DISPLAY
      // =========================================

      if (
        devices.length > 0
      ) {

        pushDeviceSection.hidden =
          false;


        pushDeviceList.innerHTML =
          devices
            .map(
              device => {

                const label =
                  device.device_label ||
                  "Registered Device";

                const browser =
                  device.browser_name ||
                  "Browser";

                const os =
                  device.operating_system ||
                  "Operating System";

                const status =
                  device.is_active
                    ? "Active"
                    : "Inactive";

                const lastSeen =
                  device.last_seen_at
                    ? new Date(
                        device.last_seen_at
                      ).toLocaleString()
                    : "Unknown";


                return `
                  <div
                    style="
                      padding:9px 0;
                      border-bottom:
                        1px solid #30363d;
                    "
                  >
                    <strong>
                      ${label}
                    </strong>

                    <br>

                    <span>
                      ${browser} • ${os}
                    </span>

                    <br>

                    <span>
                      ${status}
                      • Last seen ${lastSeen}
                    </span>
                  </div>
                `;

              }
            )
            .join("");

      } else {

        pushDeviceSection.hidden =
          true;

        pushDeviceList.textContent =
          "No registered push devices.";

      }


      // =========================================
      // BROWSER SUPPORT / PERMISSION
      // =========================================

      if (
        !(
          "Notification" in window
        )
      ) {

        pushStatus.textContent =
          "This browser does not support SecureTrack push notifications.";

        pushPermissionNote.hidden =
          false;

        pushPermissionNote.textContent =
          "Use an approved browser that supports web notifications.";

        return;

      }


      if (
        Notification.permission ===
        "denied"
      ) {

        pushStatus.textContent =
          "Push notifications are blocked in this browser.";

        pushPermissionNote.hidden =
          false;

        pushPermissionNote.textContent =
          "Notifications must be allowed for securetrackop.com in the browser before this device can receive SecureTrack alerts.";

        return;

      }


      // =========================================
      // ACTIVE DEVICE
      // =========================================

      if (
        activeDevices.length > 0
      ) {

        pushStatus.textContent =
          activeDevices.length === 1
            ? "SecureTrack push notifications are active on 1 registered device."
            : `SecureTrack push notifications are active on ${activeDevices.length} registered devices.`;

        pushPermissionNote.hidden =
          true;

        return;

      }


      // =========================================
      // NO ACTIVE DEVICE YET
      // =========================================

      pushStatus.textContent =
        "SecureTrack push is not yet active on this device.";

      pushPermissionNote.hidden =
        false;

      pushPermissionNote.textContent =
        Notification.permission ===
        "granted"
          ? "Browser permission is already granted. SecureTrack is ready for the push provider connection."
          : "This browser will ask for notification permission when SecureTrack push is activated.";

      /*
        Keep this hidden until the push provider
        is connected in the next step.
      */

      enablePushButton.hidden =
        true;


    } catch (error) {

      console.error(
        "SecureTrack push status error:",
        error
      );


      pushEnabled.checked =
        false;

      pushEnabled.disabled =
        true;


      pushStatus.textContent =
        "Push notification status could not be loaded.";


      pushPermissionNote.hidden =
        false;

      pushPermissionNote.textContent =
        error.message ||
        "SecureTrack could not retrieve this device's push status.";

    }

  }
  
  async function loadSettings() {

    loading.hidden =
      false;


    form.hidden =
      true;


    try {


      const session =
        await STM.getSession();


      if (
        !session
      ) {

        window.location.replace(
          "login.html?next=notification-settings.html"
        );

        return;

      }


      const {
        data,
        error
      } =
        await db.rpc(
          "get_my_notification_preferences"
        );


      if (error) {

        throw error;

      }


      populate(
        data || {}
      );

            await loadPushStatus();

      loading.hidden =
        true;


      form.hidden =
        false;


    }
    catch (error) {

      console.error(
        "Notification settings load error:",
        error
      );


      loading.textContent =
        error?.message ||
        "Unable to load notification preferences.";

    }

  }


  smsConsent.addEventListener(
    "change",
    () => {

      clearResult();

      updateSmsControls();

    }
  );


  phoneInput.addEventListener(
    "input",
    () => {

      clearResult();


      const current =
        normalizePhone(
          phoneInput.value
        );


      /*
        Existing SMS consent belongs to the number
        that was originally approved.

        If the number changes, require consent again.
      */

      if (
        loadedPhone &&
        current &&
        current !==
          loadedPhone
      ) {

        smsConsent.checked =
          false;


        smsEnabled.checked =
          false;


        updateSmsControls();

      }

    }
  );


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      clearResult();


      const normalizedPhone =
        normalizePhone(
          phoneInput.value
        );


      if (
        (
          smsConsent.checked ||
          smsEnabled.checked
        )
        &&
        !/^\+[1-9][0-9]{7,14}$/
          .test(
            normalizedPhone
          )
      ) {

        showResult(
          "Enter a valid mobile number before enabling SMS notifications.",
          "error"
        );


        phoneInput.focus();

        return;

      }


      if (
        smsEnabled.checked &&
        !smsConsent.checked
      ) {

        showResult(
          "SMS consent is required before text alerts can be enabled.",
          "error"
        );

        return;

      }


      saveButton.disabled =
        true;


      saveButton.textContent =
        "Saving Preferences…";


      try {


        const {
          data,
          error
        } =
          await db.rpc(
            "save_my_notification_preferences",
            {

              p_email_enabled:
                emailEnabled.checked,

              p_sms_enabled:
                smsEnabled.checked,

              p_sms_consent:
                smsConsent.checked,

              p_phone_number:
                normalizedPhone,

              p_failed_inspection_alerts:
                failedInspectionAlerts.checked,

              p_critical_issue_alerts:
                criticalIssueAlerts.checked,

              p_code_green_alerts:
                codeGreenAlerts.checked,

              p_taser_pull_alerts:
                taserPullAlerts.checked,

              p_ctw_alerts:
                ctwAlerts.checked,

              p_officer_injury_alerts:
                officerInjuryAlerts.checked,

              p_insufficient_staffing_alerts:
                insufficientStaffingAlerts.checked

            }
          );


        if (error) {

          throw error;

        }


        populate(
          data || {}
        );


        showResult(
          "Notification preferences saved successfully."
        );


        saveButton.textContent =
          "✓ Preferences Saved";


        setTimeout(
          () => {

            saveButton.textContent =
              "Save Notification Preferences";

          },
          1800
        );


      }
      catch (error) {

        console.error(
          "Notification settings save error:",
          error
        );


        showResult(
          error?.message ||
          "Unable to save notification preferences.",
          "error"
        );

      }
      finally {

        saveButton.disabled =
          false;

      }

    }
  );


  await loadSettings();


})();
