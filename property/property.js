(async function () {
  "use strict";

  const BUILD_ID = "2026-09-20-summary-links-fix";
  console.log(`SecureTrack Property build ${BUILD_ID}`);

  function waitForAuth(timeoutMs = 6000) {
    if (window.SecureTrackAuth) {
      return Promise.resolve(window.SecureTrackAuth);
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const startedAt = Date.now();

      const cleanup = () => {
        document.removeEventListener("securetrack:authorized", handler);
        window.clearInterval(pollTimer);
      };

      const finish = authValue => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(authValue);
      };

      const fail = error => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const handler = event => {
        finish(event.detail || window.SecureTrackAuth);
      };

      document.addEventListener("securetrack:authorized", handler);

      const pollTimer = window.setInterval(() => {
        if (window.SecureTrackAuth) {
          finish(window.SecureTrackAuth);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          fail(
            new Error(
              "SecureTrack authorization did not initialize."
            )
          );
        }
      }, 100);
    });
  }

  let auth;

  try {
    auth = await waitForAuth();
  } catch (error) {
    console.error(
      "SecureTrack Property authentication failed:",
      error
    );

    const currentUserName =
      document.getElementById("currentUserName");

    if (currentUserName) {
      currentUserName.textContent =
        "Authentication unavailable";
    }

    return;
  }

  if (!auth?.db || !auth?.user) {
    console.error(
      "SecureTrack authorization returned without a database client or user.",
      auth
    );
    return;
  }

  const db = auth.db;
  const profile = auth.profile || {};
  const roles = Array.isArray(auth.roles)
    ? auth.roles
    : [];

  const isDisposalManager =
    roles.includes("manager") ||
    roles.includes("director");

  const currentUserName =
    document.getElementById("currentUserName");

  const currentUserRole =
    document.getElementById("currentUserRole");

  const receivingOfficer =
    document.getElementById("receivingOfficer");

  const signOutButton =
    document.getElementById("signOutButton");

  const storedCount =
    document.getElementById("storedCount");

  const releasedCount =
    document.getElementById("releasedCount");

  const disposedCount =
    document.getElementById("disposedCount");

  const totalCount =
    document.getElementById("totalCount");

  const intakeForm =
    document.getElementById("propertyIntakeForm");

  const dgNumber =
    document.getElementById("dgNumber");

  const mrnNumber =
    document.getElementById("mrnNumber");

  const description =
    document.getElementById("description");

  const category =
    document.getElementById("category");

  const receivedAt =
    document.getElementById("receivedAt");

  const locationReceived =
    document.getElementById("locationReceived");

 const storageLocation =
  document.getElementById("storageLocation");

const clinicalStaffName =
  document.getElementById("clinicalStaffName");

const clinicalStaffBadgeNumber =
  document.getElementById("clinicalStaffBadgeNumber");

