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


  const ntfyEnabled =
    document.getElementById(
      "ntfyEnabled"
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


    ntfyEnabled.checked =
      Boolean(
        settings.ntfy_enabled
      );


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

              p_ntfy_enabled:
                ntfyEnabled.checked,

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
