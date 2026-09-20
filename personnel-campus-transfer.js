(function () {
  "use strict";

  const STM = window.SecureTrackManager;

  if (!STM || !STM.db) {
    console.error(
      "SecureTrackManager is required for Campus Transfer."
    );
    return;
  }

  const db = STM.db;

  let currentPersonnel = null;
  let submitting = false;

  // =========================================================
  // STYLES
  // =========================================================

  const style = document.createElement("style");

  style.textContent = `
    .campus-transfer-overlay[hidden] {
      display: none !important;
    }

    .campus-transfer-overlay {
      position: fixed;
      inset: 0;
      z-index: 10040;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 34px 16px;
      background: rgba(0,0,0,.82);
      backdrop-filter: blur(4px);
    }

    .campus-transfer-modal {
      width: min(760px, 100%);
      overflow: hidden;
      border: 1px solid #3b4249;
      border-radius: 18px;
      background: linear-gradient(145deg,#0b0e11,#11151a);
      box-shadow: 0 24px 80px rgba(0,0,0,.62);
    }

    .campus-transfer-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
      padding: 22px 24px;
      border-bottom: 1px solid #2d333a;
    }

    .campus-transfer-head h2 {
      margin: 4px 0 0;
    }

    .campus-transfer-close {
      width: 38px;
      height: 38px;
      border: 1px solid #3b4249;
      border-radius: 10px;
      background: #11151a;
      color: #fff;
      cursor: pointer;
      font-size: 20px;
    }

    .campus-transfer-body {
      padding: 24px;
    }

    .campus-transfer-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 10px;
      margin-bottom: 18px;
    }

    .campus-transfer-summary-item {
      border: 1px solid #30363d;
      border-radius: 11px;
      padding: 11px 12px;
      background: #0a0d10;
    }

    .campus-transfer-summary-item span {
      display: block;
      margin-bottom: 3px;
      color: #8f979f;
      font-size: 10px;
      font-weight: 850;
      letter-spacing: .07em;
      text-transform: uppercase;
    }

    .campus-transfer-summary-item strong {
      color: #f5f7f8;
      font-size: 14px;
    }

    .campus-transfer-warning {
      margin-bottom: 20px;
      padding: 14px 15px;
      border: 1px solid rgba(255,146,43,.42);
      border-radius: 12px;
      background: rgba(255,146,43,.08);
      color: #f1c18b;
      line-height: 1.55;
    }

    .campus-transfer-warning strong {
      color: #ff922b;
    }

    .campus-transfer-grid {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 15px;
    }

    .campus-transfer-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .campus-transfer-field.full {
      grid-column: 1 / -1;
    }

    .campus-transfer-field label {
      color: #b8bec5;
      font-size: 12px;
      font-weight: 800;
    }

    .campus-transfer-field input,
    .campus-transfer-field textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #383f46;
      border-radius: 10px;
      background: #080b0e;
      color: #f4f6f7;
      padding: 11px 12px;
      font: inherit;
    }

    .campus-transfer-field textarea {
      min-height: 96px;
      resize: vertical;
    }

    .campus-transfer-field input:focus,
    .campus-transfer-field textarea:focus {
      outline: 2px solid rgba(255,120,0,.25);
      border-color: #ff7800;
    }

    .campus-transfer-ack {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-top: 18px;
      padding: 13px 14px;
      border: 1px solid #353c43;
      border-radius: 11px;
      background: #090c0f;
      color: #d6dade;
      line-height: 1.45;
      cursor: pointer;
    }

    .campus-transfer-ack input {
      width: 18px;
      height: 18px;
      flex: 0 0 auto;
      margin-top: 1px;
    }

    .campus-transfer-message {
      display: none;
      margin-top: 16px;
      padding: 11px 13px;
      border-radius: 10px;
    }

    .campus-transfer-message.success {
      display: block;
      color: #9adea8;
      border: 1px solid rgba(87,187,109,.4);
      background: rgba(87,187,109,.08);
    }

    .campus-transfer-message.error {
      display: block;
      color: #ffadad;
      border: 1px solid rgba(224,74,74,.45);
      background: rgba(224,74,74,.08);
    }

    .campus-transfer-message.info {
      display: block;
      color: #ffbf79;
      border: 1px solid rgba(255,146,43,.35);
      background: rgba(255,146,43,.07);
    }

    .campus-transfer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      flex-wrap: wrap;
      padding: 18px 24px;
      border-top: 1px solid #2d333a;
    }

    .campus-transfer-button {
      border-color: rgba(255,146,43,.55) !important;
      color: #ffb25f !important;
    }

    .campus-transfer-confirm {
      border: 1px solid #ff7800;
      border-radius: 10px;
      background: #ff7800;
      color: #111;
      padding: 10px 15px;
      cursor: pointer;
      font-weight: 900;
    }

    .campus-transfer-confirm:disabled {
      opacity: .45;
      cursor: not-allowed;
    }

    .campus-transfer-cancel {
      border: 1px solid #3a4249;
      border-radius: 10px;
      background: #11161b;
      color: #e5e8eb;
      padding: 10px 15px;
      cursor: pointer;
      font-weight: 800;
    }

    @media (max-width: 650px) {
      .campus-transfer-summary,
      .campus-transfer-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  // =========================================================
  // MODAL
  // =========================================================

  const overlay = document.createElement("div");
  overlay.id = "campusTransferOverlay";
  overlay.className = "campus-transfer-overlay";
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");

  overlay.innerHTML = `
    <section
      class="campus-transfer-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campusTransferTitle"
    >
      <div class="campus-transfer-head">
        <div>
          <div class="eyebrow">Personnel Transfer</div>
          <h2 id="campusTransferTitle">Transfer to Outside Officer</h2>
          <p id="campusTransferSubtitle" class="subtle" style="margin:7px 0 0;">
            Move an active local officer to the Outside Officer Directory.
          </p>
        </div>

        <button
          id="campusTransferClose"
          class="campus-transfer-close"
          type="button"
          aria-label="Close"
        >×</button>
      </div>

      <form id="campusTransferForm">
        <div class="campus-transfer-body">
          <input id="campusTransferUserId" type="hidden">

          <div class="campus-transfer-summary">
            <div class="campus-transfer-summary-item">
              <span>Officer</span>
              <strong id="campusTransferOfficerName">—</strong>
            </div>

            <div class="campus-transfer-summary-item">
              <span>Current Shift</span>
              <strong id="campusTransferCurrentShift">—</strong>
            </div>

            <div class="campus-transfer-summary-item">
              <span>Employee #</span>
              <strong id="campusTransferEmployeeNumber">—</strong>
            </div>

            <div class="campus-transfer-summary-item">
              <span>Current Rank</span>
              <strong id="campusTransferRank">—</strong>
            </div>
          </div>

          <div class="campus-transfer-warning">
            <strong>This changes the officer's SecureTrack access.</strong><br>
            The officer will be removed from active local personnel, their local shift assignment will be closed,
            and their SecureTrack application roles will be revoked. Their original profile and historical records
            are preserved. A linked Outside Officer record will remain available for future overtime assignments.
          </div>

          <div class="campus-transfer-grid">
            <div class="campus-transfer-field">
              <label for="campusTransferHomeCampus">New Home Campus *</label>
              <input
                id="campusTransferHomeCampus"
                type="text"
                placeholder="Example: Memorial City"
                autocomplete="off"
                required
              >
            </div>

            <div class="campus-transfer-field">
              <label for="campusTransferEffectiveDate">Effective Date *</label>
              <input
                id="campusTransferEffectiveDate"
                type="date"
                required
              >
            </div>

            <div class="campus-transfer-field full">
              <label for="campusTransferNotes">Transfer Notes</label>
              <textarea
                id="campusTransferNotes"
                placeholder="Optional notes about the campus transfer"
              ></textarea>
            </div>
          </div>

          <label class="campus-transfer-ack">
            <input id="campusTransferAcknowledge" type="checkbox">
            <span>
              I understand that completing this transfer will revoke this officer's current SecureTrack application access
              and convert them to an Outside Officer record for this campus.
            </span>
          </label>

          <div
            id="campusTransferMessage"
            class="campus-transfer-message"
            role="status"
            aria-live="polite"
          ></div>
        </div>

        <div class="campus-transfer-footer">
          <button
            id="campusTransferCancel"
            class="campus-transfer-cancel"
            type="button"
          >Cancel</button>

          <button
            id="campusTransferConfirm"
            class="campus-transfer-confirm"
            type="submit"
            disabled
          >Transfer to Outside Officer</button>
        </div>
      </form>
    </section>
  `;

  document.body.appendChild(overlay);

  const form = document.getElementById("campusTransferForm");
  const closeButton = document.getElementById("campusTransferClose");
  const cancelButton = document.getElementById("campusTransferCancel");
  const confirmButton = document.getElementById("campusTransferConfirm");
  const acknowledge = document.getElementById("campusTransferAcknowledge");
  const userIdInput = document.getElementById("campusTransferUserId");
  const homeCampusInput = document.getElementById("campusTransferHomeCampus");
  const effectiveDateInput = document.getElementById("campusTransferEffectiveDate");
  const notesInput = document.getElementById("campusTransferNotes");
  const messageBox = document.getElementById("campusTransferMessage");

  function localToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function rankLabel(value) {
    const labels = {
      officer: "Officer",
      senior_officer: "Senior Officer",
      team_lead: "Team Lead",
      dispatcher: "Dispatcher",
      manager: "Manager",
      director: "Director",
      admin: "Administrator"
    };

    return labels[value] || value || "—";
  }

  function setMessage(message, type) {
    messageBox.className = "campus-transfer-message";
    messageBox.textContent = "";

    if (!message) return;

    messageBox.textContent = message;
    messageBox.classList.add(type || "info");
  }

  function resetForm() {
    currentPersonnel = null;
    form.reset();
    userIdInput.value = "";
    effectiveDateInput.value = localToday();
    confirmButton.disabled = true;
    confirmButton.textContent = "Transfer to Outside Officer";
    setMessage("", "info");

    document.getElementById("campusTransferOfficerName").textContent = "—";
    document.getElementById("campusTransferCurrentShift").textContent = "—";
    document.getElementById("campusTransferEmployeeNumber").textContent = "—";
    document.getElementById("campusTransferRank").textContent = "—";
  }

  async function openTransfer(userId) {
    if (!userId || submitting) return;

    resetForm();

    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    document.getElementById("campusTransferSubtitle").textContent =
      "Loading personnel record...";

    confirmButton.disabled = true;

    try {
      const { data, error } = await db.rpc(
        "get_personnel_admin_record",
        {
          p_user_id: userId
        }
      );

      if (error) throw error;
      if (!data) throw new Error("Personnel record was not found.");

      currentPersonnel = data;
      userIdInput.value = userId;

      document.getElementById("campusTransferSubtitle").textContent =
        "Confirm the destination campus before converting this profile to an Outside Officer.";

      document.getElementById("campusTransferOfficerName").textContent =
        data.display_name ||
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        "Personnel Record";

      document.getElementById("campusTransferCurrentShift").textContent =
        data.shift_name || "Unassigned";

      document.getElementById("campusTransferEmployeeNumber").textContent =
        data.employee_number || "—";

      document.getElementById("campusTransferRank").textContent =
        rankLabel(data.rank);

      setTimeout(() => homeCampusInput.focus(), 50);
    }
    catch (error) {
      console.error("Campus transfer record load failed:", error);
      setMessage(
        error.message || "Unable to load this personnel record.",
        "error"
      );
    }
  }

  function closeTransfer() {
    if (submitting) return;

    overlay.hidden = true;
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    resetForm();
  }

  acknowledge.addEventListener("change", () => {
    confirmButton.disabled =
      !acknowledge.checked ||
      !currentPersonnel ||
      submitting;
  });

  closeButton.addEventListener("click", closeTransfer);
  cancelButton.addEventListener("click", closeTransfer);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeTransfer();
    }
  });

  document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      !overlay.hidden &&
      !submitting
    ) {
      closeTransfer();
    }
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    if (submitting || !currentPersonnel) return;

    const userId = userIdInput.value;
    const homeCampus = homeCampusInput.value.trim();
    const effectiveDate = effectiveDateInput.value;
    const notes = notesInput.value.trim();

    if (!userId) {
      setMessage("The personnel record is missing a user ID.", "error");
      return;
    }

    if (!homeCampus) {
      setMessage("Enter the officer's new home campus.", "error");
      homeCampusInput.focus();
      return;
    }

    if (!effectiveDate) {
      setMessage("Choose the transfer effective date.", "error");
      effectiveDateInput.focus();
      return;
    }

    if (!acknowledge.checked) {
      setMessage(
        "Confirm that you understand the access change before completing the transfer.",
        "error"
      );
      return;
    }

    const officerName =
      currentPersonnel.display_name ||
      "this officer";

    const confirmed = window.confirm(
      `Transfer ${officerName} to ${homeCampus}?\n\n` +
      "This will remove the officer from active local personnel, revoke their SecureTrack application roles, and create or reactivate their linked Outside Officer record. Historical records will be preserved."
    );

    if (!confirmed) return;

    submitting = true;
    confirmButton.disabled = true;
    cancelButton.disabled = true;
    closeButton.disabled = true;
    confirmButton.textContent = "Completing Transfer…";
    setMessage("Completing campus transfer…", "info");

    try {
      const { data, error } = await db.rpc(
        "transfer_personnel_to_outside_officer",
        {
          p_user_id: userId,
          p_home_campus: homeCampus,
          p_effective_date: effectiveDate,
          p_notes: notes || null
        }
      );

      if (error) throw error;

      if (data && data.success === false) {
        throw new Error(
          data.message ||
          "SecureTrack did not complete the campus transfer."
        );
      }

      setMessage(
        `${officerName} was transferred to the Outside Officer Directory. SecureTrack application access has been revoked.`,
        "success"
      );

      // Refresh both directory sections using the page's existing controls.
      setTimeout(() => {
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";

        document.getElementById("refreshActiveButton")?.click();
        document.getElementById("refreshOutsideButton")?.click();

        if (
          window.SecureTrackOutsideOfficerEditor &&
          typeof window.SecureTrackOutsideOfficerEditor.refresh === "function"
        ) {
          window.SecureTrackOutsideOfficerEditor.refresh();
        }

        currentPersonnel = null;
        submitting = false;
        cancelButton.disabled = false;
        closeButton.disabled = false;
        confirmButton.textContent = "Transfer to Outside Officer";
      }, 950);
    }
    catch (error) {
      console.error("Campus transfer failed:", error);
      setMessage(
        error.message || "Unable to complete this campus transfer.",
        "error"
      );

      submitting = false;
      cancelButton.disabled = false;
      closeButton.disabled = false;
      confirmButton.textContent = "Transfer to Outside Officer";
      confirmButton.disabled = !acknowledge.checked;
    }
  });

  // =========================================================
  // ADD TRANSFER BUTTON TO ACTIVE PERSONNEL CARDS
  // =========================================================

  function installTransferButtons() {
    const grid = document.getElementById("activePersonnelGrid");
    if (!grid) return;

    grid.querySelectorAll(".person-card").forEach(card => {
      if (card.querySelector("button[data-campus-transfer-id]")) {
        return;
      }

      const editButton = card.querySelector(
        'button[data-action="edit"][data-id]'
      );

      const actions = card.querySelector(".card-actions");

      if (!editButton || !actions) return;

      const userId = editButton.dataset.id;
      if (!userId) return;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "action-button campus-transfer-button";
      button.dataset.campusTransferId = userId;
      button.textContent = "Transfer to Outside Officer";

      const separationButton = actions.querySelector(
        'button[data-action="separate"]'
      );

      if (separationButton) {
        actions.insertBefore(button, separationButton);
      }
      else {
        actions.appendChild(button);
      }
    });
  }

  const activeGrid = document.getElementById("activePersonnelGrid");

  if (activeGrid) {
    installTransferButtons();

    const observer = new MutationObserver(() => {
      installTransferButtons();
    });

    observer.observe(activeGrid, {
      childList: true,
      subtree: true
    });
  }

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest(
        "button[data-campus-transfer-id]"
      );

      if (!button) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      openTransfer(
        button.dataset.campusTransferId
      );
    },
    true
  );

  // Expose a tiny API for future reuse, including a future
  // "return to home campus" workflow.
  window.SecureTrackCampusTransfer = {
    open: openTransfer,
    scan: installTransferButtons
  };
})();
