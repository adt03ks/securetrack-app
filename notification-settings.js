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

  // =========================================================
// ONESIGNAL
// =========================================================

async function waitForOneSignal() {

  for (
    let attempt = 0;
    attempt < 40;
    attempt++
  ) {

    if (
      window.SecureTrackOneSignal
    ) {

      return window.SecureTrackOneSignal;

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }


  throw new Error(
    "OneSignal did not initialize."
  );

}



async function connectOneSignalUser(
  session
) {

  if (
    !session?.user?.id
  ) {

    throw new Error(
      "SecureTrack user identity is unavailable."
    );

  }


  const OneSignal =
    await waitForOneSignal();


  /*
    Use the authenticated Supabase UUID
    as OneSignal's External ID.

    This connects the OneSignal user to
    the same SecureTrack identity used
    throughout the application.
  */

 await OneSignal.login(session.user.id);


  console.log(
    "SecureTrack OneSignal user connected:",
    session.user.id
  );


  return OneSignal;

}

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

     // OneSignal is now connected.
// Allow this browser/device to be enrolled.

enablePushButton.hidden =
  false;

enablePushButton.disabled =
  false;

enablePushButton.textContent =
  "Enable Push Notifications";

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

// =========================================================
// DETECT BROWSER / OPERATING SYSTEM
// =========================================================

function getPushDeviceInfo() {

  const ua =
    navigator.userAgent || "";


  let browser =
    "Browser";


  if (
    /Edg\//i.test(ua)
  ) {

    browser =
      "Microsoft Edge";

  }
  else if (
    /Chrome\//i.test(ua)
  ) {

    browser =
      "Google Chrome";

  }
  else if (
    /Firefox\//i.test(ua)
  ) {

    browser =
      "Mozilla Firefox";

  }
  else if (
    /Safari\//i.test(ua) &&
    !/Chrome\//i.test(ua)
  ) {

    browser =
      "Safari";

  }


  let operatingSystem =
    "Operating System";


  if (
    /Windows NT/i.test(ua)
  ) {

    operatingSystem =
      "Windows";

  }
  else if (
    /Android/i.test(ua)
  ) {

    operatingSystem =
      "Android";

  }
  else if (
    /iPhone|iPad|iPod/i.test(ua)
  ) {

    operatingSystem =
      "iOS";

  }
  else if (
    /Macintosh|Mac OS X/i.test(ua)
  ) {

    operatingSystem =
      "macOS";

  }
  else if (
    /Linux/i.test(ua)
  ) {

    operatingSystem =
      "Linux";

  }


  return {

    browser,

    operatingSystem,

    deviceLabel:
      `${browser} on ${operatingSystem}`

  };

}



// =========================================================
// WAIT FOR ONESIGNAL SUBSCRIPTION ID
// =========================================================

async function waitForOneSignalSubscriptionId(
  OneSignal
) {

  for (
    let attempt = 0;
    attempt < 40;
    attempt++
  ) {

    const subscriptionId =
      OneSignal?.User
        ?.PushSubscription
        ?.id;


    if (
      subscriptionId
    ) {

      return subscriptionId;

    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }


  throw new Error(
    "OneSignal did not return a push subscription ID."
  );

}



// =========================================================
// ENABLE PUSH NOTIFICATIONS
// =========================================================

async function enableSecureTrackPush() {

  clearResult();


  enablePushButton.disabled =
    true;

  enablePushButton.textContent =
    "Enabling Push…";


  pushStatus.textContent =
    "Requesting notification permission…";


  try {

    const session =
      await STM.getSession();


    if (
      !session?.user?.id
    ) {

      throw new Error(
        "An active SecureTrack login is required."
      );

    }


    const OneSignal =
      await waitForOneSignal();


    // Make sure this OneSignal user belongs
    // to the authenticated SecureTrack account.

   // TEMP TEST:
// await OneSignal.login(session.user.id);


    // =========================================
    // REQUEST BROWSER PERMISSION
    // =========================================

    if (
      Notification.permission !==
      "granted"
    ) {

      await OneSignal.Notifications
        .requestPermission();

    }


    if (
      Notification.permission !==
      "granted"
    ) {

      throw new Error(
        "Notification permission was not granted."
      );

    }


    // =========================================
    // OPT THIS DEVICE INTO ONESIGNAL PUSH
    // =========================================

    await OneSignal.User
      .PushSubscription
      .optIn();


    // =========================================
    // GET ONESIGNAL SUBSCRIPTION ID
    // =========================================

    const subscriptionId =
      await waitForOneSignalSubscriptionId(
        OneSignal
      );


    console.log(
      "SecureTrack OneSignal subscription:",
      subscriptionId
    );


    // =========================================
    // DEVICE INFORMATION
    // =========================================

    const deviceInfo =
      getPushDeviceInfo();


    // =========================================
    // REGISTER DEVICE IN SUPABASE
    // =========================================

    const {
      data: registration,
      error: registrationError
    } =
      await db.rpc(
        "register_my_push_subscription",
        {

          p_provider:
            "onesignal",

          p_provider_subscription_id:
            subscriptionId,

          p_device_label:
            deviceInfo.deviceLabel,

          p_browser_name:
            deviceInfo.browser,

          p_operating_system:
            deviceInfo.operatingSystem,

          p_permission_status:
            "granted"

        }
      );


    if (
      registrationError
    ) {

      throw registrationError;

    }


    console.log(
      "SecureTrack push registration:",
      registration
    );


    // =========================================
    // ENABLE MASTER PUSH PREFERENCE
    // =========================================

    const {
      error: preferenceError
    } =
      await db.rpc(
        "save_my_push_preferences",
        {

          p_push_enabled:
            true,

          p_code_green:
            codeGreenAlerts.checked,

          p_taser_pull:
            taserPullAlerts.checked,

          p_ctw:
            ctwAlerts.checked,

          p_officer_injury:
            officerInjuryAlerts.checked,

          p_insufficient_staffing:
            insufficientStaffingAlerts.checked,

          p_setup_confirmed:
            true

        }
      );


    if (
      preferenceError
    ) {

      throw preferenceError;

    }


    // =========================================
    // SUCCESS
    // =========================================

    showResult(
      "Push notifications are now enabled on this device."
    );


    await loadPushStatus();

  }
  catch (error) {

    console.error(
      "SecureTrack push activation error:",
      error
    );


    pushStatus.textContent =
      "Push notifications could not be enabled.";


    pushPermissionNote.hidden =
      false;


    pushPermissionNote.textContent =
      error?.message ||
      "SecureTrack could not activate push notifications.";


    showResult(
      error?.message ||
      "Unable to enable push notifications.",
      "error"
    );


    enablePushButton.hidden =
      false;

    enablePushButton.disabled =
      false;

    enablePushButton.textContent =
      "Try Again";

  }

}



// =========================================================
// PUSH BUTTON
// =========================================================

if (
  enablePushButton
) {

  enablePushButton.addEventListener(
    "click",
    async event => {

      event.preventDefault();

      await enableSecureTrackPush();

    }
  );

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

      await connectOneSignalUser(
  session
);

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
