(async function () {

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
