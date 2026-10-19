
(() => {
  "use strict";

  // =====================================================
  // SECURETRACK OP — EMPLOYEE SEPARATION
  // Personnel Administration Module
  // =====================================================

  const STM = window.SecureTrackManager;

  if (!STM?.db) {
    console.error(
      "SecureTrack Manager database is unavailable."
    );
    return;
  }

  const db = STM.db;

  let overlay = null;
  let processing = false;
  let opening = false;

  // =====================================================
  // UTILITIES
  // =====================================================

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const get = id => document.getElementById(id);

  function localToday() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  }

  function calculateServiceDays(hireDate, endDate) {
    if (!hireDate || !endDate) return null;

    const start = Date.parse(
      String(hireDate).slice(0, 10) + "T00:00:00Z"
    );

    const end = Date.parse(
      String(endDate).slice(0, 10) + "T00:00:00Z"
    );

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end)
    ) {
      return null;
    }

    const days = Math.round(
      (end - start) / 86400000
    );

    return days >= 0 ? days : null;
  }

  function completedYear(hireDate, endDate) {
    if (!hireDate || !endDate) return false;

    const parts = String(hireDate)
      .slice(0, 10)
      .split("-")
      .map(Number);

    const anniversary = new Date(
      Date.UTC(parts[0] + 1, parts[1] - 1, parts[2])
    );

    // PostgreSQL advances Feb 29 anniversaries to
    // Feb 28 in non-leap years.
    if (
      parts[1] === 2 &&
      parts[2] === 29 &&
      anniversary.getUTCMonth() === 2
    ) {
      anniversary.setUTCDate(0);
    }

    return endDate >= anniversary
      .toISOString()
      .slice(0, 10);
  }

  function setMessage(message, type = "error") {
    const element = get("separationMessage");

    if (!element) return;

    element.textContent = message;
    element.hidden = !message;
    element.style.color =
      type === "success" ? "#9adea8" : "#ffb3b3";
  }

  function closeForm() {
    if (processing) return;

    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function updateServiceDays(person) {
    const dateInput = get("separationDate");
    const output = get("separationServiceDays");

    if (!dateInput || !output) return;

    const days = calculateServiceDays(
      person.hire_date,
      dateInput.value
    );

    output.value = days === null
      ? "Unavailable"
      : `${days} calendar days`;

    const impact = get("separationRetention");

    if (impact) {
      impact.value = days === null
        ? "Unavailable"
        : completedYear(
            person.hire_date,
            dateInput.value
          )
          ? "Completed 12 Months"
          : "Under 12 Months";
    }
  }

  // =====================================================
  // STYLES
  // =====================================================

  const style = document.createElement("style");

  style.textContent = `
    .separation-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0,0,0,.88);
    }

    .separation-dialog {
      width: min(100%, 700px);
      max-height: 92vh;
      overflow-y: auto;
      background: #10151a;
      color: white;
      border: 1px solid #424950;
      border-radius: 18px;
      padding: 24px;
      box-shadow: 0 20px 70px rgba(0,0,0,.6);
    }

    .separation-dialog h2 {
      margin: 0 0 8px;
      color: #ff9292;
    }

    .separation-dialog p {
      color: #aeb7c0;
    }

    .separation-fields {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 14px;
      margin-top: 20px;
    }

    .separation-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .separation-field.full {
      grid-column: 1 / -1;
    }

    .separation-field label {
      font-size: 12px;
      font-weight: 700;
      color: #c3cbd2;
    }

    .separation-field input,
    .separation-field select,
    .separation-field textarea {
      width: 100%;
      padding: 11px;
      border-radius: 9px;
      border: 1px solid #424950;
      background: #080b0f;
      color: white;
      font: inherit;
    }

    .separation-field input:disabled {
      opacity: .75;
    }

    .separation-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .separation-actions button {
      padding: 11px 15px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
    }

    .separation-cancel {
      background: #222931;
      border: 1px solid #515b65;
      color: white;
    }

    .separation-submit {
      background: #a53e3e;
      border: 1px solid #e06868;
      color: white;
    }

    .separation-submit:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .separation-warning {
      margin-top: 18px;
      padding: 12px;
      border: 1px solid #856323;
      border-radius: 10px;
      background: rgba(255,170,0,.08);
      color: #ffda91;
      font-size: 13px;
    }

    .separation-review {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid #a53e3e;
      border-radius: 12px;
      background: rgba(165,62,62,.10);
    }

    .separation-review strong {
      color: #ffb0b0;
    }

    .separation-message {
      margin-top: 15px;
      font-size: 13px;
      font-weight: 700;
    }

    .separation-result {
      margin-top: 18px;
      padding: 16px;
      border: 1px solid #39794b;
      border-radius: 12px;
      background: rgba(50,130,75,.12);
      line-height: 1.8;
      overflow-wrap: anywhere;
    }

    .separation-result strong {
      color: #9adea8;
    }

    @media (max-width: 600px) {
      .separation-fields {
        grid-template-columns: 1fr;
      }

      .separation-dialog {
        padding: 17px;
      }
    }
  `;

  document.head.appendChild(style);

  // =====================================================
  // FORM VALIDATION
  // =====================================================

  function validateForm(person) {
    const effectiveDate = get("separationDate").value;
    const hrDate = get("separationHRDate").value;
    const reason = get("separationReason").value;
    const notes = get("separationNotes").value.trim();
    const propertyStatus = get("separationProperty").value;
    const propertyNotes =
      get("separationPropertyNotes").value.trim();

    const today = localToday();

    if (!person.hire_date) {
      throw new Error(
        "This employee needs a recorded hire date before separation."
      );
    }

    if (!effectiveDate) {
      throw new Error(
        "Enter the effective separation date."
      );
    }

    if (
      effectiveDate > today ||
      effectiveDate < String(person.hire_date).slice(0, 10)
    ) {
      throw new Error(
        "The separation date must be between the hire date and today."
      );
    }

    if (!hrDate || hrDate > today) {
      throw new Error(
        "Enter a valid HR approval date that is not in the future."
      );
    }

    if (!reason) {
      throw new Error(
        "Select a separation reason."
      );
    }

    if (!propertyStatus) {
      throw new Error(
        "Select the property return status."
      );
    }

    if (propertyStatus === "review") {
      throw new Error(
        "Property verification is pending. Resolve the status before finalizing separation."
      );
    }

    if (
      propertyStatus === "outstanding" &&
      !propertyNotes
    ) {
      throw new Error(
        "Describe all outstanding employee property."
      );
    }

    const days = calculateServiceDays(
      person.hire_date,
      effectiveDate
    );

    if (days === null) {
      throw new Error(
        "Unable to calculate the employment period."
      );
    }

    return {
      p_user_id: person.user_id,
      p_separation_reason: reason,
      p_separation_notes: notes,
      p_hr_approval_date: hrDate,
      p_termination_effective_date: effectiveDate,
      p_property_return_confirmed:
        propertyStatus === "returned",
      p_property_notes: propertyNotes
    };
  }

  // =====================================================
  // REFRESH PERSONNEL AND PROPERTY
  // =====================================================

  async function refreshPersonnel() {
    const refreshButton = get("refreshActiveButton");
    const propertyButton = get("refreshPropertyButton");

    // Existing Personnel Administration refresh logic
    // reloads the directory and separation list.
    if (refreshButton) {
      refreshButton.click();
    }

    if (propertyButton) {
      propertyButton.click();
    }
  }

  // =====================================================
  // SEPARATION RESULTS
  // =====================================================

  function showSuccess(result) {
    processing = false;

    const dialog = overlay?.querySelector(
      ".separation-dialog"
    );

    if (!dialog) return;

    const completed =
      result.completed_12_months === true;

    const propertyReturned =
      result.property_return_confirmed === true;

    dialog.innerHTML = `
      <h2 style="color:#9adea8">
        Separation Completed
      </h2>

      <p>
        SecureTrack successfully recorded
        the employee separation.
      </p>

      <div class="separation-result">

        <strong>Employee:</strong>
        ${escapeHTML(result.employee_name)}
        <br>

        <strong>Employee Number:</strong>
        ${escapeHTML(result.employee_number || "—")}
        <br>

        <strong>Former Shift:</strong>
        ${escapeHTML(result.former_shift || "—")}
        <br>

        <strong>Hire Date:</strong>
        ${escapeHTML(result.hire_date || "—")}
        <br>

        <strong>Termination Date:</strong>
        ${escapeHTML(
          result.termination_effective_date || "—"
        )}
        <br>

        <strong>Days Employed:</strong>
        ${escapeHTML(result.service_days)}
        <br>

        <strong>12-Month Completion:</strong>
        ${completed ? "Yes" : "No"}
        <br>

        <strong>Retention Impact:</strong>
        ${result.retention_impact === true
          ? "Yes — Under 12 Months"
          : "No — Completed 12 Months"}
        <br>

        <strong>Property Returned:</strong>
        ${propertyReturned ? "Yes" : "No"}
        <br>

        <strong>Tracked Devices Outstanding:</strong>
        ${escapeHTML(
          result.tracked_devices_outstanding ?? 0
        )}
        <br>

        <strong>Separation Reference:</strong>
        ${escapeHTML(result.separation_id || "—")}

      </div>

      <div class="separation-warning">
        The employee's operational profile has
        been deactivated. Historical activity
        and accountability records are preserved.
      </div>

      <div class="separation-actions">
        <button
          type="button"
          class="separation-cancel"
          id="separationDone"
        >
          Close
        </button>
      </div>
    `;

    get("separationDone").addEventListener(
      "click",
      closeForm
    );

    refreshPersonnel().catch(error => {
      console.error(
        "Unable to refresh personnel lists:",
        error
      );
    });
  }

  // =====================================================
  // FINAL SEPARATION SUBMISSION
  // =====================================================

  async function submitSeparation(person, payload) {
    if (processing) return;

    const confirmation = get("separationConfirmation");

    if (
      !confirmation ||
      confirmation.value.trim() !== "SEPARATE"
    ) {
      setMessage(
        "Type SEPARATE exactly to authorize this action."
      );
      return;
    }

    const submitButton = get("separationFinalSubmit");
    const backButton = get("separationBack");
    const cancelButton = get("separationCancel");

    processing = true;

    submitButton.disabled = true;
    backButton.disabled = true;
    cancelButton.disabled = true;

    submitButton.textContent =
      "Processing Separation...";

    setMessage("");

    try {
      // This is the live Supabase operation.
      const { data, error } = await db.rpc(
        "finalize_employee_separation",
        payload
      );

      if (error) throw error;

      if (!data || data.success !== true) {
        throw new Error(
          "Supabase did not confirm the separation."
        );
      }

      showSuccess(data);

    } catch (error) {
      console.error(
        "Employee separation failed:",
        error
      );

      processing = false;

      submitButton.disabled = false;
      backButton.disabled = false;
      cancelButton.disabled = false;

      submitButton.textContent =
        "Finalize Employee Separation";

      setMessage(
        error.message ||
        "The employee separation could not be completed."
      );
    }
  }

  // =====================================================
  // FINAL REVIEW
  // =====================================================

  function showFinalReview(person) {
    setMessage("");

    let payload;

    try {
      payload = validateForm(person);
    } catch (error) {
      setMessage(error.message);
      return;
    }

    // Keep the form values visible but locked
    // while the final review is displayed.
    const fields = overlay.querySelectorAll(
      ".separation-fields input:not(:disabled), " +
      ".separation-fields select, " +
      ".separation-fields textarea"
    );

    fields.forEach(field => {
      field.disabled = true;
    });

    const review = get("separationReview");

    review.hidden = false;

    review.innerHTML = `
      <h3 style="margin-top:0;color:#ff9292">
        Final Separation Authorization
      </h3>

      <p>
        You are about to permanently deactivate
        this employee's operational access.
      </p>

      <p>
        <strong>Employee:</strong>
        ${escapeHTML(person.display_name)}
      </p>

      <p>
        <strong>Employee Number:</strong>
        ${escapeHTML(person.employee_number || "—")}
      </p>

      <p>
        <strong>Effective Date:</strong>
        ${escapeHTML(
          payload.p_termination_effective_date
        )}
      </p>

      <p>
        <strong>HR Approval:</strong>
        ${escapeHTML(payload.p_hr_approval_date)}
      </p>

      <p>
        <strong>Reason:</strong>
        ${escapeHTML(payload.p_separation_reason)}
      </p>

      <p>
        <strong>Property Status:</strong>
        ${payload.p_property_return_confirmed
          ? "All property reported returned"
          : "Outstanding property documented"}
      </p>

      <div class="separation-warning">
        This action removes the employee from
        active personnel and shift rosters,
        revokes operational roles, and creates
        a permanent separation audit record.
        Confirm that HR has approved this action.
      </div>

      <div class="separation-field full"
        style="margin-top:18px">

        <label for="separationConfirmation">
          Type SEPARATE to confirm
        </label>

        <input
          id="separationConfirmation"
          type="text"
          placeholder="SEPARATE"
          autocomplete="off"
        >

      </div>
    `;

    get("separationSubmit").hidden = true;

    const backButton = get("separationBack");
    const finalButton = get("separationFinalSubmit");

    backButton.hidden = false;
    finalButton.hidden = false;

    backButton.onclick = () => {
      if (processing) return;

      review.hidden = true;
      review.innerHTML = "";

      fields.forEach(field => {
        field.disabled = false;
      });

      backButton.hidden = true;
      finalButton.hidden = true;

      get("separationSubmit").hidden = false;

      setMessage("");
    };

    finalButton.onclick = () => {
      submitSeparation(person, payload);
    };
  }

  // =====================================================
  // OPEN SEPARATION FORM
  // =====================================================

  async function openSeparationForm(userId) {
    if (processing || opening) return;

    opening = true;

    let person;

    try {
      const { data, error } = await db.rpc(
        "get_personnel_admin_directory",
        {
          p_include_terminated: false
        }
      );

      if (error) throw error;

      person = (data || []).find(
        employee => employee.user_id === userId
      );

      if (!person) {
        throw new Error(
          "The selected employee was not found in the active personnel directory."
        );
      }

    } catch (error) {
      console.error(
        "Unable to load separation employee:",
        error
      );

      alert(error.message);
      return;

    } finally {
      opening = false;
    }

    closeForm();

    const localDate = localToday();

    overlay = document.createElement("div");
    overlay.className = "separation-overlay";

    overlay.innerHTML = `
      <section
        class="separation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="separationTitle"
      >
        <h2 id="separationTitle">
          Employee Separation
        </h2>

        <p>
          Complete the approved employee
          separation information below.
        </p>

        <div class="separation-fields">

          <div class="separation-field full">
            <label for="separationName">
              Employee Name
            </label>

            <input
              id="separationName"
              disabled
              value="${escapeHTML(person.display_name)}"
            >
          </div>

          <div class="separation-field">
            <label for="separationNumber">
              Employee Number
            </label>

            <input
              id="separationNumber"
              disabled
              value="${escapeHTML(
                person.employee_number || "—"
              )}"
            >
          </div>

          <div class="separation-field">
            <label for="separationShift">
              Current Shift
            </label>

            <input
              id="separationShift"
              disabled
              value="${escapeHTML(
                person.shift_name || "Unassigned"
              )}"
            >
          </div>

          <div class="separation-field">
            <label for="separationHire">
              Hire Date
            </label>

            <input
              id="separationHire"
              disabled
              value="${escapeHTML(
                person.hire_date || "Not recorded"
              )}"
            >
          </div>

          <div class="separation-field">
            <label for="separationDate">
              Effective Separation Date
            </label>

            <input
              id="separationDate"
              type="date"
              value="${localDate}"
              max="${localDate}"
              required
            >
          </div>

          <div class="separation-field">
            <label for="separationServiceDays">
              Days Employed
            </label>

            <input
              id="separationServiceDays"
              disabled
            >
          </div>

          <div class="separation-field">
            <label for="separationRetention">
              Retention Classification
            </label>

            <input
              id="separationRetention"
              disabled
            >
          </div>

          <div class="separation-field">
            <label for="separationHRDate">
              HR Approval Date
            </label>

            <input
              id="separationHRDate"
              type="date"
              max="${localDate}"
              required
            >
          </div>

          <div class="separation-field">
            <label for="separationReason">
              Separation Reason
            </label>

            <select id="separationReason" required>
              <option value="">
                Select a reason
              </option>

              <option value="voluntary">
                Voluntary Resignation
              </option>

              <option value="involuntary">
                Involuntary Termination
              </option>

              <option value="retirement">
                Retirement
              </option>

              <option value="end_of_assignment">
                End of Assignment
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </div>

          <div class="separation-field full">
            <label for="separationProperty">
              Property Return Status
            </label>

            <select id="separationProperty" required>
              <option value="">
                Select status
              </option>

              <option value="returned">
                All Property Returned
              </option>

              <option value="outstanding">
                Property Outstanding
              </option>

              <option value="review">
                Pending Verification
              </option>
            </select>
          </div>

          <div class="separation-field full">
            <label for="separationPropertyNotes">
              Property Return / Outstanding Notes
            </label>

            <textarea
              id="separationPropertyNotes"
              rows="3"
              placeholder="Document outstanding equipment, keys, badges, uniforms, or verified returns."
            ></textarea>
          </div>

          <div class="separation-field full">
            <label for="separationNotes">
              Administrative Notes
            </label>

            <textarea
              id="separationNotes"
              rows="4"
              placeholder="Record approved separation details."
            ></textarea>
          </div>

        </div>

        <div class="separation-warning">
          Separation must be approved by HR.
          Confirm that the dates, property status,
          and employee information are correct.
        </div>

        <div
          id="separationMessage"
          class="separation-message"
          role="alert"
          hidden
        ></div>

        <div
          id="separationReview"
          class="separation-review"
          hidden
        ></div>

        <div class="separation-actions">

          <button
            type="button"
            class="separation-cancel"
            id="separationCancel"
          >
            Cancel
          </button>

          <button
            type="button"
            class="separation-submit"
            id="separationSubmit"
          >
            Review Separation
          </button>

          <button
            type="button"
            class="separation-cancel"
            id="separationBack"
            hidden
          >
            Back to Form
          </button>

          <button
            type="button"
            class="separation-submit"
            id="separationFinalSubmit"
            hidden
          >
            Finalize Employee Separation
          </button>

        </div>
      </section>
    `;

    document.body.appendChild(overlay);

    get("separationCancel").addEventListener(
      "click",
      closeForm
    );

    get("separationSubmit").addEventListener(
      "click",
      () => showFinalReview(person)
    );

    get("separationDate").addEventListener(
      "change",
      () => updateServiceDays(person)
    );

    overlay.addEventListener(
      "click",
      event => {
        if (event.target === overlay) {
          closeForm();
        }
      }
    );

    updateServiceDays(person);
  }

  // =====================================================
  // INTERCEPT BOTH EXISTING SEPARATION BUTTONS
  // =====================================================

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        'button[data-action="separate"],' +
        'button[data-separation-id]'
      );

      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const userId =
        button.dataset.separationId ||
        button.dataset.id;

      if (!userId) return;

      openSeparationForm(userId).catch(error => {
        console.error(
          "Employee separation form error:",
          error
        );

        alert(
          "Unable to open Employee Separation."
        );
      });
    },
    true
  );

  console.info(
    "SecureTrack Employee Separation module loaded."
  );

})();
