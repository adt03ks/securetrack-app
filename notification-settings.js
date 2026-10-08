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


  // Start from a neutral state.

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

    // =========================================
    // LOAD SAVED SECURETRACK PUSH STATUS
    // =========================================

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
    // VERIFY BROWSER SUPPORT
    // =========================================

    const browserSupportsPush =
      (
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window
      );


    if (
      !browserSupportsPush
    ) {

      pushEnabled.checked =
        false;


      pushStatus.textContent =
        "This browser does not support SecureTrack push notifications.";


      pushPermissionNote.hidden =
        false;


      pushPermissionNote.textContent =
        "Use an approved browser that supports web push notifications.";


      return;

    }


    // =========================================
    // VERIFY BROWSER PERMISSION
    // =========================================

    if (
      Notification.permission ===
        "denied"
    ) {

      pushEnabled.checked =
        false;


      pushStatus.textContent =
        "Push notifications are blocked in this browser.";


      pushPermissionNote.hidden =
        false;


      pushPermissionNote.textContent =
        "Notifications must be allowed for securetrackop.com in the browser before this device can receive SecureTrack alerts.";


      enablePushButton.hidden =
        true;


      return;

    }


    // =========================================
    // CHECK ACTUAL BROWSER PUSH SUBSCRIPTION
    // =========================================

    let browserPushSubscription =
      null;


    try {

     const serviceWorkerRegistration =
  await Promise.race([
    navigator.serviceWorker.ready,

    new Promise(
      (_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "SERVICE_WORKER_TIMEOUT"
              )
            ),
          5000
        )
    )
  ]);


browserPushSubscription =
  await serviceWorkerRegistration
    .pushManager
    .getSubscription();

    }
   catch (error) {

  console.warn(
    "SecureTrack could not inspect the browser push subscription:",
    error
  );


 if (
  error?.message ===
  "SERVICE_WORKER_TIMEOUT"
) {

  const deviceInfo =
    getPushDeviceInfo();


  const isAppleMobile =
    deviceInfo.operatingSystem ===
      "iOS" ||
    deviceInfo.operatingSystem ===
      "iPadOS";


  pushEnabled.checked =
    false;


  pushStatus.textContent =
    "SecureTrack push is still initializing on this device.";


  pushPermissionNote.hidden =
    false;


  pushPermissionNote.textContent =
    isAppleMobile
      ? "On iPhone or iPad, open SecureTrack from the Home Screen icon and allow a few seconds for push services to initialize."
      : "Push services are taking longer than expected to initialize. You may try enabling push notifications again.";


  enablePushButton.hidden =
    false;


  enablePushButton.disabled =
    false;


  enablePushButton.textContent =
    "Enable Push Notifications";


  return;

}

}


    const browserHasSubscription =
      Boolean(
        browserPushSubscription &&
        browserPushSubscription.endpoint
      );


   // =========================================
// CHECK ONESIGNAL STATE
// =========================================

let OneSignal =
  null;

let oneSignalOptedIn =
  false;

let currentOneSignalSubscriptionId =
  null;


try {

  OneSignal =
    await waitForOneSignal();


  oneSignalOptedIn =
    OneSignal?.User
      ?.PushSubscription
      ?.optedIn === true;


  /*
    The OneSignal subscription ID may appear
    slightly after initialization/login.

    Give the SDK a few seconds to expose it.
  */

  for (
    let attempt = 0;
    attempt < 12 &&
    !currentOneSignalSubscriptionId;
    attempt += 1
  ) {

    currentOneSignalSubscriptionId =
      OneSignal?.User
        ?.PushSubscription
        ?.id ||
      null;


    if (
      currentOneSignalSubscriptionId
    ) {
      break;
    }


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          250
        )
    );

  }

}
catch (error) {

  console.warn(
    "SecureTrack could not read OneSignal push status:",
    error
  );

}


// =========================================
// CURRENT BROWSER PUSH STATE
// =========================================

const currentBrowserReady =
  (
    Notification.permission ===
      "granted" &&
    browserHasSubscription &&
    oneSignalOptedIn &&
    Boolean(
      currentOneSignalSubscriptionId
    )
  );

if (
  currentOneSignalSubscriptionId
) {

  localStorage.setItem(
    "securetrack_push_subscription_id",
    currentOneSignalSubscriptionId
  );

}
    
// =========================================
// MATCH THIS BROWSER TO SUPABASE
// =========================================

const currentRegisteredDevice =
  activeDevices.find(
    device =>
      device.provider ===
        "onesignal" &&
      device.provider_subscription_id ===
        currentOneSignalSubscriptionId
  ) ||
  null;


