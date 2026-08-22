document
  .getElementById("inspectionForm")
  .addEventListener("submit", async (ev) => {

    ev.preventDefault();

    const formEl = ev.currentTarget;
    const ST = window.SecureTrack;
    const result = document.getElementById("result");
    const submit = formEl.querySelector("button[type=submit]");
    const form = new FormData(formEl);

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
    // DETERMINE OVERALL INSPECTION RESULT
    // ==========================================
    //
    // SecureTrack Rule:
    //
    // The inspection passes regardless of other
    // checklist responses or remarks.
    //
    // ONLY a failed Cartridge Accessory
    // causes the overall inspection to FAIL.
    // ==========================================

    const cartridgeResult =
      checklist.cartridge;


    const overall =
      cartridgeResult === "fail"
        ? "fail"
        : "pass";


    submit.disabled = true;

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
              form.get("employee_number") || ""
            ).trim(),

          p_badge_number:
            String(
              form.get("badge_number") || ""
            ).trim(),

          p_checklist:
            checklist,

          p_overall_result:
            overall,

          p_notes:
            String(
              form.get("notes") || ""
            ).trim() || null

        }
      );


      // ========================================
      // SUCCESS MESSAGE
      // ========================================

      ST.showResult(
        result,
        `Inspection recorded. Overall result: ${overall.toUpperCase()}.`
      );


      formEl.reset();


      // ========================================
      // PASS = RETURN TO DEVICE FOR CHECKOUT
      // ========================================

      if (overall === "pass") {

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

      if (overall === "fail") {

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
