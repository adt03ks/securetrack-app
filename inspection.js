document
  .getElementById("inspectionForm")
  .addEventListener("submit", async (ev) => {

    ev.preventDefault();

    const formEl = ev.currentTarget;
    const ST = window.SecureTrack;

    const result =
      document.getElementById("result");

    const submit =
      formEl.querySelector(
        "button[type=submit]"
      );

    const form =
      new FormData(formEl);

    const checklist = {};


    // ==========================================
    // COLLECT INSPECTION RESPONSES
    // ==========================================

    [
      "battery",
      "cartridge",
      "display",
      "housing",
      "safety"
    ].forEach((key) => {

      checklist[key] =
        form.get(key);

    });


    // ==========================================
    // FIND FAILED ITEMS
    // ==========================================

    const failedItems =
      Object.entries(checklist)
        .filter(
          ([key, value]) =>
            value === "fail"
        )
        .map(
          ([key]) =>
            humanizeInspectionItem(key)
        );


    const notes =
      String(
        form.get("notes") || ""
      ).trim();


    // ==========================================
    // REQUIRE NOTES FOR ANY FAILED ITEM
    // ==========================================

    if (
      failedItems.length > 0 &&
      !notes
    ) {

      ST.showResult(
        result,
        `Notes are required for failed inspection item(s): ${failedItems.join(", ")}.`,
        "error"
      );

      updateFailedNotesRequirement();

      document
        .getElementById(
          "inspectionNotes"
        )
        ?.focus();

      return;
    }


    // ==========================================
    // OVERALL INSPECTION RESULT
    //
    // ONLY CARTRIDGE ACCESSORY FAIL
    // MAKES THE OVERALL INSPECTION FAIL.
    // ==========================================

    const cartridgeResult =
      checklist.cartridge;


    const overall =
      cartridgeResult === "fail"
        ? "fail"
        : "pass";


    submit.disabled =
      true;

    submit.textContent =
      "Saving inspection…";


    try {

      await ST.rpc(
        "record_device_inspection",
        {

          p_public_token:
            ST.assetToken(),

          p_employee_number:
            String(
              form.get(
                "employee_number"
              ) || ""
            ).trim(),

          p_badge_number:
            String(
              form.get(
                "badge_number"
              ) || ""
            ).trim(),

          p_checklist:
            checklist,

          p_overall_result:
            overall,

          p_notes:
            notes || null

        }
      );


      ST.showResult(
        result,
        `Inspection recorded. Overall result: ${overall.toUpperCase()}.`
      );


      formEl.reset();

      updateFailedNotesRequirement();


      // ========================================
      // PASS = RETURN TO DEVICE
      // ========================================

      if (
        overall === "pass"
      ) {

        submit.textContent =
          "✓ Inspection Passed";

        submit.disabled =
          true;


        setTimeout(() => {

          window.location.href =
            `index.html?asset=${encodeURIComponent(
              ST.assetToken()
            )}`;

        }, 1200);

      }


      // ========================================
      // FAIL = CARTRIDGE ACCESSORY FAILED
      // ========================================

      if (
        overall === "fail"
      ) {

        submit.textContent =
          "Inspection Failed";

        submit.disabled =
          false;

      }


    } catch (e) {

      ST.showResult(
        result,
        e.message ||
          "Inspection could not be recorded.",
        "error"
      );


      submit.disabled =
        false;


      submit.textContent =
        "Submit Inspection";

    }

  });


// ==================================================
// INSPECTION ITEM LABELS
// ==================================================

function humanizeInspectionItem(key) {

  const labels = {

    battery:
      "Battery",

    cartridge:
      "Cartridge Accessory",

    display:
      "Display",

    housing:
      "Housing",

    safety:
      "Safety"

  };


  return labels[key] || key;
}


// ==================================================
// FAILED ITEM NOTES REQUIREMENT
// ==================================================

function updateFailedNotesRequirement() {

  const form =
    document.getElementById(
      "inspectionForm"
    );

  const alert =
    document.getElementById(
      "failedNotesAlert"
    );

  const message =
    document.getElementById(
      "failedNotesMessage"
    );

  const notes =
    document.getElementById(
      "inspectionNotes"
    );

  const submit =
    form?.querySelector(
      "button[type=submit]"
    );


  if (
    !form ||
    !alert ||
    !message ||
    !notes ||
    !submit
  ) {
    return;
  }


  const failedKeys = [

    "battery",
    "cartridge",
    "display",
    "housing",
    "safety"

  ].filter((key) => {

    const selected =
      form.querySelector(
        `input[name="${key}"]:checked`
      );

    return (
      selected?.value ===
      "fail"
    );

  });


  const failedNames =
    failedKeys.map(
      humanizeInspectionItem
    );


  const hasFailure =
    failedNames.length > 0;


  const hasNotes =
    notes.value.trim().length > 0;


  // ==========================================
  // NO FAILED ITEMS
  // ==========================================

  if (!hasFailure) {

    alert.classList.remove(
      "required",
      "satisfied"
    );

    message.textContent =
      "If any inspection item is marked FAIL, notes describing the condition must be entered before the inspection can be submitted.";

    notes.required =
      false;

    submit.disabled =
      false;

    return;
  }


  // ==========================================
  // FAILED ITEM + NO NOTES
  // ==========================================

  if (
    hasFailure &&
    !hasNotes
  ) {

    alert.classList.add(
      "required"
    );

    alert.classList.remove(
      "satisfied"
    );


    message.textContent =
      `Notes required before submission. Failed item(s): ${failedNames.join(", ")}.`;


    notes.required =
      true;


    submit.disabled =
      true;

    return;
  }


  // ==========================================
  // FAILED ITEM + NOTES ENTERED
  // ==========================================

  alert.classList.remove(
    "required"
  );

  alert.classList.add(
    "satisfied"
  );


  message.textContent =
    `Documentation entered for failed item(s): ${failedNames.join(", ")}.`;


  notes.required =
    true;


  submit.disabled =
    false;

}


// ==================================================
// WATCH INSPECTION RESPONSES
// ==================================================

document
  .querySelectorAll(
    '#inspectionForm input[type="radio"]'
  )
  .forEach((input) => {

    input.addEventListener(
      "change",
      updateFailedNotesRequirement
    );

  });


// ==================================================
// WATCH NOTES FIELD
// ==================================================

document
  .getElementById(
    "inspectionNotes"
  )
  ?.addEventListener(
    "input",
    updateFailedNotesRequirement
  );


// Initial state
updateFailedNotesRequirement();
