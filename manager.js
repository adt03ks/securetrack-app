(async function () {

  const STM = window.SecureTrackManager;

  const manager = await STM.requireManager();

  if (!manager) {
    return;
  }

  const db = STM.db;

  document.getElementById("managerName").textContent =
    manager.profile.display_name;

  document
    .getElementById("logoutButton")
    .addEventListener("click", STM.signOut);

  document
    .getElementById("refreshButton")
    .addEventListener("click", loadDashboard);


  function formatDate(date) {

    if (!date) {
      return "—";
    }

    return new Date(date).toLocaleString();
  }


  function statusLabel(status) {

    return String(status || "")
      .replaceAll("_", " ")
      .toUpperCase();
  }


  async function loadAssets() {

    const {
      data,
      error
    } = await db
      .from("devices")
      .select(`
        id,
        asset_code,
        device_type,
        manufacturer,
        model,
        status,
        attention_required,
        current_custodian_id
      `)
      .eq("is_active", true)
      .order("asset_code");

    if (error) {
      throw error;
    }

    const custodianIds = [
      ...new Set(
        data
          .map(asset => asset.current_custodian_id)
          .filter(Boolean)
      )
    ];

    let employeeMap = {};

    if (custodianIds.length) {

      const {
        data: employees,
        error: employeeError
      } = await db
        .from("employees")
        .select("id, display_name, employee_number")
        .in("id", custodianIds);

      if (!employeeError) {

        employeeMap =
          Object.fromEntries(
            employees.map(employee => [
              employee.id,
              employee
            ])
          );
      }
    }


    document.getElementById("totalAssets").textContent =
      data.length;

    document.getElementById("availableAssets").textContent =
      data.filter(
        asset => asset.status === "available"
      ).length;

    document.getElementById("checkedOutAssets").textContent =
      data.filter(
        asset => asset.status === "checked_out"
      ).length;

    document.getElementById("attentionAssets").textContent =
      data.filter(
        asset => asset.attention_required
      ).length;


    const body =
      document.getElementById("assetTableBody");

    body.innerHTML = "";


    if (!data.length) {

      body.innerHTML = `
        <tr>
          <td colspan="5">
            No assets found.
          </td>
        </tr>
      `;

      return;
    }


    data.forEach(asset => {

      const employee =
        employeeMap[
          asset.current_custodian_id
        ];

      const row =
        document.createElement("tr");

      row.innerHTML = `

        <td>
          <strong>
            ${asset.asset_code}
          </strong>
        </td>

        <td>
          ${
            [
              asset.manufacturer,
              asset.model
            ]
            .filter(Boolean)
            .join(" ")
          }
        </td>

        <td>
          <span class="asset-status ${asset.status}">
            ${statusLabel(asset.status)}
          </span>
        </td>

        <td>
          ${
            employee
              ? `${employee.display_name} #${employee.employee_number}`
              : "—"
          }
        </td>

        <td>
          ${
            asset.attention_required
              ? "⚠ REVIEW"
              : "—"
          }
        </td>

      `;

      body.appendChild(row);

    });

  }


  async function loadTransactions() {

    const {
      data,
      error
    } = await db
      .from("device_transactions")
      .select(`
        id,
        action,
        notes,
        occurred_at,
        devices(asset_code),
        employees(display_name, employee_number)
      `)
      .order("occurred_at", {
        ascending: false
      })
      .limit(20);

    if (error) {
      throw error;
    }

    const feed =
      document.getElementById("activityFeed");

    feed.innerHTML = "";


    if (!data.length) {

      feed.textContent =
        "No accountability activity recorded.";

      return;
    }


    data.forEach(item => {

      const card =
        document.createElement("article");

      card.className =
        "activity-item";

      card.innerHTML = `

        <div>

          <strong>
            ${item.devices?.asset_code || "Asset"}
          </strong>

          <span class="activity-action">
            ${statusLabel(item.action)}
          </span>

        </div>

        <div class="subtle">

          ${
            item.employees?.display_name ||
            "Employee"
          }

          ${
            item.employees?.employee_number
              ? `#${item.employees.employee_number}`
              : ""
          }

        </div>

        <div class="activity-time">
          ${formatDate(item.occurred_at)}
        </div>

      `;

      feed.appendChild(card);

    });

  }


  async function loadInspections() {

    const {
      data,
      error
    } = await db
      .from("device_inspections")
      .select(`
        id,
        overall_result,
        occurred_at,
        notes,
        devices(asset_code),
        employees(display_name, employee_number)
      `)
      .order("occurred_at", {
        ascending: false
      })
      .limit(10);

    if (error) {
      throw error;
    }

    const feed =
      document.getElementById("inspectionFeed");

    feed.innerHTML = "";


    if (!data.length) {

      feed.textContent =
        "No inspections recorded.";

      return;
    }


    data.forEach(item => {

      const card =
        document.createElement("article");

      card.className =
        "activity-item";

      card.innerHTML = `

        <div>

          <strong>
            ${item.devices?.asset_code || "Asset"}
          </strong>

          <span class="inspection-result ${item.overall_result}">
            ${statusLabel(item.overall_result)}
          </span>

        </div>

        <div class="subtle">

          Inspected by

          ${
            item.employees?.display_name ||
            "Employee"
          }

        </div>

        <div class="activity-time">
          ${formatDate(item.occurred_at)}
        </div>

      `;

      feed.appendChild(card);

    });

  }


  async function loadIssues() {

    const {
      data,
      error
    } = await db
      .from("device_issues")
      .select(`
        id,
        category,
        severity,
        description,
        status,
        occurred_at,
        devices(asset_code),
        employees(display_name, employee_number)
      `)
      .neq("status", "resolved")
      .order("occurred_at", {
        ascending: false
      })
      .limit(20);

    if (error) {
      throw error;
    }

    const feed =
      document.getElementById("issueFeed");

    feed.innerHTML = "";


    if (!data.length) {

      feed.textContent =
        "No open issues.";

      return;
    }


    data.forEach(item => {

      const card =
        document.createElement("article");

      card.className =
        "activity-item issue-item";

      card.innerHTML = `

        <div>

          <strong>
            ${item.devices?.asset_code || "Asset"}
          </strong>

          <span class="issue-severity ${item.severity}">
            ${statusLabel(item.severity)}
          </span>

        </div>

        <div>
          ${item.description}
        </div>

        <div class="subtle">

          Reported by

          ${
            item.employees?.display_name ||
            "Employee"
          }

        </div>

        <div class="activity-time">
          ${formatDate(item.occurred_at)}
        </div>

      `;

      feed.appendChild(card);

    });

  }


  async function loadDashboard() {

    try {

      await Promise.all([
        loadAssets(),
        loadTransactions(),
        loadInspections(),
        loadIssues()
      ]);

    } catch (error) {

      console.error(
        "SecureTrack dashboard error:",
        error
      );

    }

  }


  await loadDashboard();


  const channel =
    db.channel(
      "securetrack-manager-realtime"
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "devices"
      },
      loadDashboard
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_transactions"
      },
      loadDashboard
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_inspections"
      },
      loadDashboard
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "device_issues"
      },
      loadDashboard
    )

    .subscribe(status => {

      document.getElementById(
        "realtimeStatus"
      ).textContent =
        status === "SUBSCRIBED"
          ? "SecureTrack Live Reporting Connected"
          : `Live reporting: ${status}`;

    });

})();
