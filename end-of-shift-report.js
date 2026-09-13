(async function () {
  "use strict";

  function waitForAuth() {
    if (window.SecureTrackAuth) {
      return Promise.resolve(
        window.SecureTrackAuth
      );
    }

    return new Promise(
      resolve => {

        const handler =
          event => {

            document.removeEventListener(
              "securetrack:authorized",
              handler
            );

            resolve(
              event.detail ||
              window.SecureTrackAuth
            );

          };

        document.addEventListener(
          "securetrack:authorized",
          handler
        );

      }
    );
  }


  const auth =
    await waitForAuth();


  if (
    !auth?.db ||
    !auth?.user
  ) {
    return;
  }


  const db =
    auth.db;

  const profile =
    auth.profile || {};

  const roles =
    Array.isArray(
      auth.roles
    )
      ? auth.roles
      : [];


  const $ =
    id =>
      document.getElementById(
        id
      );


  let currentReport =
    null;


  const el = {

    currentUserDisplay:
      $("currentUserDisplay"),

    signOutButton:
      $("signOutButton"),

    draftControls:
      $("draftControls"),

    openReportForm:
      $("openReportForm"),

    shiftDate:
      $("shiftDate"),

    shiftName:
      $("shiftName"),

    openReportButton:
      $("openReportButton"),

    pageMessage:
      $("pageMessage"),

    reportArea:
      $("reportArea"),

    reportTitle:
      $("reportTitle"),

    reportStatusBadge:
      $("reportStatusBadge"),

    reportCode:
      $("reportCode"),

    outgoingShift:
      $("outgoingShift"),

    shiftWindow:
      $("shiftWindow"),

    receivingShift:
      $("receivingShift"),

    preparedBy:
      $("preparedBy"),

    publishedBy:
      $("publishedBy"),

    publishedAt:
      $("publishedAt"),

    reportVersion:
      $("reportVersion"),

    summaryTotal:
      $("summaryTotal"),

    summaryCodeGreen:
      $("summaryCodeGreen"),

    summaryTaser:
      $("summaryTaser"),

    summaryResolved:
      $("summaryResolved"),

    summaryPending:
      $("summaryPending"),

    summaryUnreviewed:
      $("summaryUnreviewed"),

    summaryCtw:
      $("summaryCtw"),

    summaryInjury:
      $("summaryInjury"),

    summaryStaffing:
      $("summaryStaffing"),

    summaryCarryForward:
      $("summaryCarryForward"),

    incidentList:
      $("incidentList"),

    handoffSummary:
      $("handoffSummary"),

    handoffSummaryPrint:
      $("handoffSummaryPrint"),

    saveSummaryButton:
      $("saveSummaryButton"),

    certPublishedBy:
      $("certPublishedBy"),

    certPublishedAt:
      $("certPublishedAt"),

    acknowledgementList:
      $("acknowledgementList"),

    acknowledgementControls:
      $("acknowledgementControls"),

    acknowledgementNote:
      $("acknowledgementNote"),

    acknowledgeButton:
      $("acknowledgeButton"),

    refreshReportButton:
      $("refreshReportButton"),

    printReportButton:
      $("printReportButton"),

    publishReportButton:
      $("publishReportButton"),

    reportActionMessage:
      $("reportActionMessage"),

    historyFromDate:
      $("historyFromDate"),

    historyToDate:
      $("historyToDate"),

    historyShift:
      $("historyShift"),

    loadHistoryButton:
      $("loadHistoryButton"),

    historyTableBody:
      $("historyTableBody"),

    complianceSection:
      $("complianceSection"),

    complianceFromDate:
      $("complianceFromDate"),

    complianceToDate:
      $("complianceToDate"),

    loadComplianceButton:
      $("loadComplianceButton"),

    complianceTableBody:
      $("complianceTableBody")

  };


  function roleLabel() {

    const order = [

      "admin",

      "director",

      "manager",

      "team_lead",

      "senior_officer",

      "officer"

    ];


    return (

      order.find(
        role =>
          roles.includes(
            role
          )
      )

      ||

      roles[0]

      ||

      "user"

    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );

  }


  function localDateInput(
    date = new Date()
  ) {

    const copy =
      new Date(
        date
      );


    copy.setMinutes(
      copy.getMinutes() -
      copy.getTimezoneOffset()
    );


    return copy
      .toISOString()
      .slice(
        0,
        10
      );

  }


  function addDays(
    value,
    days
  ) {

    const date =
      new Date(
        `${value}T12:00:00`
      );


    date.setDate(
      date.getDate() +
      days
    );


    return localDateInput(
      date
    );

  }


  function formatDate(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(
        `${value}T12:00:00`
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }


    return date.toLocaleDateString(
      "en-US",
      {

        weekday:
          "short",

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric"

      }
    );

  }


  function formatDateTime(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(
        value
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }


    return date.toLocaleString(
      "en-US",
      {

        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",

        hour:
          "numeric",

        minute:
          "2-digit"

      }
    );

  }


  function formatTime(
    value
  ) {

    if (!value) {
      return "—";
    }


    const date =
      new Date(
        value
      );


    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {

      return date.toLocaleTimeString(
        "en-US",
        {

          hour:
            "numeric",

          minute:
            "2-digit"

        }
      );

    }


    const [
      hourText,
      minute
    ] =
      String(
        value
      ).split(
        ":"
      );


    const hour =
      Number(
        hourText
      );


    if (
      !Number.isFinite(
        hour
      )
      ||
      minute == null
    ) {

      return value;

    }


    return (

      `${hour % 12 || 12}:` +

      `${minute} ` +

      `${hour >= 12 ? "PM" : "AM"}`

    );

  }


  function formatWindow(
    start,
    end
  ) {

    if (
      !start ||
      !end
    ) {
      return "—";
    }


    const first =
      new Date(
        start
      );

    const second =
      new Date(
        end
      );


    if (
      Number.isNaN(
        first.getTime()
      )
      ||
      Number.isNaN(
        second.getTime()
      )
    ) {

      return (
        `${start} → ${end}`
      );

    }


    const sameDay =
      first.toDateString() ===
      second.toDateString();


    const left =
      first.toLocaleString(
        "en-US",
        {

          month:
            "short",

          day:
            "numeric",

          hour:
            "numeric",

          minute:
            "2-digit"

        }
      );


    const right =
      second.toLocaleString(
        "en-US",
        {

          ...(
            sameDay
              ? {}
              : {

                  month:
                    "short",

                  day:
                    "numeric"

                }
          ),

          hour:
            "numeric",

          minute:
            "2-digit"

        }
      );


    return (
      `${left} → ${right}`
    );

  }


  function showMessage(
    node,
    text = "",
    type = "info"
  ) {

    if (!node) {
      return;
    }


    node.textContent =
      text;


    node.className =
      text
        ? `message show ${type}`
        : "message";

  }


  function typeLabel(
    type
  ) {

    const labels = {

      code_green:
        "Code Green",

      taser_pull:
        "Taser Pull",

      ctw:
        "CTW",

      officer_injury:
        "Officer Injury",

      insufficient_staffing:
        "Insufficient Staffing"

    };


    return (

      labels[type]

      ||

      String(
        type ||
        "Security Alert"
      )
        .replaceAll(
          "_",
          " "
        )
        .replace(
          /\b\w/g,
          character =>
            character.toUpperCase()
        )

    );

  }


  function statusLabel(
    status
  ) {

    return String(
      status ||
      "unreviewed"
    )
      .replaceAll(
        "_",
        " "
      )
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );

  }


  function detail(
    label,
    value
  ) {

    const box =
      document.createElement(
        "div"
      );


    box.className =
      "detail-item";


    const title =
      document.createElement(
        "span"
      );


    title.textContent =
      label;


    const text =
      document.createElement(
        "strong"
      );


    text.textContent =
      value ||
      "—";


    box.append(
      title,
      text
    );


    return box;

  }


  function officerText(
    incident
  ) {

    if (
      incident?.incident_type ===
      "code_green"
    ) {

      return (
        incident.responding_officers ||
        "—"
      );

    }


    if (
      incident?.incident_type ===
      "taser_pull"
    ) {

      return (
        incident.officers_involved ||
        "—"
      );

    }


    if (
      incident?.incident_type ===
      "officer_injury"
    ) {

      return (
        incident.injured_officer ||
        "—"
      );

    }


    return "—";

  }


  function renderAcknowledgements(
    acknowledgements = []
  ) {

    el.acknowledgementList.innerHTML =
      "";


    if (
      !acknowledgements.length
    ) {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "ack-item";


      item.textContent =
        "No acknowledgment recorded.";


      el.acknowledgementList.appendChild(
        item
      );


      return;

    }


    acknowledgements.forEach(
      acknowledgement => {

        const item =
          document.createElement(
            "div"
          );


        item.className =
          "ack-item";


        const main =
          document.createElement(
            "strong"
          );


        main.textContent =

          `${acknowledgement.acknowledged_by} • ` +

          `${formatDateTime(
            acknowledgement.acknowledged_at
          )}`;


        item.appendChild(
          main
        );


        if (
          acknowledgement.note
        ) {

          const note =
            document.createElement(
              "div"
            );


          note.style.marginTop =
            "4px";


          note.style.color =
            "#9fa8b1";


          note.textContent =
            acknowledgement.note;


          item.appendChild(
            note
          );

        }


        el.acknowledgementList.appendChild(
          item
        );

      }
    );

  }


  async function saveIncidentReview(
    item,
    status,
    notes,
    button
  ) {

    if (
      status ===
        "pending"
      &&
      !notes.trim()
    ) {

      showMessage(

        el.reportActionMessage,

        "Pending items require handoff notes for incoming leadership.",

        "warning"

      );


      return;

    }


    button.disabled =
      true;


    button.textContent =
      "Saving…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "update_end_of_shift_report_item",

          {

            p_report_item_id:
              item.item_id,

            p_resolution_status:
              status,

            p_leadership_notes:
              notes.trim() ||
              null

          }

        );


      if (error) {
        throw error;
      }


      renderReport(
        data
      );


      showMessage(

        el.reportActionMessage,

        "Incident handoff status saved.",

        "success"

      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.reportActionMessage,

        error.message ||
        "Unable to save incident review.",

        "error"

      );

    }
    finally {

      button.disabled =
        false;


      button.textContent =
        "Save Incident Review";

    }

  }


  function renderIncidents(
    items = [],
    editable
  ) {

    el.incidentList.innerHTML =
      "";


    items =
      [
        ...items
      ]
        .sort(
          (
            first,
            second
          ) => {

            const one =
              first.incident ||
              {};

            const two =
              second.incident ||
              {};


            return (

              `${one.occurrence_date || "9999"}T` +
              `${one.occurrence_time || "23:59"}`

            )
              .localeCompare(

                `${two.occurrence_date || "9999"}T` +
                `${two.occurrence_time || "23:59"}`

              );

          }
        );


    if (
      !items.length
    ) {

      const empty =
        document.createElement(
          "div"
        );


      empty.className =
        "empty-state";


      empty.textContent =

        "No Security Leadership Alerts are associated with this shift. " +

        "A zero-incident report may still be published to document completion of the handoff requirement.";


      el.incidentList.appendChild(
        empty
      );


      return;

    }


    items.forEach(
      item => {

        const incident =
          item.incident ||
          {};


        const status =
          item.resolution_status ||
          "unreviewed";


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "incident-card";


        if (
          item.is_carry_forward
        ) {

          card.classList.add(
            "carry-forward"
          );

        }


        const head =
          document.createElement(
            "div"
          );


        head.className =
          "incident-head";


        const left =
          document.createElement(
            "div"
          );


        const type =
          document.createElement(
            "div"
          );


        type.className =
          "incident-type";


        type.textContent =
          typeLabel(
            incident.incident_type
          );


        const when =
          document.createElement(
            "div"
          );


        when.className =
          "incident-time";


        when.textContent =

          `${
            incident.occurrence_date
              ? formatDate(
                  incident.occurrence_date
                )
              : "Date not specified"
          } • ` +

          `${
            incident.occurrence_time
              ? formatTime(
                  incident.occurrence_time
                )
              : "Time not specified"
          }`;


        left.append(
          type,
          when
        );


        if (
          item.is_carry_forward
        ) {

          const carry =
            document.createElement(
              "div"
            );


          carry.className =
            "carry-label";


          carry.textContent =
            "Carry Forward From Prior Shift";


          left.appendChild(
            carry
          );

        }


        const badge =
          document.createElement(
            "span"
          );


        badge.className =
          `status-badge ${status}`;


        badge.textContent =
          statusLabel(
            status
          );


        head.append(
          left,
          badge
        );


        const body =
          document.createElement(
            "div"
          );


        body.className =
          "incident-body";


        const grid =
          document.createElement(
            "div"
          );


        grid.className =
          "incident-detail-grid";


        grid.append(

          detail(
            "Location",
            incident.location
          ),

          detail(
            "Officer(s)",
            officerText(
              incident
            )
          ),

          detail(
            "Reported By",
            incident.submitted_by
          )

        );


        if (
          incident.incident_type ===
          "taser_pull"
        ) {

          grid.appendChild(

            detail(
              "Taser / CEW",
              incident.taser_number
            )

          );

        }


        if (
          incident.incident_type ===
          "ctw"
        ) {

          grid.append(

            detail(
              "Law Enforcement Agency",
              incident.responding_law_enforcement_agency
            ),

            detail(
              "CTW Form",
              incident.ctw_form_completed
                ? "Completed"
                : "Not Completed"
            )

          );

        }


        if (
          incident.incident_type ===
          "officer_injury"
        ) {

          grid.appendChild(

            detail(
              "Incident Report",
              incident.incident_report_completed
                ? "Completed"
                : "Not Completed"
            )

          );

        }


        if (
          incident.incident_type ===
          "insufficient_staffing"
        ) {

          grid.appendChild(

            detail(
              "Officers On Duty",

              incident.total_officers_on_duty !=
              null

                ? String(
                    incident.total_officers_on_duty
                  )

                : "—"
            )

          );

        }


        body.appendChild(
          grid
        );


        if (
          item.prior_handoff_notes
        ) {

          const prior =
            document.createElement(
              "div"
            );


          prior.className =
            "prior-note";


          prior.textContent =

            "Prior shift handoff: " +

            item.prior_handoff_notes;


          body.appendChild(
            prior
          );

        }


        if (
          editable
        ) {

          const review =
            document.createElement(
              "div"
            );


          review.className =
            "review-grid no-print";


          const buttons =
            document.createElement(
              "div"
            );


          buttons.className =
            "review-status-buttons";


          const noteArea =
            document.createElement(
              "div"
            );


          noteArea.className =
            "review-note";


          let chosenStatus =
            status;


          const buttonMap =
            {};


          [

            [
              "resolved",
              "Resolved"
            ],

            [
              "pending",
              "Pending / Carry Forward"
            ],

            [
              "unreviewed",
              "Reset to Unreviewed"
            ]

          ].forEach(
            (
              [
                value,
                label
              ]
            ) => {

              const button =
                document.createElement(
                  "button"
                );


              button.type =
                "button";


              button.className =
                `review-status-button ${value}`;


              button.textContent =
                label;


              if (
                value ===
                chosenStatus
              ) {

                button.classList.add(
                  "active"
                );

              }


              button.addEventListener(
                "click",
                () => {

                  chosenStatus =
                    value;


                  Object.values(
                    buttonMap
                  )
                    .forEach(
                      current =>
                        current.classList.remove(
                          "active"
                        )
                    );


                  button.classList.add(
                    "active"
                  );

                }
              );


              buttonMap[value] =
                button;


              buttons.appendChild(
                button
              );

            }
          );


          const label =
            document.createElement(
              "label"
            );


          label.textContent =
            "Leadership Handoff Notes";


          label.style.cssText =

            "display:block;" +

            "margin-bottom:6px;" +

            "font-size:10px;" +

            "font-weight:800;" +

            "color:#c7cdd3";


          const note =
            document.createElement(
              "textarea"
            );


          note.value =
            item.leadership_notes ||
            "";


          note.placeholder =

            "Document resolution or provide clear instructions for the incoming shift.";


          const save =
            document.createElement(
              "button"
            );


          save.type =
            "button";


          save.className =
            "secondary-button";


          save.textContent =
            "Save Incident Review";


          save.style.marginTop =
            "8px";


          save.addEventListener(
            "click",
            () =>

              saveIncidentReview(

                item,

                chosenStatus,

                note.value,

                save

              )
          );


          const meta =
            document.createElement(
              "div"
            );


          meta.className =
            "review-meta";


          meta.textContent =
            item.reviewed_by_name

              ? (
                  `Last reviewed by ` +
                  `${item.reviewed_by_name}` +
                  `${
                    item.reviewed_at
                      ? ` • ${formatDateTime(
                          item.reviewed_at
                        )}`
                      : ""
                  }`
                )

              : "Not yet reviewed by shift leadership.";


          noteArea.append(

            label,

            note,

            save,

            meta

          );


          review.append(

            buttons,

            noteArea

          );


          body.appendChild(
            review
          );

        }
        else {

          const notes =
            document.createElement(
              "div"
            );


          notes.className =
            "prior-note";


          notes.style.cssText =

            "border-left-color:#66717b;" +

            "background:rgba(125,135,145,.07);" +

            "color:#d6dce1";


          notes.textContent =
            item.leadership_notes

              ? (
                  "Leadership Notes: " +
                  item.leadership_notes
                )

              : "Leadership Notes: No additional notes recorded.";


          body.appendChild(
            notes
          );

        }


        const printNote =
          document.createElement(
            "div"
          );


        printNote.className =
          "print-notes";


        printNote.textContent =
          item.leadership_notes

            ? (
                "Leadership Notes: " +
                item.leadership_notes
              )

            : "Leadership Notes: —";


        body.appendChild(
          printNote
        );


        card.append(
          head,
          body
        );


        el.incidentList.appendChild(
          card
        );

      }
    );

  }


  async function refreshAcknowledgementEligibility() {

    el.acknowledgementControls.hidden =
      true;


    const report =
      currentReport?.report;


    if (
      !report ||
      report.status !==
        "published"
    ) {

      return;

    }


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "can_acknowledge_end_of_shift_report",

          {
            p_report_id:
              report.report_id
          }

        );


      if (error) {
        throw error;
      }


      const alreadyAcknowledged =
        (
          currentReport
            .acknowledgements ||
          []
        )
          .some(
            acknowledgement =>
              acknowledgement
                .acknowledged_by ===
              profile.display_name
          );


      el.acknowledgementControls.hidden =
        !(
          data === true &&
          !alreadyAcknowledged
        );

    }
    catch (
      error
    ) {

      console.error(
        "Acknowledgment eligibility:",
        error
      );

    }

  }


  function renderReport(
    data
  ) {

    if (
      !data?.report
    ) {
      return;
    }


    currentReport =
      data;


    const report =
      data.report;


    const summary =
      data.summary ||
      {};


    const editable =
      report.status ===
        "draft"
      &&
      report.can_edit ===
        true;


    el.reportArea.hidden =
      false;


    el.reportTitle.textContent =

      `${formatDate(
        report.shift_date
      )} • ` +

      `${report.shift_name} Shift`;


    el.reportStatusBadge.textContent =
      statusLabel(
        report.status
      );


    el.reportStatusBadge.className =
      `status-badge ${report.status}`;


    el.reportCode.textContent =
      report.report_code ||
      report.report_id ||
      "—";


    el.outgoingShift.textContent =

      `${report.shift_name} • ` +

      `${formatDate(
        report.shift_date
      )}`;


    el.shiftWindow.textContent =
      formatWindow(

        report.shift_start,

        report.shift_end

      );


    el.receivingShift.textContent =
      report.receiving_shift_name

        ? (
            `${report.receiving_shift_name} • ` +

            `${formatDate(
              report.receiving_shift_date
            )}`
          )

        : "Not determined";


    el.preparedBy.textContent =
      report.created_by ||
      "—";


    el.publishedBy.textContent =
      report.published_by ||
      "Not yet published";


    el.publishedAt.textContent =
      formatDateTime(
        report.published_at
      );


    el.reportVersion.textContent =
      String(
        report.report_version ||
        1
      );


    el.summaryTotal.textContent =
      summary.total_alerts ??
      0;


    el.summaryCodeGreen.textContent =
      summary.code_greens ??
      0;


    el.summaryTaser.textContent =
      summary.taser_pulls ??
      0;


    el.summaryResolved.textContent =
      summary.resolved ??
      0;


    el.summaryPending.textContent =
      summary.pending ??
      0;


    el.summaryUnreviewed.textContent =
      summary.unreviewed ??
      0;


    el.summaryCtw.textContent =
      summary.ctw ??
      0;


    el.summaryInjury.textContent =
      summary.officer_injuries ??
      0;


    el.summaryStaffing.textContent =
      summary.insufficient_staffing ??
      0;


    el.summaryCarryForward.textContent =
      summary.carry_forward ??
      0;


    el.handoffSummary.value =
      report.handoff_summary ||
      "";


    el.handoffSummary.disabled =
      !editable;


    el.handoffSummaryPrint.textContent =
      report.handoff_summary ||
      "No overall shift summary recorded.";


    el.saveSummaryButton.hidden =
      !editable;


    el.certPublishedBy.textContent =
      report.published_by ||
      "Not yet published";


    el.certPublishedAt.textContent =
      formatDateTime(
        report.published_at
      );


    el.publishReportButton.hidden =
      !editable;


    el.publishReportButton.disabled =
      !editable;


    renderIncidents(

      data.items ||
      [],

      editable

    );


    renderAcknowledgements(

      data.acknowledgements ||
      []

    );


    refreshAcknowledgementEligibility();


    el.reportArea.scrollIntoView(
      {

        behavior:
          "smooth",

        block:
          "start"

      }
    );

  }


  async function loadReportById(
    reportId
  ) {

    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "get_end_of_shift_report",

          {
            p_report_id:
              reportId
          }

        );


      if (error) {
        throw error;
      }


      renderReport(
        data
      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.reportActionMessage,

        error.message ||
        "Unable to load report.",

        "error"

      );

    }

  }


  async function openReport() {

    showMessage(
      el.pageMessage
    );


    if (
      !el.shiftDate.value ||
      !el.shiftName.value
    ) {

      showMessage(

        el.pageMessage,

        "Select the shift start date and shift name.",

        "warning"

      );


      return;

    }


    el.openReportButton.disabled =
      true;


    el.openReportButton.textContent =
      "Opening…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "open_end_of_shift_report",

          {

            p_shift_date:
              el.shiftDate.value,

            p_shift_name:
              el.shiftName.value

          }

        );


      if (error) {
        throw error;
      }


      renderReport(
        data
      );


      showMessage(

        el.pageMessage,

        "End-of-Shift report opened successfully.",

        "success"

      );


      await loadHistory();

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.pageMessage,

        error.message ||
        "Unable to open report.",

        "error"

      );

    }
    finally {

      el.openReportButton.disabled =
        false;


      el.openReportButton.textContent =
        "Open Report";

    }

  }


  async function saveSummary() {

    if (
      !currentReport
        ?.report
        ?.report_id
    ) {
      return;
    }


    el.saveSummaryButton.disabled =
      true;


    el.saveSummaryButton.textContent =
      "Saving…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "save_end_of_shift_handoff_summary",

          {

            p_report_id:
              currentReport
                .report
                .report_id,

            p_handoff_summary:
              el.handoffSummary
                .value
                .trim()
              ||
              null

          }

        );


      if (error) {
        throw error;
      }


      renderReport(
        data
      );


      showMessage(

        el.reportActionMessage,

        "Overall shift summary saved.",

        "success"

      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.reportActionMessage,

        error.message ||
        "Unable to save summary.",

        "error"

      );

    }
    finally {

      el.saveSummaryButton.disabled =
        false;


      el.saveSummaryButton.textContent =
        "Save Summary";

    }

  }


  async function publishReport() {

    const report =
      currentReport?.report;


    if (
      !report?.report_id
    ) {
      return;
    }


    const unreviewed =
      Number(
        currentReport
          ?.summary
          ?.unreviewed ||
        0
      );


    const pending =
      Number(
        currentReport
          ?.summary
          ?.pending ||
        0
      );


    const prompt =
      unreviewed

        ? (
            `This report still has ${unreviewed} ` +
            `unreviewed alert(s). Publication will be blocked until all are reviewed.`
          )

        : pending

          ? (
              `This report has ${pending} pending item(s). ` +
              `Publish and hand them forward to ` +
              `${report.receiving_shift_name || "the receiving shift"}?`
            )

          : "Publish and permanently lock this End-of-Shift report?";


    if (
      !window.confirm(
        prompt
      )
    ) {
      return;
    }


    el.publishReportButton.disabled =
      true;


    el.publishReportButton.textContent =
      "Publishing…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "publish_end_of_shift_report",

          {
            p_report_id:
              report.report_id
          }

        );


      if (error) {
        throw error;
      }


      renderReport(
        data
      );


      showMessage(

        el.reportActionMessage,

        "Report published and permanently locked.",

        "success"

      );


      await loadHistory();


      if (
        !el.complianceSection.hidden
      ) {

        await loadCompliance();

      }

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.reportActionMessage,

        error.message ||
        "Unable to publish report.",

        "error"

      );

    }
    finally {

      el.publishReportButton.disabled =
        false;


      el.publishReportButton.textContent =
        "Publish End-of-Shift Report";

    }

  }


  async function acknowledge() {

    const reportId =
      currentReport
        ?.report
        ?.report_id;


    if (!reportId) {
      return;
    }


    if (
      !window.confirm(
        "Acknowledge that you received and reviewed this handoff?"
      )
    ) {
      return;
    }


    el.acknowledgeButton.disabled =
      true;


    el.acknowledgeButton.textContent =
      "Recording Receipt…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "acknowledge_end_of_shift_report",

          {

            p_report_id:
              reportId,

            p_acknowledgment_note:
              el.acknowledgementNote
                .value
                .trim()
              ||
              null

          }

        );


      if (error) {
        throw error;
      }


      el.acknowledgementNote.value =
        "";


      renderReport(
        data
      );


      showMessage(

        el.reportActionMessage,

        "Handoff receipt acknowledged and timestamped.",

        "success"

      );


      await loadHistory();


      if (
        !el.complianceSection.hidden
      ) {

        await loadCompliance();

      }

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      showMessage(

        el.reportActionMessage,

        error.message ||
        "Unable to acknowledge handoff.",

        "error"

      );

    }
    finally {

      el.acknowledgeButton.disabled =
        false;


      el.acknowledgeButton.textContent =
        "Acknowledge Receipt";

    }

  }


  function addCell(
    row,
    text,
    className = ""
  ) {

    const cell =
      document.createElement(
        "td"
      );


    cell.textContent =
      text ??
      "—";


    if (
      className
    ) {

      cell.className =
        className;

    }


    row.appendChild(
      cell
    );

  }


  async function loadHistory() {

    el.loadHistoryButton.disabled =
      true;


    el.loadHistoryButton.textContent =
      "Loading…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "get_end_of_shift_report_history",

          {

            p_from_date:
              el.historyFromDate.value ||
              null,

            p_to_date:
              el.historyToDate.value ||
              null,

            p_shift_name:
              el.historyShift.value ||
              null

          }

        );


      if (error) {
        throw error;
      }


      el.historyTableBody.innerHTML =
        "";


      if (
        !data?.length
      ) {

        const row =
          document.createElement(
            "tr"
          );


        const cell =
          document.createElement(
            "td"
          );


        cell.colSpan =
          8;


        cell.className =
          "empty-state";


        cell.textContent =
          "No End-of-Shift reports found.";


        row.appendChild(
          cell
        );


        el.historyTableBody.appendChild(
          row
        );


        return;

      }


      data.forEach(
        report => {

          const row =
            document.createElement(
              "tr"
            );


          row.className =
            "history-row";


          row.title =
            "Open report";


          addCell(
            row,
            report.report_code ||
            "—"
          );


          addCell(

            row,

            `${formatDate(
              report.shift_date
            )} • ` +

            `${report.shift_name}`

          );


          addCell(
            row,
            String(
              report.total_alerts ??
              0
            )
          );


          addCell(
            row,
            String(
              report.resolved_count ??
              0
            )
          );


          addCell(
            row,
            String(
              report.pending_count ??
              0
            )
          );


          addCell(
            row,
            String(
              report.acknowledgment_count ??
              0
            )
          );


          addCell(

            row,

            report.published_by_name

            ||

            report.created_by_name

            ||

            "—"

          );


          addCell(

            row,

            report.report_status ===
              "published"

              ? formatDateTime(
                  report.published_at
                )

              : "Draft"

          );


          row.addEventListener(
            "click",
            () =>

              loadReportById(
                report.report_id
              )
          );


          el.historyTableBody.appendChild(
            row
          );

        }
      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      el.historyTableBody.innerHTML =
        `<tr><td colspan="8" class="empty-state"></td></tr>`;


      el.historyTableBody
        .querySelector(
          "td"
        )
        .textContent =
          error.message ||
          "Unable to load history.";

    }
    finally {

      el.loadHistoryButton.disabled =
        false;


      el.loadHistoryButton.textContent =
        "Load Report History";

    }

  }


  function complianceClass(
    status
  ) {

    if (
      status ===
      "PUBLISHED"
    ) {

      return "compliance-good";

    }


    if (
      status ===
      "OVERDUE - DRAFT"
    ) {

      return "compliance-draft";

    }


    if (
      status ===
      "MISSING"
    ) {

      return "compliance-missing";

    }


    return "";

  }


  async function loadCompliance() {

    if (
      el.complianceSection.hidden
    ) {
      return;
    }


    el.loadComplianceButton.disabled =
      true;


    el.loadComplianceButton.textContent =
      "Loading…";


    try {

      const {
        data,
        error
      } =
        await db.rpc(

          "get_end_of_shift_compliance",

          {

            p_from_date:
              el.complianceFromDate.value,

            p_to_date:
              el.complianceToDate.value

          }

        );


      if (error) {
        throw error;
      }


      el.complianceTableBody.innerHTML =
        "";


      if (
        !data?.length
      ) {

        const row =
          document.createElement(
            "tr"
          );


        const cell =
          document.createElement(
            "td"
          );


        cell.colSpan =
          7;


        cell.className =
          "empty-state";


        cell.textContent =
          "No scheduled shifts found.";


        row.appendChild(
          cell
        );


        el.complianceTableBody.appendChild(
          row
        );


        return;

      }


      data.forEach(
        record => {

          const row =
            document.createElement(
              "tr"
            );


          addCell(

            row,

            `${formatDate(
              record.shift_date
            )} • ` +

            `${record.shift_name}`

          );


          addCell(

            row,

            formatWindow(

              record.shift_start,

              record.shift_end

            )

          );


          addCell(

            row,

            record.report_code

            ||

            (
              record.report_status ===
              "draft"

                ? "Draft exists"

                : "—"
            )

          );


          addCell(

            row,

            record.published_late

              ? (
                  `${record.compliance_status} • LATE`
                )

              : record.compliance_status,

            complianceClass(
              record.compliance_status
            )

          );


          addCell(

            row,

            record.published_by_name ||
            "—"

          );


          addCell(

            row,

            formatDateTime(
              record.published_at
            )

          );


          addCell(

            row,

            `${record.acknowledgment_count ?? 0} acknowledgment(s)`

          );


          if (

            record.report_id

            &&

            record.report_status ===
            "published"

          ) {

            row.className =
              "history-row";


            row.title =
              "Open published report";


            row.addEventListener(
              "click",
              () =>

                loadReportById(
                  record.report_id
                )
            );

          }


          el.complianceTableBody.appendChild(
            row
          );

        }
      );

    }
    catch (
      error
    ) {

      console.error(
        error
      );


      el.complianceTableBody.innerHTML =
        `<tr><td colspan="7" class="empty-state"></td></tr>`;


      el.complianceTableBody
        .querySelector(
          "td"
        )
        .textContent =
          error.message ||
          "Unable to load compliance.";

    }
    finally {

      el.loadComplianceButton.disabled =
        false;


      el.loadComplianceButton.textContent =
        "Review Compliance";

    }

  }


  el.openReportForm
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        openReport();

      }
    );


  el.saveSummaryButton
    ?.addEventListener(
      "click",
      saveSummary
    );


  el.refreshReportButton
    ?.addEventListener(
      "click",
      () => {

        if (
          currentReport
            ?.report
            ?.report_id
        ) {

          loadReportById(
            currentReport
              .report
              .report_id
          );

        }

      }
    );


  el.publishReportButton
    ?.addEventListener(
      "click",
      publishReport
    );


  el.acknowledgeButton
    ?.addEventListener(
      "click",
      acknowledge
    );


  el.loadHistoryButton
    ?.addEventListener(
      "click",
      loadHistory
    );


  el.loadComplianceButton
    ?.addEventListener(
      "click",
      loadCompliance
    );


  el.printReportButton
    ?.addEventListener(
      "click",
      () => {

        el.handoffSummaryPrint.textContent =

          el.handoffSummary
            .value
            .trim()

          ||

          currentReport
            ?.report
            ?.handoff_summary

          ||

          "No overall shift summary recorded.";


        window.print();

      }
    );


  el.signOutButton
    ?.addEventListener(
      "click",
      async () => {

        await db.auth.signOut();

        window.location.replace(
          "login.html"
        );

      }
    );


  const canDraft =
    roles.some(
      role =>
        [
          "senior_officer",
          "team_lead",
          "director",
          "admin"
        ]
          .includes(
            role
          )
    );


  const canCompliance =
    roles.some(
      role =>
        [
          "manager",
          "director",
          "admin"
        ]
          .includes(
            role
          )
    );


  el.draftControls.hidden =
    !canDraft;


  el.complianceSection.hidden =
    !canCompliance;


  el.currentUserDisplay.textContent =

    `${
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User"
    } • ` +

    roleLabel();


  const today =
    localDateInput();


  el.shiftDate.value =
    today;


  el.historyToDate.value =
    today;


  el.historyFromDate.value =
    addDays(
      today,
      -14
    );


  el.complianceToDate.value =
    today;


  el.complianceFromDate.value =
    addDays(
      today,
      -7
    );


  await loadHistory();


  if (
    canCompliance
  ) {

    await loadCompliance();

  }

})();