const notes =
  document.getElementById("notes");

  const intakeResult =
    document.getElementById("intakeResult");

  const savePropertyButton =
    document.getElementById("savePropertyButton");

  const clearPropertyButton =
    document.getElementById("clearPropertyButton");

  const searchForm =
    document.getElementById("propertySearchForm");

  const searchInput =
    document.getElementById("propertySearchInput");

  const searchButton =
    document.getElementById("propertySearchButton");

  const searchMessage =
    document.getElementById("searchMessage");

  const resultsBody =
    document.getElementById("propertyResultsBody");

  let openDisposalRequests = new Map();
  let currentDisposalItem = null;
  let currentManagementRequest = null;
  let activePropertyStatusFilter = null;

  function roleLabel(roleList) {
    const order = [
      "admin",
      "director",
      "manager",
      "team_lead",
      "senior_officer",
      "dispatcher",
      "officer"
    ];

    const found =
      order.find(
        role =>
          roleList.includes(role)
      );

    return (
      found ||
      roleList[0] ||
      "user"
    ).replaceAll("_", " ");
  }

  function showMessage(
    element,
    message,
    type = "info"
  ) {
    if (!element) return;

    element.textContent =
      message;

    element.className =
      `message show ${type}`;
  }

  function clearMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "message";
  }

  function localDateTimeValue(
    date = new Date()
  ) {
    const local =
      new Date(
        date.getTime() -
        date.getTimezoneOffset() * 60000
      );

    return local
      .toISOString()
      .slice(0, 16);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString();
  }

  function categoryList(value) {
    return String(
      value || ""
    )
      .split("|")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);
  }

  function hasCategory(
    value,
    wanted
  ) {
    return categoryList(
      value
    ).some(
      item =>
        item.toLowerCase() ===
        String(wanted)
          .trim()
          .toLowerCase()
    );
  }

  function escapeHtml(value) {
    return String(
      value ?? ""
    ).replace(
      /[&<>"']/g,
      character =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[character]
    );
  }

  function setUserDisplay() {
    const name =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

    currentUserName.textContent =
      name;

    currentUserRole.textContent =
      roleLabel(roles);

    receivingOfficer.value =
      name;
  }

  async function loadSummary() {
    const {
      data,
      error
    } =
      await db
        .from("property_items")
        .select("status");

    if (error) {
      console.error(
        "Property summary load error:",
        error
      );

      storedCount.textContent = "—";
      releasedCount.textContent = "—";
      disposedCount.textContent = "—";
      totalCount.textContent = "—";

      return;
    }

    const rows =
      data || [];

    storedCount.textContent =
      rows.filter(
        row =>
          row.status === "stored"
      ).length;

    releasedCount.textContent =
      rows.filter(
        row =>
          row.status === "released"
      ).length;

    disposedCount.textContent =
      rows.filter(
        row =>
          row.status === "disposed"
      ).length;

    totalCount.textContent =
      rows.length;
  }

  function clearIntakeForm(
    {
      keepMessage = false
    } = {}
  ) {
    intakeForm.reset();

    receivedAt.value =
      localDateTimeValue();

    receivingOfficer.value =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

    if (!keepMessage) {
      clearMessage(
        intakeResult
      );
    }
  }

  async function loadOpenDisposalRequests() {
    try {
      const {
        data,
        error
      } =
        await db.rpc(
          "get_open_property_disposal_requests"
        );

      if (error) {
        throw error;
      }

      openDisposalRequests =
        new Map(
          (data || []).map(
            row => [
              row.property_item_id,
              row
            ]
          )
        );
    } catch (error) {
      console.warn(
        "Unable to load open disposal requests:",
        error
      );

      openDisposalRequests =
        new Map();
    }
  }

  function injectWorkflowStyles() {
    if (
      document.getElementById(
        "propertyWorkflowStyles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "propertyWorkflowStyles";

    style.textContent = `
      .property-action-stack {
        display:flex;
        flex-wrap:wrap;
        gap:7px;
        align-items:center;
      }

      .disposal-pending-badge,
      .weapon-alert-badge {
        display:inline-flex;
        align-items:center;
        border-radius:999px;
        padding:5px 8px;
        font-size:11px;
        font-weight:800;
        letter-spacing:.02em;
        white-space:nowrap;
      }

      .disposal-pending-badge {
        border:1px solid rgba(255,166,70,.45);
        background:rgba(255,139,35,.10);
        color:#ffbf79;
      }

      .weapon-alert-badge {
        border:1px solid rgba(255,83,83,.50);
        background:rgba(255,70,70,.10);
        color:#ffabab;
      }

      .button.compact.danger-action {
        border-color:rgba(255,90,90,.55);
      }

      .property-dialog {
        width:min(92vw,620px);
        border:1px solid #353b42;
        border-radius:18px;
        background:#111418;
        color:#fff;
        padding:0;
        box-shadow:0 24px 80px rgba(0,0,0,.55);
      }

      .property-dialog::backdrop {
        background:rgba(0,0,0,.72);
      }

      .property-dialog-inner {
        padding:22px;
      }

      .property-dialog h3 {
        margin:4px 0 8px;
      }

      .property-dialog .dialog-summary {
        color:#c1c7ce;
        margin-bottom:16px;
        line-height:1.45;
      }

      .property-dialog label {
        display:block;
        margin:12px 0;
      }

      .property-dialog label > span {
        display:block;
        margin-bottom:6px;
        font-weight:700;
      }

      .property-dialog textarea,
      .property-dialog input[type="text"] {
        width:100%;
        box-sizing:border-box;
      }

      .property-dialog .confirm-row {
        display:flex;
        gap:9px;
        align-items:flex-start;
        margin-top:14px;
      }

      .property-dialog .confirm-row input {
        margin-top:3px;
      }

      .property-dialog-actions {
        display:flex;
        flex-wrap:wrap;
        gap:9px;
        justify-content:flex-end;
        margin-top:18px;
      }

      .property-review-panel .table-wrap {
        margin-top:14px;
      }

      .property-review-section +
      .property-review-section {
        margin-top:30px;
        padding-top:24px;
        border-top:1px solid #30363d;
      }

      .review-count {
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:24px;
        height:24px;
        padding:0 7px;
        border-radius:999px;
        background:rgba(255,139,35,.12);
        color:#ffb46a;
        font-weight:800;
        font-size:12px;
        margin-left:7px;
      }

      .management-action-buttons {
        display:flex;
        flex-wrap:wrap;
        gap:6px;
      }

      .active-summary-filter {
        border-color:#ff7a00 !important;
        box-shadow:
          0 0 0 1px rgba(255,122,0,.25),
          0 8px 24px rgba(0,0,0,.30);
      }
    `;

    document.head.appendChild(
      style
    );
  }

  function installDialogs() {
    if (
      !document.getElementById(
        "requestDisposalDialog"
      )
    ) {
      const dialog =
        document.createElement(
          "dialog"
        );

      dialog.id =
        "requestDisposalDialog";

      dialog.className =
        "property-dialog";

      dialog.innerHTML = `
        <form
          id="requestDisposalForm"
          method="dialog"
          class="property-dialog-inner"
        >
          <div class="eyebrow">
            DISPOSAL REQUEST
          </div>

          <h3>
            Request Property Disposal
          </h3>

          <div
            id="requestDisposalSummary"
            class="dialog-summary"
          ></div>

          <label>
            <span>
              Request Notes
            </span>

            <textarea
              id="requestDisposalNotes"
              rows="4"
              placeholder="Reason for disposal request or inspection information"
            ></textarea>
          </label>

          <div
            id="requestDisposalMessage"
            class="message"
            role="status"
            aria-live="polite"
          ></div>

          <div class="property-dialog-actions">
            <button
              id="cancelRequestDisposal"
              class="button secondary"
              type="button"
            >
              Cancel
            </button>

            <button
              id="confirmRequestDisposal"
              class="button primary"
              type="submit"
            >
              Send Disposal Request
            </button>
          </div>
        </form>
      `;

      document.body.appendChild(
        dialog
      );
    }

    if (
      isDisposalManager &&
      !document.getElementById(
        "completeDisposalDialog"
      )
    ) {
      const dialog =
        document.createElement(
          "dialog"
        );

      dialog.id =
        "completeDisposalDialog";

      dialog.className =
        "property-dialog";

      dialog.innerHTML = `
        <form
          id="completeDisposalForm"
          method="dialog"
          class="property-dialog-inner"
        >
          <div class="eyebrow">
            MANAGEMENT DISPOSAL
          </div>

          <h3>
            Approve & Physically Dispose
          </h3>

          <div
            id="completeDisposalSummary"
            class="dialog-summary"
          ></div>

          <label>
            <span>
              Disposal Method <b>*</b>
            </span>

            <input
              id="disposalMethod"
              type="text"
              required
              placeholder="Example: Transferred to law enforcement"
            >
          </label>

          <label>
            <span>
              Witness
            </span>

            <input
              id="disposalWitness"
              type="text"
              placeholder="Optional witness name"
            >
          </label>

          <label>
            <span>
              Disposal / Review Notes
            </span>

            <textarea
              id="completeDisposalNotes"
              rows="4"
              placeholder="Inspection findings or disposal notes"
            ></textarea>
          </label>

          <label class="confirm-row">
            <input
              id="physicalDisposalConfirmed"
              type="checkbox"
              required
            >

            <span>
              I personally inspected this property and physically completed the disposal.
            </span>
          </label>

          <div
            id="completeDisposalMessage"
            class="message"
            role="status"
            aria-live="polite"
          ></div>

          <div class="property-dialog-actions">
            <button
              id="cancelCompleteDisposal"
              class="button secondary"
              type="button"
            >
              Cancel
            </button>

            <button
              id="confirmCompleteDisposal"
              class="button primary danger-action"
              type="submit"
            >
              Approve & Mark Disposed
            </button>
          </div>
        </form>
      `;

      document.body.appendChild(
        dialog
      );
    }
  }

  function installManagementPanel() {
    if (!isDisposalManager) {
      return;
    }

    if (
      document.getElementById(
        "propertyReviewPanel"
      )
    ) {
      return;
    }

    const tabs =
      document.querySelector(
        ".tabs"
      );

    const searchPanel =
      document.getElementById(
        "searchPanel"
      );

    if (
      !tabs ||
      !searchPanel
    ) {
      return;
    }

    const tab =
      document.createElement(
        "button"
      );

    tab.className =
      "tab";

    tab.type =
      "button";

    tab.dataset.panel =
      "propertyReviewPanel";

    tab.innerHTML = `
      Disposal Review
      <span
        id="disposalReviewCount"
        class="review-count"
      >
        0
      </span>
    `;

    tabs.appendChild(
      tab
    );

    const panel =
      document.createElement(
        "section"
      );

    panel.id =
      "propertyReviewPanel";

    panel.className =
      "panel property-review-panel";

    panel.innerHTML = `
      <div class="panel-heading">
        <div>
          <div class="eyebrow">
            MANAGEMENT REVIEW
          </div>

          <h2>
            Property Disposal Review
          </h2>

          <p class="subtitle">
            Pending disposal requests require a physical management inspection before disposal.
          </p>
        </div>

        <button
          id="refreshDisposalQueue"
          class="button secondary"
          type="button"
        >
          Refresh
        </button>
      </div>

      <div
        id="managementPropertyMessage"
        class="message"
        role="status"
        aria-live="polite"
      ></div>

      <section class="property-review-section">
        <h3>
          Pending Disposal Requests
        </h3>

        <div class="table-wrap">
          <table class="property-table">
            <thead>
              <tr>
                <th>Property ID</th>
                <th>Description</th>
                <th>Categories</th>
                <th>Storage</th>
                <th>Requested By</th>
                <th>Requested</th>
                <th>Assigned Reviewers</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody id="disposalQueueBody">
              <tr>
                <td
                  colspan="8"
                  class="empty-cell"
                >
                  Loading disposal requests…
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="property-review-section">
        <div class="panel-heading">
          <div>
            <div class="eyebrow">
              LEADERSHIP ALERTS
            </div>

            <h3>
              Weapon Property Alerts
            </h3>
          </div>

          <button
            id="refreshWeaponAlerts"
            class="button secondary"
            type="button"
          >
            Refresh Alerts
          </button>
        </div>

        <div class="table-wrap">
          <table class="property-table">
            <thead>
              <tr>
                <th>Property ID</th>
                <th>Alert</th>
                <th>Priority</th>
                <th>Created</th>
                <th>Push</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody id="weaponAlertsBody">
              <tr>
                <td
                  colspan="7"
                  class="empty-cell"
                >
                  Loading leadership alerts…
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    `;

    searchPanel.insertAdjacentElement(
      "afterend",
      panel
    );
  }

  function openRequestDisposalDialog(
    item
  ) {
    currentDisposalItem =
      item;

    const dialog =
      document.getElementById(
        "requestDisposalDialog"
      );

    const summary =
      document.getElementById(
        "requestDisposalSummary"
      );

    const notesInput =
      document.getElementById(
        "requestDisposalNotes"
      );

    const message =
      document.getElementById(
        "requestDisposalMessage"
      );

    summary.innerHTML = `
      <strong>
        ${escapeHtml(
          item.property_number ||
          "Property"
        )}
      </strong>
      <br>

      ${escapeHtml(
        item.description ||
        "No description"
      )}
      <br>

      <span class="subtle">
        ${escapeHtml(
          item.current_storage_location ||
          ""
        )}
      </span>
    `;

    notesInput.value =
      "";

    clearMessage(
      message
    );

    dialog.showModal();
  }

  function openCompleteDisposalDialog(
    request
  ) {
    if (!isDisposalManager) {
      return;
    }

    currentManagementRequest =
      request;

    const dialog =
      document.getElementById(
        "completeDisposalDialog"
      );

    const summary =
      document.getElementById(
        "completeDisposalSummary"
      );

    const method =
      document.getElementById(
        "disposalMethod"
      );

    const witness =
      document.getElementById(
        "disposalWitness"
      );

    const disposalNotes =
      document.getElementById(
        "completeDisposalNotes"
      );

    const confirmed =
      document.getElementById(
        "physicalDisposalConfirmed"
      );

    const message =
      document.getElementById(
        "completeDisposalMessage"
      );

    summary.innerHTML = `
      <strong>
        ${escapeHtml(
          request.property_number ||
          "Property"
        )}
      </strong>
      <br>

      ${escapeHtml(
        request.description ||
        "No description"
      )}
      <br>

      <span class="subtle">
        Storage:
        ${escapeHtml(
          request.storage_location ||
          "—"
        )}
      </span>
    `;

    method.value = "";
    witness.value = "";
    disposalNotes.value = "";
    confirmed.checked = false;

    clearMessage(
      message
    );

    dialog.showModal();
  }

  async function requestDisposal(
    item,
    requestNotes
  ) {
    const {
      data,
      error
    } =
      await db.rpc(
        "request_property_disposal",
        {
          p_property_number:
            item.property_number,

          p_notes:
            requestNotes.trim() ||
            null
        }
      );

    if (error) {
      throw error;
    }

    return data || {};
  }

  async function denyDisposal(
    request
  ) {
    const reason =
      window.prompt(
        `Reason for denying disposal of ${request.property_number}:`
      );

    if (
      reason === null
    ) {
      return;
    }

    if (
      !reason.trim()
    ) {
      showMessage(
        document.getElementById(
          "managementPropertyMessage"
        ),
        "Enter a reason before denying a disposal request.",
        "error"
      );

      return;
    }

    if (
      !window.confirm(
        `Deny disposal request for ${request.property_number}?`
      )
    ) {
      return;
    }

    try {
      const {
        error
      } =
        await db.rpc(
          "deny_property_disposal",
          {
            p_disposal_request_id:
              request.disposal_request_id,

            p_notes:
              reason.trim()
          }
        );

      if (error) {
        throw error;
      }

      showMessage(
        document.getElementById(
          "managementPropertyMessage"
        ),
        `${request.property_number} disposal request denied. The property remains stored.`,
        "success"
      );

      await Promise.all([
        loadManagementPanel(),

        runSearch(
          searchInput.value,
          {
            preserveMessage:
              true
          }
        ),

        loadSummary()
      ]);
    } catch (error) {
      console.error(
        "Deny property disposal error:",
        error
      );

      showMessage(
        document.getElementById(
          "managementPropertyMessage"
        ),
        error.message ||
        "Unable to deny disposal request.",
        "error"
      );
    }
  }

  async function notifyWeaponLeadership(
    propertyItemId
  ) {
    if (!propertyItemId) {
      throw new Error(
        "Weapon property was created, but its record ID was not returned."
      );
    }

    if (
      !db.functions?.invoke
    ) {
      throw new Error(
        "SecureTrack push notification service is unavailable."
      );
    }

    const {
      data,
      error
    } =
      await db.functions.invoke(
        "send-security-ntfy",
        {
          body: {
            property_item_id:
              propertyItemId
          }
        }
      );

    if (error) {
      throw error;
    }

    if (
      data?.ok === false
    ) {
      throw new Error(
        data.error ||
        "Weapon leadership notification failed."
      );
    }

    return data;
  }

  function renderSearchResults(
    rows
  ) {
    resultsBody.innerHTML =
      "";

    if (!rows.length) {
      const tr =
        document.createElement(
          "tr"
        );

      const td =
        document.createElement(
          "td"
        );

      td.colSpan = 9;
      td.className = "empty-cell";
      td.textContent =
        "No matching property records found.";

      tr.appendChild(
        td
      );

      resultsBody.appendChild(
        tr
      );

      return;
    }

    rows.forEach(
      item => {
        const tr =
          document.createElement(
            "tr"
          );

        const pendingRequest =
          openDisposalRequests.get(
            item.id
          );

        const values = [
          {
            value:
              item.property_number ||
              "—",

            className:
              "property-number"
          },

          {
            value:
              item.dg_number ||
              "—"
          },

          {
            value:
              item.mrn_number ||
              "—"
          },

          {
            value:
              item.description ||
              "—"
          },

          {
            value:
              item.category ||
              "—"
          },

          {
            value:
              item.current_storage_location ||
              "—"
          }
        ];

        values.forEach(
          entry => {
            const td =
              document.createElement(
                "td"
              );

            td.textContent =
              entry.value;

            if (
              entry.className
            ) {
              td.className =
                entry.className;
            }

            tr.appendChild(
              td
            );
          }
        );

        const statusTd =
          document.createElement(
            "td"
          );

        const status =
          document.createElement(
            "span"
          );

        status.className =
          `status-pill ${item.status || ""}`;

        status.textContent =
          String(
            item.status ||
            "—"
          ).replaceAll(
            "_",
            " "
          );

        statusTd.appendChild(
          status
        );

        if (
          pendingRequest
        ) {
          const pending =
            document.createElement(
              "span"
            );

          pending.className =
            "disposal-pending-badge";

          pending.textContent =
            "Disposal Requested";

          pending.title =
            `Requested by ${
              pendingRequest
                .requested_by_name ||
              "SecureTrack user"
            } ${formatDate(
              pendingRequest
                .requested_at
            )}`;

          statusTd.appendChild(
            document.createTextNode(
              " "
            )
          );

          statusTd.appendChild(
            pending
          );
        }

        if (
          hasCategory(
            item.category,
            "Weapons"
          )
        ) {
          const weapon =
            document.createElement(
              "span"
            );

          weapon.className =
            "weapon-alert-badge";

          weapon.textContent =
            "Weapon";

          statusTd.appendChild(
            document.createTextNode(
              " "
            )
          );

          statusTd.appendChild(
            weapon
          );
        }

        tr.appendChild(
          statusTd
        );

        const dateTd =
          document.createElement(
            "td"
          );

        dateTd.textContent =
          formatDate(
            item.received_at
          );

        tr.appendChild(
          dateTd
        );

        const actionTd =
          document.createElement(
            "td"
          );

        const actionStack =
          document.createElement(
            "div"
          );

        actionStack.className =
          "property-action-stack";

        const openLink =
          document.createElement(
            "a"
          );

        openLink.className =
          "button secondary compact";

        openLink.href =
          `record.html?id=${encodeURIComponent(
            item.id
          )}`;

        openLink.textContent =
          "Open";

        actionStack.appendChild(
          openLink
        );

        if (
          item.status ===
          "stored"
        ) {
          const disposalButton =
            document.createElement(
              "button"
            );

          disposalButton.type =
            "button";

          disposalButton.className =
            "button secondary compact";

          if (
            pendingRequest
          ) {
            disposalButton.textContent =
              "Disposal Requested";

            disposalButton.disabled =
              true;
          } else {
            disposalButton.textContent =
              "Request Disposal";

            disposalButton.addEventListener(
              "click",
              () => {
                openRequestDisposalDialog(
                  item
                );
              }
            );
          }

          actionStack.appendChild(
            disposalButton
          );
        }

        actionTd.appendChild(
          actionStack
        );

        tr.appendChild(
          actionTd
        );

        tr.classList.add(
          "clickable-row"
        );

        tr.addEventListener(
          "dblclick",
          event => {
            if (
              event.target.closest(
                "a,button"
              )
            ) {
              return;
            }

            window.location.href =
              openLink.href;
          }
        );

        resultsBody.appendChild(
          tr
        );
      }
    );
  }

  async function runSearch(
    searchTerm = "",
    {
      preserveMessage = false
    } = {}
  ) {
    searchButton.disabled =
      true;

    searchButton.textContent =
      "Searching…";

    if (!preserveMessage) {
      clearMessage(
        searchMessage
      );
    }

    try {
      const [
        searchResult
      ] =
        await Promise.all([
          db.rpc(
            "search_property_items",
            {
              p_search:
                searchTerm.trim()
            }
          ),

          loadOpenDisposalRequests()
        ]);

      if (
        searchResult.error
      ) {
        throw searchResult.error;
      }

      const allRows =
        searchResult.data ||
        [];

      const rows =
        activePropertyStatusFilter
          ? allRows.filter(
              row =>
                row.status ===
                activePropertyStatusFilter
            )
          : allRows;

      renderSearchResults(
        rows
      );

      if (!preserveMessage) {
        if (
          activePropertyStatusFilter
        ) {
          const label =
            activePropertyStatusFilter
              .charAt(0)
              .toUpperCase() +
            activePropertyStatusFilter
              .slice(1);

          showMessage(
            searchMessage,
            `Showing ${rows.length} ${label.toLowerCase()} property record${rows.length === 1 ? "" : "s"}.`,
            "info"
          );
        } else if (
          searchTerm.trim()
        ) {
          showMessage(
            searchMessage,
            `${rows.length} matching record${rows.length === 1 ? "" : "s"} found.`,
            rows.length
              ? "success"
              : "info"
          );
        } else {
          showMessage(
            searchMessage,
            `Showing ${rows.length} most recent property record${rows.length === 1 ? "" : "s"}.`,
            "info"
          );
        }
      }
    } catch (error) {
      console.error(
        "Property search error:",
        error
      );

      showMessage(
        searchMessage,
        error.message ||
        "Unable to search property records.",
        "error"
      );
    } finally {
      searchButton.disabled =
        false;

      searchButton.textContent =
        "Search";
    }
  }

  function renderDisposalQueue(
    rows
  ) {
    const body =
      document.getElementById(
        "disposalQueueBody"
      );

    const count =
      document.getElementById(
        "disposalReviewCount"
      );

    if (!body) {
      return;
    }

    if (count) {
      count.textContent =
        String(rows.length);
    }

    body.innerHTML =
      "";

    if (!rows.length) {
      const tr =
        document.createElement(
          "tr"
        );

      const td =
        document.createElement(
          "td"
        );

      td.colSpan = 8;
      td.className = "empty-cell";

      td.textContent =
        "No pending property disposal requests.";

      tr.appendChild(
        td
      );

      body.appendChild(
        tr
      );

      return;
    }

    rows.forEach(
      request => {
        const tr =
          document.createElement(
            "tr"
          );

        [
          request.property_number ||
            "—",

          request.description ||
            "—",

          request.category ||
            "—",

          request.storage_location ||
            "—",

          request.requested_by_name ||
            "—",

          formatDate(
            request.requested_at
          ),

          request.assigned_reviewers ||
            "—"
        ].forEach(
          value => {
            const td =
              document.createElement(
                "td"
              );

            td.textContent =
              value;

            tr.appendChild(
              td
            );
          }
        );

        const actionTd =
          document.createElement(
            "td"
          );

        const buttons =
          document.createElement(
            "div"
          );

        buttons.className =
          "management-action-buttons";

        const openLink =
          document.createElement(
            "a"
          );

        openLink.className =
          "button secondary compact";

        openLink.href =
          `record.html?id=${encodeURIComponent(
            request.property_item_id
          )}`;

        openLink.textContent =
          "Open";

        buttons.appendChild(
          openLink
        );

        const disposeButton =
          document.createElement(
            "button"
          );

        disposeButton.type =
          "button";

        disposeButton.className =
          "button primary compact danger-action";

        disposeButton.textContent =
          "Approve & Dispose";

        disposeButton.addEventListener(
          "click",
          () => {
            openCompleteDisposalDialog(
              request
            );
          }
        );

        buttons.appendChild(
          disposeButton
        );

        const denyButton =
          document.createElement(
            "button"
          );

        denyButton.type =
          "button";

        denyButton.className =
          "button secondary compact";

        denyButton.textContent =
          "Deny";

        denyButton.addEventListener(
          "click",
          () =>
            denyDisposal(
              request
            )
        );

        buttons.appendChild(
          denyButton
        );

        actionTd.appendChild(
          buttons
        );

        tr.appendChild(
          actionTd
        );

        body.appendChild(
          tr
        );
      }
    );
  }

  function renderWeaponAlerts(
    rows
  ) {
    const body =
      document.getElementById(
        "weaponAlertsBody"
      );

    if (!body) {
      return;
    }

    body.innerHTML =
      "";

    if (!rows.length) {
      const tr =
        document.createElement(
          "tr"
        );

      const td =
        document.createElement(
          "td"
        );

      td.colSpan = 7;
      td.className = "empty-cell";

      td.textContent =
        "No weapon property alerts for this account.";

      tr.appendChild(
        td
      );

      body.appendChild(
        tr
      );

      return;
    }

    rows.forEach(
      alert => {
        const tr =
          document.createElement(
            "tr"
          );

        const values = [
          alert.property_number ||
            "—",

          alert.title ||
            "Weapon Property Alert",

          alert.priority ||
            "high",

          formatDate(
            alert.created_at
          ),

          alert.push_status ||
            "—",

          alert.read_at
            ? "Read"
            : "Unread"
        ];

        values.forEach(
          (
            value,
            index
          ) => {
            const td =
              document.createElement(
                "td"
              );

            td.textContent =
              value;

            if (
              index === 2 &&
              String(value)
                .toLowerCase() ===
                "high"
            ) {
              td.className =
                "weapon-alert-badge";
            }

            tr.appendChild(
              td
            );
          }
        );

        const actionTd =
          document.createElement(
            "td"
          );

        const buttons =
          document.createElement(
            "div"
          );

        buttons.className =
          "management-action-buttons";

        const openLink =
          document.createElement(
            "a"
          );

        openLink.className =
          "button secondary compact";

        openLink.href =
          `record.html?id=${encodeURIComponent(
            alert.property_item_id
          )}`;

        openLink.textContent =
          "Open";

        buttons.appendChild(
          openLink
        );

        if (
          !alert.read_at
        ) {
          const readButton =
            document.createElement(
              "button"
            );

          readButton.type =
            "button";

          readButton.className =
            "button secondary compact";

          readButton.textContent =
            "Mark Read";

          readButton.addEventListener(
            "click",
            async () => {
              readButton.disabled =
                true;

              try {
                const {
                  error
                } =
                  await db.rpc(
                    "mark_property_leadership_alert_read",
                    {
                      p_alert_id:
                        alert.alert_id
                    }
                  );

                if (error) {
                  throw error;
                }

                await loadWeaponAlerts();
              } catch (error) {
                console.error(
                  "Mark property alert read error:",
                  error
                );

                showMessage(
                  document.getElementById(
                    "managementPropertyMessage"
                  ),
                  error.message ||
                  "Unable to mark leadership alert as read.",
                  "error"
                );
              } finally {
                readButton.disabled =
                  false;
              }
            }
          );

          buttons.appendChild(
            readButton
          );
        }

        actionTd.appendChild(
          buttons
        );

        tr.appendChild(
          actionTd
        );

        body.appendChild(
          tr
        );
      }
    );
  }

  async function loadDisposalQueue() {
    if (!isDisposalManager) {
      return [];
    }

    const {
      data,
      error
    } =
      await db.rpc(
        "get_property_disposal_queue"
      );

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    renderDisposalQueue(
      rows
    );

    return rows;
  }

  async function loadWeaponAlerts() {
    if (!isDisposalManager) {
      return [];
    }

    try {
      const {
        data,
        error
      } =
        await db.rpc(
          "get_my_property_leadership_alerts",
          {
            p_unread_only:
              false
          }
        );

      if (error) {
        throw error;
      }

      const rows =
        data || [];

      renderWeaponAlerts(
        rows
      );

      return rows;
    } catch (error) {
      const body =
        document.getElementById(
          "weaponAlertsBody"
        );

      if (body) {
        body.innerHTML =
          "";

        const tr =
          document.createElement(
            "tr"
          );

        const td =
          document.createElement(
            "td"
          );

        td.colSpan = 7;
        td.className = "empty-cell";

        td.textContent =
          error.message ||
          "Unable to load weapon property alerts.";

        tr.appendChild(
          td
        );

        body.appendChild(
          tr
        );
      }

      console.warn(
        "Unable to load property leadership alerts:",
        error
      );

      return [];
    }
  }

  async function loadManagementPanel() {
    if (!isDisposalManager) {
      return;
    }

    const message =
      document.getElementById(
        "managementPropertyMessage"
      );

    try {
      await Promise.all([
        loadDisposalQueue(),
        loadWeaponAlerts()
      ]);
    } catch (error) {
      console.error(
        "Property disposal queue load error:",
        error
      );

      showMessage(
        message,
        error.message ||
        "Unable to load the property disposal queue.",
        "error"
      );
    }
  }

  injectWorkflowStyles();
  installDialogs();
  installManagementPanel();

  document
    .querySelectorAll(
      ".tab"
    )
    .forEach(
      tab => {
        tab.addEventListener(
          "click",
          async () => {
            document
              .querySelectorAll(
                ".tab"
              )
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );

            document
              .querySelectorAll(
                ".panel"
              )
              .forEach(
                panel =>
                  panel.classList.remove(
                    "active"
                  )
              );

            tab.classList.add(
              "active"
            );

            document
              .getElementById(
                tab.dataset.panel
              )
              ?.classList.add(
                "active"
              );

            if (
              tab.dataset.panel ===
              "searchPanel"
            ) {
              searchInput.focus();

              await runSearch(
                searchInput.value
              );
            }

            if (
              tab.dataset.panel ===
              "propertyReviewPanel"
            ) {
              await loadManagementPanel();
            }
          }
        );
      }
    );

  const requestDisposalDialog =
    document.getElementById(
      "requestDisposalDialog"
    );

  const requestDisposalForm =
    document.getElementById(
      "requestDisposalForm"
    );

  const requestDisposalNotes =
    document.getElementById(
      "requestDisposalNotes"
    );

  const requestDisposalMessage =
    document.getElementById(
      "requestDisposalMessage"
    );

  const confirmRequestDisposal =
    document.getElementById(
      "confirmRequestDisposal"
    );

  document
    .getElementById(
      "cancelRequestDisposal"
    )
    ?.addEventListener(
      "click",
      () =>
        requestDisposalDialog.close()
    );

  requestDisposalForm
    ?.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        if (
          !currentDisposalItem
        ) {
          return;
        }

        confirmRequestDisposal.disabled =
          true;

        confirmRequestDisposal.textContent =
          "Sending Request…";

        clearMessage(
          requestDisposalMessage
        );

        try {
          const result =
            await requestDisposal(
              currentDisposalItem,
              requestDisposalNotes.value
            );

          requestDisposalDialog.close();

          showMessage(
            searchMessage,
            result.already_pending
              ? `${currentDisposalItem.property_number} already has a pending disposal request.`
              : `${currentDisposalItem.property_number} sent to Archie and Cory for disposal review.`,
            "success"
          );

          await Promise.all([
            runSearch(
              searchInput.value,
              {
                preserveMessage:
                  true
              }
            ),

            isDisposalManager
              ? loadManagementPanel()
              : Promise.resolve()
          ]);
        } catch (error) {
          console.error(
            "Request property disposal error:",
            error
          );

          showMessage(
            requestDisposalMessage,
            error.message ||
            "Unable to request property disposal.",
            "error"
          );
        } finally {
          confirmRequestDisposal.disabled =
            false;

          confirmRequestDisposal.textContent =
            "Send Disposal Request";
        }
      }
    );

  if (isDisposalManager) {
    const completeDisposalDialog =
      document.getElementById(
        "completeDisposalDialog"
      );

    const completeDisposalForm =
      document.getElementById(
        "completeDisposalForm"
      );

    const disposalMethod =
      document.getElementById(
        "disposalMethod"
      );

    const disposalWitness =
      document.getElementById(
        "disposalWitness"
      );

    const completeDisposalNotes =
      document.getElementById(
        "completeDisposalNotes"
      );

    const physicalDisposalConfirmed =
      document.getElementById(
        "physicalDisposalConfirmed"
      );

    const completeDisposalMessage =
      document.getElementById(
        "completeDisposalMessage"
      );

    const confirmCompleteDisposal =
      document.getElementById(
        "confirmCompleteDisposal"
      );

    document
      .getElementById(
        "cancelCompleteDisposal"
      )
      ?.addEventListener(
        "click",
        () =>
          completeDisposalDialog.close()
      );

    completeDisposalForm
      ?.addEventListener(
        "submit",
        async event => {
          event.preventDefault();

          if (
            !currentManagementRequest
          ) {
            return;
          }

          if (
            !physicalDisposalConfirmed.checked
          ) {
            showMessage(
              completeDisposalMessage,
              "Confirm that you personally inspected and physically disposed of the property.",
              "error"
            );

            return;
          }

          confirmCompleteDisposal.disabled =
            true;

          confirmCompleteDisposal.textContent =
            "Recording Disposal…";

          clearMessage(
            completeDisposalMessage
          );

          try {
            const {
              data,
              error
            } =
              await db.rpc(
                "dispose_property_item",
                {
                  p_disposal_request_id:
                    currentManagementRequest
                      .disposal_request_id,

                  p_disposal_method:
                    disposalMethod
                      .value
                      .trim(),

                  p_witness:
                    disposalWitness
                      .value
                      .trim() ||
                    null,

                  p_notes:
                    completeDisposalNotes
                      .value
                      .trim() ||
                    null
                }
              );

            if (error) {
              throw error;
            }

            completeDisposalDialog.close();

            showMessage(
              document.getElementById(
                "managementPropertyMessage"
              ),
              `${
                data?.property_number ||
                currentManagementRequest
                  .property_number
              } marked disposed by ${
                data?.disposed_by ||
                profile.display_name ||
                "management"
              }.`,
              "success"
            );

            await Promise.all([
              loadManagementPanel(),

              runSearch(
                searchInput.value,
                {
                  preserveMessage:
                    true
                }
              ),

              loadSummary()
            ]);
          } catch (error) {
            console.error(
              "Dispose property error:",
              error
            );

            showMessage(
              completeDisposalMessage,
              error.message ||
              "Unable to complete property disposal.",
              "error"
            );
          } finally {
            confirmCompleteDisposal.disabled =
              false;

            confirmCompleteDisposal.textContent =
              "Approve & Mark Disposed";
          }
        }
      );

    document
      .getElementById(
        "refreshDisposalQueue"
      )
      ?.addEventListener(
        "click",
        loadManagementPanel
      );

    document
      .getElementById(
        "refreshWeaponAlerts"
      )
      ?.addEventListener(
        "click",
        loadWeaponAlerts
      );
  }

  intakeForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      clearMessage(
        intakeResult
      );

      const receivedDate =
        new Date(
          receivedAt.value
        );

      if (
        !receivedAt.value ||
        Number.isNaN(
          receivedDate.getTime()
        )
      ) {
        showMessage(
          intakeResult,
          "Enter a valid received date and time.",
          "error"
        );

        receivedAt.focus();

        return;
      }

      const selectedCategories =
        categoryList(
          category.value
        );

      if (
        !selectedCategories.length
      ) {
        showMessage(
          intakeResult,
          "Select at least one property category.",
          "error"
        );

        document
          .getElementById(
            "categoryPicker"
          )
          ?.setAttribute(
            "open",
            ""
          );

        return;
      }
