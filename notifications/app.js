(() => {

  const elements = {
    pushEnabled:
      document.getElementById(
        "pushEnabled"
      ),

    codeGreen:
      document.getElementById(
        "codeGreen"
      ),

    taserPull:
      document.getElementById(
        "taserPull"
      ),

    ctw:
      document.getElementById(
        "ctw"
      ),

    officerInjury:
      document.getElementById(
        "officerInjury"
      ),

    insufficientStaffing:
      document.getElementById(
        "insufficientStaffing"
      ),

    pushStatus:
      document.getElementById(
        "pushStatus"
      ),

    setupMessage:
      document.getElementById(
        "setupMessage"
      ),

    setupButton:
      document.getElementById(
        "setupButton"
      ),

    testButton:
      document.getElementById(
        "testButton"
      ),

    saveButton:
      document.getElementById(
        "saveButton"
      ),

    messageBox:
      document.getElementById(
        "messageBox"
      )
  };


  let db = null;

  let setupConfirmed =
    false;


  function showMessage(
    message,
    type = ""
  ) {

    elements.messageBox.hidden =
      false;

    elements.messageBox.className =
      `message-box ${type}`;

    elements.messageBox.textContent =
      message;
  }


  function clearMessage() {

    elements.messageBox.hidden =
      true;

    elements.messageBox.textContent =
      "";

    elements.messageBox.className =
      "message-box";
  }


  function refreshStatus() {

    const active =
      elements.pushEnabled.checked &&
      setupConfirmed;


    if (active) {

      elements.pushStatus.textContent =
        "Push Active";

      elements.pushStatus.className =
        "status-badge active";

      elements.setupMessage.textContent =
        "Push notification setup is confirmed for this account.";

      elements.setupButton.textContent =
        "Review Push Setup";

      elements.testButton.disabled =
        false;

    } else {

      elements.pushStatus.textContent =
        setupConfirmed
          ? "Push Disabled"
          : "Not Configured";

      elements.pushStatus.className =
        "status-badge inactive";

      elements.setupMessage.textContent =
        setupConfirmed
          ? "Device setup is confirmed, but push alerts are currently disabled."
          : "Push notification setup has not yet been confirmed for this account.";

      elements.setupButton.textContent =
        setupConfirmed
          ? "Review Push Setup"
          : "Enable Push Alerts";

     elements.testButton.disabled =
  !elements.pushEnabled.checked;
    }
  }


  async function loadPreferences() {

    clearMessage();


    const {
      data,
      error
    } =
      await db.rpc(
        "get_my_push_preferences"
      );


    if (error) {

      console.error(
        "Unable to load push preferences:",
        error
      );

      showMessage(
        "Unable to load your notification settings.",
        "error"
      );

      return;
    }


    elements.pushEnabled.checked =
      data?.push_enabled === true;


    elements.codeGreen.checked =
      data?.code_green !== false;


    elements.taserPull.checked =
      data?.taser_pull !== false;


    elements.ctw.checked =
      data?.ctw !== false;


    elements.officerInjury.checked =
      data?.officer_injury !== false;


    elements.insufficientStaffing.checked =
      data?.insufficient_staffing !== false;


    setupConfirmed =
      data?.setup_confirmed === true;


    refreshStatus();
  }


  async function savePreferences() {

    clearMessage();


    elements.saveButton.disabled =
      true;

    elements.saveButton.textContent =
      "Saving...";


    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "save_my_push_preferences",
          {
            p_push_enabled:
              elements.pushEnabled.checked,

            p_code_green:
              elements.codeGreen.checked,

            p_taser_pull:
              elements.taserPull.checked,

            p_ctw:
              elements.ctw.checked,

            p_officer_injury:
              elements.officerInjury.checked,

            p_insufficient_staffing:
              elements.insufficientStaffing.checked,

            p_setup_confirmed:
              setupConfirmed
          }
        );


      if (error) {

        throw error;
      }


      showMessage(
        "Notification settings saved.",
        "success"
      );


      refreshStatus();


    } catch (error) {

      console.error(
        "Unable to save notification settings:",
        error
      );


      showMessage(
        "SecureTrack could not save your notification settings.",
        "error"
      );

    } finally {

      elements.saveButton.disabled =
        false;

      elements.saveButton.textContent =
        "Save Notification Settings";
    }
  }


  async function openSetup() {

  clearMessage();


  elements.setupButton.disabled =
    true;

  elements.setupButton.textContent =
    "Loading Setup...";


  try {

    const {
      data,
      error
    } =
      await db
        .functions
        .invoke(
          "securetrack-push-setup",
          {
            body: {
              action:
                "get_setup"
            }
          }
        );


    if (error) {

      throw error;
    }


    if (
      !data?.ok ||
      !data?.topic
    ) {

      throw new Error(
        data?.error ||
        "Push setup information is unavailable."
      );
    }


    const topic =
      data.topic;


    const server =
      data.server ||
      "https://ntfy.sh";


    const copyText =
      topic;


    try {

      await navigator
        .clipboard
        .writeText(
          copyText
        );

    } catch (
      clipboardError
    ) {

      console.warn(
        "Topic could not be copied automatically:",
        clipboardError
      );
    }


    showMessage(
      `Your SecureTrack notification topic has been copied. Open ntfy, choose Subscribe to topic, paste "${topic}", and subscribe. Then return here and select Send Test Alert.`,
      "success"
    );


    // Open ntfy in a new tab.
    window.open(
      server,
      "_blank",
      "noopener,noreferrer"
    );


  } catch (error) {

    console.error(
      "Push setup error:",
      error
    );


    showMessage(
      error.message ||
      "SecureTrack could not start push notification setup.",
      "error"
    );


  } finally {

    elements.setupButton.disabled =
      false;

    elements.setupButton.textContent =
      setupConfirmed
        ? "Review Push Setup"
        : "Enable Push Alerts";
  }
}


 async function sendTestAlert() {

  clearMessage();


  elements.testButton.disabled =
    true;

  elements.testButton.textContent =
    "Sending...";


  try {

    const {
      data,
      error
    } =
      await db
        .functions
        .invoke(
          "securetrack-push-setup",
          {
            body: {
              action:
                "send_test"
            }
          }
        );


    if (error) {

      throw error;
    }


    if (
      !data?.ok
    ) {

      throw new Error(
        data?.error ||
        "Test alert failed."
      );
    }


    setupConfirmed =
      true;


    elements.pushEnabled.checked =
      true;


    refreshStatus();


    showMessage(
      "Test alert sent. If the notification appeared on your device, SecureTrack Push is now active.",
      "success"
    );


  } catch (error) {

    console.error(
      "Test notification error:",
      error
    );


    showMessage(
      error.message ||
      "SecureTrack could not send the test alert.",
      "error"
    );


  } finally {

    elements.testButton.disabled =
      false;

    elements.testButton.textContent =
      "Send Test Alert";
  }
}


  async function start() {

    let attempts =
      0;


    while (
      !window.SecureTrackAuth &&
      attempts < 100
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            100
          )
      );

      attempts++;
    }


    if (
      !window.SecureTrackAuth?.db
    ) {

      showMessage(
        "SecureTrack authentication could not be loaded.",
        "error"
      );

      return;
    }


    db =
      window.SecureTrackAuth.db;


    elements.pushEnabled
      .addEventListener(
        "change",
        refreshStatus
      );


    elements.saveButton
      .addEventListener(
        "click",
        savePreferences
      );


    elements.setupButton
      .addEventListener(
        "click",
        openSetup
      );


    elements.testButton
      .addEventListener(
        "click",
        sendTestAlert
      );


    await loadPreferences();
  }


  start();

})();
