document.getElementById("inspectionForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const formEl = ev.currentTarget;
  const ST = window.SecureTrack;
  const result = document.getElementById("result");
  const submit = formEl.querySelector("button[type=submit]");
  const form = new FormData(formEl);
  const checklist = {};

  ["battery", "cartridge", "display", "housing", "safety", "camera"].forEach(
    (k) => (checklist[k] = form.get(k))
  );

  const values = Object.values(checklist);
  const overall = values.includes("fail")
    ? "fail"
    : values.every((v) => v === "na")
      ? "not_applicable"
      : "pass";

  submit.disabled = true;
  submit.textContent = "Saving inspection…";

  try {
    await ST.rpc("record_device_inspection", {
      p_public_token: ST.assetToken(),
      p_employee_number: String(form.get("employee_number") || "").trim(),
      p_badge_number: String(form.get("badge_number") || "").trim(),
      p_checklist: checklist,
      p_overall_result: overall,
      p_notes: String(form.get("notes") || "").trim() || null
    });

    ST.showResult(
      result,
      `Inspection recorded. Overall result: ${overall.replace("_", " ").toUpperCase()}.`
    );

    formEl.reset();

  } catch (e) {
    ST.showResult(
      result,
      e.message || "Inspection could not be recorded.",
      "error"
    );

  } finally {
    submit.disabled = false;
    submit.textContent = "Submit Inspection";
  }
});
