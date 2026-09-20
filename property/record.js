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
  if (!auth?.db || !auth?.user) return;

  const db = auth.db;
  const profile = auth.profile || {};
  const roles = Array.isArray(auth.roles) ? auth.roles : [];

  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");

  const currentUserName = document.getElementById("currentUserName");
  const currentUserRole = document.getElementById("currentUserRole");
  const signOutButton = document.getElementById("signOutButton");
  const pageMessage = document.getElementById("pageMessage");
  const recordContent = document.getElementById("recordContent");
  const actionResult = document.getElementById("actionResult");

  const propertyNumber = document.getElementById("propertyNumber");
  const statusPill = document.getElementById("statusPill");
  const dgNumber = document.getElementById("dgNumber");
  const mrnNumber = document.getElementById("mrnNumber");
  const description = document.getElementById("description");
  const category = document.getElementById("category");
  const storageLocation = document.getElementById("storageLocation");
  const locationReceived = document.getElementById("locationReceived");
 const receivedAt =
  document.getElementById("receivedAt");

const receivedBy =
  document.getElementById("receivedBy");

const clinicalStaffName =
  document.getElementById(
    "clinicalStaffName"
  );

const clinicalStaffBadgeNumber =
  document.getElementById(
    "clinicalStaffBadgeNumber"
  );

const notes =
  document.getElementById("notes");

