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
  const actions = [...document.querySelectorAll(".action-card")];

  function setActionState(active) {
    actions.forEach((card) => {
      card.classList.toggle("disabled", !active);
      card.classList.toggle("active", active);
      card.setAttribute("aria-disabled", String(!active));
      const pill = card.querySelector(".lock-pill");
      if (pill) pill.textContent = active ? "READY" : "LOCKED";
    });
  }

  function setVerified() {
    verifyBtn.classList.add("verified");
    verifyBtn.disabled = true;
    verifyBtn.textContent = "✓ Device Verified";
    statusText.textContent = "Device verified. Select an action to continue.";
    setActionState(true);
  }

  setActionState(false);
  tokenEl.textContent = token || "No token";

  try {
    const device = await ST.getDevice(token);
    img.src = ST.imageFor(device);
    assetCode.textContent = device.asset_code;
    model.textContent = ST.modelFor(device);
    statusText.textContent = "Device found. Verify it before recording any activity.";
    if (ST.isVerified(token)) setVerified();

    verifyBtn.addEventListener("click", async () => {
      verifyBtn.disabled = true;
      verifyBtn.textContent = "Verifying…";
      try {
        await ST.verifyDevice(token);
        setVerified();
      } catch (e) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify Device";
        ST.showResult(errorBox, e.message || "Unable to verify the device.", "error");
      }
    });
  } catch (e) {
    img.src = "assets/device-placeholder.svg";
    assetCode.textContent = "Device not verified";
    model.textContent = "Scan or tap a registered SecureTrack tag";
    verifyBtn.disabled = true;
    ST.showResult(errorBox, e.message, "error");
  }
})();