const currentBrowserRegistered =
  Boolean(
    currentRegisteredDevice
  );


console.log(
  "SecureTrack push verification:",
  {
    currentOneSignalSubscriptionId,
    browserHasSubscription,
    oneSignalOptedIn,
    currentBrowserRegistered
  }
);


// =========================================
// SECURETRACK MASTER PUSH STATUS
// =========================================

const secureTrackPushActive =
  Boolean(
    state.push_enabled &&
    currentBrowserReady &&
    currentBrowserRegistered
  );


pushEnabled.checked =
  secureTrackPushActive;

    // =========================================
// FULLY ACTIVE
// =========================================

if (
  secureTrackPushActive
) {

  pushEnabled.checked =
    true;

  pushStatus.textContent =
    "SecureTrack push notifications are active on this browser.";

  pushPermissionNote.hidden =
    false;

  pushPermissionNote.textContent =
    activeDevices.length === 1
      ? "1 push device is registered with SecureTrack."
      : `${activeDevices.length} push devices are registered with SecureTrack.`;

  enablePushButton.hidden =
    true;

  enablePushButton.disabled =
    true;

  return;

}


// =========================================
// BROWSER CONNECTED BUT SECURETRACK
// REGISTRATION IS NOT COMPLETE
// =========================================

if (
  currentBrowserReady &&
  !secureTrackPushActive
) {

  pushEnabled.checked =
    false;

  pushStatus.textContent =
    "This browser is connected to OneSignal, but SecureTrack push setup is not complete.";

  pushPermissionNote.hidden =
    false;

  pushPermissionNote.textContent =
    "Select Enable Push Notifications to finish registering this browser with SecureTrack.";

  enablePushButton.hidden =
    false;

  enablePushButton.disabled =
    false;

  enablePushButton.textContent =
    "Enable Push Notifications";

  return;

}
    // =========================================
    // PERMISSION GRANTED BUT NO REAL
    // PUSH SUBSCRIPTION EXISTS
    // =========================================

    if (
      Notification.permission ===
        "granted"
    ) {

      pushEnabled.checked =
        false;


      pushStatus.textContent =
        "Push notifications are not active on this browser.";


      pushPermissionNote.hidden =
        false;


      pushPermissionNote.textContent =
        "Browser permission is granted, but this browser does not currently have a verified SecureTrack push subscription.";


      enablePushButton.hidden =
        false;


      enablePushButton.disabled =
        false;


      enablePushButton.textContent =
        "Enable Push Notifications";


      return;

    }


    // =========================================
    // PERMISSION HAS NOT BEEN REQUESTED
    // =========================================

    pushEnabled.checked =
      false;


    pushStatus.textContent =
      "SecureTrack push is not yet active on this browser.";


    pushPermissionNote.hidden =
      false;


    pushPermissionNote.textContent =
      "This browser will ask for notification permission when SecureTrack push is activated.";


    enablePushButton.hidden =
      false;


    enablePushButton.disabled =
      false;


    enablePushButton.textContent =
      "Enable Push Notifications";

  }
  catch (error) {

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
      error?.message ||
      "SecureTrack could not retrieve this device's push status.";


    enablePushButton.hidden =
      false;


    enablePushButton.disabled =
      false;


    enablePushButton.textContent =
      "Try Again";

  }

}
// =========================================================
// DETECT BROWSER / OPERATING SYSTEM / DEVICE
// =========================================================

