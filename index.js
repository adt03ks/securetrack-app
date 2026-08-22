(async function () {
  const ST = window.SecureTrack;
  const token = ST.assetToken();

  const img = document.getElementById("deviceImage");
  const assetCode = document.getElementById("assetCode");
  const model = document.getElementById("deviceModel");
  const tokenEl = document.getElementById("tokenDisplay");
  const verifyBtn = document.getElementById("verifyBtn");
  const statusText = document.getElementById("statusText");
  const errorBox = document.getElementById("errorBox");

  const actions = [
    ...document.querySelectorAll(".action-card")
  ];

  const custodyAction = actions[0];

  let currentDevice = null;


  function configureCustodyAction(device) {

    if (!custodyAction || !device) {
      return;
    }

    const title =
      custodyAction.querySelector("h3");

    const description =
      custodyAction.querySelector("p");

    const icon =
      custodyAction.querySelector(".action-icon");


    // ==========================================
    // DEVICE IS CURRENTLY CHECKED OUT
    // ==========================================

    if (device.status === "checked_out") {

      custodyAction.href = "return.html";

      if (title) {
        title.textContent = "Return Item";
      }

      if (description) {
        description.textContent =
          "Release this verified equipment from your custody and create a timestamped return record.";
      }

      if (icon) {
        icon.textContent = "↩";
      }

      return;
    }


    // ==========================================
    // DEVICE IS AVAILABLE
    // ==========================================

    custodyAction.href = "checkout.html";

    if (title) {
      title.textContent = "Check Out Item";
    }

    if (description) {
      description.textContent =
        "Assign the verified equipment to your custody and create a timestamped checkout record.";
    }

    if (icon) {
      icon.textContent = "⬡";
    }
  }


  function setActionState(active) {

    actions.forEach((card, index) => {

      /*
        The first action is the custody action.

        It should only activate when the device
        is either:

        available
        OR
        checked_out

        Maintenance or retired equipment cannot
        be checked out or returned through the
        normal officer workflow.
      */

      const custodyAllowed =
        index !== 0 ||
        [
          "available",
          "checked_out"
        ].includes(currentDevice?.status);


      const shouldActivate =
        active && custodyAllowed;


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
        String(!shouldActivate)
      );


      const pill =
        card.querySelector(".lock-pill");


      if (pill) {

        pill.textContent =
          shouldActivate
            ? "READY"
            : active && index === 0
              ? "UNAVAILABLE"
              : "LOCKED";
      }
    });
  }


  function setVerified() {

    verifyBtn.classList.add(
      "verified"
    );

    verifyBtn.disabled = true;

    verifyBtn.textContent =
      "✓ Device Verified";


    statusText.textContent =
      "Device verified. Select an action to continue.";


    setActionState(true);
  }


  // ==========================================
  // INITIAL PAGE STATE
  // ==========================================

  setActionState(false);

  tokenEl.textContent =
    token || "No token";


  try {

    // ========================================
    // GET DEVICE FROM SUPABASE
    // ========================================

    const device =
      await ST.getDevice(token);


    currentDevice = device;


    // ========================================
    // SHOW DEVICE INFORMATION
    // ========================================

    img.src =
      ST.imageFor(device);


    assetCode.textContent =
      device.asset_code;


    model.textContent =
      ST.modelFor(device);


    // ========================================
    // CONFIGURE CHECKOUT OR RETURN BUTTON
    // ========================================

    configureCustodyAction(device);


    // ========================================
    // SHOW CURRENT DEVICE STATUS
    // ========================================

    if (
      device.status ===
      "checked_out"
    ) {

      statusText.textContent =
        "Device found and currently checked out. Verify it to return, inspect, or report an issue.";

    } else if (
      device.status ===
      "available"
    ) {

      statusText.textContent =
        "Device found and available. Verify it before recording any activity.";

    } else {

      statusText.textContent =
        `Device found with status: ${
          String(device.status)
            .replaceAll("_", " ")
        }. Verify it to continue.`;
    }


    // ========================================
    // DEVICE WAS ALREADY VERIFIED THIS SESSION
    // ========================================

    if (
      ST.isVerified(token)
    ) {

      setVerified();
    }


    // ========================================
    // VERIFY DEVICE BUTTON
    // ========================================

    verifyBtn.addEventListener(
      "click",
      async () => {

        verifyBtn.disabled = true;

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

        } catch (e) {

          verifyBtn.disabled =
            false;


          verifyBtn.textContent =
            "Verify Device";


          ST.showResult(
            errorBox,
            e.message ||
              "Unable to verify the device.",
            "error"
          );
        }
      }
    );


  } catch (e) {

    // ========================================
    // DEVICE LOOKUP FAILED
    // ========================================

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
      e.message,
      "error"
    );
  }

})();
