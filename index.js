(async function () {

  "use strict";


  const ST =
    window.SecureTrack;

  const token =
    ST.assetToken();


  // =========================================================
  // PAGE ELEMENTS
  // =========================================================

  const img =
    document.getElementById(
      "deviceImage"
    );

  const assetCode =
    document.getElementById(
      "assetCode"
    );

  const model =
    document.getElementById(
      "deviceModel"
    );

  const tokenEl =
    document.getElementById(
      "tokenDisplay"
    );

  const verifyBtn =
    document.getElementById(
      "verifyBtn"
    );

  const statusText =
    document.getElementById(
      "statusText"
    );

  const errorBox =
    document.getElementById(
      "errorBox"
    );


  const identificationSection =
    document.getElementById(
      "deviceIdentificationSection"
    );

  const workflowSection =
    document.getElementById(
      "deviceWorkflowSection"
    );

  const actionsSection =
    document.getElementById(
      "deviceActionsSection"
    );


  const scanQrButton =
    document.getElementById(
      "scanQrButton"
    );

  const closeQrScannerButton =
    document.getElementById(
      "closeQrScannerButton"
    );

  const qrScannerPanel =
    document.getElementById(
      "qrScannerPanel"
    );

  const serialLookupForm =
    document.getElementById(
      "serialLookupForm"
    );

  const serialNumberInput =
    document.getElementById(
      "serialNumberInput"
    );

  const serialLookupButton =
    document.getElementById(
      "serialLookupButton"
    );

  const identificationResult =
    document.getElementById(
      "deviceIdentificationResult"
    );


  const actions =
    [
      ...document.querySelectorAll(
        ".action-card"
      )
    ];

  const custodyAction =
    actions[0];


  let currentDevice =
    null;

  let qrScanner =
    null;

  let qrScannerRunning =
    false;


  // =========================================================
  // RESULT MESSAGE
  // =========================================================

  function showIdentificationResult(
    message,
    type = "error"
  ) {

    if (!identificationResult) {
      return;
    }

    ST.showResult(
      identificationResult,
      message,
      type
    );

  }


  // =========================================================
  // TOKEN VALIDATION
  // =========================================================

  function normalizeToken(
    value
  ) {

    const clean =
      String(
        value || ""
      )
        .trim();


    if (
      !/^[A-Za-z0-9_-]{8,128}$/
        .test(
          clean
        )
    ) {

      return "";

    }


    return clean;

  }


  // =========================================================
  // OPEN DEVICE BY TOKEN
  // =========================================================

  function openDeviceByToken(
    value
  ) {

    const cleanToken =
      normalizeToken(
        value
      );


    if (!cleanToken) {

      showIdentificationResult(
        "SecureTrack could not read a valid device identifier."
      );

      return;

    }


    const nextUrl =
      new URL(
        window.location.href
      );


    nextUrl.search =
      "";

    nextUrl.searchParams.set(
      "asset",
      cleanToken
    );


    window.location.assign(
      nextUrl.toString()
    );

  }


  // =========================================================
  // EXTRACT TOKEN FROM QR CODE
  // =========================================================

  function tokenFromQrValue(
    decodedValue
  ) {

    const raw =
      String(
        decodedValue || ""
      )
        .trim();


    if (!raw) {
      return "";
    }


    // -------------------------------------------------------
    // NORMAL SECURETRACK QR URL
    // -------------------------------------------------------

    try {

      const qrUrl =
        new URL(
          raw
        );


      const qrToken =
        qrUrl.searchParams.get(
          "asset"
        );


      const normalized =
        normalizeToken(
          qrToken
        );


      if (normalized) {
        return normalized;
      }

    }
    catch {

      // The QR may contain only the opaque token.
      // Continue below.

    }


    // -------------------------------------------------------
    // TOKEN-ONLY QR FALLBACK
    // -------------------------------------------------------

    return normalizeToken(
      raw
    );

  }


  // =========================================================
  // STOP QR CAMERA
  // =========================================================

  async function stopQrScanner() {

    if (!qrScanner) {

      if (qrScannerPanel) {
        qrScannerPanel.hidden =
          true;
      }

      return;

    }


    try {

      if (qrScannerRunning) {

        await qrScanner.stop();

      }

    }
    catch (error) {

      console.warn(
        "SecureTrack QR camera stop:",
        error
      );

    }


    try {

      await qrScanner.clear();

    }
    catch {

      // Scanner may already be cleared.

    }


    qrScannerRunning =
      false;

    qrScanner =
      null;


    if (qrScannerPanel) {

      qrScannerPanel.hidden =
        true;

    }

  }


  // =========================================================
  // START QR CAMERA
  // =========================================================

  async function startQrScanner() {

    if (
      typeof window.Html5Qrcode ===
      "undefined"
    ) {

      showIdentificationResult(
        "The SecureTrack QR scanner could not be loaded."
      );

      return;

    }


    await stopQrScanner();


    if (qrScannerPanel) {

      qrScannerPanel.hidden =
        false;

    }


    qrScanner =
      new window.Html5Qrcode(
        "qrReader"
      );


    try {

      await qrScanner.start(

        {
          facingMode:
            "environment"
        },

        {
          fps: 10,

          qrbox: {
            width: 250,
            height: 250
          }
        },

        async decodedText => {

          const scannedToken =
            tokenFromQrValue(
              decodedText
            );


          if (!scannedToken) {

            showIdentificationResult(
              "That QR code is not a registered SecureTrack device code."
            );

            return;

          }


          await stopQrScanner();


          openDeviceByToken(
            scannedToken
          );

        },

        () => {

          // Normal scan misses are ignored while
          // the camera continues looking for a QR.

        }

      );


      qrScannerRunning =
        true;

    }
    catch (error) {

      console.error(
        "SecureTrack QR camera error:",
        error
      );


      await stopQrScanner();


      showIdentificationResult(
        "SecureTrack could not open the camera. Confirm camera permission is enabled for this site."
      );

    }

  }


  // =========================================================
  // MANUAL SERIAL NUMBER LOOKUP
  // =========================================================

  async function lookupSerialNumber(
    serialNumber
  ) {

    const auth =
      window.SecureTrackAuth;


    if (
      !auth?.db
    ) {

      throw new Error(
        "SecureTrack authentication is unavailable."
      );

    }


    const {
      data,
      error
    } =
      await auth.db.rpc(
        "resolve_device_by_serial",
        {
          p_serial_number:
            serialNumber
        }
      );


    if (error) {
      throw error;
    }


    if (
      !data?.public_token
    ) {

      throw new Error(
        "SecureTrack could not locate that device."
      );

    }


    return data;

  }


  // =========================================================
  // IDENTIFICATION MODE
  // =========================================================

  if (!token) {

    identificationSection.hidden =
      false;

    workflowSection.hidden =
      true;

    actionsSection.hidden =
      true;


    statusText.textContent =
      "Choose how you want to identify the device.";


    scanQrButton
      ?.addEventListener(
        "click",
        startQrScanner
      );


    closeQrScannerButton
      ?.addEventListener(
        "click",
        stopQrScanner
      );


    serialLookupForm
      ?.addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          const serialNumber =
            String(
              serialNumberInput
                ?.value ||
              ""
            )
              .trim()
              .toUpperCase();


          if (!serialNumber) {

            showIdentificationResult(
              "Enter the complete device serial number."
            );

            return;

          }


          serialLookupButton.disabled =
            true;

          serialLookupButton.textContent =
            "Finding Device…";


          try {

            const device =
              await lookupSerialNumber(
                serialNumber
              );


            showIdentificationResult(
              `${device.asset_code || "Device"} found. Opening SecureTrack device record.`,
              "success"
            );


            openDeviceByToken(
              device.public_token
            );

          }
          catch (error) {

            console.error(
              "SecureTrack serial lookup:",
              error
            );


            showIdentificationResult(
              error.message ||
              "Unable to locate that device."
            );


            serialLookupButton.disabled =
              false;

            serialLookupButton.textContent =
              "Find Device";

          }

        }
      );


    return;

  }


  // =========================================================
  // EXISTING VERIFIED DEVICE WORKFLOW
  // =========================================================

  identificationSection.hidden =
    true;

  workflowSection.hidden =
    false;

  actionsSection.hidden =
    false;


  function configureCustodyAction(
    device
  ) {

    if (
      !custodyAction ||
      !device
    ) {
      return;
    }


    const title =
      custodyAction.querySelector(
        "h3"
      );

    const description =
      custodyAction.querySelector(
        "p"
      );

    const icon =
      custodyAction.querySelector(
        ".action-icon"
      );


    if (
      device.status ===
      "checked_out"
    ) {

      custodyAction.href =
        "return.html";


      if (title) {

        title.textContent =
          "Return Item";

      }


      if (description) {

        description.textContent =
          "Release this verified equipment from your custody and create a timestamped return record.";

      }


      if (icon) {

        icon.textContent =
          "↩";

      }


      return;

    }


    custodyAction.href =
      "checkout.html";


    if (title) {

      title.textContent =
        "Check Out Item";

    }


    if (description) {

      description.textContent =
        "Assign the verified equipment to your custody and create a timestamped checkout record.";

    }


    if (icon) {

      icon.textContent =
        "⬡";

    }

  }


  function setActionState(
    active
  ) {

    actions.forEach(
      (
        card,
        index
      ) => {

        const custodyAllowed =
          index !== 0 ||
          [
            "available",
            "checked_out"
          ].includes(
            currentDevice?.status
          );


        const shouldActivate =
          active &&
          custodyAllowed;


        card.classList.toggle(
          "disabled",
          !shouldActivate
        );

        card.classList.toggle(
          "active",
          shouldActivate
        );

        card.setAttribute(
          "aria-disabled",
          String(
            !shouldActivate
          )
        );


        const pill =
          card.querySelector(
            ".lock-pill"
          );


        if (pill) {

          pill.textContent =
            shouldActivate
              ? "READY"
              : active &&
                index === 0
                ? "UNAVAILABLE"
                : "LOCKED";

        }

      }
    );

  }


  function setVerified() {

    verifyBtn.classList.add(
      "verified"
    );

    verifyBtn.disabled =
      true;

    verifyBtn.textContent =
      "✓ Device Verified";

    statusText.textContent =
      "Device verified. Select an action to continue.";

    setActionState(
      true
    );

  }


  setActionState(
    false
  );


  tokenEl.textContent =
    token ||
    "No token";


  try {

    const device =
      await ST.getDevice(
        token
      );


    currentDevice =
      device;


    img.src =
      ST.imageFor(
        device
      );

    assetCode.textContent =
      device.asset_code;

    model.textContent =
      ST.modelFor(
        device
      );


    configureCustodyAction(
      device
    );


    if (
      device.status ===
      "checked_out"
    ) {

      statusText.textContent =
        "Device found and currently checked out. Verify it to return, inspect, or report an issue.";

    }
    else if (
      device.status ===
      "available"
    ) {

      statusText.textContent =
        "Device found and available. Verify it before recording any activity.";

    }
    else {

      statusText.textContent =
        `Device found with status: ${String(
          device.status
        ).replaceAll(
          "_",
          " "
        )}. Verify it to continue.`;

    }


    if (
      ST.isVerified(
        token
      )
    ) {

      setVerified();

    }


    verifyBtn.addEventListener(
      "click",
      async () => {

        verifyBtn.disabled =
          true;

        verifyBtn.textContent =
          "Verifying…";


        try {

          const verifiedDevice =
            await ST.verifyDevice(
              token
            );


          currentDevice =
            verifiedDevice;


          configureCustodyAction(
            verifiedDevice
          );


          setVerified();

        }
        catch (error) {

          verifyBtn.disabled =
            false;

          verifyBtn.textContent =
            "Verify Device";


          ST.showResult(
            errorBox,
            error.message ||
            "Unable to verify the device.",
            "error"
          );

        }

      }
    );

  }
  catch (error) {

    img.src =
      "assets/device-placeholder.svg";

    assetCode.textContent =
      "Device not verified";

    model.textContent =
      "Scan or tap a registered SecureTrack tag";

    verifyBtn.disabled =
      true;


    ST.showResult(
      errorBox,
      error.message,
      "error"
    );

  }

})();(async function () {

  const ST =
    window.SecureTrack;

  const token =
    ST.assetToken();


  const img =
    document.getElementById(
      "deviceImage"
    );

  const assetCode =
    document.getElementById(
      "assetCode"
    );

  const model =
    document.getElementById(
      "deviceModel"
    );

  const tokenEl =
    document.getElementById(
      "tokenDisplay"
    );

  const verifyBtn =
    document.getElementById(
      "verifyBtn"
    );

  const statusText =
    document.getElementById(
      "statusText"
    );

  const errorBox =
    document.getElementById(
      "errorBox"
    );


  const inspectionAction =
    document.getElementById(
      "inspectionAction"
    );

  const custodyAction =
    document.getElementById(
      "custodyAction"
    );

  const issueAction =
    document.getElementById(
      "issueAction"
    );


  let currentDevice = null;


  // ==========================================
  // CARD STATE
  // ==========================================

  function setCardState(
    card,
    enabled,
    label
  ) {

    if (!card) {
      return;
    }


    card.classList.toggle(
      "disabled",
      !enabled
    );

    card.classList.toggle(
      "active",
      enabled
    );


    card.setAttribute(
      "aria-disabled",
      String(!enabled)
    );


    const pill =
      card.querySelector(
        ".lock-pill"
      );


    if (pill) {

      pill.textContent =
        label ||
        (
          enabled
            ? "READY"
            : "LOCKED"
        );

    }
  }


  // ==========================================
  // CHECKOUT READINESS
  // ==========================================

  async function getCheckoutReadiness() {

    return await ST.rpc(
      "get_checkout_readiness",
      {
        p_public_token:
          token
      }
    );
  }


  // ==========================================
  // CONFIGURE CUSTODY CARD
  // ==========================================

  async function configureCustodyAction() {

    if (
      !custodyAction ||
      !currentDevice
    ) {
      return;
    }


    const title =
      custodyAction.querySelector(
        "h3"
      );

    const description =
      custodyAction.querySelector(
        "p"
      );

    const icon =
      custodyAction.querySelector(
        ".action-icon"
      );


    // ========================================
    // DEVICE CHECKED OUT = RETURN
    // ========================================

    if (
      currentDevice.status ===
      "checked_out"
    ) {

      custodyAction.href =
        "return.html";


      if (title) {
        title.textContent =
          "Return Item";
      }


      if (description) {
        description.textContent =
          "Release this verified equipment from your custody and create a timestamped return record.";
      }


      if (icon) {
        icon.textContent =
          "↩";
      }


      setCardState(
        custodyAction,
        true,
        "READY"
      );


      return;
    }


    // ========================================
    // NOT AVAILABLE
    // ========================================

    if (
      currentDevice.status !==
      "available"
    ) {

      setCardState(
        custodyAction,
        false,
        "UNAVAILABLE"
      );


      return;
    }


    // ========================================
    // AVAILABLE = CHECK INSPECTION
    // ========================================

    custodyAction.href =
      "checkout.html";


    if (title) {
      title.textContent =
        "Check Out Item";
    }


    if (icon) {
      icon.textContent =
        "⬡";
    }


    try {

      const readiness =
        await getCheckoutReadiness();


      if (
        readiness?.ready === true
      ) {

        if (description) {
          description.textContent =
            "Inspection passed. This equipment is ready for checkout.";
        }


        setCardState(
          custodyAction,
          true,
          "READY"
        );


        return;
      }


      // ======================================
      // INSPECTION FAILED
      // ======================================

      if (
        readiness?.reason ===
        "inspection_failed"
      ) {

        if (description) {
          description.textContent =
            "Latest inspection did not pass. Resolve the equipment condition before checkout.";
        }


        setCardState(
          custodyAction,
          false,
          "INSPECTION FAILED"
        );


        return;
      }


      // ======================================
      // INSPECTION REQUIRED
      // ======================================

      if (description) {

        description.textContent =
          "A passing device inspection is required before checkout.";

      }


      setCardState(
        custodyAction,
        false,
        "INSPECTION REQUIRED"
      );


    } catch (error) {

      console.error(
        "Checkout readiness error:",
        error
      );


      setCardState(
        custodyAction,
        false,
        "INSPECTION REQUIRED"
      );

    }

  }


  // ==========================================
  // VERIFIED DEVICE STATE
  // ==========================================

  async function setVerified() {

    verifyBtn.classList.add(
      "verified"
    );

    verifyBtn.disabled =
      true;

    verifyBtn.textContent =
      "✓ Device Verified";


    // Inspection is always available
    // after verification.

    setCardState(
      inspectionAction,
      true,
      "READY"
    );


    // Issues can also always be reported.

    setCardState(
      issueAction,
      true,
      "READY"
    );


    // Checkout depends upon inspection.
    // Return does not.

    await configureCustodyAction();


    if (
      currentDevice.status ===
      "available"
    ) {

      const readiness =
        await getCheckoutReadiness();


      statusText.textContent =
        readiness?.ready
          ? "Device verified and inspection passed. Equipment is ready for checkout."
          : "Device verified. Complete and pass the device inspection before checkout.";

    } else if (
      currentDevice.status ===
      "checked_out"
    ) {

      statusText.textContent =
        "Device verified. Equipment is currently checked out and may be returned, inspected, or reported.";

    } else {

      statusText.textContent =
        "Device verified. Select an available action to continue.";

    }

  }


  // ==========================================
  // INITIAL LOCKED STATE
  // ==========================================

  setCardState(
    inspectionAction,
    false,
    "LOCKED"
  );

  setCardState(
    custodyAction,
    false,
    "LOCKED"
  );

  setCardState(
    issueAction,
    false,
    "LOCKED"
  );


  tokenEl.textContent =
    token || "No token";


  // ==========================================
  // LOAD DEVICE
  // ==========================================

  try {

    const device =
      await ST.getDevice(
        token
      );


    currentDevice =
      device;


    img.src =
      ST.imageFor(
        device
      );


    assetCode.textContent =
      device.asset_code;


    model.textContent =
      ST.modelFor(
        device
      );


    if (
      device.status ===
      "available"
    ) {

      statusText.textContent =
        "Device found. Verify it, then complete an inspection before checkout.";

    } else if (
      device.status ===
      "checked_out"
    ) {

      statusText.textContent =
        "Device found and currently checked out. Verify it to continue.";

    } else {

      statusText.textContent =
        `Device found with status: ${
          String(
            device.status
          ).replaceAll(
            "_",
            " "
          )
        }.`;

    }


    // ========================================
    // ALREADY VERIFIED THIS SESSION
    // ========================================

    if (
      ST.isVerified(
        token
      )
    ) {

      await setVerified();

    }


    // ========================================
    // VERIFY BUTTON
    // ========================================

    verifyBtn.addEventListener(
      "click",
      async () => {

        verifyBtn.disabled =
          true;

        verifyBtn.textContent =
          "Verifying…";


        try {

          const verifiedDevice =
            await ST.verifyDevice(
              token
            );


          currentDevice =
            verifiedDevice;


          await setVerified();


        } catch (error) {

          verifyBtn.disabled =
            false;

          verifyBtn.textContent =
            "Verify Device";


          ST.showResult(
            errorBox,
            error.message ||
              "Unable to verify the device.",
            "error"
          );

        }

      }
    );


  } catch (error) {

    img.src =
      "assets/device-placeholder.svg";


    assetCode.textContent =
      "Device not verified";


    model.textContent =
      "Scan or tap a registered SecureTrack tag";


    verifyBtn.disabled =
      true;


    ST.showResult(
      errorBox,
      error.message,
      "error"
    );

  }

})();
