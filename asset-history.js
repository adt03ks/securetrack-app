(async function () {
  const STM = window.SecureTrackManager;
  const manager = await STM.requireManager();

  if (!manager) return;

  const db = STM.db;
  const deviceId = new URLSearchParams(window.location.search).get("device");
  const timelineEl = document.getElementById("historyTimeline");

  let historyItems = [];
  let activeFilter = "all";

  document
    .getElementById("logoutButton")
    .addEventListener("click", STM.signOut);

  if (!deviceId) {
    timelineEl.textContent = "No device was selected.";
    return;
  }

  const escapeHTML = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const humanize = (value) =>
    String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "—";

  const maskSerial = (last4) =>
    last4 ? `••••${last4}` : "Not displayed";

  function renderTimeline() {
    const visible =
      activeFilter === "all"
        ? historyItems
        : historyItems.filter((item) => item.type === activeFilter);

    timelineEl.innerHTML = "";

    if (!visible.length) {
      timelineEl.innerHTML = `
        <div class="history-empty">
          No ${
            activeFilter === "all"
              ? "history"
              : activeFilter + " records"
          } found for this asset.
        </div>
      `;
      return;
    }

    visible.forEach((item) => {
      const card = document.createElement("article");

      card.className = `history-event ${item.type}`;

      let detailHTML = "";

      if (item.type === "transaction") {
        detailHTML = `
          <div class="history-event-line">
            <span>Action</span>
            <strong>
              ${escapeHTML(humanize(item.action))}
            </strong>
          </div>

          ${
            item.notes
              ? `
                <div class="history-event-note">
                  ${escapeHTML(item.notes)}
                </div>
              `
              : ""
          }
        `;
      }

      if (item.type === "inspection") {
        const checklist = item.checklist || {};

        const checks = Object.entries(checklist)
          .map(
            ([key, value]) => `
              <span class="history-check ${escapeHTML(value)}">
                ${escapeHTML(humanize(key))}:
                ${escapeHTML(String(value).toUpperCase())}
              </span>
            `
          )
          .join("");

        detailHTML = `
          <div class="history-event-line">
            <span>Overall</span>

            <strong
              class="inspection-result ${escapeHTML(
                item.overall_result
              )}"
            >
              ${escapeHTML(
                humanize(item.overall_result)
              )}
            </strong>
          </div>

          <div class="history-checks">
            ${checks}
          </div>

          ${
            item.notes
              ? `
                <div class="history-event-note">
                  ${escapeHTML(item.notes)}
                </div>
              `
              : ""
          }
        `;
      }

      if (item.type === "issue") {
        detailHTML = `
          <div class="history-event-line">
            <span>Category</span>
            <strong>
              ${escapeHTML(humanize(item.category))}
            </strong>
          </div>

          <div class="history-event-line">
            <span>Severity</span>

            <strong
              class="issue-severity ${escapeHTML(
                item.severity
              )}"
            >
              ${escapeHTML(humanize(item.severity))}
            </strong>
          </div>

          <div class="history-event-line">
            <span>Status</span>
            <strong>
              ${escapeHTML(humanize(item.status))}
            </strong>
          </div>

          <div class="history-event-note">
            ${escapeHTML(item.description)}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="history-event-marker"></div>

        <div class="history-event-body">

          <div class="history-event-top">

            <div>
              <span class="history-event-type">
                ${escapeHTML(humanize(item.type))}
              </span>

              <h3>
                ${escapeHTML(item.title)}
              </h3>
            </div>

            <time>
              ${escapeHTML(
                formatDate(item.occurred_at)
              )}
            </time>

          </div>

          <div class="history-event-actor">
            ${escapeHTML(
              item.actor ||
              "Employee not available"
            )}
          </div>

          ${detailHTML}

        </div>
      `;

      timelineEl.appendChild(card);
    });
  }

  async function loadAssetHistory() {
    try {
      const {
        data: device,
        error: deviceError
      } = await db
        .from("devices")
        .select(`
          id,
          asset_code,
          device_type,
          manufacturer,
          model,
          serial_last4,
          image_url,
          status,
          current_custodian_id,
          attention_required,
          is_active
        `)
        .eq("id", deviceId)
        .single();

      if (deviceError) {
        throw deviceError;
      }

      let custodian = null;

      if (device.current_custodian_id) {
        const { data } = await db
          .from("employees")
          .select(`
            display_name,
            employee_number
          `)
          .eq(
            "id",
            device.current_custodian_id
          )
          .maybeSingle();

        custodian = data;
      }

     const [
  transactionsResult,
  inspectionsResult,
  issuesResult,
  recoveriesResult
] = await Promise.all([


  // =========================================================
  // TRANSACTIONS
  // =========================================================

  db
    .from("device_transactions")
    .select(`
      id,
      action,
      notes,
      occurred_at,
      employees(
        display_name,
        employee_number
      )
    `)
    .eq("device_id", deviceId)
    .order(
      "occurred_at",
      { ascending: false }
    ),


  // =========================================================
  // INSPECTIONS
  // =========================================================

  db
    .from("device_inspections")
    .select(`
      id,
      checklist,
      overall_result,
      notes,
      occurred_at,
      employees(
        display_name,
        employee_number
      )
    `)
    .eq("device_id", deviceId)
    .order(
      "occurred_at",
      { ascending: false }
    ),


  // =========================================================
  // ISSUES
  // =========================================================

  db
    .from("device_issues")
    .select(`
      id,
      category,
      severity,
      description,
      status,
      occurred_at,
      resolved_at,
      employees(
        display_name,
        employee_number
      )
    `)
    .eq("device_id", deviceId)
    .order(
      "occurred_at",
      { ascending: false }
    ),


  // =========================================================
  // MANAGER RECOVERIES / FORCE RETURNS
  // =========================================================

  db
    .from("device_recoveries")
    .select(`
      id,
      previous_custodian_id,
      recovered_by_user_id,
      reason,
      notes,
      physically_present,
      occurred_at
    `)
    .eq("device_id", deviceId)
    .order(
      "occurred_at",
      { ascending: false }
    )

]);

        db
          .from("device_transactions")
          .select(`
            id,
            action,
            notes,
            occurred_at,
            employees(
              display_name,
              employee_number
            )
          `)
          .eq("device_id", deviceId)
          .order(
            "occurred_at",
            { ascending: false }
          ),

        db
          .from("device_inspections")
          .select(`
            id,
            checklist,
            overall_result,
            notes,
            occurred_at,
            employees(
              display_name,
              employee_number
            )
          `)
          .eq("device_id", deviceId)
          .order(
            "occurred_at",
            { ascending: false }
          ),

        db
          .from("device_issues")
          .select(`
            id,
            category,
            severity,
            description,
            status,
            occurred_at,
            resolved_at,
            employees(
              display_name,
              employee_number
            )
          `)
          .eq("device_id", deviceId)
          .order(
            "occurred_at",
            { ascending: false }
          )
      ]);

     if (transactionsResult.error) {
  throw transactionsResult.error;
}

if (inspectionsResult.error) {
  throw inspectionsResult.error;
}

if (issuesResult.error) {
  throw issuesResult.error;
}

if (recoveriesResult.error) {
  throw recoveriesResult.error;
}

     const transactions =
  transactionsResult.data || [];

const inspections =
  inspectionsResult.data || [];

const issues =
  issuesResult.data || [];

const recoveries =
  recoveriesResult.data || [];

      document
        .getElementById("historyTitle")
        .textContent =
          `${device.asset_code} History`;

      document
        .getElementById("historySubtitle")
        .textContent =
          [
            device.manufacturer,
            device.model,
            device.device_type
          ]
            .filter(Boolean)
            .join(" • ");

      document
        .getElementById("historyAssetCode")
        .textContent =
          device.asset_code;

      document
        .getElementById("historyModel")
        .textContent =
          [
            device.manufacturer,
            device.model
          ]
            .filter(Boolean)
            .join(" ") ||
          "Registered equipment";

      document
        .getElementById("historyDeviceImage")
        .src =
          device.image_url ||
          "assets/device-placeholder.svg";

      document
        .getElementById("historyStatus")
        .textContent =
          humanize(device.status);

      document
        .getElementById("historyCustodian")
        .textContent =
          custodian
            ? `${custodian.display_name} #${custodian.employee_number}`
            : "Unassigned";

      document
        .getElementById("historySerial")
        .textContent =
          maskSerial(device.serial_last4);

      document
        .getElementById("historyAttention")
        .textContent =
          device.attention_required
            ? "Review Required"
            : "Clear";

      document
        .getElementById("transactionCount")
        .textContent =
          transactions.length;

      document
        .getElementById("inspectionCount")
        .textContent =
          inspections.length;

      document
        .getElementById("issueCount")
        .textContent =
          issues.length;

      document
        .getElementById("openIssueCount")
        .textContent =
          issues.filter(
            (i) => i.status !== "resolved"
          ).length;

      const employeeLabel = (employee) =>
        employee
          ? `${employee.display_name}${
              employee.employee_number
                ? ` #${employee.employee_number}`
                : ""
            }`
          : "Employee not available";

      historyItems = [

        ...transactions.map((item) => ({
          ...item,
          type: "transaction",
          title:
            `${humanize(item.action)} Recorded`,
          actor:
            employeeLabel(item.employees)
        })),

        ...inspections.map((item) => ({
          ...item,
          type: "inspection",
          title:
            `Inspection ${humanize(
              item.overall_result
            )}`,
          actor:
            employeeLabel(item.employees)
        })),

        ...issues.map((item) => ({
          ...item,
          type: "issue",
          title:
            `${humanize(
              item.severity
            )} Issue Reported`,
          actor:
            employeeLabel(item.employees)
        }))
         ...recoveries.map((item) => ({

    ...item,

    type:
      "recovery",

    title:
      "Administrative Recovery / Force Return",

    actor:
      "SecureTrack Manager",

    previous_custodian_label:
      item.previous_custodian_label ||
      "Previously Assigned Officer"

  }))


].sort(

  (a, b) =>
    new Date(b.occurred_at) -
    new Date(a.occurred_at)

);

The important thing is the comma here:

})),

at the end of the issues.map() section. That allows the new:

...recoveries.map(...)

block to follow it.

Your file should now flow like:

transactions
      ↓
inspections
      ↓
issues
      ↓
recoveries          ← NEW
      ↓
.sort(...)
      ↓
renderTimeline()
      ].sort(
        (a, b) =>
          new Date(b.occurred_at) -
          new Date(a.occurred_at)
      );

      renderTimeline();

    } catch (error) {
      console.error(
        "SecureTrack asset history error:",
        error
      );

      timelineEl.innerHTML = `
        <div class="result show error">
          ${escapeHTML(
            error.message ||
            "Unable to load asset history."
          )}
        </div>
      `;
    }
  }

  document
    .querySelectorAll(".history-filter")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          activeFilter =
            button.dataset.filter;

          document
            .querySelectorAll(
              ".history-filter"
            )
            .forEach((b) =>
              b.classList.toggle(
                "active",
                b === button
              )
            );

          renderTimeline();
        }
      );
    });

  await loadAssetHistory();

  db
    .channel(
      `securetrack-asset-history-${deviceId}`
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "devices",
        filter: `id=eq.${deviceId}`
      },
      loadAssetHistory
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_transactions",
        filter: `device_id=eq.${deviceId}`
      },
      loadAssetHistory
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_inspections",
        filter: `device_id=eq.${deviceId}`
      },
      loadAssetHistory
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_issues",
        filter: `device_id=eq.${deviceId}`
      },
      loadAssetHistory
    )

    .subscribe((status) => {

      document
        .getElementById(
          "historyRealtimeStatus"
        )
        .textContent =
          status === "SUBSCRIBED"
            ? "Live asset history connected"
            : `Live asset history: ${status}`;
    });

})();
