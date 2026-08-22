document.getElementById("checkoutForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const formEl = ev.currentTarget;
  const ST = window.SecureTrack;
  const result = document.getElementById("result");
  const submit = formEl.querySelector("button[type=submit]");
  const form = new FormData(formEl);

  submit.disabled = true;
  submit.textContent = "Recording checkout…";

  try {
    const data = await ST.rpc("checkout_device", {
      p_public_token: ST.assetToken(),
      p_employee_number: String(form.get("employee_number") || "").trim(),
      p_badge_number: String(form.get("badge_number") || "").trim(),
      p_notes: String(form.get("notes") || "").trim() || null
    });

    const who =
      data?.employee_name ||
      data?.employee ||
      "Verified employee";

    ST.showResult(
      result,
      `Checkout recorded successfully for ${who}. This device is now assigned in SecureTrack.`
    );

    formEl.reset();

  } catch (e) {
    ST.showResult(
      result,
      e.message || "Checkout could not be recorded.",
      "error"
    );

  } finally {
    submit.disabled = false;
    submit.textContent = "Confirm Checkout";
  }
});
