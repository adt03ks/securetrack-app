(async function () {
  const ST = window.SecureTrack;
  const token = ST.requireVerified();
  if (!token) return;
  const summary = document.getElementById("deviceSummary");
  const hiddenToken = document.getElementById("assetToken");
  if (hiddenToken) hiddenToken.value = token;
  try {
    const device = await ST.getDevice(token);
    ST.renderDeviceSummary(device, summary);
    document.querySelectorAll("[data-asset-code]").forEach(el => el.textContent = device.asset_code);
  } catch (e) {
    ST.showResult(document.getElementById("result"), e.message, "error");
    document.querySelectorAll("button[type=submit]").forEach(b => b.disabled = true);
  }
})();
