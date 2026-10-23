(function () {

  "use strict";


  // ========================================================
  // CONFIG / SUPABASE
  // ========================================================

  const cfg =
    window.SECURETRACK_CONFIG ||
    {};


  if (
    !cfg.supabaseUrl ||
    !cfg.supabaseAnonKey
  ) {

    alert(
      "SecureTrack configuration is missing."
    );

    return;

  }


  const db =
    window.supabase.createClient(

      cfg.supabaseUrl,

      cfg.supabaseAnonKey,

      {

        auth: {

          persistSession:
            true,

          autoRefreshToken:
            true,

          detectSessionInUrl:
            true

        }

      }

    );


  const ALLOWED_ROLES =
    [
      "officer",
      "senior_officer",
      "team_lead",
      "manager",
      "director",
      "admin"
    ];


  let currentProfile =
    null;

const pageParams =
  new URLSearchParams(
    window.location.search
  );

const shiftInstanceId =
  pageParams.get("shift_id");
  // ========================================================
  // DOM
  // ========================================================

  const form =
    document.getElementById(
      "incidentForm"
    );


  const incidentType =
    document.getElementById(
      "incidentType"
    );
// ========================================================
// ENSURE TSI REQUEST OPTION EXISTS
// ========================================================

if (
  incidentType &&
  !incidentType.querySelector(
    'option[value="tsi"]'
  )
) {

  const tsiOption =
    document.createElement(
      "option"
    );

  tsiOption.value =
    "tsi";

  tsiOption.textContent =
    "TSI Request";

  incidentType.appendChild(
    tsiOption
  );

}

  const detailsSection =
    document.getElementById(
      "detailsSection"
    );


  const submissionSection =
    document.getElementById(
      "submissionSection"
    );


  const submitSection =
    document.getElementById(
      "submitSection"
    );


  const dynamicFields =
    document.getElementById(
      "dynamicFields"
    );


  const incidentHelp =
    document.getElementById(
      "incidentHelp"
    );


  const submitButton =
    document.getElementById(
      "submitButton"
    );


  const systemMessage =
    document.getElementById(
      "systemMessage"
    );


  const successPanel =
    document.getElementById(
      "successPanel"
    );


  const successMessage =
    document.getElementById(
      "successMessage"
    );


  const incidentReference =
    document.getElementById(
      "incidentReference"
    );


  // ========================================================
  // HELPERS
  // ========================================================

  function escapeHtml(
    value
  ) {

    return String(
      value
    ).replace(

      /[&<>'"]/g,

      char => ({

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        "'":
          "&#39;",

        '"':
          "&quot;"

      })[char]

    );

  }


  function showMessage(
    text,
    type = "error"
  ) {

    systemMessage.textContent =
      text;

    systemMessage.className =
      "system-message " +
      type;

  }


  function clearMessage() {

    systemMessage.textContent =
      "";

    systemMessage.className =
      "system-message hidden";

  }


  function nullable(
    value
  ) {

    const clean =
      String(
        value || ""
      ).trim();

    return clean || null;

  }


  // ========================================================
  // AUTHENTICATION
  // ========================================================

  async function initializeSecurity() {

    const {
      data: {
        session
      },
      error
    } =
      await db.auth.getSession();


    if (
      error ||
      !session
    ) {

      window.location.replace(
        "login.html?next=security-alerts.html"
      );

      return false;

    }


    const [
      profileResult,
      rolesResult
    ] =
      await Promise.all([

        db
          .from("profiles")
          .select(
            "id, display_name, email, is_active"
          )
          .eq(
            "id",
            session.user.id
          )
          .single(),

        db
          .from("user_roles")
          .select("role")
          .eq(
            "user_id",
            session.user.id
          )

      ]);


    if (
      profileResult.error ||
      !profileResult.data ||
      profileResult.data.is_active !== true
    ) {

      await db.auth.signOut();

      window.location.replace(
        "login.html"
      );

      return false;

    }


    const roles =
      (
        rolesResult.data ||
        []
      )
        .map(
          row =>
            row.role
        );


    const allowed =
      roles.some(
        role =>
          ALLOWED_ROLES.includes(
            role
          )
      );


    if (!allowed) {

      window.location.replace(
        "hub.html"
      );

      return false;

    }


    currentProfile =
      profileResult.data;


    document.getElementById(
      "currentUserName"
    ).textContent =
      currentProfile.display_name ||
      currentProfile.email ||
      "SecureTrack Officer";


    return true;

  }


  // ========================================================
  // FIELD BUILDERS
  // ========================================================

  function dateField() {

    return `

      <div class="field">

        <label for="occurrenceDate">
          Date of Occurrence *
        </label>

        <input
          id="occurrenceDate"
          type="date"
          required
        >

      </div>

    `;

  }


  function timeField() {

    return `

      <div class="field">

        <label for="occurrenceTime">
          Time of Occurrence *
        </label>

        <input
          id="occurrenceTime"
          type="time"
          required
        >

      </div>

    `;

  }


  function textField(
    id,
    label,
    placeholder,
    fullWidth = false
  ) {

    return `

      <div class="field ${
        fullWidth
          ? "full-width"
          : ""
      }">

        <label for="${id}">
          ${escapeHtml(label)} *
        </label>

        <input
          id="${id}"
          type="text"
          maxlength="300"
          required
          placeholder="${escapeHtml(
            placeholder || ""
          )}"
        >

      </div>

    `;

  }


  function textareaField(
    id,
    label,
    placeholder
  ) {

    return `

      <div class="field full-width">

        <label for="${id}">
          ${escapeHtml(label)} *
        </label>

        <textarea
          id="${id}"
          rows="4"
          maxlength="1200"
          required
          placeholder="${escapeHtml(
            placeholder || ""
          )}"
        ></textarea>

      </div>

    `;

  }


  function checkboxField(
    id,
    label
  ) {

    return `

      <div class="field full-width">

        <div class="checkbox-row">

          <input
            id="${id}"
            type="checkbox"
          >

          <label for="${id}">
            ${escapeHtml(label)}
          </label>

        </div>

      </div>

    `;

  }

  function slipFallImageField(
  id,
  label
) {

  return `

    <div class="field full-width">

      <label for="${id}Images">
        ${escapeHtml(label)}
      </label>

      <input
        id="${id}Images"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
      >

      <small>
        Maximum 4 images • Maximum 10 MB per image
      </small>

      <div
        id="${id}ImageStatus"
        class="muted"
        style="margin-top:6px;"
      ></div>

    </div>

  `;

}

  // ========================================================
  // INCIDENT TEMPLATES
  // ========================================================

  const templates = {

    code_green: {

      help:
        "Document the Code Green occurrence and responding personnel.",

      html: () => (

        dateField() +

        timeField() +

        textField(
          "location",
          "Location",
          "Building, unit, room, or area"
        ) +

        textareaField(
          "patientInformation",
          "Patient Information",
          "Use only the minimum information required by policy."
        ) +

        textField(
          "respondingOfficers",
          "Responding Officer(s)",
          "Separate multiple names with commas",
          true
        )

      )

    },


    taser_pull: {

      help:
        "Document the Taser Pull and identify the deploying officer and device.",

      html: () => (

        dateField() +

        timeField() +

        textField(
          "location",
          "Location",
          "Building, unit, room, or area"
        ) +

        textField(
          "deployingOfficer",
          "Deploying Officer",
          "Officer name"
        ) +

        textField(
          "taserNumber",
          "Taser Number",
          "Device or asset number"
        )

      )

    },


    ctw: {

      help:
        "Document the Criminal Trespass Warning and law-enforcement response.",

      html: () => (

        dateField() +

        timeField() +

        textField(
          "location",
          "Location",
          "Building, unit, room, or area"
        ) +

        textField(
          "trespassSubject",
          "Trespass Subject",
          "Subject name or approved identifier"
        ) +

        textareaField(
          "reportedDamages",
          "Reported Damages",
          "Enter None if no damages were reported."
        ) +

        textField(
          "lawEnforcementAgency",
          "Responding Law Enforcement Agency",
          "Agency name",
          true
        ) +

        checkboxField(
          "ctwFormCompleted",
          "CTW form completed"
        )

      )

    },


    officer_injury: {

      help:
        "Document the officer injury and required incident-report status.",

      html: () => (

        dateField() +

        timeField() +

        textField(
          "location",
          "Location",
          "Building, unit, room, or area"
        ) +

        textField(
          "injuredOfficer",
          "Officer Name",
          "Injured officer"
        ) +

        checkboxField(
          "incidentReportCompleted",
          "Incident report completed"
        )

      )

    },

    slip_and_fall: {

  help:
    "Document the Slip & Fall, person involved, witnesses, Risk Management notification, and required photographic evidence.",

  html: () => `

    <div class="field">

      <label for="occurrenceDate">
        Date *
      </label>

      <input
        id="occurrenceDate"
        type="date"
        required
      >

    </div>


    <div class="field">

      <label for="occurrenceTime">
        Time *
      </label>

      <input
        id="occurrenceTime"
        type="time"
        required
      >

    </div>


    <div class="field full-width">

      <label for="location">
        Location of Fall *
      </label>

      <input
        id="location"
        type="text"
        maxlength="300"
        required
        placeholder="Building, department, hallway, room, entrance, parking area, etc."
      >

    </div>


    <div class="field">

      <label for="slipFallPersonName">
        Person Involved Name *
      </label>

      <input
        id="slipFallPersonName"
        type="text"
        maxlength="180"
        required
      >

    </div>


   <div class="field">

  <label for="slipFallPersonPhone">
    Phone Number *
  </label>

  <input
    id="slipFallPersonPhone"
    type="tel"
    maxlength="50"
    autocomplete="tel"
    placeholder="Phone number"
    required
  >

</div>

   <div class="field">

  <label for="slipFallPersonEmail">
    Email Address *
  </label>

  <input
    id="slipFallPersonEmail"
    type="email"
    maxlength="254"
    autocomplete="email"
    placeholder="Email address"
    required
  >

</div>


    <div class="field full-width">

      <label>
        Witnesses
      </label>

      <div
        id="slipFallWitnessList"
        style="
          display:grid;
          gap:12px;
          margin-top:8px;
        "
      ></div>

      <button
        id="addSlipFallWitness"
        class="secondary-button"
        type="button"
        style="margin-top:10px;"
      >
        + Add Witness
      </button>

      <div class="muted" style="margin-top:8px;">
        Record witness name, contact information, and whether
        the witness is a visitor or employee.
      </div>

    </div>


    <div class="field full-width">

      <label
        style="
          display:flex;
          align-items:flex-start;
          gap:10px;
          cursor:pointer;
        "
      >

        <input
          id="riskManagementNotified"
          type="checkbox"
          style="
            width:18px;
            height:18px;
            margin-top:3px;
          "
        >

        <span>
          <strong>
            Risk Management Notified
          </strong>

          <small
            style="
              display:block;
              margin-top:4px;
            "
          >
            Check this box when Risk Management has been contacted.
          </small>
        </span>

      </label>

    </div>


    <div
      id="riskManagementDetailsField"
      class="field full-width"
      style="display:none;"
    >

      <label for="riskManagementDetails">
        Risk Management Notification Details *
      </label>

      <textarea
        id="riskManagementDetails"
        rows="4"
        maxlength="1500"
        placeholder="Document who was contacted, when, instructions received, reference number, or other relevant details."
      ></textarea>

    </div>


    <div class="field full-width">

      <label for="slipFallAdditionalDetails">
        Additional Slip & Fall Details
      </label>

      <textarea
        id="slipFallAdditionalDetails"
        rows="4"
        maxlength="2000"
        placeholder="Enter additional operational details relevant to the incident."
      ></textarea>

    </div>


    <div class="field full-width">

      <div
        style="
          font-weight:800;
          margin-bottom:6px;
        "
      >
        Photographic Evidence
      </div>

      <div class="privacy-note">
        Up to 4 images may be uploaded in each category.
        Photograph only what is operationally necessary and authorized.
        Do not capture unrelated medical information.
      </div>

    </div>


    ${slipFallImageField(
      "shoeSoles",
      "Bottom / Soles of Shoes"
    )}


    ${slipFallImageField(
      "fallScene",
      "Scene Where the Fall Occurred"
    )}


    ${slipFallImageField(
      "areaCameras",
      "Cameras Within the Area"
    )}


    ${slipFallImageField(
      "nearbySignage",
      "Nearby Signage / Warnings"
    )}


    ${slipFallImageField(
      "injury",
      "Visible Injuries"
    )}

  `

},

    insufficient_staffing: {

      help:
        "Record the number of officers currently on duty.",

      html: () => `

        <div class="field">

          <label for="officersOnDuty">
            Total Officers on Duty *
          </label>

          <input
            id="officersOnDuty"
            type="number"
            min="0"
            max="200"
            required
          >

        </div>

      `

    },

tsi: {

  help:
    "Record a TSI request for operational tracking. No management notification will be sent.",

  html: () => `

    <div class="field">

      <label for="tsiTicketNumber">
        Ticket Number
      </label>

      <input
        id="tsiTicketNumber"
        type="text"
        maxlength="100"
        placeholder="Example: INC0012345"
      >

    </div>


    <div class="field">

      <label for="tsiRequestType">
        Request Type
      </label>

      <input
        id="tsiRequestType"
        type="text"
        maxlength="180"
        placeholder="Example: Workstation, Phone, Access"
      >

    </div>


    <div class="field">

      <label for="tsiLocation">
        Location
      </label>

      <input
        id="tsiLocation"
        type="text"
        maxlength="300"
        placeholder="Department, unit, room, or area"
      >

    </div>


    <div class="field">

      <label for="tsiPriority">
        Priority
      </label>

      <select id="tsiPriority">

        <option value="low">
          Low
        </option>

        <option
          value="normal"
          selected
        >
          Normal
        </option>

        <option value="high">
          High
        </option>

        <option value="urgent">
          Urgent
        </option>

      </select>

    </div>


    <div class="field">

      <label for="tsiStatus">
        Status
      </label>

      <select id="tsiStatus">

        <option
          value="open"
          selected
        >
          Open
        </option>

        <option value="in_progress">
          In Progress
        </option>

        <option value="resolved">
          Resolved
        </option>

        <option value="cancelled">
          Cancelled
        </option>

      </select>

    </div>


    <div class="field full-width">

      <label for="tsiDescription">
        Request Details *
      </label>

      <textarea
        id="tsiDescription"
        rows="4"
        maxlength="1500"
        required
        placeholder="Describe the issue or support request..."
      ></textarea>

    </div>


    <div class="field full-width">

      <label for="tsiOperationalNotes">
        Operational Notes
      </label>

      <textarea
        id="tsiOperationalNotes"
        rows="4"
        maxlength="1500"
        placeholder="Add relevant operational notes..."
      ></textarea>

    </div>

  `

}

    
  };


  // ========================================================
  // INCIDENT TYPE CHANGE
  // ========================================================

  incidentType.addEventListener(
    "change",
    () => {

      clearMessage();


      const selected =
        incidentType.value;


      if (
        !selected ||
        !templates[selected]
      ) {

        dynamicFields.innerHTML =
          "";

        detailsSection.classList.add(
          "hidden"
        );

        submissionSection.classList.add(
          "hidden"
        );

        submitSection.classList.add(
          "hidden"
        );

        return;

      }


      const template =
        templates[selected];


      incidentHelp.textContent =
        template.help;


      dynamicFields.innerHTML =
        template.html();

      if (
  selected ===
  "slip_and_fall"
) {

  initializeSlipFallForm();

}

      detailsSection.classList.remove(
        "hidden"
      );


      submissionSection.classList.remove(
        "hidden"
      );


      submitSection.classList.remove(
        "hidden"
      );


      if (
        selected !==
        "insufficient_staffing"
      ) {

        setDefaultDateTime();

      }

    }
  );


  // ========================================================
  // DATE / TIME
  // ========================================================

  function setDefaultDateTime() {

    const now =
      new Date();


    const local =
      new Date(

        now.getTime() -

        now.getTimezoneOffset() *
        60000

      );


    const dateInput =
      document.getElementById(
        "occurrenceDate"
      );


    const timeInput =
      document.getElementById(
        "occurrenceTime"
      );


    if (dateInput) {

      dateInput.value =
        local
          .toISOString()
          .slice(
            0,
            10
          );

    }


    if (timeInput) {

      timeInput.value =
        local
          .toISOString()
          .slice(
            11,
            16
          );

    }

  }
function initializeSlipFallForm() {

  const addWitnessButton =
    document.getElementById(
      "addSlipFallWitness"
    );

  const riskCheckbox =
    document.getElementById(
      "riskManagementNotified"
    );

  const riskField =
    document.getElementById(
      "riskManagementDetailsField"
    );

  const riskDetails =
    document.getElementById(
      "riskManagementDetails"
    );


  if (addWitnessButton) {

    addWitnessButton.addEventListener(
      "click",
      () => {

        addSlipFallWitnessRow();

      }
    );

  }


  if (
    riskCheckbox &&
    riskField &&
    riskDetails
  ) {

    riskCheckbox.addEventListener(
      "change",
      () => {

        riskField.style.display =
          riskCheckbox.checked
            ? ""
            : "none";


        riskDetails.required =
          riskCheckbox.checked;


        if (
          !riskCheckbox.checked
        ) {

          riskDetails.value =
            "";

        }

      }
    );

  }


  [
    "shoeSoles",
    "fallScene",
    "areaCameras",
    "nearbySignage",
    "injury"
  ].forEach(
    id => {

      const input =
        document.getElementById(
          `${id}Images`
        );

      const status =
        document.getElementById(
          `${id}ImageStatus`
        );


      input?.addEventListener(
        "change",
        () => {

          const files =
            Array.from(
              input.files || []
            );


          if (
            files.length > 4
          ) {

            input.value =
              "";

            if (status) {

              status.textContent =
                "Maximum 4 images allowed in this category.";

            }

            return;

          }


          const oversized =
            files.find(
              file =>
                file.size >
                10485760
            );


          if (oversized) {

            input.value =
              "";

            if (status) {

              status.textContent =
                `${oversized.name} exceeds the 10 MB limit.`;

            }

            return;

          }


          if (status) {

            status.textContent =
              files.length
                ? `${files.length} image(s) selected.`
                : "";

          }

        }
      );

    }
  );

}


function addSlipFallWitnessRow() {

  const list =
    document.getElementById(
      "slipFallWitnessList"
    );


  if (!list) {
    return;
  }


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "slip-fall-witness-row";


  row.style.cssText =
    `
      border:1px solid rgba(255,255,255,.12);
      border-radius:12px;
      padding:14px;
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:10px;
    `;


  row.innerHTML =
    `

      <div class="field">
        <label>
          Witness Name *
        </label>

        <input
          class="slip-fall-witness-name"
          type="text"
          maxlength="180"
          required
        >
      </div>


      <div class="field">
        <label>
          Witness Type *
        </label>

        <select
          class="slip-fall-witness-affiliation"
          required
        >

          <option value="">
            Select...
          </option>

          <option value="visitor">
            Visitor
          </option>

          <option value="employee">
            Employee
          </option>

        </select>
      </div>


      <div class="field">
        <label>
          Phone
        </label>

        <input
          class="slip-fall-witness-phone"
          type="tel"
          maxlength="50"
        >
      </div>


      <div class="field">
        <label>
          Email
        </label>

        <input
          class="slip-fall-witness-email"
          type="email"
          maxlength="254"
        >
      </div>


      <div class="field full-width">
        <label>
          Witness Notes
        </label>

        <textarea
          class="slip-fall-witness-notes"
          rows="2"
          maxlength="750"
        ></textarea>
      </div>


      <div class="field full-width">

        <button
          type="button"
          class="secondary-button slip-fall-remove-witness"
        >
          Remove Witness
        </button>

      </div>

    `;


  row
    .querySelector(
      ".slip-fall-remove-witness"
    )
    ?.addEventListener(
      "click",
      () => {

        row.remove();

      }
    );


  list.appendChild(
    row
  );

}

  // ========================================================
  // BUILD RPC PAYLOAD
  // ========================================================

  function buildPayload() {

    const type =
      incidentType.value;


    return {

      p_incident_type:
        type,

      p_occurrence_date:
        nullable(
          document.getElementById(
            "occurrenceDate"
          )?.value
        ),

      p_occurrence_time:
        nullable(
          document.getElementById(
            "occurrenceTime"
          )?.value
        ),

      p_location:
        nullable(
          document.getElementById(
            "location"
          )?.value
        ),

      p_patient_information:
        nullable(
          document.getElementById(
            "patientInformation"
          )?.value
        ),

      p_responding_officers:
        nullable(
          document.getElementById(
            "respondingOfficers"
          )?.value
        ),

      p_deploying_officer:
        nullable(
          document.getElementById(
            "deployingOfficer"
          )?.value
        ),

      p_taser_number:
        nullable(
          document.getElementById(
            "taserNumber"
          )?.value
        ),

      p_trespass_subject:
        nullable(
          document.getElementById(
            "trespassSubject"
          )?.value
        ),

      p_reported_damages:
        nullable(
          document.getElementById(
            "reportedDamages"
          )?.value
        ),

      p_responding_law_enforcement_agency:
        nullable(
          document.getElementById(
            "lawEnforcementAgency"
          )?.value
        ),

      p_ctw_form_completed:
        Boolean(
          document.getElementById(
            "ctwFormCompleted"
          )?.checked
        ),

      p_incident_report_completed:
        Boolean(
          document.getElementById(
            "incidentReportCompleted"
          )?.checked
        ),

      p_officer_name:
        nullable(
          document.getElementById(
            "injuredOfficer"
          )?.value
        ),

      p_total_officers_on_duty:

        document.getElementById(
          "officersOnDuty"
        )

          ? Number(
              document.getElementById(
                "officersOnDuty"
              ).value
            )

          : null,

      p_dispatch_unit:
        nullable(
          document.getElementById(
            "dispatchUnit"
          ).value
        ),

      p_additional_notes:
        nullable(
          document.getElementById(
            "additionalNotes"
          ).value
        ),

      p_client_submitted_at:
        new Date()
          .toISOString()

    };

  }
// ========================================================
// SLIP & FALL SUBMISSION HELPERS
// ========================================================

function collectSlipFallWitnesses() {

  const rows =
    Array.from(
      document.querySelectorAll(
        ".slip-fall-witness-row"
      )
    );


  return rows.map(
    row => ({

      name:
        row
          .querySelector(
            ".slip-fall-witness-name"
          )
          ?.value
          ?.trim()
        || "",

      phone:
        row
          .querySelector(
            ".slip-fall-witness-phone"
          )
          ?.value
          ?.trim()
        || "",

      email:
        row
          .querySelector(
            ".slip-fall-witness-email"
          )
          ?.value
          ?.trim()
        || "",

      affiliation:
        row
          .querySelector(
            ".slip-fall-witness-affiliation"
          )
          ?.value
        || "",

      notes:
        row
          .querySelector(
            ".slip-fall-witness-notes"
          )
          ?.value
          ?.trim()
        || ""

    })
  );

}


// ========================================================
// SLIP & FALL EVIDENCE CONFIGURATION
// ========================================================

const SLIP_FALL_EVIDENCE_FIELDS = [

  {
    inputId:
      "shoeSolesImages",

    category:
      "shoe_soles"
  },

  {
    inputId:
      "fallSceneImages",

    category:
      "fall_scene"
  },

  {
    inputId:
      "areaCamerasImages",

    category:
      "area_cameras"
  },

  {
    inputId:
      "nearbySignageImages",

    category:
      "nearby_signage"
  },

  {
    inputId:
      "injuryImages",

    category:
      "injury"
  }

];


// ========================================================
// CLEAN FILE NAME
// ========================================================

function safeEvidenceFileName(
  fileName
) {

  const value =
    String(
      fileName || "image"
    )
      .trim()
      .toLowerCase();


  return value
    .replace(
      /[^a-z0-9._-]+/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^[-.]+|[-.]+$/g,
      ""
    )
    || "image";

}


// ========================================================
// SAVE SLIP & FALL DETAILS
// ========================================================

async function saveSlipFallDetails(
  incidentId
) {

  const riskManagementNotified =
    Boolean(
      document.getElementById(
        "riskManagementNotified"
      )?.checked
    );


  const witnesses =
    collectSlipFallWitnesses();


  const {
    data,
    error
  } =
    await db.rpc(
      "save_slip_fall_details",
      {

        p_incident_id:
          incidentId,

        p_person_name:
          document
            .getElementById(
              "slipFallPersonName"
            )
            .value
            .trim(),

        p_person_phone:
          nullable(
            document.getElementById(
              "slipFallPersonPhone"
            )?.value
          ),

        p_person_email:
          nullable(
            document.getElementById(
              "slipFallPersonEmail"
            )?.value
          ),

        p_fall_location:
          document
            .getElementById(
              "location"
            )
            .value
            .trim(),

        p_occurrence_date:
          document
            .getElementById(
              "occurrenceDate"
            )
            .value,

        p_occurrence_time:
          document
            .getElementById(
              "occurrenceTime"
            )
            .value,

        p_risk_management_notified:
          riskManagementNotified,

        p_risk_management_details:
          riskManagementNotified

            ? nullable(
                document.getElementById(
                  "riskManagementDetails"
                )?.value
              )

            : null,

        p_additional_details:
          nullable(
            document.getElementById(
              "slipFallAdditionalDetails"
            )?.value
          ),

        p_witnesses:
          witnesses

      }
    );


  if (error) {

    throw error;

  }


  if (
    !data ||
    data.ok !== true
  ) {

    throw new Error(
      "SecureTrack could not save the Slip & Fall follow-up details."
    );

  }


  return data;

}


// ========================================================
// UPLOAD ONE SLIP & FALL IMAGE
// ========================================================

async function uploadSlipFallEvidenceFile(
  incidentId,
  category,
  slot,
  file
) {

  if (
    !file
  ) {

    return null;

  }


  if (
    file.size >
    10485760
  ) {

    throw new Error(
      `${file.name} exceeds the 10 MB evidence-image limit.`
    );

  }


  const uniquePart =

    typeof crypto !== "undefined"

    &&
    typeof crypto.randomUUID ===
      "function"

      ? crypto.randomUUID()

      : (
          Date.now()
          +
          "-"
          +
          Math.random()
            .toString(36)
            .slice(2)
        );


  const cleanName =
    safeEvidenceFileName(
      file.name
    );


  const storagePath =
    `${incidentId}/${category}/${slot}-${uniquePart}-${cleanName}`;


  const {
    error: uploadError
  } =
    await db
      .storage
      .from(
        "slip-fall-evidence"
      )
      .upload(
        storagePath,
        file,
        {

          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type ||
            undefined

        }
      );


  if (
    uploadError
  ) {

    throw new Error(
      `Unable to upload ${file.name}: ${uploadError.message}`
    );

  }


  const {
    data,
    error
  } =
    await db.rpc(
      "save_slip_fall_evidence",
      {

        p_incident_id:
          incidentId,

        p_evidence_category:
          category,

        p_evidence_slot:
          slot,

        p_storage_path:
          storagePath,

        p_original_file_name:
          file.name,

        p_mime_type:
          file.type ||
          null,

        p_file_size_bytes:
          file.size

      }
    );


  if (
    error
  ) {

    /*
      The file reached Storage but the database
      registration failed. Remove the orphaned
      object before reporting the failure.
    */

    await db
      .storage
      .from(
        "slip-fall-evidence"
      )
      .remove(
        [
          storagePath
        ]
      );


    throw error;

  }


  return data;

}


// ========================================================
// UPLOAD ALL SLIP & FALL EVIDENCE
// ========================================================

async function uploadAllSlipFallEvidence(
  incidentId
) {

  let uploadedCount =
    0;


  for (
    const evidenceField
    of SLIP_FALL_EVIDENCE_FIELDS
  ) {

    const input =
      document.getElementById(
        evidenceField.inputId
      );


    const files =
      Array.from(
        input?.files || []
      );


    if (
      files.length > 4
    ) {

      throw new Error(
        "A maximum of four images may be uploaded in each evidence category."
      );

    }


    for (
      let index = 0;
      index < files.length;
      index += 1
    ) {

      await uploadSlipFallEvidenceFile(

        incidentId,

        evidenceField.category,

        index + 1,

        files[index]

      );


      uploadedCount +=
        1;

    }

  }


  return uploadedCount;

}

// ========================================================
// SUBMIT
// ========================================================

form.addEventListener(

  "submit",

  async event => {

    event.preventDefault();

    clearMessage();


    if (
      !form.checkValidity()
    ) {

      form.reportValidity();

      return;

    }


    const isSlipFall =
      incidentType.value ===
      "slip_and_fall";


    /*
      Check evidence counts before creating the incident.
    */

    if (
      isSlipFall
    ) {

      for (
        const evidenceField
        of SLIP_FALL_EVIDENCE_FIELDS
      ) {

        const input =
          document.getElementById(
            evidenceField.inputId
          );


        const files =
          Array.from(
            input?.files || []
          );


        if (
          files.length > 4
        ) {

          showMessage(
            "A maximum of four images may be uploaded in each Slip & Fall evidence category.",
            "error"
          );

          return;

        }


        const oversizedFile =
          files.find(
            file =>
              file.size >
              10485760
          );


        if (
          oversizedFile
        ) {

          showMessage(

            `${oversizedFile.name} exceeds the 10 MB evidence-image limit.`,

            "error"

          );

          return;

        }

      }

    }


    submitButton.disabled =
      true;


    submitButton.textContent =

      isSlipFall

        ? "Saving Slip & Fall..."

        : "Submitting Alert...";


    let createdIncidentId =
      null;


    try {

      // ======================================================
      // STEP 1 — CREATE SECURITY ALERT
      // ======================================================

      const payload =
        buildPayload();


      const {
        data,
        error
      } =
        await db.rpc(
          "submit_security_incident",
          payload
        );


      if (
        error
      ) {

        throw error;

      }


      if (
        !data ||
        data.ok !== true
      ) {

        throw new Error(
          "SecureTrack did not confirm the incident submission."
        );

      }


      createdIncidentId =
        data.incident_id;


      // ======================================================
      // STEP 2 — SLIP & FALL DETAILS / WITNESSES
      // ======================================================

      let evidenceCount =
        0;


      if (
        isSlipFall
      ) {

        submitButton.textContent =
          "Saving Follow-Up Details...";


        await saveSlipFallDetails(
          createdIncidentId
        );


        // ====================================================
        // STEP 3 — PRIVATE EVIDENCE UPLOADS
        // ====================================================

        submitButton.textContent =
          "Uploading Evidence...";


        evidenceCount =
          await uploadAllSlipFallEvidence(
            createdIncidentId
          );

      }


      // ======================================================
      // COMPLETE
      // ======================================================

      form.classList.add(
        "hidden"
      );


      successPanel.classList.remove(
        "hidden"
      );


      if (
        isSlipFall
      ) {

        successMessage.textContent =

          evidenceCount > 0

            ? (
                "The Slip & Fall alert was recorded, "
                +
                "follow-up details were saved, and "
                +
                `${evidenceCount} evidence image(s) were uploaded securely.`
              )

            : (
                "The Slip & Fall alert and follow-up details were recorded successfully."
              );

      }

      else {

        successMessage.textContent =

          data.notification_status ===
            "queued"

            ? (
                "The incident was recorded and the SecureTrack leadership notification was queued."
              )

            : (
                "The incident was recorded successfully."
              );

      }


      incidentReference.textContent =

        createdIncidentId

          ? (
              "Incident Reference: "
              +
              createdIncidentId
            )

          : "";


      successPanel.scrollIntoView({

        behavior:
          "smooth",

        block:
          "center"

      });

    }

    catch (
      error
    ) {

      console.error(
        "Security Alert submission failed:",
        error
      );


      /*
        If the main incident was already created,
        NEVER tell the user simply to submit again.
        That could create a duplicate Security Alert.
      */

      if (
        createdIncidentId
      ) {

        form.classList.add(
          "hidden"
        );


        successPanel.classList.remove(
          "hidden"
        );


        successMessage.textContent =

          (
            "The Security Alert was created, but part of the Slip & Fall follow-up could not be completed. "
            +
            "Do not submit a duplicate alert. "
            +
            "Provide this Incident Reference to shift leadership or a manager so the record can be completed."
          );


        incidentReference.textContent =

          "Incident Reference: "
          +
          createdIncidentId;


        showMessage(

          error.message ||
          "The follow-up record could not be completed.",

          "error"

        );


        successPanel.scrollIntoView({

          behavior:
            "smooth",

          block:
            "center"

        });


        return;

      }


      showMessage(

        error.message ||

        "The Security Alert could not be submitted. Contact leadership directly if immediate notification is required.",

        "error"

      );

    }

    finally {

      submitButton.disabled =
        false;


      submitButton.textContent =
        "Submit Security Alert";

    }

  }

);
  // ========================================================
  // NEW REPORT
  // ========================================================

  document
    .getElementById(
      "newReportButton"
    )
    .addEventListener(
      "click",
      () => {

        form.reset();


        dynamicFields.innerHTML =
          "";


        detailsSection.classList.add(
          "hidden"
        );


        submissionSection.classList.add(
          "hidden"
        );


        submitSection.classList.add(
          "hidden"
        );


        successPanel.classList.add(
          "hidden"
        );


        form.classList.remove(
          "hidden"
        );


        clearMessage();


        incidentType.focus();

      }
    );


  // ========================================================
  // NAVIGATION
  // ========================================================

  document
    .getElementById(
      "backToHub"
    )
    .addEventListener(
      "click",
      () => {

        window.location.href =
          "hub.html";

      }
    );


  document
    .getElementById(
      "logoutButton"
    )
    .addEventListener(
      "click",
      async () => {

        await db.auth.signOut();


        window.location.replace(
          "login.html"
        );

      }
    );


  // ========================================================
  // INITIALIZE
  // ========================================================

  initializeSecurity()
    .catch(
      error => {

        console.error(
          "Security Alerts initialization failed:",
          error
        );


        showMessage(
          error.message ||
          "SecureTrack could not initialize Security Alerts.",
          "error"
        );

      }
    );


})();