const timeline =
  document.getElementById("timeline");

  const moveButton = document.getElementById("moveButton");
  const releaseButton = document.getElementById("releaseButton");
  const disposeButton = document.getElementById("disposeButton");
  const actionHelp = document.getElementById("actionHelp");

  const moveModal = document.getElementById("moveModal");
  const releaseModal = document.getElementById("releaseModal");
  const disposeModal = document.getElementById("disposeModal");

  const moveForm = document.getElementById("moveForm");
  const moveToLocation = document.getElementById("moveToLocation");
  const moveNotes = document.getElementById("moveNotes");
  const confirmMoveButton = document.getElementById("confirmMoveButton");

  const releaseForm = document.getElementById("releaseForm");
  const releasedTo = document.getElementById("releasedTo");
  const recipientRelationship = document.getElementById("recipientRelationship");
  const noIdPresent = document.getElementById("noIdPresent");
  const idCaptureFields = document.getElementById("idCaptureFields");
  const recipientIdType = document.getElementById("recipientIdType");
  const recipientIdImage = document.getElementById("recipientIdImage");
  const idPreviewWrap = document.getElementById("idPreviewWrap");
  const idPreview = document.getElementById("idPreview");

  const exceptionApprovalSection =
    document.getElementById("exceptionApprovalSection");

  const exceptionRequirementText =
    document.getElementById("exceptionRequirementText");

  const exceptionApprovalObtained =
    document.getElementById("exceptionApprovalObtained");

  const exceptionApprovalFields =
    document.getElementById("exceptionApprovalFields");

  const approvalSource =
    document.getElementById("approvalSource");

  const securityApproverLabel =
    document.getElementById("securityApproverLabel");

  const securityApprover =
    document.getElementById("securityApprover");

  const externalApproverLabel =
    document.getElementById("externalApproverLabel");

  const externalApproverName =
    document.getElementById("externalApproverName");

  const approvalNotes =
    document.getElementById("approvalNotes");

  const releaseWitness =
    document.getElementById("releaseWitness");

  const releaseNotes =
    document.getElementById("releaseNotes");

  const releaseValidationMessage =
    document.getElementById("releaseValidationMessage");

  const confirmReleaseButton =
    document.getElementById("confirmReleaseButton");

  const disposeForm =
    document.getElementById("disposeForm");

  const disposeNotes =
    document.getElementById("disposeNotes");

  const confirmDisposeButton =
    document.getElementById("confirmDisposeButton");

  const releaseVerificationCard =
    document.getElementById("releaseVerificationCard");

  const verificationRecipient =
    document.getElementById("verificationRecipient");

  const verificationRelationship =
    document.getElementById("verificationRelationship");

  const verificationIdStatus =
    document.getElementById("verificationIdStatus");

  const verificationApprovalItem =
    document.getElementById("verificationApprovalItem");

  const verificationApproval =
    document.getElementById("verificationApproval");

  const verificationReleasedBy =
    document.getElementById("verificationReleasedBy");

  const verificationReleasedAt =
    document.getElementById("verificationReleasedAt");

  const verificationApprovalNotesItem =
    document.getElementById("verificationApprovalNotesItem");

  const verificationApprovalNotes =
    document.getElementById("verificationApprovalNotes");

  const verificationImageActions =
    document.getElementById("verificationImageActions");

  const viewRecipientIdButton =
    document.getElementById("viewRecipientIdButton");

  let currentItem = null;
  let currentReleaseVerification = null;
  let currentDisposalRequest = null;
  let previewObjectUrl = null;
  let approversLoaded = false;

  function roleLabel(list) {
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
      order.find(role =>
        list.includes(role)
      );

    return (
      found ||
      list[0] ||
      "user"
    ).replaceAll("_", " ");
  }

  function showMessage(
    element,
    message,
    type = "info"
  ) {
    if (!element) return;

    element.textContent = message;
    element.className = `message show ${type}`;
  }

  function clearMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "message";
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "—";
    }

    return date.toLocaleString();
  }

  function safe(value) {
    return (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    )
      ? "—"
      : String(value);
  }

  function titleFromCode(value) {
    if (!value) return "—";

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  function setUserDisplay() {
    currentUserName.textContent =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

    currentUserRole.textContent =
      roleLabel(roles);
  }

  function openModal(
    modal,
    focusElement
  ) {
    clearMessage(actionResult);

    modal.classList.add("show");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    setTimeout(
      () =>
        focusElement?.focus(),
      0
    );
  }

  function closeModal(modal) {
    modal.classList.remove("show");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function clearIdPreview() {
    if (previewObjectUrl) {
      URL.revokeObjectURL(
        previewObjectUrl
      );

      previewObjectUrl = null;
    }

    idPreview.removeAttribute(
      "src"
    );

    idPreviewWrap.classList.remove(
      "show"
    );
  }

  function releaseRequiresException() {
    return (
      recipientRelationship.value ===
        "other_authorized_recipient" ||
      noIdPresent.checked
    );
  }

  function releaseExceptionReason() {
    const nonNextOfKin =
      recipientRelationship.value ===
      "other_authorized_recipient";

    const noId =
      noIdPresent.checked;

    if (
      nonNextOfKin &&
      noId
    ) {
      return "both";
    }

    if (nonNextOfKin) {
      return "non_next_of_kin";
    }

    if (noId) {
      return "no_id";
    }

    return null;
  }

  function updateApprovalSourceFields() {
    const source =
      approvalSource.value;

    const securityManagement =
      source ===
      "security_management";

    const outsideDepartment =
      source ===
        "risk_management" ||
      source ===
        "patient_relations";

    securityApproverLabel.hidden =
      !securityManagement;

    externalApproverLabel.hidden =
      !outsideDepartment;

    securityApprover.required =
      securityManagement;

    externalApproverName.required =
      outsideDepartment;

    if (!securityManagement) {
      securityApprover.value = "";
    }

    if (!outsideDepartment) {
      externalApproverName.value = "";
    }
  }

  function updateReleaseRequirements() {
    const idMissing =
      noIdPresent.checked;

    const needsException =
      releaseRequiresException();

    idCaptureFields.hidden =
      idMissing;

    recipientIdType.required =
      !idMissing;

    recipientIdImage.required =
      !idMissing;

    if (idMissing) {
      recipientIdType.value = "";
      recipientIdImage.value = "";

      clearIdPreview();
    }

    exceptionApprovalSection.hidden =
      !needsException;

    if (needsException) {
      const reason =
        releaseExceptionReason();

      if (reason === "both") {
        exceptionRequirementText.textContent =
          "This release is to a non-next-of-kin recipient and no acceptable photo ID is present. Exception approval is required.";
      }

      else if (
        reason ===
        "non_next_of_kin"
      ) {
        exceptionRequirementText.textContent =
          "This release is to someone other than the patient or documented next of kin. Exception approval is required.";
      }

      else {
        exceptionRequirementText.textContent =
          "No acceptable photo ID is present. Exception approval is required before property can be released.";
      }

      exceptionApprovalObtained.required =
        true;

      exceptionApprovalFields.hidden =
        !exceptionApprovalObtained.checked;

      approvalSource.required =
        exceptionApprovalObtained.checked;
    }

    else {
      exceptionApprovalObtained.required =
        false;

      exceptionApprovalObtained.checked =
        false;

      exceptionApprovalFields.hidden =
        true;

      approvalSource.required =
        false;

      approvalSource.value = "";
      securityApprover.value = "";
      externalApproverName.value = "";
      approvalNotes.value = "";

      updateApprovalSourceFields();
    }
  }

  async function loadSecurityApprovers() {
    if (approversLoaded) return;

    const {
      data,
      error
    } =
      await db.rpc(
        "get_property_release_approvers"
      );

    if (error) {
      throw error;
    }

    securityApprover.innerHTML =
      '<option value="">Select approver</option>';

    (
      data ||
      []
    ).forEach(
      person => {
        const option =
          document.createElement(
            "option"
          );

        option.value =
          person.user_id;

        option.textContent =
          `${person.display_name} — ${titleFromCode(
            person.role
          )}`;

        option.dataset.displayName =
          person.display_name;

        securityApprover.appendChild(
          option
        );
      }
    );

    approversLoaded =
      true;
  }

  function renderRecord(item) {
    propertyNumber.textContent =
      safe(
        item.property_number
      );

    dgNumber.textContent =
      safe(
        item.dg_number
      );

    mrnNumber.textContent =
      safe(
        item.mrn_number
      );

    description.textContent =
      safe(
        item.description
      );

    category.textContent =
      safe(
        item.category
      );

    storageLocation.textContent =
      safe(
        item.current_storage_location
      );

    locationReceived.textContent =
      safe(
        item.location_received
      );

    receivedAt.textContent =
      formatDate(
        item.received_at
      );

   receivedBy.textContent =
  safe(
    item.received_by_name
  );


if (
  clinicalStaffName
) {
  clinicalStaffName.textContent =
    safe(
      item.clinical_staff_name
    );
}


if (
  clinicalStaffBadgeNumber
) {
  clinicalStaffBadgeNumber.textContent =
    safe(
      item.clinical_staff_badge_number
    );
}


notes.textContent =
  safe(
    item.notes
  );

    statusPill.className =
      `status-pill ${item.status || ""}`;

    statusPill.textContent =
      safe(
        item.status
      ).replaceAll(
        "_",
        " "
      );

    const active =
      item.status ===
      "stored";

    moveButton.disabled =
      !active;

    releaseButton.disabled =
      !active;

    if (!active) {
      disposeButton.disabled =
        true;

      actionHelp.textContent =
        `This record is ${String(
          item.status
        ).replaceAll(
          "_",
          " "
        )}. No further standard property movement is permitted.`;
    }

    else if (
      currentDisposalRequest
    ) {
      disposeButton.disabled =
        true;

      disposeButton.textContent =
        "Disposal Requested";

      actionHelp.textContent =
        `Disposal was requested by ${
          currentDisposalRequest
            .requested_by_name ||
          "SecureTrack user"
        } on ${formatDate(
          currentDisposalRequest
            .requested_at
        )}. Property remains stored until management review is complete.`;
    }

    else {
      disposeButton.disabled =
        false;

      disposeButton.textContent =
        "Request Disposal";

      actionHelp.textContent =
        "Actions are recorded automatically in the chain of custody.";
    }
  }

  function timelineMeta(event) {
    const lines = [];

    if (
      event.event_type ===
      "received"
    ) {
      if (
        event.from_location
      ) {
        lines.push(
          `Received at: ${event.from_location}`
        );
      }

      if (
        event.to_location
      ) {
        lines.push(
          `Stored at: ${event.to_location}`
        );
      }
    }

    if (
      event.event_type ===
      "relocated"
    ) {
      if (
        event.from_location
      ) {
        lines.push(
          `From: ${event.from_location}`
        );
      }

      if (
        event.to_location
      ) {
        lines.push(
          `To: ${event.to_location}`
        );
      }
    }

    if (
      event.event_type ===
      "released"
    ) {
      if (
        event.from_location
      ) {
        lines.push(
          `Released from: ${event.from_location}`
        );
      }

      if (
        event.released_to
      ) {
        lines.push(
          `Released to: ${event.released_to}`
        );
      }

      if (
        event.witness
      ) {
        lines.push(
          `Witness: ${event.witness}`
        );
      }
    }

    if (
      event.event_type ===
      "disposed"
    ) {
      if (
        event.from_location
      ) {
        lines.push(
          `Removed from: ${event.from_location}`
        );
      }

      if (
        event.witness
      ) {
        lines.push(
          `Witness: ${event.witness}`
        );
      }
    }

    lines.push(
      `Recorded by: ${safe(
        event.actor_display_name
      )}`
    );

    return lines;
  }

  function renderTimeline(events) {
    timeline.innerHTML = "";

    if (!events.length) {
      timeline.innerHTML =
        '<div class="empty-cell">No chain-of-custody events found.</div>';

      return;
    }

    events.forEach(
      event => {
        const wrapper =
          document.createElement(
            "article"
          );

        wrapper.className =
          "timeline-event";

        const dot =
          document.createElement(
            "div"
          );

        dot.className =
          "timeline-dot";

        const body =
          document.createElement(
            "div"
          );

        body.className =
          "timeline-body";

        const head =
          document.createElement(
            "div"
          );

        head.className =
          "timeline-head";

        const type =
          document.createElement(
            "div"
          );

        type.className =
          "timeline-type";

        type.textContent =
          String(
            event.event_type ||
            "event"
          ).replaceAll(
            "_",
            " "
          );

        const time =
          document.createElement(
            "div"
          );

        time.className =
          "timeline-time";

        time.textContent =
          formatDate(
            event.occurred_at
          );

        head.append(
          type,
          time
        );

        body.appendChild(
          head
        );

        const meta =
          document.createElement(
            "div"
          );

        meta.className =
          "timeline-meta";

        timelineMeta(
          event
        ).forEach(
          line => {
            const row =
              document.createElement(
                "div"
              );

            row.textContent =
              line;

            meta.appendChild(
              row
            );
          }
        );

        body.appendChild(
          meta
        );

        if (
          event.notes
        ) {
          const note =
            document.createElement(
              "div"
            );

          note.className =
            "timeline-notes";

          note.textContent =
            event.notes;

          body.appendChild(
            note
          );
        }

        wrapper.append(
          dot,
          body
        );

        timeline.appendChild(
          wrapper
        );
      }
    );
  }

  function renderReleaseVerification(
    verification
  ) {
    currentReleaseVerification =
      verification ||
      null;

    if (!verification) {
      releaseVerificationCard.hidden =
        true;

      verificationImageActions.hidden =
        true;

      return;
    }

    releaseVerificationCard.hidden =
      false;

    verificationRecipient.textContent =
      safe(
        verification.recipient_name
      );

    verificationRelationship.textContent =
      titleFromCode(
        verification.recipient_relationship
      );

    verificationIdStatus.textContent =
      verification.id_present
        ? `Captured — ${titleFromCode(
            verification.id_type
          )}`
        : "No ID — exception approval used";

    if (
      verification.exception_approval
    ) {
      verificationApprovalItem.hidden =
        false;

      verificationApproval.textContent =
        `${titleFromCode(
          verification.approval_source
        )} — ${safe(
          verification.approved_by_name
        )}`;
    }

    else {
      verificationApprovalItem.hidden =
        false;

      verificationApproval.textContent =
        "Not required";
    }

    verificationReleasedBy.textContent =
      safe(
        verification.released_by_name
      );

    verificationReleasedAt.textContent =
      formatDate(
        verification.released_at
      );

    if (
      verification.approval_notes
    ) {
      verificationApprovalNotesItem.hidden =
        false;

      verificationApprovalNotes.textContent =
        verification.approval_notes;
    }

    else {
      verificationApprovalNotesItem.hidden =
        true;

      verificationApprovalNotes.textContent =
        "—";
    }

    verificationImageActions.hidden =
      !(
        verification.can_view_id_image &&
        verification.id_image_path
      );
  }

  async function loadDisposalRequestState() {
    currentDisposalRequest =
      null;

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

      currentDisposalRequest =
        (
          data ||
          []
        ).find(
          row =>
            row.property_item_id ===
            itemId
        ) ||
        null;
    }

    catch (
      error
    ) {
      console.warn(
        "Unable to load property disposal request state:",
        error
      );
    }
  }

  async function loadReleaseVerification() {
    try {
      const {
        data,
        error
      } =
        await db.rpc(
          "get_property_release_verification",
          {
            p_property_item_id:
              itemId
          }
        );

      if (error) {
        throw error;
      }

      return data ||
        null;
    }

    catch (
      error
    ) {
      console.warn(
        "Unable to load release verification:",
        error
      );

      return null;
    }
  }

  async function loadRecord() {
    clearMessage(
      pageMessage
    );

    if (!itemId) {
      showMessage(
        pageMessage,
        "No property record was selected.",
        "error"
      );

      return;
    }

    try {
      const [
        itemResult,
        eventResult,
        releaseVerification
      ] =
        await Promise.all(
          [
            db
              .from(
                "property_items"
              )
              .select(
               .select(
  "id, property_number, dg_number, mrn_number, description, category, location_received, current_storage_location, clinical_staff_name, clinical_staff_badge_number, status, received_at, received_by_name, notes, created_at, updated_at"
)
              .eq(
                "id",
                itemId
              )
              .single(),

            db
              .from(
                "property_events"
              )
              .select(
                "id, event_type, actor_display_name, occurred_at, from_location, to_location, released_to, witness, notes"
              )
              .eq(
                "property_item_id",
                itemId
              )
              .order(
                "occurred_at",
                {
                  ascending:
                    true
                }
              ),

            loadReleaseVerification()
          ]
        );

      if (
        itemResult.error
      ) {
        throw itemResult.error;
      }

      if (
        eventResult.error
      ) {
        throw eventResult.error;
      }

      currentItem =
        itemResult.data;

      await loadDisposalRequestState();

      renderRecord(
        currentItem
      );

      renderTimeline(
        eventResult.data ||
        []
      );

      renderReleaseVerification(
        releaseVerification
      );

      recordContent.hidden =
        false;
    }

    catch (
      error
    ) {
      console.error(
        "Property record load error:",
        error
      );

      showMessage(
        pageMessage,
        error.message ||
          "Unable to load this property record.",
        "error"
      );
    }
  }

  function resetReleaseForm() {
    releaseForm.reset();

    clearMessage(
      releaseValidationMessage
    );

    clearIdPreview();

    exceptionApprovalFields.hidden =
      true;

    securityApproverLabel.hidden =
      true;

    externalApproverLabel.hidden =
      true;

    updateReleaseRequirements();
  }

  moveButton.addEventListener(
    "click",
    () => {
      if (
        !currentItem ||
        currentItem.status !==
          "stored"
      ) {
        return;
      }

      moveToLocation.value = "";
      moveNotes.value = "";

      openModal(
        moveModal,
        moveToLocation
      );
    }
  );

  releaseButton.addEventListener(
    "click",
    async () => {
      if (
        !currentItem ||
        currentItem.status !==
          "stored"
      ) {
        return;
      }

      resetReleaseForm();

      try {
        await loadSecurityApprovers();
      }

      catch (
        error
      ) {
        console.warn(
          "Unable to preload Security Management approvers:",
          error
        );
      }

      openModal(
        releaseModal,
        releasedTo
      );
    }
  );

  disposeButton.addEventListener(
    "click",
    () => {
      if (
        !currentItem ||
        currentItem.status !==
          "stored" ||
        currentDisposalRequest
      ) {
        return;
      }

      disposeForm.reset();

      openModal(
        disposeModal,
        disposeNotes
      );
    }
  );

  recipientRelationship.addEventListener(
    "change",
    updateReleaseRequirements
  );

  noIdPresent.addEventListener(
    "change",
    updateReleaseRequirements
  );

  exceptionApprovalObtained.addEventListener(
    "change",
    () => {
      exceptionApprovalFields.hidden =
        !exceptionApprovalObtained.checked;

      approvalSource.required =
        exceptionApprovalObtained.checked;

      if (
        !exceptionApprovalObtained.checked
      ) {
        approvalSource.value = "";
        securityApprover.value = "";
        externalApproverName.value = "";
        approvalNotes.value = "";

        updateApprovalSourceFields();
      }
    }
  );

  approvalSource.addEventListener(
    "change",
    async () => {
      updateApprovalSourceFields();

      if (
        approvalSource.value ===
        "security_management"
      ) {
        try {
          await loadSecurityApprovers();
        }

        catch (
          error
        ) {
          showMessage(
            releaseValidationMessage,
            error.message ||
              "Unable to load authorized Security Management approvers.",
            "error"
          );
        }
      }
    }
  );

  recipientIdImage.addEventListener(
    "change",
    () => {
      clearMessage(
        releaseValidationMessage
      );

      clearIdPreview();

      const file =
        recipientIdImage
          .files?.[0];

      if (!file) return;

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        recipientIdImage.value =
          "";

        showMessage(
          releaseValidationMessage,
          "Recipient ID must be a JPG, PNG, or WebP image.",
          "error"
        );

        return;
      }

      if (
        file.size >
        10 * 1024 * 1024
      ) {
        recipientIdImage.value =
          "";

        showMessage(
          releaseValidationMessage,
          "Recipient ID image must be 10 MB or smaller.",
          "error"
        );

        return;
      }

      previewObjectUrl =
        URL.createObjectURL(
          file
        );

      idPreview.src =
        previewObjectUrl;

      idPreviewWrap.classList.add(
        "show"
      );
    }
  );

  document
    .querySelectorAll(
      ".modal-cancel"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            const modal =
              button.closest(
                ".modal-backdrop"
              );

            closeModal(
              modal
            );

            if (
              modal ===
              releaseModal
            ) {
              clearIdPreview();
            }
          }
        );
      }
    );

  document
    .querySelectorAll(
      ".modal-backdrop"
    )
    .forEach(
      modal => {
        modal.addEventListener(
          "click",
          event => {
            if (
              event.target ===
              modal
            ) {
              closeModal(
                modal
              );

              if (
                modal ===
                releaseModal
              ) {
                clearIdPreview();
              }
            }
          }
        );
      }
    );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      document
        .querySelectorAll(
          ".modal-backdrop.show"
        )
        .forEach(
          modal => {
            closeModal(
              modal
            );

            if (
              modal ===
              releaseModal
            ) {
              clearIdPreview();
            }
          }
        );
    }
  );

  moveForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      if (!currentItem) {
        return;
      }

      confirmMoveButton.disabled =
        true;

      confirmMoveButton.textContent =
        "Recording…";

      try {
        const {
          error
        } =
          await db.rpc(
            "move_property_item",
            {
              p_property_number:
                currentItem
                  .property_number,

              p_to_location:
                moveToLocation
                  .value
                  .trim(),

              p_notes:
                moveNotes
                  .value
                  .trim() ||
                null
            }
          );

        if (error) {
          throw error;
        }

        closeModal(
          moveModal
        );

        showMessage(
          actionResult,
          "Property move recorded successfully.",
          "success"
        );

        await loadRecord();
      }

      catch (
        error
      ) {
        console.error(
          "Move property error:",
          error
        );

        showMessage(
          actionResult,
          error.message ||
            "Unable to move property.",
          "error"
        );

        closeModal(
          moveModal
        );
      }

      finally {
        confirmMoveButton.disabled =
          false;

        confirmMoveButton.textContent =
          "Record Move";
      }
    }
  );

  function validateReleaseForm() {
    clearMessage(
      releaseValidationMessage
    );

    if (
      !releasedTo
        .value
        .trim()
    ) {
      return "Enter the recipient's full name.";
    }

    if (
      !recipientRelationship.value
    ) {
      return "Select the recipient's relationship to the patient.";
    }

    const idPresent =
      !noIdPresent.checked;

    if (idPresent) {
      if (
        !recipientIdType.value
      ) {
        return "Select the recipient's ID type.";
      }

      if (
        !recipientIdImage
          .files?.[0]
      ) {
        return "Capture or upload the recipient's photo ID before release.";
      }
    }

    if (
      releaseRequiresException()
    ) {
      if (
        !exceptionApprovalObtained.checked
      ) {
        return "Exception approval must be confirmed for this release.";
      }

      if (
        !approvalSource.value
      ) {
        return "Select the exception approval source.";
      }

      if (
        approvalSource.value ===
          "security_management" &&
        !securityApprover.value
      ) {
        return "Select the approving Security Manager or Director.";
      }

      if (
        [
          "risk_management",
          "patient_relations"
        ].includes(
          approvalSource.value
        ) &&
        !externalApproverName
          .value
          .trim()
      ) {
        return "Enter the name of the approving Risk Management or Patient Relations representative.";
      }
    }

    return null;
  }

  function fileExtensionFromType(type) {
    if (
      type ===
      "image/png"
    ) {
      return "png";
    }

    if (
      type ===
      "image/webp"
    ) {
      return "webp";
    }

    return "jpg";
  }

  async function uploadRecipientIdImage(
    file
  ) {
    const extension =
      fileExtensionFromType(
        file.type
      );

    const unique =
      typeof crypto?.randomUUID ===
      "function"
        ? crypto.randomUUID()
        : Math.random()
            .toString(36)
            .slice(2);

    const path =
      `${currentItem.id}/release-id-${Date.now()}-${unique}.${extension}`;

    const {
      error
    } =
      await db.storage
        .from(
          "property-release-ids"
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type
          }
        );

    if (error) {
      throw error;
    }

    return path;
  }

  releaseForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      if (!currentItem) {
        return;
      }

      const validationError =
        validateReleaseForm();

      if (
        validationError
      ) {
        showMessage(
          releaseValidationMessage,
          validationError,
          "error"
        );

        return;
      }

      const idPresent =
        !noIdPresent.checked;

      const needsException =
        releaseRequiresException();

      const exceptionReason =
        releaseExceptionReason();

      const confirmed =
        window.confirm(
          `Release ${currentItem.property_number} to "${releasedTo.value.trim()}"? ` +
          "This will close the property record as released."
        );

      if (!confirmed) {
        return;
      }

      confirmReleaseButton.disabled =
        true;

      confirmReleaseButton.textContent =
        "Verifying & Releasing…";

      clearMessage(
        releaseValidationMessage
      );

      let uploadedIdPath =
        null;

      try {
        if (idPresent) {
          const file =
            recipientIdImage
              .files[0];

          uploadedIdPath =
            await uploadRecipientIdImage(
              file
            );
        }

        let approvedByUserId =
          null;

        let approvedByName =
          null;

        if (
          needsException &&
          approvalSource.value ===
            "security_management"
        ) {
          approvedByUserId =
            securityApprover.value;

          approvedByName =
            securityApprover.options[
              securityApprover
                .selectedIndex
            ]?.dataset
              ?.displayName ||
            null;
        }

        if (
          needsException &&
          [
            "risk_management",
            "patient_relations"
          ].includes(
            approvalSource.value
          )
        ) {
          approvedByName =
            externalApproverName
              .value
              .trim();
        }

        const {
          data,
          error
        } =
          await db.rpc(
            "release_property_item_verified",
            {
              p_property_number:
                currentItem
                  .property_number,

              p_released_to:
                releasedTo
                  .value
                  .trim(),

              p_recipient_relationship:
                recipientRelationship
                  .value,

              p_id_present:
                idPresent,

              p_id_type:
                idPresent
                  ? recipientIdType
                      .value
                  : null,

              p_id_image_path:
                idPresent
                  ? uploadedIdPath
                  : null,

              p_exception_approval:
                needsException
                  ? exceptionApprovalObtained
                      .checked
                  : false,

              p_exception_reason:
                needsException
                  ? exceptionReason
                  : null,

              p_approval_source:
                needsException
                  ? approvalSource
                      .value
                  : null,

              p_approved_by_user_id:
                approvedByUserId,

              p_approved_by_name:
                approvedByName,

              p_approval_notes:
                needsException
                  ? approvalNotes
                      .value
                      .trim() ||
                    null
                  : null,

              p_witness:
                releaseWitness
                  .value
                  .trim() ||
                null,

              p_notes:
                releaseNotes
                  .value
                  .trim() ||
                null
            }
          );

        if (error) {
          throw error;
        }

        closeModal(
          releaseModal
        );

        clearIdPreview();

        showMessage(
          actionResult,
          data?.exception_approval
            ? "Property release recorded with documented exception approval."
            : "Property release recorded with recipient ID verification.",
          "success"
        );

        await loadRecord();
      }

      catch (
        error
      ) {
        console.error(
          "Verified property release error:",
          error
        );

        if (
          uploadedIdPath
        ) {
          try {
            await db.storage
              .from(
                "property-release-ids"
              )
              .remove(
                [
                  uploadedIdPath
                ]
              );
          }

          catch (
            cleanupError
          ) {
            console.warn(
              "Unable to clean up failed release ID upload:",
              cleanupError
            );
          }
        }

        showMessage(
          releaseValidationMessage,
          error.message ||
            "Unable to complete the verified property release.",
          "error"
        );
      }

      finally {
        confirmReleaseButton.disabled =
          false;

        confirmReleaseButton.textContent =
          "Confirm Verified Release";
      }
    }
  );

  disposeForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      if (
        !currentItem ||
        currentDisposalRequest
      ) {
        return;
      }

      confirmDisposeButton.disabled =
        true;

      confirmDisposeButton.textContent =
        "Sending Request…";

      try {
        const {
          data,
          error
        } =
          await db.rpc(
            "request_property_disposal",
            {
              p_property_number:
                currentItem
                  .property_number,

              p_notes:
                disposeNotes
                  .value
                  .trim() ||
                null
            }
          );

        if (error) {
          throw error;
        }

        closeModal(
          disposeModal
        );

        showMessage(
          actionResult,
          data?.already_pending
            ? "A disposal request is already pending for this property."
            : "Disposal request sent for management review. Property remains stored until an authorized Manager or Director completes disposal.",
          "success"
        );

        await loadRecord();
      }

      catch (
        error
      ) {
        console.error(
          "Request property disposal error:",
          error
        );

        showMessage(
          actionResult,
          error.message ||
            "Unable to request property disposal.",
          "error"
        );

        closeModal(
          disposeModal
        );
      }

      finally {
        confirmDisposeButton.disabled =
          false;

        confirmDisposeButton.textContent =
          "Send Disposal Request";
      }
    }
  );

  viewRecipientIdButton.addEventListener(
    "click",
    async () => {
      if (
        !currentReleaseVerification
          ?.id_image_path
      ) {
        return;
      }

      viewRecipientIdButton.disabled =
        true;

      viewRecipientIdButton.textContent =
        "Opening…";

      try {
        const {
          data,
          error
        } =
          await db.storage
            .from(
              "property-release-ids"
            )
            .createSignedUrl(
              currentReleaseVerification
                .id_image_path,
              60
            );

        if (error) {
          throw error;
        }

        if (
          !data?.signedUrl
        ) {
          throw new Error(
            "Unable to create secure ID image link."
          );
        }

        window.open(
          data.signedUrl,
          "_blank",
          "noopener,noreferrer"
        );
      }

      catch (
        error
      ) {
        console.error(
          "Open recipient ID error:",
          error
        );

        showMessage(
          pageMessage,
          error.message ||
            "Unable to open the captured recipient ID.",
          "error"
        );
      }

      finally {
        viewRecipientIdButton.disabled =
          false;

        viewRecipientIdButton.textContent =
          "View Captured ID";
      }
    }
  );

  signOutButton.addEventListener(
    "click",
    async () => {
      signOutButton.disabled =
        true;

      signOutButton.textContent =
        "Signing Out…";

      await db.auth
        .signOut();

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

  updateApprovalSourceFields();

  updateReleaseRequirements();

  await loadRecord();
})();
