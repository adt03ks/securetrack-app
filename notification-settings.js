(async function () {

  "use strict";


  // =========================================================
  // SECURETRACK MANAGER CLIENT
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

  const managerName =
    document.getElementById(
      "managerName"
    );


  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  const loading =
    document.getElementById(
      "settingsLoading"
    );


  const form =
    document.getElementById(
      "notificationSettingsForm"
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


  const failedInspectionAlerts =
    document.getElementById(
      "failedInspectionAlerts"
    );


  const criticalIssueAlerts =
    document.getElementById(
      "criticalIssueAlerts"
    );


  const consentStatusCard =
    document.getElementById(
      "consentStatusCard"
    );


  const consentStatusText =
    document.getElementById(
      "consentStatusText"
    );


  const consentDateText =
    document.getElementById(
      "consentDateText"
    );


  const saveButton =
    document.getElementById(
      "saveNotificationButton"
    );


  const result =
    document.getElementById(
      "notificationResult"
    );


  // =========================================================
  // CURRENT STATE
  // =========================================================

  let loadedPhoneNumber = "";

  let originalConsent =
    false;


  // =========================================================
  // RESULT MESSAGE
  // =========================================================

  function showResult(
    message,
    type = "success"
  ) {

    result.className =
      `result show ${type}`;

    result.textContent =
      message;

  }


  function clearResult() {

    result.className =
      "result";

    result.textContent =
      "";

  }


  // =========================================================
  // PHONE NUMBER NORMALIZATION
  // =========================================================

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


    /*
      Already entered in international
      format such as +13465551234
    */

    if (
      /^\+[1-9][0-9]{7,14}$/
        .test(raw)
    ) {

      return raw;

    }


    /*
      Remove formatting:
      (346) 555-1234
      346-555-1234
      etc.
    */

    const digits =
      raw.replace(
        /\D/g,
        ""
      );


    /*
      Standard U.S. 10-digit number
    */

    if (
      digits.length === 10
    ) {

      return `+1${digits}`;

    }


    /*
      U.S. number already beginning
      with country code 1
    */

    if (
      digits.length === 11 &&
      digits.startsWith("1")
    ) {

      return `+${digits}`;

    }


    /*
      Other international number
    */

    if (
      digits.length >= 8 &&
      digits.length <= 15
    ) {

      return `+${digits}`;

    }


    return raw;

  }


  // =========================================================
  // DISPLAY CONSENT DATE
  // =========================================================

  function formatDate(
    value
  ) {

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

      return "—";

    }


    return date.toLocaleString(
      undefined,
      {
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  }


  // =========================================================
  // CONSENT STATUS DISPLAY
  // =========================================================

  function updateConsentStatus(
    consent,
    consentDate
  ) {

    if (consent) {

      consentStatusText.textContent =
        "Opted In";

      consentDateText.textContent =
        formatDate(
          consentDate
        );

      consentStatusCard.classList.add(
        "active"
      );

    } else {

      consentStatusText.textContent =
        "Not Consented";

      consentDateText.textContent =
        "—";

      consentStatusCard.classList.remove(
        "active"
      );

    }

  }


  // =========================================================
  // CONTROL DEPENDENCIES
  // =========================================================

  function updateControls() {

    const consented =
      smsConsent.checked;


    /*
      SMS cannot remain enabled when
      consent has been removed.
    */

    if (!consented) {

      smsEnabled.checked =
        false;

    }


    smsEnabled.disabled =
      !consented;


    const notificationsActive =
      consented &&
      smsEnabled.checked;


    /*
      Preserve category choices,
      but visually prevent changing
      them until SMS is enabled.
    */

    failedInspectionAlerts.disabled =
      !notificationsActive;

    criticalIssueAlerts.disabled =
      !notificationsActive;

  }


  // =========================================================
  // VERIFY MANAGER SESSION
  // =========================================================

  async function requireSession() {

    const {
      data,
      error
    } =
      await db.auth
        .getSession();


    if (error) {
      throw error;
    }


    const session =
      data?.session;


    if (!session) {

      window.location.replace(
        "manager-login.html"
      );

      return null;

    }


    return session;

  }


  // =========================================================
  // LOAD NOTIFICATION SETTINGS
  // =========================================================

  async function loadSettings() {

    loading.hidden =
      false;

    form.hidden =
      true;


    try {

      const session =
        await requireSession();


      if (!session) {
        return;
      }


      const {
        data,
        error
      } =
        await db.rpc(
          "get_my_notification_settings"
        );


      if (error) {
        throw error;
      }


      const settings =
        data || {};


      // =========================================
      // MANAGER DISPLAY NAME
      // =========================================

      managerName.textContent =
        settings.display_name ||
        session.user.email ||
        "Manager";


      // =========================================
      // PHONE NUMBER
      // =========================================

      phoneInput.value =
        settings.phone_number ||
        "";


      loadedPhoneNumber =
        normalizePhone(
          settings.phone_number ||
          ""
        );


      // =========================================
      // CONSENT
      // =========================================

      smsConsent.checked =
        Boolean(
          settings.sms_consent
        );


      originalConsent =
        Boolean(
          settings.sms_consent
        );


      // =========================================
      // SMS ENABLED
      // =========================================

      smsEnabled.checked =
        Boolean(
          settings.sms_enabled
        );


      // =========================================
      // ALERT CATEGORIES
      // =========================================

      failedInspectionAlerts.checked =
        settings.failed_inspection_alerts
          !== false;


      criticalIssueAlerts.checked =
        settings.critical_issue_alerts
          !== false;


      // =========================================
      // CONSENT STATUS
      // =========================================

      updateConsentStatus(
        Boolean(
          settings.sms_consent
        ),
        settings.sms_consent_at
      );


      updateControls();


      loading.hidden =
        true;

      form.hidden =
        false;


    } catch (error) {

      console.error(
        "SecureTrack notification settings load error:",
        error
      );


      loading.textContent =
        "Notification settings could not be loaded.";


      showResult(
        error.message ||
        "Unable to load notification settings.",
        "error"
      );

    }

  }


  // =========================================================
  // PHONE NUMBER CHANGED
  // =========================================================

  phoneInput.addEventListener(
    "input",
    () => {

      clearResult();


      const currentPhone =
        normalizePhone(
          phoneInput.value
        );


      /*
        Consent is tied to the number
        that originally received permission.

        If the manager changes the mobile
        number, SecureTrack requires the
        consent checkbox to be selected
        again before SMS can be enabled.
      */

      if (
        loadedPhoneNumber &&
        currentPhone &&
        currentPhone !==
          loadedPhoneNumber
      ) {

        smsConsent.checked =
          false;

        smsEnabled.checked =
          false;


        consentStatusText.textContent =
          "New Consent Required";

        consentDateText.textContent =
          "—";

        consentStatusCard.classList.remove(
          "active"
        );


        updateControls();

      }

    }
  );


  // =========================================================
  // CONSENT CHECKBOX
  // =========================================================

  smsConsent.addEventListener(
    "change",
    () => {

      clearResult();


      if (
        smsConsent.checked
      ) {

        consentStatusText.textContent =
          originalConsent
            ? "Opted In"
            : "Consent Pending Save";

      } else {

        consentStatusText.textContent =
          originalConsent
            ? "Opt-Out Pending Save"
            : "Not Consented";

        consentDateText.textContent =
          "—";

      }


      updateControls();

    }
  );


  // =========================================================
  // SMS ENABLED CHECKBOX
  // =========================================================

  smsEnabled.addEventListener(
    "change",
    () => {

      clearResult();

      updateControls();

    }
  );


  // =========================================================
  // SAVE NOTIFICATION SETTINGS
  // =========================================================

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      clearResult();


      const normalizedPhone =
        normalizePhone(
          phoneInput.value
        );


      // =========================================
      // VALIDATE PHONE
      // =========================================

      if (
        !/^\+[1-9][0-9]{7,14}$/
          .test(
            normalizedPhone
          )
      ) {

        showResult(
          "Enter a valid mobile number. U.S. numbers may be entered as 10 digits or in +1 international format.",
          "error"
        );

        phoneInput.focus();

        return;

      }


      // =========================================
      // VALIDATE CONSENT
      // =========================================

      if (
        smsEnabled.checked &&
        !smsConsent.checked
      ) {

        showResult(
          "You must agree to receive SecureTrack text messages before SMS notifications can be enabled.",
          "error"
        );

        smsConsent.focus();

        return;

      }


      // =========================================
      // SAVE
      // =========================================

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
            "save_my_notification_settings",
            {

              p_phone_number:
                normalizedPhone,

              p_sms_enabled:
                smsEnabled.checked,

              p_sms_consent:
                smsConsent.checked,

              p_failed_inspection_alerts:
                failedInspectionAlerts.checked,

              p_critical_issue_alerts:
                criticalIssueAlerts.checked

            }
          );


        if (error) {
          throw error;
        }


        const settings =
          data || {};


        // =======================================
        // UPDATE FORM WITH SAVED VALUES
        // =======================================

        phoneInput.value =
          settings.phone_number ||
          normalizedPhone;


        loadedPhoneNumber =
          normalizePhone(
            settings.phone_number ||
            normalizedPhone
          );


        smsConsent.checked =
          Boolean(
            settings.sms_consent
          );


        smsEnabled.checked =
          Boolean(
            settings.sms_enabled
          );


        failedInspectionAlerts.checked =
          Boolean(
            settings.failed_inspection_alerts
          );


        criticalIssueAlerts.checked =
          Boolean(
            settings.critical_issue_alerts
          );


        originalConsent =
          Boolean(
            settings.sms_consent
          );


        updateConsentStatus(
          Boolean(
            settings.sms_consent
          ),
          settings.sms_consent_at
        );


        updateControls();


        // =======================================
        // SUCCESS MESSAGE
        // =======================================

       // =======================================
// SUCCESS MESSAGE
// =======================================

if (
  settings.confirmation_pending
) {

  showResult(
    "Notification preferences saved. Your SMS consent has been recorded and a SecureTrack opt-in confirmation text has been queued."
  );

} else if (
  settings.sms_consent &&
  settings.sms_enabled
) {

  showResult(
    "Notification preferences saved. SecureTrack SMS notifications are enabled for this mobile number."
  );

} else if (
  settings.sms_consent
) {

  showResult(
    "Notification preferences saved. SMS consent is recorded, but text notifications are currently disabled."
  );

} else {

  showResult(
    "Notification preferences saved. SMS messaging is disabled and no active SMS consent is recorded."
  );

}

          showResult(
            "Notification preferences saved. SecureTrack SMS notifications are enabled for this mobile number."
          );

        } else if (
          settings.sms_consent
        ) {

          showResult(
            "Notification preferences saved. SMS consent is recorded, but text notifications are currently disabled."
          );

        } else {

          showResult(
            "Notification preferences saved. SMS messaging is disabled and no active SMS consent is recorded."
          );

        }


        saveButton.textContent =
          "✓ Preferences Saved";


        setTimeout(
          () => {

            saveButton.textContent =
              "Save Notification Preferences";

          },
          1800
        );


      } catch (error) {

        console.error(
          "SecureTrack notification settings save error:",
          error
        );


        showResult(
          error.message ||
          "Notification preferences could not be saved.",
          "error"
        );


      } finally {

        saveButton.disabled =
          false;

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


      try {

        await db.auth
          .signOut();

      } finally {

        window.location.replace(
          "manager-login.html"
        );

      }

    }
  );


  // =========================================================
  // INITIALIZE PAGE
  // =========================================================

  await loadSettings();


})();
