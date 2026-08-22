document.getElementById("issueForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const formEl = ev.currentTarget;
  const ST = window.SecureTrack;
  const result = document.getElementById("result");
  const submit = formEl.querySelector("button[type=submit]");
  const form = new FormData(formEl);

  submit.disabled = true;
  submit.textContent = "Submitting report…";

  try {
    const data = await ST.rpc("report_device_issue", {
      p_public_token: ST.assetToken(),
      p_employee_number: String(form.get("employee_number") || "").trim(),
      p_badge_number: String(form.get("badge_number") || "").trim(),
      p_category: form.get("category"),
      p_severity: form.get("severity"),
      p_description: String(form.get("description") || "").trim()
    });

    const ref = data?.issue_reference
      ? ` Reference: ${data.issue_reference}.`
      : "";

    ST.showResult(
      result,
      `Issue recorded successfully.${ref}`
    );

    formEl.reset();

  } catch (e) {
    ST.showResult(
      result,
      e.message || "Issue could not be reported.",
      "error"
    );

  } finally {
    submit.disabled = false;
    submit.textContent = "Submit Issue Report";
  }
});