function getPushDeviceInfo() {

  const ua =
    navigator.userAgent || "";

  const platform =
    navigator.platform || "";

  const maxTouchPoints =
    navigator.maxTouchPoints || 0;


  // =======================================================
  // DEVICE / OPERATING SYSTEM
  // =======================================================

  let operatingSystem =
    "Operating System";

  let deviceType =
    "Device";


  /*
    Modern iPads may report:
    platform = "MacIntel"
    userAgent contains "Macintosh"

    maxTouchPoints > 1 is the important clue
    that this is actually an iPad.
  */

  const isIPad =
    /iPad/i.test(ua) ||
    (
      /MacIntel|Macintosh/i.test(
        platform + " " + ua
      ) &&
      maxTouchPoints > 1
    );


  const isIPhone =
    /iPhone|iPod/i.test(ua);


  const isAndroid =
    /Android/i.test(ua);


  const isWindows =
    /Windows NT/i.test(ua);


  const isMac =
    !isIPad &&
    /Macintosh|Mac OS X|MacIntel/i.test(
      ua + " " + platform
    );


  const isLinux =
    !isAndroid &&
    /Linux/i.test(ua);


  if (
    isIPad
  ) {

    operatingSystem =
      "iPadOS";

    deviceType =
      "iPad";

  }
  else if (
    isIPhone
  ) {

    operatingSystem =
      "iOS";

    deviceType =
      "iPhone";

  }
  else if (
    isAndroid
  ) {

    operatingSystem =
      "Android";

    deviceType =
      /Mobile/i.test(ua)
        ? "Android Phone"
        : "Android Tablet";

  }
  else if (
    isWindows
  ) {

    operatingSystem =
      "Windows";

    deviceType =
      "Windows Device";

  }
  else if (
    isMac
  ) {

    operatingSystem =
      "macOS";

    deviceType =
      "Mac";

  }
  else if (
    isLinux
  ) {

    operatingSystem =
      "Linux";

    deviceType =
      "Linux Device";

  }


  // =======================================================
  // BROWSER
  // =======================================================

  let browser =
    "Browser";


  /*
    Check the specialized browser tokens first.

    iOS/iPadOS browsers do not always use the
    same UA tokens as their desktop versions.
  */

  if (
    /EdgiOS\//i.test(ua)
  ) {

    browser =
      "Microsoft Edge";

  }
  else if (
    /EdgA\//i.test(ua)
  ) {

    browser =
      "Microsoft Edge";

  }
  else if (
    /Edg\//i.test(ua)
  ) {

    browser =
      "Microsoft Edge";

  }
  else if (
    /CriOS\//i.test(ua)
  ) {

    browser =
      "Google Chrome";

  }
  else if (
    /Chrome\//i.test(ua) &&
    !/Edg|OPR|SamsungBrowser/i.test(ua)
  ) {

    browser =
      "Google Chrome";

  }
  else if (
    /FxiOS\//i.test(ua)
  ) {

    browser =
      "Mozilla Firefox";

  }
  else if (
    /Firefox\//i.test(ua)
  ) {

    browser =
      "Mozilla Firefox";

  }
  else if (
    /SamsungBrowser\//i.test(ua)
  ) {

    browser =
      "Samsung Internet";

  }
  else if (
    /OPR\//i.test(ua)
  ) {

    browser =
      "Opera";

  }
  else if (
    /Safari\//i.test(ua)
  ) {

    browser =
      "Safari";

  }


  // =======================================================
  // FRIENDLY DEVICE LABEL
  // =======================================================

  let deviceLabel =
    `${browser} on ${operatingSystem}`;


  if (
    deviceType === "iPad"
  ) {

    deviceLabel =
      `${browser} on iPad`;

  }
  else if (
    deviceType === "iPhone"
  ) {

    deviceLabel =
      `${browser} on iPhone`;

  }
  else if (
    deviceType === "Android Phone"
  ) {

    deviceLabel =
      `${browser} on Android Phone`;

  }
  else if (
    deviceType === "Android Tablet"
  ) {

    deviceLabel =
      `${browser} on Android Tablet`;

  }
  else if (
    deviceType === "Mac"
  ) {

    deviceLabel =
      `${browser} on Mac`;

  }
  else if (
    deviceType === "Windows Device"
  ) {

    deviceLabel =
      `${browser} on Windows`;

  }


  return {

    browser,

    operatingSystem,

    deviceLabel

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

    // =========================================
    // SECURETRACK SESSION
    // =========================================

    const session =
      await STM.getSession();


    if (
      !session?.user?.id
    ) {

      throw new Error(
        "An active SecureTrack login is required."
      );

    }


    // =========================================
    // ONESIGNAL
    // =========================================

    const OneSignal =
      await waitForOneSignal();


    // =========================================
    // REQUEST BROWSER PERMISSION
    // =========================================

   if (
  Notification.permission !==
  "granted"
) {

  pushStatus.textContent =
    "Requesting notification permission…";


  await Promise.race([

    OneSignal.Notifications
      .requestPermission(),

    new Promise(
      (_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                "Notification permission request timed out."
              )
            ),
          10000
        )
    )

  ]);

}


    if (
      Notification.permission !==
      "granted"
    ) {

      throw new Error(
        "Notification permission was not granted."
      );

    }


    pushStatus.textContent =
      "Creating secure push subscription…";


    // =========================================
    // OPT DEVICE INTO ONESIGNAL
    // =========================================

    await OneSignal.User
      .PushSubscription
      .optIn();


    // =========================================
    // VERIFY REAL BROWSER PUSH SUBSCRIPTION
    // =========================================

    const serviceWorkerRegistration =
      await navigator.serviceWorker.ready;


    let browserPushSubscription =
      await serviceWorkerRegistration
        .pushManager
        .getSubscription();


    /*
      Give OneSignal a few seconds to create
      the native browser subscription.
    */

    for (
      let attempt = 0;
      attempt < 10 &&
      !browserPushSubscription;
      attempt += 1
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );


      browserPushSubscription =
        await serviceWorkerRegistration
          .pushManager
          .getSubscription();

    }


    if (
      !browserPushSubscription
    ) {

      throw new Error(
        "The browser did not create a valid push subscription. SecureTrack will not mark this device as active."
      );

    }


    if (
      !browserPushSubscription.endpoint
    ) {

      throw new Error(
        "The browser push subscription does not contain a valid endpoint."
      );

    }


    console.log(
      "SecureTrack native push subscription verified."
    );


    // =========================================
    // ATTACH ONESIGNAL TO SECURETRACK USER
    // =========================================

    pushStatus.textContent =
      "Connecting push notifications to your SecureTrack account…";


    await OneSignal.login(
      session.user.id
    );


    /*
      Give OneSignal time to attach the
      authenticated SecureTrack External ID.
    */

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          1500
        )
    );


    const externalId =
      OneSignal?.User?.externalId;


    if (
      externalId !==
      session.user.id
    ) {

      throw new Error(
        "OneSignal could not verify the SecureTrack user identity."
      );

    }


    // =========================================
    // VERIFY ONESIGNAL OPT-IN STATE
    // =========================================

    if (
      OneSignal?.User
        ?.PushSubscription
        ?.optedIn !== true
    ) {

      throw new Error(
        "OneSignal did not confirm that this device is opted in for push notifications."
      );

    }


    // =========================================
    // GET ONESIGNAL SUBSCRIPTION ID
    // =========================================

    /*
      The browser subscription can exist before
      OneSignal exposes its subscription ID.

      Give OneSignal time to finish creating
      the subscription record.
    */

    let subscriptionId = null;


    for (
      let attempt = 0;
      attempt < 20 &&
      !subscriptionId;
      attempt += 1
    ) {

      subscriptionId =
        OneSignal?.User
          ?.PushSubscription
          ?.id ||
        null;


      if (
        subscriptionId
      ) {

        break;

      }


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

    }


    /*
      Fallback:
      use the OneSignal User ID only if the
      push-specific subscription ID has not yet
      been exposed by the SDK.

      This keeps the SecureTrack device record
      tied to a real OneSignal identity rather
      than creating a false "active" entry.
    */

    if (
      !subscriptionId
    ) {

      subscriptionId =
        OneSignal?.User
          ?.onesignalId ||
        null;

    }


    if (
      !subscriptionId
    ) {

      throw new Error(
        "OneSignal created the browser subscription but did not return a usable subscription identifier."
      );

    }


    console.log(
      "SecureTrack OneSignal registration ID:",
      subscriptionId
    );
