
(() => {
  "use strict";

  // SecureTrack OP — Employee Separation
  // Phase 1: Form interface only.
  // No database changes are performed.

  const STM = window.SecureTrackManager;

  if (!STM) {
    console.error("SecureTrack Manager is unavailable.");
    return;
  }

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const style = document.createElement("style");

  style.textContent = `
    .separation-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(0,0,0,.85);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .separation-dialog {
      width: min(100%, 680px);
      max-height: 92vh;
      overflow-y: auto;
      background: #10151a;
      color: #fff;
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
      color: #fff;
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
      background: #773434;
      border: 1px solid #b85656;
      color: white;
    }

    .separation-submit:disabled {
      opacity: .5;
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

    @media (max-width: 600px) {
      .separation-fields {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  let overlay = null;

  function closeForm() {
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
  }

  function calculateServiceDays(hireDate, endDate) {
    if (!hireDate || !endDate) return null;

    const start = Date.parse(hireDate.slice(0, 10) + "T00:00:00Z");
    const end = Date.parse(endDate + "T00:00:00Z");

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }

    const days = Math.round((end - start) / 86400000);
    return days >= 0 ? days : null;
  }

  function updateServiceDays(person) {
    const dateInput = document.getElementById("separationDate");
    const output = document.getElementById("separationServiceDays");

    if (!dateInput || !output) return;

    const days = calculateServiceDays(
      person.hire_date,
      dateInput.value
    );

    output.value = days === null
      ? "Unavailable"
      : `${days} calendar days`;
  }

  async function openSeparationForm(userId) {
    const { data, error } = await STM.db.rpc(
      "get_personnel_admin_directory",
      { p_include_terminated: false }
    );

    if (error) {
      console.error("Separation directory:", error);
      alert("Unable to retrieve employee information: " + error.message);
      return;
    }

    const person = (data || []).find(
      employee => employee.user_id === userId
    );

    if (!person) {
      alert("Employee was not found in the active personnel directory.");
      return;
    }

    closeForm();

    const today = new Date();
    const localDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    overlay = document.createElement("div");
    overlay.className = "separation-overlay";

    overlay.innerHTML = `
      <section
        class="separation-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="separationTitle"
      >
        <h2 id="separationTitle">Employee Separation</h2>
        <p>Review the employee information before proceeding.</p>

        <div class="separation-fields">
          <div class="separation-field full">
            <label for="separationName">Employee Name</label>
            <input id="separationName" disabled
              value="${escapeHTML(person.display_name)}">
          </div>

          <div class="separation-field">
            <label for="separationNumber">Employee Number</label>
            <input id="separationNumber" disabled
              value="${escapeHTML(person.employee_number || "—")}">
          </div>

          <div class="separation-field">
            <label for="separationShift">Current Shift</label>
            <input id="separationShift" disabled
              value="${escapeHTML(person.shift_name || "Unassigned")}">
          </div>

          <div class="separation-field">
            <label for="separationHire">Hire Date</label>
            <input id="separationHire" disabled
              value="${escapeHTML(person.hire_date || "Not recorded")}">
          </div>

          <div class="separation-field">
            <label for="separationDate">Effective Separation Date</label>         
<input
  id="separationDate"
  type="date"
  value="${localDate}"
  max="${localDate}"
  required
>

          </div>

          <div class="separation-field">
            <label for="separationServiceDays">Days Employed</label>
            <input id="separationServiceDays" disabled>
          </div>


<div class="separation-field">
  <label for="separationHRDate">
    HR Approval Date
  </label>
  <input
    id="separationHRDate"
    type="date"
    required
    max="${localDate}"
  >
</div>


          <div class="separation-field">
            <label for="separationReason">Separation Reason</label>
            <select id="separationReason">
              <option value="">Select a reason</option>
              <option value="voluntary">Voluntary Resignation</option>
              <option value="involuntary">Involuntary Termination</option>
              <option value="retirement">Retirement</option>
              <option value="end_of_assignment">End of Assignment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div class="separation-field full">
            <label for="separationProperty">Property Return Status</label>
            <select id="separationProperty">
              <option value="">Select status</option>
              <option value="returned">All Property Returned</option>
              <option value="outstanding">Property Outstanding</option>
              <option value="review">Pending Verification</option>
            </select>
          </div>


<div class="separation-field full">
  <label for="separationPropertyNotes">
    Outstanding Property / Return Notes
  </label>
  <textarea
    id="separationPropertyNotes"
    rows="3"
    placeholder="Identify outstanding equipment, uniforms, keys, badges, or document verified returns."
  ></textarea>
</div>


          <div class="separation-field full">
            <label for="separationNotes">Administrative Notes</label>
            <textarea id="separationNotes" rows="4"
              placeholder="Record approved separation information..."></textarea>
          </div>
        </div>

        <div class="separation-warning">
          Preview only. No separation or account changes will be submitted
          until the secure backend is connected and tested.
        </div>

        <div class="separation-actions">
          <button type="button" class="separation-cancel"
            id="separationCancel">Cancel</button>
          <button type="button" class="separation-submit"
            disabled>Confirm Separation</button>
        </div>
      </section>
    `;

    document.body.appendChild(overlay);

    document.getElementById("separationCancel")
      .addEventListener("click", closeForm);

    document.getElementById("separationDate")
      .addEventListener("change", () => updateServiceDays(person));

    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeForm();
    });

    updateServiceDays(person);
  }

  // Capture both buttons before the page's placeholder handler.

  document.addEventListener("click", event => {
    const button = event.target.closest(
      'button[data-action="separate"],button[data-separation-id]'
    );

    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const userId = button.dataset.separationId || button.dataset.id;

    if (userId) {
      openSeparationForm(userId).catch(error => {
        console.error("Employee separation form:", error);
        alert("Unable to open the separation form.");
      });
    }
  }, true);

  console.info("SecureTrack Employee Separation module loaded.");
})();
