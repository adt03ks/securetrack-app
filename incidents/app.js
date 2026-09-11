(async function () {
  "use strict";

  function waitForAuth() {
    if (window.SecureTrackAuth) {
      return Promise.resolve(window.SecureTrackAuth);
    }

    return new Promise(resolve => {
      const handler = event => {
        document.removeEventListener("securetrack:authorized", handler);
        resolve(event.detail || window.SecureTrackAuth);
      };

      document.addEventListener("securetrack:authorized", handler);
    });
  }

  const auth = await waitForAuth();

  if (!auth?.db || !auth?.user) {
    return;
  }

  const db = auth.db;
  const profile = auth.profile || {};
  const roles = auth.roles || [];

  const form = document.getElementById("incident-form");
  const incidentType = document.getElementById("incident_type");
  const detailsSection = document.getElementById("incident-details-section");
  const dispatchSection = document.getElementById("dispatch-section");
  const submitSection = document.getElementById("submit-section");
  const dynamicFields = document.getElementById("dynamic-fields");
  const incidentHelp = document.getElementById("incident-help");
  const submitButton = document.getElementById("submit-button");
  const spinner = document.querySelector(".button-spinner");
  const systemMessage = document.getElementById("system-message");
  const successPanel = document.getElementById("success-panel");
  const successHeading = document.getElementById("success-heading");
  const successMessage = document.getElementById("success-message");
  const incidentReference = document.getElementById("incident-reference");
  const newReportButton = document.getElementById("new-report-button");
  const signOutButton = document.getElementById("sign-out-button");
  const signedInUser = document.getElementById("signed-in-user");
  const signedInRole = document.getElementById("signed-in-role");
  const submittedByDisplay = document.getElementById("submitted-by-display");

  const displayName =
    profile.display_name ||
    auth.user.email ||
    "SecureTrack User";

  signedInUser.textContent = displayName;
  submittedByDisplay.textContent = displayName;
  signedInRole.textContent = primaryRole(roles);

  const fieldTemplates = {
    code_green: {
      help: "Document the Code Green occurrence and responding personnel.",
      fields: [
        dateField(),
        timeField(),
        textField("location", "Location", true, "Building, unit, room, or area"),
        textareaField(
          "patient_information",
          "Patient Information",
          true,
          "Use only the minimum necessary information permitted by policy.",
          "full-width",
          "Protected detail remains in SecureTrack and is not copied into the ntfy push alert."
        ),
        textField("responding_officers", "Responding Officer(s)", true, "Separate multiple names with commas", "full-width")
      ]
    },

    taser_pull: {
      help: "Document the Taser Pull and identify the deploying officer and device.",
      fields: [
        dateField(),
        timeField(),
        textField("location", "Location", true, "Building, unit, room, or area"),
        textField("deploying_officer", "Deploying Officer", true, "Officer name"),
        textField("taser_number", "Taser Number", true, "Asset or device number")
      ]
    },

    ctw: {
      help: "Document the Criminal Trespass Warning and law-enforcement response.",
      fields: [
        dateField(),
        timeField(),
        textField("location", "Location", true, "Building, unit, room, or area"),
        textField("trespass_subject", "Trespass Subject", true, "Subject name or approved identifier"),
        textareaField("reported_damages", "Reported Damages", true, "Enter None if no damages were reported.", "full-width"),
        textField("responding_law_enforcement_agency", "Responding Law Enforcement Agency", true, "Agency name", "full-width"),
        checkboxField("ctw_form_completed", "CTW form completed")
      ]
    },

    officer_injury: {
      help: "Document the officer injury and required report status.",
      fields: [
        dateField(),
        timeField(),
        textField("location", "Location", true, "Building, unit, room, or area"),
        textField("officer_name", "Officer Name", true, "Injured officer"),
        checkboxField("incident_report_completed", "Incident report completed")
      ]
    },

    insufficient_staffing: {
      help: "Record the staffing level currently on duty.",
      fields: [
        numberField(
          "total_officers_on_duty",
          "Total Officers on Duty",
          true,
          0,
          200,
          "Enter the total number of officers currently on duty"
        )
      ]
    }
  };

  function primaryRole(list) {
    const order = ["admin", "manager", "dispatcher"];
    const found = order.find(role => list.includes(role));
    return (found || list[0] || "user").replaceAll("_", " ");
  }

  function dateField() {
    return fieldHtml({
      name: "occurrence_date",
      label: "Date of Occurrence",
      type: "date",
      required: true
    });
  }

  function timeField() {
    return fieldHtml({
      name: "occurrence_time",
      label: "Time of Occurrence",
      type: "time",
      required: true
    });
  }

  function textField(
    name,
    label,
    required = false,
    placeholder = "",
    className = ""
  ) {
    return fieldHtml({
      name,
      label,
      type: "text",
      required,
      placeholder,
      className,
      maxlength: 180
    });
  }

  function numberField(
    name,
    label,
    required,
    min,
    max,
    placeholder = ""
  ) {
    return fieldHtml({
      name,
      label,
      type: "number",
      required,
      placeholder,
      min,
      max
    });
  }

  function textareaField(
    name,
    label,
    required = false,
    placeholder = "",
    className = "",
    hint = ""
  ) {
    const requiredMark = required
      ? '<span aria-hidden="true">*</span>'
      : '<span class="optional">Optional</span>';

    return `
      <div class="field ${className}">
        <label for="${name}">${label} ${requiredMark}</label>
        <textarea
          id="${name}"
          name="${name}"
          rows="4"
          maxlength="1200"
          ${required ? "required" : ""}
          placeholder="${escapeAttr(placeholder)}"
        ></textarea>
        ${hint ? `<p class="field-hint">${escapeHtml(hint)}</p>` : ""}
        <p class="field-error" data-error-for="${name}"></p>
      </div>`;
  }

  function checkboxField(name, label) {
    return `
      <div class="field full-width">
        <div class="checkbox-row">
          <input id="${name}" name="${name}" type="checkbox" />
          <label for="${name}">${label}</label>
        </div>
      </div>`;
  }

  function fieldHtml({
    name,
    label,
    type,
    required = false,
    placeholder = "",
    className = "",
    maxlength,
    min,
    max
  }) {
    const requiredMark = required
      ? '<span aria-hidden="true">*</span>'
      : '<span class="optional">Optional</span>';

    const attrs = [
      required ? "required" : "",
      maxlength ? `maxlength="${maxlength}"` : "",
      min !== undefined ? `min="${min}"` : "",
      max !== undefined ? `max="${max}"` : ""
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div class="field ${className}">
        <label for="${name}">${label} ${requiredMark}</label>
        <input
          id="${name}"
          name="${name}"
          type="${type}"
          ${attrs}
          placeholder="${escapeAttr(placeholder)}"
        />
        <p class="field-error" data-error-for="${name}"></p>
      </div>`;
  }

  incidentType.addEventListener("change", () => {
    clearSystemMessage();
    clearErrors();

    const selected = incidentType.value;

    if (!selected || !fieldTemplates[selected]) {
      dynamicFields.innerHTML = "";
      detailsSection.classList.add("hidden");
      dispatchSection.classList.add("hidden");
      submitSection.classList.add("hidden");
      return;
    }

    const template = fieldTemplates[selected];

    incidentHelp.textContent = template.help;
    dynamicFields.innerHTML = template.fields.join("");
    detailsSection.classList.remove("hidden");
    dispatchSection.classList.remove("hidden");
    submitSection.classList.remove("hidden");

    if (selected !== "insufficient_staffing") {
      setDefaultOccurrenceDateTime();
    }

    detailsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  function setDefaultOccurrenceDateTime() {
    const now = new Date();
    const dateInput = document.getElementById("occurrence_date");
    const timeInput = document.getElementById("occurrence_time");

    const localDate =
      new Date(
        now.getTime() -
        now.getTimezoneOffset() * 60000
      );

    if (dateInput && !dateInput.value) {
      dateInput.value =
        localDate.toISOString().slice(0,10);
    }

    if (timeInput && !timeInput.value) {
      timeInput.value =
        localDate.toISOString().slice(11,16);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    clearSystemMessage();
    clearErrors();

    if (!validateForm()) {
      showSystemMessage(
        "Please complete the highlighted required fields before submitting.",
        "error"
      );

      const firstInvalid =
        form.querySelector('[aria-invalid="true"]');

      if (firstInvalid) {
        firstInvalid.focus();
      }

      return;
    }

    const payload = collectPayload();
    setSubmitting(true);

    try {
      const incidentResult =
        await saveIncident(payload);

      let pushResult = {
        ok: false,
        notification_status: "not_attempted"
      };

      try {
        pushResult =
          await sendNtfyPush(
            incidentResult.incident_id
          );

      } catch (pushError) {
        console.error(
          "SecureTrack ntfy push error:",
          pushError
        );

        pushResult = {
          ok: false,
          notification_status: "failed",
          error:
            pushError.message ||
            "Push delivery was not confirmed."
        };
      }

      showSuccess(
        incidentResult,
        pushResult
      );

    } catch (error) {
      console.error(
        "SecureTrack incident submission error:",
        error
      );

      showSystemMessage(
        "The incident could not be saved. Do not rely on this form for notification. Use your approved backup notification process and contact a supervisor directly.",
        "error"
      );

    } finally {
      setSubmitting(false);
    }
  });

  function collectPayload() {
    const formData = new FormData(form);
    const data = Object.fromEntries(
      formData.entries()
    );

    return {
      p_incident_type:
        data.incident_type,

      p_occurrence_date:
        data.occurrence_date || null,

      p_occurrence_time:
        data.occurrence_time || null,

      p_location:
        data.location || null,

      p_patient_information:
        data.patient_information || null,

      p_responding_officers:
        data.responding_officers || null,

      p_deploying_officer:
        data.deploying_officer || null,

      p_taser_number:
        data.taser_number || null,

      p_trespass_subject:
        data.trespass_subject || null,

      p_reported_damages:
        data.reported_damages || null,

      p_responding_law_enforcement_agency:
        data.responding_law_enforcement_agency || null,

      p_ctw_form_completed:
        document.getElementById("ctw_form_completed")?.checked || false,

      p_incident_report_completed:
        document.getElementById("incident_report_completed")?.checked || false,

      p_officer_name:
        data.officer_name || null,

      p_total_officers_on_duty:
        data.total_officers_on_duty !== undefined &&
        data.total_officers_on_duty !== ""
          ? Number(data.total_officers_on_duty)
          : null,

      p_dispatch_unit:
        data.dispatch_unit || null,

      p_additional_notes:
        data.additional_notes || null,

      p_client_submitted_at:
        new Date().toISOString()
    };
  }

  async function saveIncident(payload) {
    const { data, error } =
      await db.rpc(
        "submit_security_incident",
        payload
      );

    if (error) {
      throw error;
    }

    if (!data?.ok || !data?.incident_id) {
      throw new Error(
        "SecureTrack did not return an incident reference."
      );
    }

    return data;
  }

  async function sendNtfyPush(incidentId) {
    const { data, error } =
      await db.functions.invoke(
        "send-security-ntfy",
        {
          body: {
            incident_id: incidentId
          }
        }
      );

    if (error) {
      throw error;
    }

    if (!data?.ok) {
      throw new Error(
        data?.error ||
        "ntfy delivery was not confirmed."
      );
    }

    return data;
  }

  function validateForm() {
    let valid = true;

    const visibleRequired = [
      ...form.querySelectorAll("[required]")
    ].filter(
      element =>
        !element.closest(".hidden")
    );

    for (const field of visibleRequired) {
      const isValid =
        field.checkValidity() &&
        String(field.value || "").trim() !== "";

      field.setAttribute(
        "aria-invalid",
        isValid ? "false" : "true"
      );

      const error =
        document.querySelector(
          `[data-error-for="${field.name}"]`
        );

      if (error) {
        error.textContent =
          isValid ? "" : "Required field";
      }

      if (!isValid) {
        valid = false;
      }
    }

    return valid;
  }

  function clearErrors() {
    document
      .querySelectorAll('[aria-invalid="true"]')
      .forEach(element =>
        element.removeAttribute("aria-invalid")
      );

    document
      .querySelectorAll(".field-error")
      .forEach(element => {
        element.textContent = "";
      });
  }

  function setSubmitting(isSubmitting) {
    submitButton.disabled = isSubmitting;

    spinner.classList.toggle(
      "hidden",
      !isSubmitting
    );

    submitButton
      .querySelector(".button-label")
      .textContent = isSubmitting
        ? "Saving Incident & Sending Push..."
        : "Submit Incident & Send Push Alert";
  }

  function showSuccess(
    incidentResult,
    pushResult
  ) {
    form.classList.add("hidden");
    systemMessage.classList.add("hidden");
    successPanel.classList.remove("hidden");

    const pushSent =
      pushResult?.notification_status === "sent";

    if (pushSent) {
      successHeading.textContent =
        "Incident saved and push alert sent";

      successMessage.textContent =
        "The incident was recorded in SecureTrack and the ntfy operational alert confirmed delivery to the configured topic.";

    } else {
      successHeading.textContent =
        "Incident saved — push not confirmed";

      successMessage.textContent =
        "The incident is safely recorded in SecureTrack, but ntfy delivery was not confirmed. Follow your approved backup notification process if immediate leadership awareness is required.";
    }

    incidentReference.textContent =
      incidentResult.incident_id
        ? `Incident Reference: ${incidentResult.incident_id}`
        : "";

    successPanel.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  newReportButton.addEventListener(
    "click",
    () => {
      form.reset();
      dynamicFields.innerHTML = "";
      detailsSection.classList.add("hidden");
      dispatchSection.classList.add("hidden");
      submitSection.classList.add("hidden");
      successPanel.classList.add("hidden");
      form.classList.remove("hidden");
      incidentType.focus();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  );

  signOutButton.addEventListener(
    "click",
    async () => {
      signOutButton.disabled = true;
      signOutButton.textContent = "Signing Out…";

      await db.auth.signOut();

      window.location.replace(
        new URL(
          "login.html",
          auth.appRootUrl || "../"
        ).href
      );
    }
  );

  function showSystemMessage(
    message,
    type
  ) {
    systemMessage.textContent = message;
    systemMessage.className =
      `system-message ${type}`;
  }

  function clearSystemMessage() {
    systemMessage.textContent = "";
    systemMessage.className =
      "system-message hidden";
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>'"]/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      })[char]
    );
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