localStorage.setItem(
  "securetrack_push_subscription_id",
  subscriptionId
);

    // =========================================
    // DEVICE INFORMATION
    // =========================================

    const deviceInfo =
      getPushDeviceInfo();


    // =========================================
    // REGISTER VERIFIED DEVICE IN SUPABASE
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
    // FINAL VERIFICATION
    // =========================================

    const finalSubscription =
      await serviceWorkerRegistration
        .pushManager
        .getSubscription();


    if (
      !finalSubscription ||
      Notification.permission !==
        "granted" ||
      OneSignal?.User
        ?.PushSubscription
        ?.optedIn !== true
    ) {

      throw new Error(
        "Push setup could not be verified after registration."
      );

    }


    // =========================================
    // SUCCESS
    // =========================================

    pushPermissionNote.hidden =
      true;


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

    // =========================================
    // SECURETRACK SESSION
    // =========================================

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


    // =========================================
    // LOAD GENERAL NOTIFICATION PREFERENCES
    // =========================================

    const {
      data,
      error
    } =
      await db.rpc(
        "get_my_notification_preferences"
      );


    if (
      error
    ) {

      throw error;

    }


    populate(
      data || {}
    );


    // =========================================
    // SHOW THE PAGE NOW
    // =========================================

    /*
      Email and SMS settings must not wait
      for OneSignal or Web Push initialization.
    */

    loading.hidden =
      true;


    form.hidden =
      false;


    // =========================================
    // INITIALIZE PUSH SEPARATELY
    // =========================================

    /*
      Do not await these here.

      Apple browsers may require additional
      Web Push conditions, but that should
      never prevent the rest of Notification
      Settings from loading.
    */

   connectOneSignalUser(
  session
)
  .catch(
    error => {

      console.warn(
        "OneSignal user connection was not completed:",
        error
      );

    }
  );


loadPushStatus()
  .catch(
    error => {

      console.warn(
        "Push status could not be loaded:",
        error
      );

    }
  );

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
