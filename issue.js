document.getElementById("issueForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const ST = window.SecureTrack;
  const result = document.getElementById("result");
  const submit = ev.currentTarget.querySelector("button[type=submit]");
  const form = new FormData(ev.currentTarget);
  submit.disabled = true; submit.textContent = "Submitting report…";
  try {
    const data = await ST.rpc("report_device_issue", {
      p_public_token: ST.assetToken(),
      p_employee_number: form.get("employee_number").trim(),
      p_badge_number: form.get("badge_number").trim(),
      p_category: form.get("category"),
      p_severity: form.get("severity"),
      p_description: form.get("description").trim()
    });
    const ref = data?.issue_reference ? ` Reference: ${data.issue_reference}.` : "";
    ST.showResult(result, `Issue recorded successfully.${ref}`);
    ev.currentTarget.reset();
  } catch (e) { ST.showResult(result, e.message || "Issue could not be reported.", "error"); }
  finally { submit.disabled = false; submit.textContent = "Submit Issue Report"; }
});
