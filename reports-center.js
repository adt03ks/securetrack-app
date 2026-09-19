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

  loadReportTypes();


})();
