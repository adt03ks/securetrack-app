(async function () {

  const STM =
    window.SecureTrackManager;

  const manager =
    await STM.requireManager();

  if (!manager) {
    return;
  }


  const db = STM.db;


  const form =
    document.getElementById(
      "reportForm"
    );

  const startInput =
    document.getElementById(
      "startDate"
    );

  const endInput =
    document.getElementById(
      "endDate"
    );

  const typeInput =
    document.getElementById(
      "reportType"
    );

  const generateButton =
    document.getElementById(
      "generateButton"
    );

  const errorBox =
    document.getElementById(
      "reportError"
    );

  const tableBody =
    document.getElementById(
      "reportTableBody"
    );

  const csvButton =
    document.getElementById(
      "csvButton"
    );

  const printButton =
    document.getElementById(
      "printButton"
    );


  let currentReport = [];


  document
    .getElementById(
      "managerName"
    )
    .textContent =
      manager.profile.display_name;


  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      STM.signOut
    );


  // =========================================
  // DATE UTILITIES
  // =========================================


  function inputDate(date) {

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        date.getDate()
      ).padStart(2, "0");


    return `${year}-${month}-${day}`;
  }


  function startOfDate(value) {

    const [
      year,
      month,
      day
    ] =
      value
        .split("-")
        .map(Number);


    return new Date(
      year,
      month - 1,
      day,
      0,
      0,
      0,
      0
    );
  }


  function dayAfter(value) {

    const date =
      startOfDate(value);

    date.setDate(
      date.getDate() + 1
    );

    return date;
  }


  function formatDate(value) {

    if (!value) {
      return "—";
    }


    return new Date(
      value
    ).toLocaleString();
  }


  function humanize(value) {

    return String(
      value || ""
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      );
  }


  // =========================================
  // DEFAULT DATE
  // =========================================


  const today =
    new Date();


  startInput.value =
    inputDate(today);

  endInput.value =
    inputDate(today);


  // =========================================
  // QUICK DATE BUTTONS
  // =========================================


  document
    .querySelectorAll(
      ".report-quick-btn"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const range =
              button.dataset.range;

            const end =
              new Date();

            const start =
              new Date();


            if (
              range !== "today"
            ) {

              const days =
                Number(range);

              start.setDate(
                start.getDate() -
                (days - 1)
              );
            }


            startInput.value =
              inputDate(start);

            endInput.value =
              inputDate(end);


            form.requestSubmit();
          }
        );
      }
    );


  // =========================================
  // LOAD TRANSACTIONS
  // =========================================


  async function loadTransactions(
    startISO,
    endISO
  ) {

    const {
      data,
      error
    } = await db

      .from(
        "device_transactions"
      )

      .select(`
        id,
        action,
        notes,
        occurred_at,

        devices(
          id,
          asset_code,
          manufacturer,
          model
        ),

        employees(
          display_name,
          employee_number
        )
      `)

      .gte(
        "occurred_at",
        startISO
      )

      .lt(
        "occurred_at",
        endISO
      )

      .order(
        "occurred_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    return (
      data || []
    ).map(
      (item) => ({

        id: item.id,

        type:
          "transaction",

        occurred_at:
          item.occurred_at,

        asset:
          item.devices
            ?.asset_code ||
          "Unknown Asset",

        activity:
          humanize(
            item.action
          ),

        employee:
          item.employees
            ? `${
                item.employees
                  .display_name
              } #${
                item.employees
                  .employee_number
              }`
            : "Employee unavailable",

        result:
          item.action ===
            "checkout"
            ? "Checked Out"
            : item.action ===
                "return"
              ? "Available"
              : humanize(
                  item.action
                ),

        details:
          item.notes || ""

      })
    );
  }


  // =========================================
  // LOAD INSPECTIONS
  // =========================================


  async function loadInspections(
    startISO,
    endISO
  ) {

    const {
      data,
      error
    } = await db

      .from(
        "device_inspections"
      )

      .select(`
        id,
        overall_result,
        checklist,
        notes,
        occurred_at,

        devices(
          id,
          asset_code
        ),

        employees(
          display_name,
          employee_number
        )
      `)

      .gte(
        "occurred_at",
        startISO
      )

      .lt(
        "occurred_at",
        endISO
      )

      .order(
        "occurred_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    return (
      data || []
    ).map(
      (item) => ({

        id: item.id,

        type:
          "inspection",

        occurred_at:
          item.occurred_at,

        asset:
          item.devices
            ?.asset_code ||
          "Unknown Asset",

        activity:
          "Inspection",

        employee:
          item.employees
            ? `${
                item.employees
                  .display_name
              } #${
                item.employees
                  .employee_number
              }`
            : "Employee unavailable",

        result:
          humanize(
            item.overall_result
          ),

        details:
          item.notes || ""

      })
    );
  }


  // =========================================
  // LOAD ISSUES
  // =========================================


  async function loadIssues(
    startISO,
    endISO
  ) {

    const {
      data,
      error
    } = await db

      .from(
        "device_issues"
      )

      .select(`
        id,
        category,
        severity,
        description,
        status,
        occurred_at,
        resolved_at,

        devices(
          id,
          asset_code
        ),

        employees(
          display_name,
          employee_number
        )
      `)

      .gte(
        "occurred_at",
        startISO
      )

      .lt(
        "occurred_at",
        endISO
      )

      .order(
        "occurred_at",
        {
          ascending: false
        }
      );


    if (error) {
      throw error;
    }


    return (
      data || []
    ).map(
      (item) => ({

        id: item.id,

        type:
          "issue",

        occurred_at:
          item.occurred_at,

        asset:
          item.devices
            ?.asset_code ||
          "Unknown Asset",

        activity:
          `Issue — ${
            humanize(
              item.category
            )
          }`,

        employee:
          item.employees
            ? `${
                item.employees
                  .display_name
              } #${
                item.employees
                  .employee_number
              }`
            : "Employee unavailable",

        result:
          `${
            humanize(
              item.severity
            )
          } / ${
            humanize(
              item.status
            )
          }`,

        details:
          item.description || ""

      })
    );
  }


  // =========================================
  // RENDER TABLE
  // =========================================


  function renderReport(
    rows
  ) {

    tableBody.innerHTML =
      "";


    if (!rows.length) {

      const row =
        tableBody
          .insertRow();


      const cell =
        row.insertCell();


      cell.colSpan = 6;

      cell.textContent =
        "No SecureTrack activity was recorded during this reporting period.";


      return;
    }


    rows.forEach(
      (item) => {

        const row =
          tableBody
            .insertRow();


        const values = [

          formatDate(
            item.occurred_at
          ),

          item.asset,

          item.activity,

          item.employee,

          item.result,

          item.details || "—"

        ];


        values.forEach(
          (value) => {

            const cell =
              row.insertCell();

            cell.textContent =
              value;

          }
        );
      }
    );
  }


  // =========================================
  // SUMMARY COUNTS
  // =========================================


  function updateSummary(
    rows
  ) {

    document
      .getElementById(
        "totalRecords"
      )
      .textContent =
        rows.length;


    document
      .getElementById(
        "transactionRecords"
      )
      .textContent =
        rows.filter(
          (item) =>
            item.type ===
            "transaction"
        ).length;


    document
      .getElementById(
        "inspectionRecords"
      )
      .textContent =
        rows.filter(
          (item) =>
            item.type ===
            "inspection"
        ).length;


    document
      .getElementById(
        "issueRecords"
      )
      .textContent =
        rows.filter(
          (item) =>
            item.type ===
            "issue"
        ).length;

  }


  // =========================================
  // GENERATE REPORT
  // =========================================


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      errorBox.className =
        "result";

      errorBox.textContent =
        "";


      const startValue =
        startInput.value;

      const endValue =
        endInput.value;


      if (
        !startValue ||
        !endValue
      ) {

        errorBox.className =
          "result show error";

        errorBox.textContent =
          "Please select both a start and end date.";

        return;
      }


      const startDate =
        startOfDate(
          startValue
        );


      const endExclusive =
        dayAfter(
          endValue
        );


      if (
        startDate >=
        endExclusive
      ) {

        errorBox.className =
          "result show error";

        errorBox.textContent =
          "The end date must be the same as or later than the start date.";

        return;
      }


      generateButton.disabled =
        true;

      generateButton.textContent =
        "Generating Report…";


      try {

        const startISO =
          startDate.toISOString();

        const endISO =
          endExclusive.toISOString();


        const reportType =
          typeInput.value;


        let results = [];


        if (
          reportType ===
          "transaction"
        ) {

          results =
            await loadTransactions(
              startISO,
              endISO
            );

        } else if (
          reportType ===
          "inspection"
        ) {

          results =
            await loadInspections(
              startISO,
              endISO
            );

        } else if (
          reportType ===
          "issue"
        ) {

          results =
            await loadIssues(
              startISO,
              endISO
            );

        } else {

          const [
            transactions,
            inspections,
            issues
          ] =
            await Promise.all([

              loadTransactions(
                startISO,
                endISO
              ),

              loadInspections(
                startISO,
                endISO
              ),

              loadIssues(
                startISO,
                endISO
              )

            ]);


          results = [

            ...transactions,
            ...inspections,
            ...issues

          ];
        }


        results.sort(
          (a, b) =>
            new Date(
              b.occurred_at
            ) -
            new Date(
              a.occurred_at
            )
        );


        currentReport =
          results;


        renderReport(
          results
        );


        updateSummary(
          results
        );


        document
          .getElementById(
            "reportTitle"
          )
          .textContent =
            typeInput
              .options[
                typeInput
                  .selectedIndex
              ]
              .text;


        document
          .getElementById(
            "reportPeriod"
          )
          .textContent =
            `${startValue} through ${endValue}`;


        csvButton.disabled =
          results.length === 0;


        printButton.disabled =
          results.length === 0;


      } catch (error) {

        console.error(
          "SecureTrack report error:",
          error
        );


        errorBox.className =
          "result show error";


        errorBox.textContent =
          error.message ||
          "Unable to generate report.";

      } finally {

        generateButton.disabled =
          false;


        generateButton.textContent =
          "Generate Report";

      }

    }
  );


  // =========================================
  // CSV EXPORT
  // =========================================


  csvButton.addEventListener(
    "click",
    () => {

      if (
        !currentReport.length
      ) {
        return;
      }


      const headers = [

        "Date / Time",
        "Asset",
        "Activity",
        "Employee",
        "Result / Status",
        "Details"

      ];


      const csvEscape =
        (value) =>
          `"${String(
            value ?? ""
          ).replaceAll(
            '"',
            '""'
          )}"`;


      const lines = [

        headers
          .map(csvEscape)
          .join(","),

        ...currentReport.map(
          (item) => [

            formatDate(
              item.occurred_at
            ),

            item.asset,

            item.activity,

            item.employee,

            item.result,

            item.details

          ]
            .map(csvEscape)
            .join(",")
        )

      ];


      const blob =
        new Blob(
          [
            lines.join(
              "\n"
            )
          ],
          {
            type:
              "text/csv;charset=utf-8;"
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
        `securetrack-report-${startInput.value}-to-${endInput.value}.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        url
      );

    }
  );


  // =========================================
  // PRINT REPORT
  // =========================================


  printButton.addEventListener(
    "click",
    () => {

      window.print();

    }
  );


})();