const clinicalName =
  clinicalStaffName
    .value
    .trim();

const clinicalBadge =
  clinicalStaffBadgeNumber
    .value
    .trim();


if (
  (clinicalName && !clinicalBadge) ||
  (!clinicalName && clinicalBadge)
) {
  showMessage(
    intakeResult,
    "Enter both the clinical staff name and badge number, or leave both fields blank.",
    "error"
  );

  if (!clinicalName) {
    clinicalStaffName.focus();
  } else {
    clinicalStaffBadgeNumber.focus();
  }

  return;
}
      savePropertyButton.disabled =
        true;

      savePropertyButton.textContent =
        "Creating Record…";

      try {
        const isWeaponProperty =
          hasCategory(
            category.value,
            "Weapons"
          );

        const {
          data,
          error
        } =
          await db.rpc(
            "create_property_item",
            {
              p_description:
                description
                  .value
                  .trim(),

              p_category:
                category.value,

              p_location_received:
                locationReceived
                  .value
                  .trim(),

              p_storage_location:
                storageLocation
                  .value
                  .trim(),

              p_dg_number:
                dgNumber
                  .value
                  .trim() ||
                null,

              p_mrn_number:
                mrnNumber
                  .value
                  .trim() ||
                null,

              p_notes:
                notes
                  .value
                  .trim() ||
                null,

              p_received_at:
                receivedDate
                  .toISOString()
            }
          );

        if (error) {
          throw error;
        }

        const propertyNumber =
          data?.property_number ||
          "Property record";

        let weaponPushWarning =
          "";

        if (
          isWeaponProperty
        ) {
          try {
            await notifyWeaponLeadership(
              data?.id
            );
          } catch (notifyError) {
            console.error(
              "Weapon leadership push error:",
              notifyError
            );

            weaponPushWarning =
              " The weapon leadership alert was recorded, but push delivery could not be confirmed. Leadership can still review the alert inside SecureTrack.";
          }
        }

        clearIntakeForm({
          keepMessage:
            true
        });

        showMessage(
          intakeResult,
          isWeaponProperty &&
          !weaponPushWarning
            ? `${propertyNumber} created successfully. WEAPON ALERT sent to Security Leadership. Match this Property ID to the physical property form.`
            : `${propertyNumber} created successfully. Match this Property ID to the physical property form.${weaponPushWarning}`,
          weaponPushWarning
            ? "info"
            : "success"
        );

        await Promise.all([
          loadSummary(),

          isDisposalManager &&
          isWeaponProperty
            ? loadWeaponAlerts()
            : Promise.resolve()
        ]);
      } catch (error) {
        console.error(
          "Create property error:",
          error
        );

        showMessage(
          intakeResult,
          error.message ||
          "Unable to create property record.",
          "error"
        );
      } finally {
        savePropertyButton.disabled =
          false;

        savePropertyButton.textContent =
          "Create Property Record";
      }
    }
  );

  clearPropertyButton.addEventListener(
    "click",
    () =>
      clearIntakeForm()
  );

  searchForm.addEventListener(
    "submit",
    event => {
      event.preventDefault();

      activePropertyStatusFilter =
        null;

      document
        .querySelectorAll(
          "[data-property-status]"
        )
        .forEach(
          card => {
            card.classList.remove(
              "active-summary-filter"
            );
          }
        );

      runSearch(
        searchInput.value
      );
    }
  );

  // =========================================================
  // SUMMARY CARD SHORTCUTS
  // =========================================================

  document
    .querySelectorAll(
      "[data-property-status]"
    )
    .forEach(
      card => {
        card.addEventListener(
          "click",
          async () => {
            activePropertyStatusFilter =
              card.dataset
                .propertyStatus ||
              null;

            searchInput.value =
              "";

            document
              .querySelectorAll(
                "[data-property-status]"
              )
              .forEach(
                item => {
                  item.classList.toggle(
                    "active-summary-filter",
                    item === card
                  );
                }
              );

            document
              .querySelectorAll(
                ".tab"
              )
              .forEach(
                tab => {
                  tab.classList.remove(
                    "active"
                  );
                }
              );

            document
              .querySelectorAll(
                ".panel"
              )
              .forEach(
                panel => {
                  panel.classList.remove(
                    "active"
                  );
                }
              );

            document
              .querySelector(
                '.tab[data-panel="searchPanel"]'
              )
              ?.classList.add(
                "active"
              );

            document
              .getElementById(
                "searchPanel"
              )
              ?.classList.add(
                "active"
              );

            await runSearch(
              ""
            );

            document
              .getElementById(
                "searchPanel"
              )
              ?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
              });
          }
        );
      }
    );

  signOutButton.addEventListener(
    "click",
    async () => {
      signOutButton.disabled =
        true;

      signOutButton.textContent =
        "Signing Out…";

      await db.auth.signOut();

      window.location.replace(
        new URL(
          "login.html",
          auth.appRootUrl ||
          "../"
        ).href
      );
    }
  );

  setUserDisplay();

  receivedAt.value =
    localDateTimeValue();

  await loadSummary();

  if (
    isDisposalManager
  ) {
    await loadManagementPanel();
  }
})();
