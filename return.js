document.getElementById("returnForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const formEl = ev.currentTarget;
  const ST = window.SecureTrack;
  const result = document.getElementById("result");
  const submit = formEl.querySelector("button[type=submit]");
  const form = new FormData(formEl);

  submit.disabled = true;
  submit.textContent = "Recording return…";

  try {
    const data = await ST.rpc("return_device", {
      p_public_token: ST.assetToken(),
      p_employee_number: String(form.get("employee_number") || "").trim(),
      p_badge_number: String(form.get("badge_number") || "").trim(),
      p_notes: String(form.get("notes") || "").trim() || null
    });

    const who = data?.employee_name || "Verified employee";
    const asset = data?.asset_code || "Device";

    ST.showResult(
      result,
      `${asset} returned successfully by ${who}. The device is now AVAILABLE in SecureTrack.`
    );

    formEl.reset();
    submit.textContent = "✓ Return Recorded";
    submit.disabled = true;

  } catch (e) {
    ST.showResult(
      result,
      e.message || "Equipment return could not be recorded.",
      "error"
    );

    submit.disabled = false;
    submit.textContent = "Confirm Return";
  }
});
