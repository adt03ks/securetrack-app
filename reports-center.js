(async function () {

  "use strict";


  // =========================================================
  // SECURETRACK REPORTING CENTER
  // =========================================================

  const STM =
    window.SecureTrackManager;


  const manager =
    await STM.requireManager();


  if (!manager) {
    return;
  }


  const db =
    STM.db;


  // =========================================================
  // UNIVERSAL NOTIFICATION BELL
  // =========================================================

  async function initializeReportingNotifications() {
    try {
      const { data, error } =
        await db.auth.getUser();

      if (error) {
        throw error;
      }

      const userId = data?.user?.id;

      if (!userId) {
        console.warn(
          "Reporting Center: no authenticated notification user."
        );
        return;
      }

      if (!window.SecureTrackNotifications?.init) {
        console.warn(
          "Reporting Center: notification bell script unavailable."
        );
        return;
      }

      await window.SecureTrackNotifications.init({
        client: db,
        userId,
        target: "#securetrack-notification-mount"
      });

      console.log(
        "Reporting Center notification bell initialized."
      );

    } catch (error) {
      console.error(
        "Reporting Center notification initialization failed:",
        error
      );
    }
  }

  await initializeReportingNotifications();


  // =========================================================
  // ELEMENTS
  // =========================================================

  const userName =
    document.getElementById(
      "reportingUserName"
    );


  const moduleTitle =
    document.getElementById(
      "reportModuleTitle"
    );


  const reportType =
    document.getElementById(
      "reportType"
    );


  const dateRange =
    document.getElementById(
      "reportDateRange"
    );


  const startDate =
    document.getElementById(
      "reportStartDate"
    );


  const endDate =
    document.getElementById(
      "reportEndDate"
    );


  const shift =
    document.getElementById(
      "reportShift"
    );


  const officer =
    document.getElementById(
      "reportOfficer"
    );


  const generateButton =
    document.getElementById(
      "generateReportButton"
    );


  const exportButton =
    document.getElementById(
      "exportReportButton"
    );


  const printButton =
    document.getElementById(
      "printReportButton"
    );


  const result =
    document.getElementById(
      "reportResult"
    );


  const output =
    document.getElementById(
      "reportOutput"
    );


  const generatedTitle =
    document.getElementById(
      "generatedReportTitle"
    );


  const generatedMeta =
    document.getElementById(
      "generatedReportMeta"
    );


  const summaryCards =
    document.getElementById(
      "reportSummaryCards"
    );


  const tableHead =
    document.getElementById(
      "reportTableHead"
    );


  const tableBody =
    document.getElementById(
      "reportTableBody"
    );



  // =========================================================
  // CURRENT REPORT STATE
  // =========================================================

  let activeModule =
    "devices";


  let currentRows =
    [];


  let currentColumns =
    [];



  // =========================================================
  // REPORT DEFINITIONS
  // =========================================================

  const reportDefinitions = {


    devices: {

      title:
        "Device Reports",

      reports: [

        {
          value:
            "inspection_summary",

          label:
            "Inspection Pass / Fail Summary"
        },

        {
          value:
            "failed_inspections",

          label:
            "Failed Inspection Detail"
        },

        {
          value:
            "damaged_equipment",

          label:
            "Damaged Equipment"
        },

        {
          value:
            "checked_out",

          label:
            "Currently Checked Out Equipment"
        },

        {
          value:
            "device_over_24",

          label:
            "Equipment Checked Out Over 24 Hours"
        },

        {
          value:
            "repeat_device_checkout",

          label:
            "Same Device Used Multiple Days"
        },

        {
          value:
            "administrative_recoveries",

          label:
            "Administrative Recoveries"
        }

      ]

    },


    overtime: {

      title:
        "Overtime Reports",

      reports: [

        {
          value:
            "overtime_opportunities",

          label:
            "Overtime Opportunities"
        },

        {
          value:
            "overtime_hours",

          label:
            "Utilized Overtime Hours"
        },

        {
          value:
            "filled_overtime",

          label:
            "Filled Overtime Opportunities"
        },

        {
          value:
            "unfilled_overtime",

          label:
            "Unfilled Overtime Opportunities"
        },

        {
          value:
            "overtime_by_shift",

          label:
            "Shifts Requiring Overtime"
        },

        {
          value:
            "overtime_by_officer",

          label:
            "Officer Overtime Signup History"
        },

        {
          value:
            "external_overtime",

          label:
            "On-Campus vs Off-Campus Help"
        }

      ]

    },


    alerts: {

      title:
        "Security Alert Reports",

      reports: [

        {
          value:
            "all_security_alerts",

          label:
            "All Security Alerts"
        },

        {
          value:
            "alerts_by_shift",

          label:
            "Security Alerts by Shift"
        },

        {
          value:
            "code_green",

          label:
            "Code Green"
        },

        {
          value:
            "taser_pull",

          label:
            "Taser Pull"
        },

        {
          value:
            "ctw",

          label:
            "CTW"
        },

        {
          value:
            "officer_injury",

          label:
            "Officer Injury"
        },

        {
          value:
            "insufficient_staffing",

          label:
            "Insufficient Staffing"
        }

      ]

    },


    duty: {

      title:
        "Duty Station Reports",

      reports: [

        {
          value:
            "finalized_duty",

          label:
            "Finalized Duty Stations"
        },

        {
          value:
            "duty_by_officer",

          label:
            "Duty Stations by Officer"
        },

        {
          value:
            "duty_overrides",

          label:
            "Duty Station Overrides"
        },

        {
          value:
            "post_publish_changes",

          label:
            "Changes After Finalization"
        },

        {
          value:
            "repeat_assignments",

          label:
            "Repeated Duty Station Assignments"
        }

      ]

    },


    handoff: {

      title:
        "Shift Handoff Reports",

      reports: [

        {
          value:
            "handoff_lookup",

          label:
            "Shift Handoff Lookup"
        },

        {
          value:
            "incomplete_handoffs",

          label:
            "Incomplete Shift Handoffs"
        },

        {
          value:
            "handoffs_by_shift",

          label:
            "Shift Handoffs by Shift"
        },

        {
          value:
            "handoffs_by_leader",

          label:
            "Handoffs by Team Lead / Senior Officer"
        },

        {
          value:
            "carry_forward",

          label:
            "Carry-Forward Items"
        }

      ]

    },


    personnel: {

      title:
        "Personnel Reports",

      reports: [

        {
          value:
            "active_officers",

          label:
            "Active Officers"
        },

        {
          value:
            "officers_by_shift",

          label:
            "Officers by Shift"
        },

        {
          value:
            "unarmed_officers",

          label:
            "Officers Without Armed Qualification"
        },

        {
          value:
            "new_hires",

          label:
            "New Hires"
        },

        {
          value:
            "separations",

          label:
            "Employee Separations"
        },

        {
          value:
            "turnover",

          label:
            "Turnover Percentage"
        }

      ]

    },


    notifications: {

      title:
        "Notification Reports",

      reports: [

        {
          value:
            "notification_subscribers",

          label:
            "All Notification Subscribers"
        },

        {
          value:
            "sms_subscribers",

          label:
            "SMS Subscribers"
        },

        {
          value:
            "email_subscribers",

          label:
            "Email Subscribers"
        },

        {
          value:
            "notification_opt_outs",

          label:
            "Notification Opt-Outs"
        }

      ]

    }

  };



  // =========================================================
  // USER DISPLAY
  // =========================================================

  userName.textContent =
    manager.display_name ||
    manager.email ||
    "Management";


async function loadReportingOfficers() {

  // =========================================================
  // SECURETRACK OP - REPORTING OFFICER DIRECTORY
  // Load all active employees instead of overtime signups
  // =========================================================

  try {

    const { data, error } = await db
      .from("profiles")
      .select(`
        id,
        employee_id,
        display_name,
        first_name,
        last_name,
        employee_number,
        is_active,
        employment_status
      `)
      .eq("is_active", true)
      .eq("employment_status", "active")
      .order("display_name", {
        ascending: true
      });

    if (error) {
      throw error;
    }

    const officers = new Map();

    (data || []).forEach(profile => {

      if (!profile.id) {
        return;
      }

      const fullName = [
        profile.first_name,
        profile.last_name
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const displayName =
        profile.display_name?.trim() ||
        fullName ||
        `Employee ${profile.employee_number || ""}`;

      officers.set(profile.id, {
        id: profile.id,
        name: displayName,
        employeeNumber: profile.employee_number
      });

    });

    // Preserve the All Officers option.

    officer.innerHTML = "";

    const allOption =
      document.createElement("option");

    allOption.value = "all";
    allOption.textContent = "All Officers";

    officer.appendChild(allOption);

    // Sort alphabetically.

    const sortedOfficers =
      Array.from(officers.values())
        .sort((a, b) =>
          a.name.localeCompare(b.name)
        );

    sortedOfficers.forEach(person => {

      const option =
        document.createElement("option");

      option.value = person.id;

      option.textContent =
        person.employeeNumber
          ? `${person.name} (#${person.employeeNumber})`
          : person.name;

      officer.appendChild(option);

    });

    console.log(
      `Reporting Center: Loaded ${sortedOfficers.length} active personnel profiles.`
    );

  } catch (error) {

    console.error(
      "Unable to load Reporting Center officers:",
      error
    );

    // Keep the basic dropdown usable.

    officer.innerHTML = "";

    const fallback =
      document.createElement("option");

    fallback.value = "all";
    fallback.textContent = "All Officers";

    officer.appendChild(fallback);

    result.className = "result show error";

    result.textContent =
      "Unable to load the employee directory. " +
      "Please refresh or contact an administrator.";

  }

}


  // =========================================================
  // LOAD REPORT TYPES
  // =========================================================

  function loadReportTypes() {

    const module =
      reportDefinitions[
        activeModule
      ];


    moduleTitle.textContent =
      module.title;


    reportType.innerHTML =
      "";


    module.reports.forEach(
      (definition) => {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          definition.value;


        option.textContent =
          definition.label;


        reportType.appendChild(
          option
        );

      }
    );

  }



  // =========================================================
  // MODULE TABS
  // =========================================================

  document
    .querySelectorAll(
      ".report-tab"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            activeModule =
              button.dataset.module;


            document
              .querySelectorAll(
                ".report-tab"
              )
              .forEach(
                (tab) =>
                  tab.classList.toggle(
                    "active",
                    tab === button
                  )
              );


            loadReportTypes();


            output.hidden =
              true;


            currentRows =
              [];

          }
        );

      }
    );



  // =========================================================
  // QUICK REPORT BUTTONS
  // =========================================================

  document
    .querySelectorAll(
      ".quick-report-card"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const requested =
              button.dataset.report;


            for (
              const [
                moduleName,
                module
              ]
              of Object.entries(
                reportDefinitions
              )
            ) {

              const found =
                module.reports.find(
                  (item) =>
                    item.value ===
                    requested
                );


              if (!found) {
                continue;
              }


              activeModule =
                moduleName;


              document
                .querySelectorAll(
                  ".report-tab"
                )
                .forEach(
                  (tab) =>
                    tab.classList.toggle(
                      "active",
                      tab.dataset.module ===
                        activeModule
                    )
                );


              loadReportTypes();


              reportType.value =
                requested;


              break;

            }

          }
        );

      }
    );



  // =========================================================
  // DATE HELPERS
  // =========================================================

  function resolveDateRange() {

    const now =
      new Date();


    let start =
      new Date(now);


    let end =
      new Date(now);


    end.setHours(
      23,
      59,
      59,
      999
    );


    if (
      dateRange.value ===
      "custom"
    ) {

      if (
        !startDate.value ||
        !endDate.value
      ) {

        throw new Error(
          "Select both a start date and an end date."
        );

      }


      start =
        new Date(
          `${startDate.value}T00:00:00`
        );


      end =
        new Date(
          `${endDate.value}T23:59:59`
        );


      return {
        start,
        end
      };

    }


    if (
      dateRange.value ===
      "today"
    ) {

      start.setHours(
        0,
        0,
        0,
        0
      );

    } else {

      const days =
        Number(
          dateRange.value
        );


      start.setDate(
        start.getDate() -
        days
      );


      start.setHours(
        0,
        0,
        0,
        0
      );

    }


    return {
      start,
      end
    };

  }



  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHTML(
    value
  ) {

    return String(
      value ?? ""
    )

      .replaceAll(
        "&",
        "&amp;"
      )

      .replaceAll(
        "<",
        "&lt;"
      )

      .replaceAll(
        ">",
        "&gt;"
      )

      .replaceAll(
        '"',
        "&quot;"
      )

      .replaceAll(
        "'",
        "&#039;"
      );

  }



  // =========================================================
  // RENDER GENERIC TABLE
  // =========================================================

  function renderTable(
    columns,
    rows
  ) {

    currentColumns =
      columns;


    currentRows =
      rows;


    tableHead.innerHTML = `

      <tr>

        ${columns
          .map(
            (column) => `
              <th>
                ${escapeHTML(
                  column.label
                )}
              </th>
            `
          )
          .join("")}

      </tr>

    `;


    if (!rows.length) {

      tableBody.innerHTML = `

        <tr>

          <td
            colspan="${columns.length}"
            class="report-empty"
          >
            No records found for the selected report.
          </td>

        </tr>

      `;

      return;

    }


    tableBody.innerHTML =
      rows
        .map(
          (row) => `

            <tr>

              ${columns
                .map(
                  (column) => `

                    <td>
                      ${escapeHTML(
                        row[
                          column.key
                        ] ?? "—"
                      )}
                    </td>

                  `
                )
                .join("")}

            </tr>

          `
        )
        .join("");

  }



  // =========================================================
  // SUMMARY CARDS
  // =========================================================

  function renderSummary(
    items
  ) {

    summaryCards.innerHTML =
      items
        .map(
          (item) => `

            <div class="report-summary-card">

              <span>
                ${escapeHTML(
                  item.label
                )}
              </span>

              <strong>
                ${escapeHTML(
                  item.value
                )}
              </strong>

            </div>

          `
        )
        .join("");

  }



  // =========================================================
  // DEVICE REPORTS
  // =========================================================

  async function generateDeviceReport(
    type,
    range
  ) {

    const startISO =
      range.start.toISOString();


    const endISO =
      range.end.toISOString();



    // -------------------------------------------------------
    // INSPECTION PASS / FAIL SUMMARY
    // -------------------------------------------------------

    if (
      type ===
      "inspection_summary"
    ) {

      const {
        data,
        error
      } =
        await db
          .from(
            "device_inspections"
          )
          .select(
            `
              id,
              overall_result,
              occurred_at,
              devices(
                asset_code
              )
            `
          )
          .gte(
            "occurred_at",
            startISO
          )
          .lte(
            "occurred_at",
            endISO
          );


      if (error) {
        throw error;
      }


      const rows =
        data || [];


      const passed =
        rows.filter(
          (item) =>
            item.overall_result ===
            "pass"
        ).length;


      const failed =
        rows.filter(
          (item) =>
            item.overall_result ===
            "fail"
        ).length;


      renderSummary([
        {
          label:
            "Total Inspections",

          value:
            rows.length
        },

        {
          label:
            "Passed",

          value:
            passed
        },

        {
          label:
            "Failed",

          value:
            failed
        },

        {
          label:
            "Failure Rate",

          value:
            rows.length
              ? `${(
                  failed /
                  rows.length *
                  100
                ).toFixed(1)}%`
              : "0%"
        }
      ]);


      renderTable(
        [
          {
            key:
              "asset",

            label:
              "Asset"
          },

          {
            key:
              "result",

            label:
              "Result"
          },

          {
            key:
              "date",

            label:
              "Inspection Date"
          }
        ],

        rows.map(
          (item) => ({

            asset:
              item.devices
                ?.asset_code ||
              "—",

            result:
              String(
                item.overall_result ||
                ""
              ).toUpperCase(),

            date:
              new Date(
                item.occurred_at
              ).toLocaleString()

          })
        )
      );


      return;

    }



    // -------------------------------------------------------
    // FAILED INSPECTIONS
    // -------------------------------------------------------

    if (
      type ===
      "failed_inspections"
    ) {

      const {
        data,
        error
      } =
        await db
          .from(
            "device_inspections"
          )
          .select(
            `
              id,
              checklist,
              notes,
              overall_result,
              occurred_at,
              devices(
                asset_code
              ),
              employees(
                display_name,
                employee_number
              )
            `
          )
          .eq(
            "overall_result",
            "fail"
          )
          .gte(
            "occurred_at",
            startISO
          )
          .lte(
            "occurred_at",
            endISO
          )
          .order(
            "occurred_at",
            {
              ascending:
                false
            }
          );


      if (error) {
        throw error;
      }


      const rows =
        data || [];


      renderSummary([
        {
          label:
            "Failed Inspections",

          value:
            rows.length
        }
      ]);


      renderTable(
        [
          {
            key:
              "asset",

            label:
              "Asset"
          },

          {
            key:
              "officer",

            label:
              "Officer"
          },

          {
            key:
              "failedItems",

            label:
              "Failed Items"
          },

          {
            key:
              "notes",

            label:
              "Notes"
          },

          {
            key:
              "date",

            label:
              "Date / Time"
          }
        ],

        rows.map(
          (item) => {

            const failedItems =
              Object.entries(
                item.checklist ||
                {}
              )

                .filter(
                  ([, value]) =>
                    String(
                      value
                    ).toLowerCase() ===
                    "fail"
                )

                .map(
                  ([key]) =>
                    key
                      .replaceAll(
                        "_",
                        " "
                      )
                )

                .join(", ");


            return {

              asset:
                item.devices
                  ?.asset_code ||
                "—",

              officer:
                item.employees
                  ? `${item.employees.display_name}${
                      item.employees.employee_number
                        ? ` #${item.employees.employee_number}`
                        : ""
                    }`
                  : "—",

              failedItems:
                failedItems ||
                "—",

              notes:
                item.notes ||
                "—",

              date:
                new Date(
                  item.occurred_at
                ).toLocaleString()

            };

          }
        )
      );


      return;

    }



    // -------------------------------------------------------
    // CURRENTLY CHECKED OUT
    // -------------------------------------------------------

    if (
      type ===
        "checked_out" ||
      type ===
        "device_over_24"
    ) {

      const {
        data,
        error
      } =
        await db
          .from(
            "devices"
          )
          .select(
            `
              id,
              asset_code,
              manufacturer,
              model,
              status,
              current_custodian_id,
              employees:current_custodian_id(
                display_name,
                employee_number
              )
            `
          )
          .eq(
            "status",
            "checked_out"
          );


      if (error) {
        throw error;
      }


      const devices =
        data || [];


      const rows =
        [];


      for (
        const device
        of devices
      ) {

        const {
          data:
            latestCheckout
        } =
          await db
            .from(
              "device_transactions"
            )
            .select(
              "occurred_at"
            )
            .eq(
              "device_id",
              device.id
            )
            .eq(
              "action",
              "checkout"
            )
            .order(
              "occurred_at",
              {
                ascending:
                  false
              }
            )
            .limit(1)
            .maybeSingle();


        const checkoutTime =
          latestCheckout
            ?.occurred_at
            ? new Date(
                latestCheckout.occurred_at
              )
            : null;


        const hoursOut =
          checkoutTime
            ? (
                Date.now() -
                checkoutTime.getTime()
              ) /
              3600000
            : 0;


        if (
          type ===
            "device_over_24" &&
          hoursOut <= 24
        ) {

          continue;

        }


        rows.push({

          asset:
            device.asset_code,

          model:
            [
              device.manufacturer,
              device.model
            ]
              .filter(Boolean)
              .join(" "),

          officer:
            device.employees
              ? `${device.employees.display_name}${
                  device.employees.employee_number
                    ? ` #${device.employees.employee_number}`
                    : ""
                }`
              : "Unknown",

          checkout:
            checkoutTime
              ? checkoutTime
                  .toLocaleString()
              : "—",

          hours:
            checkoutTime
              ? hoursOut
                  .toFixed(1)
              : "—"

        });

      }


      renderSummary([
        {
          label:
            type ===
              "device_over_24"
              ? "Equipment Over 24 Hours"
              : "Currently Checked Out",

          value:
            rows.length
        }
      ]);


      renderTable(
        [
          {
            key:
              "asset",

            label:
              "Asset"
          },

          {
            key:
              "model",

            label:
              "Equipment"
          },

          {
            key:
              "officer",

            label:
              "Current Custodian"
          },

          {
            key:
              "checkout",

            label:
              "Checkout Time"
          },

          {
            key:
              "hours",

            label:
              "Hours Out"
          }
        ],

        rows
      );


      return;

    }


    throw new Error(
      "This device report is being added in the next reporting module update."
    );

  }


 
  // =========================================================
  // SECURITY ALERT REPORTS
  // Uses actual incident occurrence date and time
  // =========================================================

  async function generateSecurityAlertReport(type, range) {

    const supportedTypes = [
      "all_security_alerts",
      "alerts_by_shift",
      "code_green",
      "taser_pull",
      "ctw",
      "officer_injury",
      "insufficient_staffing"
    ];

    if (!supportedTypes.includes(type)) {
      throw new Error("Unsupported security alert report.");
    }

    // Convert the selected local date range into
    // calendar dates for the occurrence_date column.
    function localDateString(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const startDateValue = localDateString(range.start);
    const endDateValue = localDateString(range.end);

    // =====================================================
    // LOAD SECURITY INCIDENTS
    // =====================================================

    let query = db
      .from("security_incidents")
      .select(`
        id,
        incident_type,
        occurrence_date,
        occurrence_time,
        location,
        submitted_at
      `)
      .gte("occurrence_date", startDateValue)
      .lte("occurrence_date", endDateValue)
      .order("occurrence_date", {
        ascending: false
      })
      .order("occurrence_time", {
        ascending: false
      });

    if (
      type !== "all_security_alerts" &&
      type !== "alerts_by_shift"
    ) {
      query = query.eq("incident_type", type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const incidents = data || [];

    // =====================================================
    // LOAD INCIDENT / SHIFT RELATIONSHIPS
    // =====================================================

    const incidentIds = incidents.map(item => item.id);

    let links = [];

    if (incidentIds.length) {

      const response = await db
        .from("security_incident_shift_links")
        .select("incident_id, shift_instance_id")
        .in("incident_id", incidentIds);

      if (response.error) {
        throw response.error;
      }

      links = response.data || [];
    }

    // =====================================================
    // LOAD ASSOCIATED SHIFTS
    // =====================================================

    const shiftIds = [
      ...new Set(
        links
          .map(item => item.shift_instance_id)
          .filter(Boolean)
      )
    ];

    let shifts = [];

    if (shiftIds.length) {

      const response = await db
        .from("shift_instances")
        .select("id, shift_name, shift_date")
        .in("id", shiftIds);

      if (response.error) {
        throw response.error;
      }

      shifts = response.data || [];
    }

    const shiftMap = new Map(
      shifts.map(item => [item.id, item])
    );

    const linksByIncident = new Map();

    links.forEach(link => {

      if (!linksByIncident.has(link.incident_id)) {
        linksByIncident.set(link.incident_id, []);
      }

      linksByIncident
        .get(link.incident_id)
        .push(link);

    });

    // =====================================================
    // BUILD REPORT RESULTS
    // =====================================================

    const rows = [];

    incidents.forEach(incident => {

      const associations =
        linksByIncident.get(incident.id) || [];

      const matchingAssociations =
        associations.filter(link => {

          const linkedShift =
            shiftMap.get(link.shift_instance_id);

          return (
            shift.value === "all" ||
            linkedShift?.shift_name === shift.value
          );
        });

      if (
        shift.value !== "all" &&
        matchingAssociations.length === 0
      ) {
        return;
      }

      const displayAssociations =
        matchingAssociations.length
          ? matchingAssociations
          : [null];

      displayAssociations.forEach(link => {

        const linkedShift = link
          ? shiftMap.get(link.shift_instance_id)
          : null;

        rows.push({

          date:
            incident.occurrence_date || "—",

          time:
            incident.occurrence_time
              ? String(incident.occurrence_time)
                  .slice(0, 5)
              : "—",

          type:
            String(incident.incident_type || "")
              .replaceAll("_", " ")
              .toUpperCase(),

          shift:
            linkedShift?.shift_name || "Unassigned",

          shiftDate:
            linkedShift?.shift_date || "—",

          location:
            incident.location || "—",

          incidentId:
            incident.id

        });

      });

    });

    // =====================================================
    // SECURITY ALERTS BY SHIFT
    // =====================================================

    if (type === "alerts_by_shift") {

      const counts = new Map();

      rows.forEach(row => {

        counts.set(
          row.shift,
          (counts.get(row.shift) || 0) + 1
        );

      });

      renderSummary([
        {
          label: "Incident / Shift Records",
          value: rows.length
        },
        {
          label: "Shifts Represented",
          value: counts.size
        }
      ]);

      renderTable(
        [
          { key: "shift", label: "Shift" },
          { key: "count", label: "Alerts" }
        ],
        Array.from(
          counts,
          ([shiftName, count]) => ({
            shift: shiftName,
            count
          })
        )
      );

      return;
    }

    // =====================================================
    // ALL OTHER SECURITY ALERT REPORTS
    // =====================================================

    const uniqueIncidents =
      new Set(rows.map(row => row.incidentId));

    renderSummary([
      {
        label: "Security Incidents",
        value: uniqueIncidents.size
      },
      {
        label: "Shift Associations",
        value: rows.length
      }
    ]);

    renderTable(
      [
        { key: "date", label: "Occurrence Date" },
        { key: "time", label: "Time" },
        { key: "type", label: "Alert Type" },
        { key: "shift", label: "Shift" },
        { key: "location", label: "Location" },
        { key: "incidentId", label: "Reference ID" }
      ],
      rows
    );

  }


  // =========================================================
  // DUTY STATION REPORTS
  // SecureTrack OP Reporting Center
  // =========================================================

  async function generateDutyStationReport(type, range) {

    const supportedTypes = [
      "finalized_duty",
      "duty_by_officer",
      "duty_overrides",
      "post_publish_changes",
      "repeat_assignments"
    ];

    if (!supportedTypes.includes(type)) {
      throw new Error("Unsupported Duty Station report.");
    }

    function localDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    const fromDate = localDate(range.start);
    const toDate = localDate(range.end);

    // =====================================================
    // LOAD SHIFTS WITHIN THE REPORTING PERIOD
    // =====================================================

    let shiftQuery = db
      .from("shift_instances")
      .select("id, shift_name, shift_date, status")
      .gte("shift_date", fromDate)
      .lte("shift_date", toDate)
      .order("shift_date", { ascending: false });

    if (shift.value !== "all") {
      shiftQuery = shiftQuery.eq(
        "shift_name",
        shift.value
      );
    }

    const {
      data: shiftData,
      error: shiftError
    } = await shiftQuery;

    if (shiftError) throw shiftError;

    const shifts = shiftData || [];

    const shiftMap = new Map(
      shifts.map(item => [item.id, item])
    );

    const shiftIds = shifts.map(item => item.id);

    if (!shiftIds.length) {
      renderSummary([
        { label: "Matching Shifts", value: 0 },
        { label: "Records", value: 0 }
      ]);

      renderTable(
        [{ key: "message", label: "Result" }],
        []
      );
      return;
    }

    // =====================================================
    // LOAD DUTY STATION ASSIGNMENTS
    // =====================================================

    let assignmentQuery = db
      .from("station_assignments")
      .select(`
        id,
        shift_instance_id,
        station_id,
        user_id,
        display_name,
        is_locked,
        assignment_source,
        assigned_by_user_id,
        assigned_at
      `)
      .in("shift_instance_id", shiftIds);

    if (officer.value !== "all") {
      assignmentQuery = assignmentQuery.eq(
        "user_id",
        officer.value
      );
    }

    const {
      data: assignmentData,
      error: assignmentError
    } = await assignmentQuery;

    if (assignmentError) throw assignmentError;

    const assignments = assignmentData || [];

   
    // =====================================================
    // LOAD DUTY STATION NAMES
    // =====================================================

    const {
      data: stationData,
      error: stationError
    } = await db
      .from("duty_stations")
      .select(`
        id,
        station_code,
        station_name
      `);

    if (stationError) {
      throw stationError;
    }

    const stationMap = new Map(
      (stationData || []).map(station => [
        station.id,
        station
      ])
    );

    const formatDateTime = value =>
      value
        ? new Date(value).toLocaleString()
        : "—";

    const formatStation = stationId => {

      if (!stationId) {
        return "Unassigned";
      }

      const station = stationMap.get(stationId);

      if (!station) {
        return "Unknown Station";
      }

      return (
        station.station_name ||
        station.station_code ||
        "Unnamed Station"
      );

    };


    // =====================================================
    // FINALIZED DUTY STATIONS
    // =====================================================

    if (
      type === "finalized_duty" ||
      type === "duty_by_officer"
    ) {

      const filtered = type === "finalized_duty"
        ? assignments.filter(item =>
            shiftMap.get(item.shift_instance_id)
              ?.status === "published"
          )
        : assignments;

      const rows = filtered.map(item => {

        const workShift =
          shiftMap.get(item.shift_instance_id);

        return {
          date: workShift?.shift_date || "—",
          shift: workShift?.shift_name || "—",
          officer: item.display_name || "Unknown",
          station: formatStation(item.station_id),
          source: item.assignment_source || "—",
          status: workShift?.status || "—",
          locked: item.is_locked ? "Yes" : "No",
          assigned: formatDateTime(item.assigned_at)
        };
      });

      renderSummary([
        {
          label: "Duty Assignments",
          value: rows.length
        },
        {
          label: "Officers",
          value: new Set(
            filtered.map(item => item.user_id)
              .filter(Boolean)
          ).size
        },
        {
          label: "Shifts",
          value: new Set(
            filtered.map(item => item.shift_instance_id)
          ).size
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Shift" },
          { key: "officer", label: "Officer" },
         { key: "station", label: "Duty Station" },
          { key: "source", label: "Assignment Source" },
          { key: "status", label: "Shift Status" },
          { key: "locked", label: "Locked" },
          { key: "assigned", label: "Assigned At" }
        ],
        rows
      );

      return;
    }

    // =====================================================
    // LOAD DUTY STATION CHANGE HISTORY
    // =====================================================

    let historyQuery = db
      .from("station_assignment_history")
      .select(`
        id,
        shift_instance_id,
        user_id,
        display_name,
        from_station_id,
        to_station_id,
        action_type,
        reason,
        actor_display_name,
        occurred_at
      `)
      .in("shift_instance_id", shiftIds)
      .order("occurred_at", { ascending: false });

    if (officer.value !== "all") {
      historyQuery = historyQuery.eq(
        "user_id",
        officer.value
      );
    }

    const {
      data: historyData,
      error: historyError
    } = await historyQuery;

    if (historyError) throw historyError;

    const history = historyData || [];

    // =====================================================
    // DUTY STATION OVERRIDES
    // =====================================================

    if (type === "duty_overrides") {

      const overrideAssignments =
        assignments.filter(item =>
          item.assignment_source === "override" ||
          item.assignment_source === "manual"
        );

      const overrideHistory =
        history.filter(item =>
          String(item.action_type || "")
            .toLowerCase()
            .includes("override")
        );

      const rows = [
        ...overrideAssignments.map(item => {
          const s = shiftMap.get(item.shift_instance_id);

          return {
            date: s?.shift_date || "—",
            shift: s?.shift_name || "—",
            officer: item.display_name || "—",
            action: item.assignment_source || "—",
            from: "—",
            to: formatStation(item.station_id),
            actor: "—",
            notes: "Current assignment"
          };
        }),
        ...overrideHistory.map(item => {
          const s = shiftMap.get(item.shift_instance_id);

          return {
            date: s?.shift_date || "—",
            shift: s?.shift_name || "—",
            officer: item.display_name || "—",
            action: item.action_type || "—",
            from: formatStation(item.from_station_id),
            to: formatStation(item.to_station_id),
            actor: item.actor_display_name || "—",
            notes: item.reason || "—"
          };
        })
      ];

      renderSummary([
        {
          label: "Current Manual / Override Assignments",
          value: overrideAssignments.length
        },
        {
          label: "Override History Events",
          value: overrideHistory.length
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Shift" },
          { key: "officer", label: "Officer" },
          { key: "action", label: "Change Type" },
          { key: "from", label: "Previous Station" },
          { key: "to", label: "New Station" },
          { key: "actor", label: "Changed By" },
          { key: "notes", label: "Reason / Notes" }
        ],
        rows
      );

      return;
    }

    // =====================================================
    // CHANGES AFTER FINALIZATION
    // =====================================================

    if (type === "post_publish_changes") {

      // A published shift plus a history entry does not,
      // by itself, prove the change occurred AFTER publish.
      // Only report records with explicit post-publish
      // action naming; otherwise avoid a false claim.

      const changes = history.filter(item =>
        /post.publish|after.final/i.test(
          String(item.action_type || "")
        )
      );

      const rows = changes.map(item => {
        const s = shiftMap.get(item.shift_instance_id);

        return {
          date: s?.shift_date || "—",
          shift: s?.shift_name || "—",
          officer: item.display_name || "—",
          from: formatStation(item.from_station_id),
          to: formatStation(item.to_station_id),
          action: item.action_type || "—",
          changed: formatDateTime(item.occurred_at),
          actor: item.actor_display_name || "—",
          reason: item.reason || "—"
        };
      });

      renderSummary([
        {
          label: "Explicitly Logged Post-Publish Changes",
          value: rows.length
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Shift" },
          { key: "officer", label: "Officer" },
          { key: "from", label: "Previous Station" },
          { key: "to", label: "New Station" },
          { key: "action", label: "Action" },
          { key: "changed", label: "Changed At" },
          { key: "actor", label: "Changed By" },
          { key: "reason", label: "Reason" }
        ],
        rows
      );

      return;
    }

    // =====================================================
    // REPEATED DUTY STATION ASSIGNMENTS
    // =====================================================

    if (type === "repeat_assignments") {

      const assignmentCounts = new Map();

      assignments.forEach(item => {

        if (!item.user_id || !item.station_id) {
          return;
        }

        const key =
          `${item.user_id}:${item.station_id}`;

        if (!assignmentCounts.has(key)) {
          assignmentCounts.set(key, {
            officer: item.display_name || "—",
            station: formatStation(item.station_id),
            count: 0,
            shiftDates: new Set()
          });
        }

        const record = assignmentCounts.get(key);
        record.count += 1;

        const workShift =
          shiftMap.get(item.shift_instance_id);

        if (workShift?.shift_date) {
          record.shiftDates.add(workShift.shift_date);
        }
      });

      const repeated = Array.from(
        assignmentCounts.values()
      )
      .filter(item => item.shiftDates.size > 1)
      .map(item => ({
        officer: item.officer,
        station: item.station,
        assignments: item.count,
        days: item.shiftDates.size
      }))
      .sort((a, b) => b.days - a.days);

      renderSummary([
        {
          label: "Repeated Officer / Station Combinations",
          value: repeated.length
        }
      ]);

      renderTable(
        [
          { key: "officer", label: "Officer" },
          { key: "station", label: "Station ID" },
          { key: "assignments", label: "Assignments" },
          { key: "days", label: "Different Days" }
        ],
        repeated
      );

      return;
    }

  }

  
  // =========================================================
  // SHIFT HANDOFF REPORTS
  // SECURETRACK OP - MANAGER REPORTING CENTER
  // READ ONLY
  // =========================================================

  async function generateShiftHandoffReport(type, range) {

    const supportedTypes = [
      "handoff_lookup",
      "incomplete_handoffs",
      "handoffs_by_shift",
      "handoffs_by_leader",
      "carry_forward"
    ];

    if (!supportedTypes.includes(type)) {
      throw new Error("Unsupported Shift Handoff report.");
    }

    // Use local calendar dates for shift_date.
    function localDate(value) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1)
        .padStart(2, "0");
      const day = String(value.getDate())
        .padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    const fromDate = localDate(range.start);
    const toDate = localDate(range.end);
    const today = localDate(new Date());

    const displayTime = value =>
      value
        ? new Date(value).toLocaleString()
        : "—";

    // =====================================================
    // LOAD SHIFTS FOR SELECTED PERIOD
    // =====================================================

    let shiftQuery = db
      .from("shift_instances")
      .select(`
        id,
        shift_date,
        shift_name,
        status,
        handoff_status,
        handoff_source_report_id,
        handoff_acknowledged_at,
        handoff_acknowledged_by_name
      `)
      .gte("shift_date", fromDate)
      .lte("shift_date", toDate)
      .order("shift_date", {
        ascending: false
      });

    if (shift.value !== "all") {
      shiftQuery = shiftQuery.eq(
        "shift_name",
        shift.value
      );
    }

    const {
      data: shiftData,
      error: shiftError
    } = await shiftQuery;

    if (shiftError) {
      throw shiftError;
    }

    const shifts = shiftData || [];
    const shiftIds = shifts.map(item => item.id);

    const shiftMap = new Map(
      shifts.map(item => [item.id, item])
    );

    // =====================================================
    // LOAD END-OF-SHIFT REPORTS
    // =====================================================

    let reports = [];

    if (shiftIds.length) {

      const response = await db
        .from("end_of_shift_reports")
        .select(`
          id,
          shift_instance_id,
          status,
          receiving_shift_name,
          created_at,
          published_at,
          published_by,
          published_by_name
        `)
        .in("shift_instance_id", shiftIds);

      if (response.error) {
        throw response.error;
      }

      reports = response.data || [];
    }

    // =====================================================
    // LOAD ACKNOWLEDGMENTS
    // =====================================================

    const reportIds = reports.map(item => item.id);

    let acknowledgments = [];

    if (reportIds.length) {

      const response = await db
        .from("end_of_shift_report_acknowledgements")
        .select(`
          id,
          report_id,
          acknowledged_by,
          acknowledged_by_name,
          acknowledged_at
        `)
        .in("report_id", reportIds);

      if (response.error) {
        throw response.error;
      }

      acknowledgments = response.data || [];
    }

    // Index acknowledgments by report ID.

    const ackMap = new Map();

    acknowledgments.forEach(item => {

      const previous = ackMap.get(item.report_id);

      if (
        !previous ||
        (
          item.acknowledged_at &&
          (
            !previous.acknowledged_at ||
            item.acknowledged_at >
              previous.acknowledged_at
          )
        )
      ) {
        ackMap.set(item.report_id, item);
      }

    });

    // =====================================================
    // BUILD COMMON REPORT RECORDS
    // =====================================================

    let records = reports.map(report => {

      const sourceShift =
        shiftMap.get(report.shift_instance_id);

      const ack = ackMap.get(report.id);

      const isPublished =
        report.published_at !== null;

      const isAcknowledged =
        Boolean(ack?.acknowledged_at);

      return {
        reportId: report.id,
        shiftId: report.shift_instance_id,
        date: sourceShift?.shift_date || "—",
        shift: sourceShift?.shift_name || "—",
        receiving:
          report.receiving_shift_name || "—",
        status: isPublished
          ? "Published"
          : report.status || "Draft",
        handoffStatus:
          sourceShift?.handoff_status || "—",
        published:
          displayTime(report.published_at),
        publisher:
          report.published_by_name || "—",
        publisherId: report.published_by,
        acknowledged:
          displayTime(ack?.acknowledged_at),
        acknowledgedBy:
          ack?.acknowledged_by_name || "—",
        acknowledgedById:
          ack?.acknowledged_by || null,
        isPublished,
        isAcknowledged
      };

    });

    // When an individual officer is selected,
    // match publisher or acknowledging employee.
    if (officer.value !== "all") {

      records = records.filter(item =>
        item.publisherId === officer.value ||
        item.acknowledgedById === officer.value
      );

    }

    // =====================================================
    // 1. SHIFT HANDOFF LOOKUP
    // =====================================================

    if (type === "handoff_lookup") {

      renderSummary([
        {
          label: "Handoff Reports",
          value: records.length
        },
        {
          label: "Published",
          value: records.filter(
            r => r.isPublished
          ).length
        },
        {
          label: "Acknowledged",
          value: records.filter(
            r => r.isAcknowledged
          ).length
        },
        {
          label: "Drafts",
          value: records.filter(
            r => !r.isPublished
          ).length
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Outgoing Shift" },
          { key: "receiving", label: "Receiving Shift" },
          { key: "status", label: "Report Status" },
          { key: "publisher", label: "Published By" },
          { key: "published", label: "Published At" },
          { key: "acknowledgedBy", label: "Acknowledged By" },
          { key: "acknowledged", label: "Acknowledged At" }
        ],
        records
      );

      return;
    }

    // =====================================================
    // 2. INCOMPLETE SHIFT HANDOFFS
    // =====================================================

    if (type === "incomplete_handoffs") {

      // Published but not acknowledged is a definite
      // outstanding acknowledgment.
      //
      // A draft from a prior shift date is shown
      // separately as pending publication.
      //
      // Do not treat all not_started shift records
      // as incomplete because some shifts may not
      // have reached their handoff time.

      const pending = records
        .filter(item =>
          (
            item.isPublished &&
            !item.isAcknowledged
          ) ||
          (
            !item.isPublished &&
            item.date < today
          )
        )
        .map(item => ({
          ...item,
          requiredAction: item.isPublished
            ? "Awaiting acknowledgment"
            : "Draft — publication pending"
        }));

      renderSummary([
        {
          label: "Outstanding Handoffs",
          value: pending.length
        },
        {
          label: "Awaiting Acknowledgment",
          value: pending.filter(
            item => item.isPublished
          ).length
        },
        {
          label: "Prior-Date Drafts",
          value: pending.filter(
            item => !item.isPublished
          ).length
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Outgoing Shift" },
          { key: "receiving", label: "Receiving Shift" },
          { key: "status", label: "Report Status" },
          { key: "requiredAction", label: "Outstanding Action" },
          { key: "publisher", label: "Published By" },
          { key: "published", label: "Published At" }
        ],
        pending
      );

      return;
    }

    // =====================================================
    // 3. HANDOFFS BY SHIFT
    // =====================================================

    if (type === "handoffs_by_shift") {

      const grouped = new Map();

      records.forEach(item => {

        if (!grouped.has(item.shift)) {

          grouped.set(item.shift, {
            shift: item.shift,
            reports: 0,
            published: 0,
            drafts: 0,
            acknowledged: 0,
            pendingAcknowledgment: 0
          });

        }

        const group = grouped.get(item.shift);

        group.reports++;

        if (item.isPublished) {
          group.published++;
        } else {
          group.drafts++;
        }

        if (item.isAcknowledged) {
          group.acknowledged++;
        }

        if (
          item.isPublished &&
          !item.isAcknowledged
        ) {
          group.pendingAcknowledgment++;
        }

      });

      const rows = Array.from(
        grouped.values()
      ).sort(
        (a, b) =>
          a.shift.localeCompare(b.shift)
      );

      renderSummary([
        {
          label: "Shifts Represented",
          value: rows.length
        },
        {
          label: "Total Reports",
          value: records.length
        },
        {
          label: "Published Reports",
          value: records.filter(
            r => r.isPublished
          ).length
        }
      ]);

      renderTable(
        [
          { key: "shift", label: "Shift" },
          { key: "reports", label: "Total Reports" },
          { key: "published", label: "Published" },
          { key: "drafts", label: "Draft" },
          { key: "acknowledged", label: "Acknowledged" },
          {
            key: "pendingAcknowledgment",
            label: "Awaiting Acknowledgment"
          }
        ],
        rows
      );

      return;
    }

    // =====================================================
    // 4. HANDOFFS BY TEAM LEAD / SENIOR OFFICER
    // =====================================================

    if (type === "handoffs_by_leader") {

      // These are the recorded publishing and
      // acknowledging actors. Their leadership
      // titles are not inferred from report names.

      const leaders = new Map();

      function addActivity(
        userId,
        name,
        activity
      ) {

        if (!userId && !name) {
          return;
        }

        const key = userId || `name:${name}`;

        if (!leaders.has(key)) {

          leaders.set(key, {
            leader: name || "Unknown",
            published: 0,
            acknowledged: 0
          });

        }

        const entry = leaders.get(key);

        entry[activity]++;

      }

      records.forEach(item => {

        if (item.isPublished) {
          addActivity(
            item.publisherId,
            item.publisher,
            "published"
          );
        }

        if (item.isAcknowledged) {
          addActivity(
            item.acknowledgedById,
            item.acknowledgedBy,
            "acknowledged"
          );
        }

      });

      const rows = Array.from(
        leaders.values()
      ).sort(
        (a, b) =>
          (b.published + b.acknowledged) -
          (a.published + a.acknowledged)
      );

      renderSummary([
        {
          label: "Recorded Participants",
          value: rows.length
        },
        {
          label: "Publication Actions",
          value: rows.reduce(
            (sum, r) => sum + r.published,
            0
          )
        },
        {
          label: "Acknowledgment Actions",
          value: rows.reduce(
            (sum, r) => sum + r.acknowledged,
            0
          )
        }
      ]);

      renderTable(
        [
          {
            key: "leader",
            label: "Recorded Employee"
          },
          {
            key: "published",
            label: "Reports Published"
          },
          {
            key: "acknowledged",
            label: "Reports Acknowledged"
          }
        ],
        rows
      );

      return;
    }

    // =====================================================
    // 5. CARRY-FORWARD ITEMS
    // =====================================================

    if (type === "carry_forward") {

      const filteredReportIds =
        records.map(item => item.reportId);

      let items = [];

      if (filteredReportIds.length) {

        const response = await db
          .from("end_of_shift_report_items")
          .select(`
            id,
            report_id,
            resolution_status,
            is_carry_forward,
            created_at
          `)
          .in("report_id", filteredReportIds)
          .eq("is_carry_forward", true);

        if (response.error) {
          throw response.error;
        }

        items = response.data || [];
      }

      const reportMap = new Map(
        records.map(item => [
          item.reportId,
          item
        ])
      );

      const rows = items.map(item => {

        const report =
          reportMap.get(item.report_id);

        return {
          date: report?.date || "—",
          shift: report?.shift || "—",
          receiving: report?.receiving || "—",
          status: item.resolution_status || "—",
          publication:
            report?.status || "—",
          recorded:
            displayTime(item.created_at),
          reference: item.id
        };

      });

      renderSummary([
        {
          label: "Carry-Forward Items",
          value: rows.length
        },
        {
          label: "Unresolved Items",
          value: items.filter(item =>
            item.resolution_status !== "resolved"
          ).length
        },
        {
          label: "Resolved Items",
          value: items.filter(item =>
            item.resolution_status === "resolved"
          ).length
        }
      ]);

      renderTable(
        [
          { key: "date", label: "Shift Date" },
          { key: "shift", label: "Outgoing Shift" },
          { key: "receiving", label: "Receiving Shift" },
          { key: "status", label: "Resolution Status" },
          { key: "publication", label: "Report Status" },
          { key: "recorded", label: "Recorded At" },
          { key: "reference", label: "Item Reference" }
        ],
        rows
      );

      return;
    }

  }

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  async function generateReport() {

    result.className =
      "result";


    result.textContent =
      "";


    generateButton.disabled =
      true;


    generateButton.textContent =
      "Generating Report…";


    try {

      const range =
        resolveDateRange();


      const selectedReport =
        reportType.value;


      generatedTitle.textContent =
        reportType
          .selectedOptions[0]
          ?.textContent ||
        "SecureTrack Report";


      generatedMeta.textContent =
        `${range.start.toLocaleDateString()} – ${range.end.toLocaleDateString()} • Shift: ${shift.value}`;


      if (
  activeModule ===
  "devices"
) {

  await generateDeviceReport(
    selectedReport,
    range
  );


} else if (
  activeModule ===
  "overtime"
) {

  await generateOvertimeReport(
    selectedReport,
    range
  );


} else if (activeModule === "alerts") {

  await generateSecurityAlertReport(
    selectedReport,
    range
  );

} else if (activeModule === "duty") {

  await generateDutyStationReport(
    selectedReport,
    range
  );

} else if (activeModule === "handoff") {

  await generateShiftHandoffReport(
    selectedReport,
    range
  );

} else {

  throw new Error(
    `${reportDefinitions[activeModule].title} are ready in the interface but still need to be connected to their SecureTrack database module.`
  );

}


      output.hidden =
        false;


      exportButton.disabled =
        false;


      printButton.disabled =
        false;


      output.scrollIntoView({
        behavior:
          "smooth",

        block:
          "start"
      });


    } catch (error) {

      console.error(
        "SecureTrack reporting error:",
        error
      );


      result.className =
        "result show error";


      result.textContent =
        error.message ||
        "The report could not be generated.";


    } finally {

      generateButton.disabled =
        false;


      generateButton.textContent =
        "Generate Report";

    }

  }

// =========================================================
// OVERTIME REPORTS
// =========================================================

async function generateOvertimeReport(
  type,
  range
) {

  const startDate =
    range.start
      .toISOString()
      .slice(0, 10);


  const endDate =
    range.end
      .toISOString()
      .slice(0, 10);


  // =======================================================
  // LOAD OPPORTUNITIES
  // =======================================================

  let opportunityQuery =
    db
      .from(
        "overtime_opportunities"
      )
      .select(`
        id,
        opportunity_date,
        shift_name,
        start_time,
        end_time,
        location,
        total_openings,
        filled_openings,
        requirements,
        notes,
        status,
        created_by_name,
        created_at,
        updated_at
      `)
      .gte(
        "opportunity_date",
        startDate
      )
      .lte(
        "opportunity_date",
        endDate
      )
      .order(
        "opportunity_date",
        {
          ascending: false
        }
      );


  if (
    shift.value &&
    shift.value !== "all"
  ) {

    opportunityQuery =
      opportunityQuery.eq(
        "shift_name",
        shift.value
      );

  }


  const {
    data: opportunityData,
    error: opportunityError
  } =
    await opportunityQuery;


  if (opportunityError) {
    throw opportunityError;
  }


  const opportunities =
    opportunityData || [];


  const opportunityIds =
    opportunities.map(
      item => item.id
    );


  // =======================================================
  // LOAD SIGNUPS FOR THOSE OPPORTUNITIES
  // =======================================================

  let signups = [];


  if (
    opportunityIds.length
  ) {

    const {
      data: signupData,
      error: signupError
    } =
      await db
        .from(
          "overtime_signups"
        )
        .select(`
          id,
          opportunity_id,
          user_id,
          display_name,
          status,
          requested_at,
          reviewed_at,
          reviewed_by_name,
          manager_notes
        `)
        .in(
          "opportunity_id",
          opportunityIds
        )
        .order(
          "requested_at",
          {
            ascending: false
          }
        );


    if (signupError) {
      throw signupError;
    }


    signups =
      signupData || [];

  }


  // =======================================================
  // HELPER MAP
  // =======================================================

  const opportunityMap =
    new Map(
      opportunities.map(
        item => [
          item.id,
          item
        ]
      )
    );


  // =======================================================
  // CALCULATE HOURS
  // =======================================================

  function calculateHours(
    startTime,
    endTime
  ) {

    if (
      !startTime ||
      !endTime
    ) {

      return 0;

    }


    const [
      startHour,
      startMinute
    ] =
      String(
        startTime
      )
        .split(":")
        .map(Number);


    const [
      endHour,
      endMinute
    ] =
      String(
        endTime
      )
        .split(":")
        .map(Number);


    let startMinutes =
      startHour * 60 +
      startMinute;


    let endMinutes =
      endHour * 60 +
      endMinute;


    /*
      Supports an overtime period that
      crosses midnight.
    */

    if (
      endMinutes <
      startMinutes
    ) {

      endMinutes +=
        24 * 60;

    }


    return (
      endMinutes -
      startMinutes
    ) / 60;

  }


  // =======================================================
  // OVERTIME OPPORTUNITIES
  // =======================================================

  if (
    type ===
    "overtime_opportunities"
  ) {

    const totalOpenings =
      opportunities.reduce(
        (sum, item) =>
          sum +
          Number(
            item.total_openings ||
            0
          ),
        0
      );


    const filledOpenings =
      opportunities.reduce(
        (sum, item) =>
          sum +
          Number(
            item.filled_openings ||
            0
          ),
        0
      );


    renderSummary([
      {
        label:
          "Opportunities",

        value:
          opportunities.length
      },

      {
        label:
          "Total Openings",

        value:
          totalOpenings
      },

      {
        label:
          "Filled Openings",

        value:
          filledOpenings
      },

      {
        label:
          "Remaining",

        value:
          Math.max(
            totalOpenings -
            filledOpenings,
            0
          )
      }
    ]);


    renderTable(
      [
        {
          key:
            "date",

          label:
            "Date"
        },

        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "time",

          label:
            "Time"
        },

        {
          key:
            "location",

          label:
            "Location"
        },

        {
          key:
            "filled",

          label:
            "Filled"
        },

        {
          key:
            "status",

          label:
            "Status"
        },

        {
          key:
            "createdBy",

          label:
            "Created By"
        }
      ],

      opportunities.map(
        item => ({

          date:
            item.opportunity_date,

          shift:
            item.shift_name,

          time:
            `${item.start_time || "—"} - ${item.end_time || "—"}`,

          location:
            item.location,

          filled:
            `${item.filled_openings || 0}/${item.total_openings || 0}`,

          status:
            item.status,

          createdBy:
            item.created_by_name ||
            "—"

        })
      )
    );


    return;

  }


  // =======================================================
  // UTILIZED OVERTIME HOURS
  //
  // Count completed overtime assignments.
  // =======================================================

  if (
    type ===
    "overtime_hours"
  ) {

    const utilized =
      signups.filter(
        item =>
          item.status ===
          "completed"
      );


    let totalHours =
      0;


    const rows =
      utilized.map(
        signup => {

          const opportunity =
            opportunityMap.get(
              signup.opportunity_id
            );


          const hours =
            calculateHours(
              opportunity
                ?.start_time,
              opportunity
                ?.end_time
            );


          totalHours +=
            hours;


          return {

            officer:
              signup.display_name ||
              "—",

            date:
              opportunity
                ?.opportunity_date ||
              "—",

            shift:
              opportunity
                ?.shift_name ||
              "—",

            location:
              opportunity
                ?.location ||
              "—",

            time:
              `${opportunity?.start_time || "—"} - ${opportunity?.end_time || "—"}`,

            hours:
              hours
                .toFixed(2)

          };

        }
      );


    const uniqueOfficers =
      new Set(
        utilized
          .map(
            item =>
              item.user_id
          )
          .filter(Boolean)
      ).size;


    renderSummary([
      {
        label:
          "Completed OT Assignments",

        value:
          utilized.length
      },

      {
        label:
          "Utilized Hours",

        value:
          totalHours
            .toFixed(1)
      },

      {
        label:
          "Officers Utilized",

        value:
          uniqueOfficers
      }
    ]);


    renderTable(
      [
        {
          key:
            "officer",

          label:
            "Officer"
        },

        {
          key:
            "date",

          label:
            "Date"
        },

        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "location",

          label:
            "Location"
        },

        {
          key:
            "time",

          label:
            "Time"
        },

        {
          key:
            "hours",

          label:
            "Hours"
        }
      ],

      rows
    );


    return;

  }


  // =======================================================
  // FILLED OVERTIME OPPORTUNITIES
  // =======================================================

  if (
    type ===
    "filled_overtime"
  ) {

    const filled =
      opportunities.filter(
        item =>
          Number(
            item.filled_openings ||
            0
          ) >=
          Number(
            item.total_openings ||
            0
          ) &&
          Number(
            item.total_openings ||
            0
          ) > 0
      );


    renderSummary([
      {
        label:
          "Fully Filled Opportunities",

        value:
          filled.length
      },

      {
        label:
          "Total Opportunities",

        value:
          opportunities.length
      },

      {
        label:
          "Fill Rate",

        value:
          opportunities.length
            ? `${(
                filled.length /
                opportunities.length *
                100
              ).toFixed(1)}%`
            : "0%"
      }
    ]);


    renderTable(
      [
        {
          key:
            "date",

          label:
            "Date"
        },

        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "location",

          label:
            "Location"
        },

        {
          key:
            "filled",

          label:
            "Filled"
        },

        {
          key:
            "status",

          label:
            "Status"
        }
      ],

      filled.map(
        item => ({

          date:
            item.opportunity_date,

          shift:
            item.shift_name,

          location:
            item.location,

          filled:
            `${item.filled_openings}/${item.total_openings}`,

          status:
            item.status

        })
      )
    );


    return;

  }


  // =======================================================
  // UNFILLED OVERTIME OPPORTUNITIES
  // =======================================================

  if (
    type ===
    "unfilled_overtime"
  ) {

    const unfilled =
      opportunities.filter(
        item =>
          Number(
            item.filled_openings ||
            0
          ) <
          Number(
            item.total_openings ||
            0
          )
      );


    const remainingOpenings =
      unfilled.reduce(
        (sum, item) =>
          sum +
          Math.max(
            Number(
              item.total_openings ||
              0
            ) -
            Number(
              item.filled_openings ||
              0
            ),
            0
          ),
        0
      );


    renderSummary([
      {
        label:
          "Unfilled Opportunities",

        value:
          unfilled.length
      },

      {
        label:
          "Remaining Openings",

        value:
          remainingOpenings
      }
    ]);


    renderTable(
      [
        {
          key:
            "date",

          label:
            "Date"
        },

        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "location",

          label:
            "Location"
        },

        {
          key:
            "needed",

          label:
            "Openings Needed"
        },

        {
          key:
            "status",

          label:
            "Status"
        }
      ],

      unfilled.map(
        item => ({

          date:
            item.opportunity_date,

          shift:
            item.shift_name,

          location:
            item.location,

          needed:
            Math.max(
              Number(
                item.total_openings ||
                0
              ) -
              Number(
                item.filled_openings ||
                0
              ),
              0
            ),

          status:
            item.status

        })
      )
    );


    return;

  }


  // =======================================================
  // SHIFTS REQUIRING OVERTIME
  // =======================================================

  if (
    type ===
    "overtime_by_shift"
  ) {

    const shiftMap =
      new Map();


    opportunities.forEach(
      item => {

        const shiftName =
          item.shift_name ||
          "Unknown";


        if (
          !shiftMap.has(
            shiftName
          )
        ) {

          shiftMap.set(
            shiftName,
            {
              shift:
                shiftName,

              opportunities:
                0,

              openings:
                0,

              filled:
                0,

              remaining:
                0
            }
          );

        }


        const row =
          shiftMap.get(
            shiftName
          );


        row.opportunities +=
          1;


        row.openings +=
          Number(
            item.total_openings ||
            0
          );


        row.filled +=
          Number(
            item.filled_openings ||
            0
          );


        row.remaining +=
          Math.max(
            Number(
              item.total_openings ||
              0
            ) -
            Number(
              item.filled_openings ||
              0
            ),
            0
          );

      }
    );


    const rows =
      Array.from(
        shiftMap.values()
      )
        .sort(
          (a, b) =>
            b.opportunities -
            a.opportunities
        );


    renderSummary([
      {
        label:
          "Shifts With OT",

        value:
          rows.length
      },

      {
        label:
          "Total Opportunities",

        value:
          opportunities.length
      }
    ]);


    renderTable(
      [
        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "opportunities",

          label:
            "Opportunities"
        },

        {
          key:
            "openings",

          label:
            "Total Openings"
        },

        {
          key:
            "filled",

          label:
            "Filled"
        },

        {
          key:
            "remaining",

          label:
            "Remaining"
        }
      ],

      rows
    );


    return;

  }


  // =======================================================
  // OFFICER OVERTIME SIGNUP HISTORY
  // =======================================================

  if (
    type ===
    "overtime_by_officer"
  ) {

    let filteredSignups =
      [...signups];


    if (
      officer.value &&
      officer.value !==
      "all"
    ) {

      filteredSignups =
        filteredSignups.filter(
          item =>
            item.user_id ===
            officer.value
        );

    }


    const uniqueOfficers =
      new Set(
        filteredSignups
          .map(
            item =>
              item.user_id
          )
          .filter(Boolean)
      ).size;


    const approved =
      filteredSignups.filter(
        item =>
          item.status ===
          "approved" ||
          item.status ===
          "completed"
      ).length;


    const denied =
      filteredSignups.filter(
        item =>
          item.status ===
          "denied"
      ).length;


    renderSummary([
      {
        label:
          "Signup Requests",

        value:
          filteredSignups.length
      },

      {
        label:
          "Officers",

        value:
          uniqueOfficers
      },

      {
        label:
          "Approved / Completed",

        value:
          approved
      },

      {
        label:
          "Denied",

        value:
          denied
      }
    ]);


    renderTable(
      [
        {
          key:
            "officer",

          label:
            "Officer"
        },

        {
          key:
            "date",

          label:
            "OT Date"
        },

        {
          key:
            "shift",

          label:
            "Shift"
        },

        {
          key:
            "location",

          label:
            "Location"
        },

        {
          key:
            "status",

          label:
            "Request Status"
        },

        {
          key:
            "requested",

          label:
            "Requested"
        },

        {
          key:
            "reviewed",

          label:
            "Reviewed"
        },

        {
          key:
            "reviewedBy",

          label:
            "Reviewed By"
        }
      ],

      filteredSignups.map(
        item => {

          const opportunity =
            opportunityMap.get(
              item.opportunity_id
            );


          return {

            officer:
              item.display_name ||
              "—",

            date:
              opportunity
                ?.opportunity_date ||
              "—",

            shift:
              opportunity
                ?.shift_name ||
              "—",

            location:
              opportunity
                ?.location ||
              "—",

            status:
              item.status,

            requested:
              item.requested_at
                ? new Date(
                    item.requested_at
                  ).toLocaleString()
                : "—",

            reviewed:
              item.reviewed_at
                ? new Date(
                    item.reviewed_at
                  ).toLocaleString()
                : "—",

            reviewedBy:
              item.reviewed_by_name ||
              "—"

          };

        }
      )
    );


    return;

  }


  // =======================================================
  // ON-CAMPUS VS OFF-CAMPUS
  // =======================================================

  if (
    type ===
    "external_overtime"
  ) {

    throw new Error(
      "SecureTrack does not currently store whether an overtime signup is on-campus or off-campus help. Add a home-campus/help-source field before this report can be generated accurately."
    );

  }


  throw new Error(
    "This overtime report is not configured."
  );

}

  // =========================================================
  // GENERATE BUTTON
  // =========================================================

  generateButton.addEventListener(
    "click",
    generateReport
  );



  // =========================================================
  // EXPORT CSV
  // =========================================================

  exportButton.addEventListener(
    "click",
    () => {

      if (
        !currentRows.length ||
        !currentColumns.length
      ) {

        return;

      }


      const csv =
        [

          currentColumns
            .map(
              (column) =>
                `"${column.label.replaceAll(
                  '"',
                  '""'
                )}"`
            )
            .join(","),

          ...currentRows.map(
            (row) =>

              currentColumns
                .map(
                  (column) => {

                    const value =
                      String(
                        row[column.key] ??
                        ""
                      );


                    return `"${value.replaceAll(
                      '"',
                      '""'
                    )}"`;

                  }
                )
                .join(",")

          )

        ].join("\n");


      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `securetrack-${reportType.value}.csv`;


      link.click();


      URL.revokeObjectURL(
        url
      );

    }
  );



  // =========================================================
  // PRINT / PDF
  // =========================================================

  printButton.addEventListener(
    "click",
    () => {

      window.print();

    }
  );



  // =========================================================
  // SIGN OUT
  // =========================================================

  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      STM.signOut
    );



  // =========================================================
  // INITIALIZE
  // =========================================================


  // =========================================================
  // REPORTING CENTER INITIALIZATION
  // =========================================================

  loadReportTypes();

  await loadReportingOfficers();


  // =========================================================
  // NOTIFICATION DEEP-LINK ROUTING
  // =========================================================

  const reportingParams =
    new URLSearchParams(window.location.search);

  const requestedModule =
    reportingParams.get("module");

  const requestedReport =
    reportingParams.get("report");

  const autoGenerate =
    reportingParams.get("run") === "1";

  if (
    requestedModule &&
    requestedReport &&
    Object.prototype.hasOwnProperty.call(
      reportDefinitions,
      requestedModule
    )
  ) {

    const moduleDefinition =
      reportDefinitions[requestedModule];

    const matchingReport =
      moduleDefinition.reports.find(
        item => item.value === requestedReport
      );

    if (matchingReport) {

      activeModule = requestedModule;

      document
        .querySelectorAll(".report-tab")
        .forEach(tab => {
          tab.classList.toggle(
            "active",
            tab.dataset.module === activeModule
          );
        });

      loadReportTypes();

      reportType.value = requestedReport;

      // Only auto-generate modules that
      // currently have implemented report handlers.
      if (
        autoGenerate &&
        (
          activeModule === "devices" ||
          activeModule === "overtime"
        )
      ) {
        await generateReport();
      }
    }
  }

})();
