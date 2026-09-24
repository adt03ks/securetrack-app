(async function () {

  "use strict";

 console.log(
    "IdentityLink JS build 2026-09-24 fingerprint-complete-v7 loaded"
  );

  
  // =========================================================
  // BASIC HELPERS
  // =========================================================

  const $ =
    id =>
      document.getElementById(id);


  const escapeHtml =
    value =>
      String(
        value ?? ""
      )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");


  const formatDateTime =
    value => {

      if (!value) {
        return "—";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return value;
      }

      return date.toLocaleString();
    };


  const requestTypeLabel =
    value => {

      if (
        value ===
        "image_request"
      ) {
        return "Image Request";
      }

      if (
        value ===
        "fingerprint"
      ) {
        return "Fingerprint Request";
      }

      return value || "—";
    };


  const statusLabel =
    value => {

      const labels = {

        pending:
          "Pending Approval",

        changes_requested:
          "Changes Requested",

        approved:
          "Approved",

        denied:
          "Denied",

        cancelled:
          "Cancelled",

        completed:
          "Completed",

        draft:
          "Draft"

      };

      return labels[value] ||
        value ||
        "Unknown";
    };


  const roleLabel =
    roles => {

      if (
        roles.includes("admin")
      ) {
        return "Administrator";
      }

      if (
        roles.includes("director")
      ) {
        return "Director";
      }

      if (
        roles.includes("manager")
      ) {
        return "Manager";
      }

      return "Management";
    };


  const isRequestOpen =
    request =>
      String(
        request?.case_status ??
        request?.status ??
        ""
      )
        .trim()
        .toLowerCase() ===
      "open";


  function showMessage(
    message,
    type = "success"
  ) {

    const el =
      $("pageMessage");

    if (!el) {
      return;
    }

    el.textContent =
      message;

    el.className =
      `message show ${type}`;


    clearTimeout(
      showMessage.timer
    );


    showMessage.timer =
      setTimeout(
        () => {

          el.className =
            "message";

        },
        5500
      );

  }



  // =========================================================
  // AUTH FALLBACK
  // =========================================================

  async function buildAuthFallback() {

    const cfg =
      window.SECURETRACK_CONFIG ||
      {};


    if (
      !cfg.supabaseUrl ||
      !cfg.supabaseAnonKey
    ) {

      throw new Error(
        "SecureTrack Supabase configuration is unavailable."
      );

    }


    const fallbackDb =
      window.supabase.createClient(
        cfg.supabaseUrl,
        cfg.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );


    const {
      data: {
        session
      },
      error: sessionError
    } =
      await fallbackDb
        .auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session) {
      return null;
    }


    const [
      profileResult,
      rolesResult
    ] =
      await Promise.all([

        fallbackDb
          .from("profiles")
          .select(
            "id, display_name, email, employee_number, is_active"
          )
          .eq(
            "id",
            session.user.id
          )
          .single(),

        fallbackDb
          .from("user_roles")
          .select("role")
          .eq(
            "user_id",
            session.user.id
          )

      ]);


    if (profileResult.error) {
      throw profileResult.error;
    }


    if (rolesResult.error) {
      throw rolesResult.error;
    }


    const profile =
      profileResult.data;


    const roles =
      (rolesResult.data || [])
        .map(
          row =>
            row.role
        );


    if (
      !profile ||
      !profile.is_active
    ) {

      throw new Error(
        "An active SecureTrack profile is required."
      );

    }


    const authorized =
      roles.some(
        role =>
          [
            "manager",
            "director",
            "admin"
          ].includes(role)
      );


    if (!authorized) {

      throw new Error(
        "IdentityLink management access is required."
      );

    }


    const fallbackAuth = {

      db:
        fallbackDb,

      session,

      user:
        session.user,

      profile,

      roles

    };


    window.SecureTrackAuth =
      window.SecureTrackAuth ||
      fallbackAuth;


    return fallbackAuth;

  }



  function waitForAuth() {

    if (
      window.SecureTrackAuth
    ) {

      return Promise.resolve(
        window.SecureTrackAuth
      );

    }


    return new Promise(
      (
        resolve,
        reject
      ) => {

        let settled =
          false;


        const finish =
          value => {

            if (settled) {
              return;
            }

            settled =
              true;

            document.removeEventListener(
              "securetrack:authorized",
              handler
            );

            resolve(value);

          };


        const handler =
          event => {

            finish(
              event.detail ||
              window.SecureTrackAuth
            );

          };


        document.addEventListener(
          "securetrack:authorized",
          handler
        );


        setTimeout(
          async () => {

            if (settled) {
              return;
            }

            try {

              if (
                window.SecureTrackAuth
              ) {

                finish(
                  window.SecureTrackAuth
                );

                return;

              }


              const fallback =
                await buildAuthFallback();


              if (!fallback) {

                window.location.replace(
                  "../login.html?next=identitylink/index.html"
                );

                return;

              }


              finish(fallback);

            }
            catch (error) {

              if (!settled) {

                settled =
                  true;

                document.removeEventListener(
                  "securetrack:authorized",
                  handler
                );

                reject(error);

              }

            }

          },
          2500
        );

      }
    );

  }



  // =========================================================
  // AUTH INITIALIZATION
  // =========================================================

  let auth;


  try {

    auth =
      await waitForAuth();

  }
  catch (error) {

    console.error(
      "IdentityLink authentication error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to initialize IdentityLink.",
      "error"
    );

    return;

  }


  if (
    !auth?.db ||
    !auth?.user
  ) {

    showMessage(
      "IdentityLink authentication is unavailable.",
      "error"
    );

    return;

  }


  const db =
    auth.db;


  const profile =
    auth.profile ||
    {};


  const roles =
    auth.roles ||
    [];


  const hasManagementAccess =
    roles.some(
      role =>
        [
          "manager",
          "director",
          "admin"
        ].includes(role)
    );


  if (
    !hasManagementAccess
  ) {

    window.location.replace(
      "../hub.html"
    );

    return;

  }



  // =========================================================
  // ELEMENT REFERENCES
  // =========================================================

  const currentUserName =
    $("currentUserName");

  const currentUserRole =
    $("currentUserRole");

  const requestList =
    $("requestList");

  const searchInput =
    $("searchInput");

  const statusFilter =
    $("statusFilter");

  const requestModal =
    $("requestModal");

  const requestForm =
    $("requestForm");

  const detailModal =
    $("detailModal");

  const detailBody =
    $("detailBody");

  const imageModal =
    $("imageModal");

  const fullImage =
    $("fullImage");


  let currentRequests =
    [];


  let currentDetail =
    null;



  // =========================================================
  // USER DISPLAY
  // =========================================================

  if (currentUserName) {

    currentUserName.textContent =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

  }


  if (currentUserRole) {

    currentUserRole.textContent =
      roleLabel(roles);

  }



  // =========================================================
  // SIGN OUT
  // =========================================================

  $("signOutButton")
    ?.addEventListener(
      "click",
      async () => {

        try {

          await db.auth.signOut();

        }
        finally {

          window.location.replace(
            "../login.html"
          );

        }

      }
    );



  // =========================================================
  // REQUEST LIST
  // =========================================================

 async function loadRequests() {

  if (!requestList) {
    return;
  }


  requestList.innerHTML =
    '<div class="loading-state">Loading IdentityLink records…</div>';


  const searchValue =
    searchInput
      ?.value
      ?.trim() ||
    null;


  const statusValue =
    statusFilter
      ?.value ||
    null;


  const [
    requestResult,
    outcomeResult
  ] =
    await Promise.all([

      db.rpc(
        "get_identitylink_management_requests",
        {
          p_search:
            searchValue,

          p_status:
            statusValue
        }
      ),

      db.rpc(
        "get_identitylink_management_file_outcomes"
      )

    ]);


  if (requestResult.error) {
    throw requestResult.error;
  }


  if (outcomeResult.error) {
    throw outcomeResult.error;
  }


  const outcomeMap =
    new Map(

      (
        outcomeResult.data ||
        []
      ).map(
        item => [
          item.request_id,
          item
        ]
      )

    );


  currentRequests =
    (
      requestResult.data ||
      []
    ).map(
      item => {

        const outcome =
          outcomeMap.get(
            item.request_id
          ) || {};


        return {

          ...item,

          image_processing_status:
            outcome.image_processing_status ||
            "not_started",

          fingerprint_processing_status:
            outcome.fingerprint_processing_status ||
            "not_started",

          identity_result:
            outcome.identity_result ||
            null,

          verified_identity_name:
            outcome.verified_identity_name ||
            null,

          next_of_kin_result:
            outcome.next_of_kin_result ||
            null,

          fingerprint_results_recorded_at:
            outcome.fingerprint_results_recorded_at ||
            null

        };

      }
    );


  renderRequests();

}


  // =========================================================
  // MINI IMAGE / FINGERPRINT STATUS
  // =========================================================

  function renderMiniAction(
    item,
    actionType,
    label,
    status
  ) {

    const currentStatus =
      status ||
      "not_requested";


    if (
      currentStatus ===
      "not_requested"
    ) {

      return `
        <div class="action-mini not-requested">

          <span>
            ${escapeHtml(label)}
            • Not Requested
          </span>

          <button
            class="mini-request-button request-action-button"
            type="button"
            data-request-id="${escapeHtml(item.request_id)}"
            data-action-type="${escapeHtml(actionType)}"
          >
            Request
          </button>

        </div>
      `;

    }


    return `
      <div class="action-mini active">

        <strong>
          ${escapeHtml(label)}
        </strong>

        <span>
          ${escapeHtml(statusLabel(currentStatus))}
        </span>

      </div>
    `;

  }

// =========================================================
// FILE COMPLETION / QUICK OUTCOME
// =========================================================

function isIdentityLinkFileComplete(
  item
) {

  const fingerprintsComplete =
    item.fingerprint_status ===
      "approved" &&
    item.fingerprint_processing_status ===
      "completed";


  // If an image request was approved,
  // it must also be operationally completed.

  const imageSatisfied =

    item.image_status ===
      "not_requested" ||

    item.image_status ===
      "denied" ||

    item.image_status ===
      "cancelled" ||

    (
      item.image_status ===
        "approved" &&

      item.image_processing_status ===
        "completed"
    );


  return (
    fingerprintsComplete &&
    imageSatisfied
  );

}


// =========================================================
// LEFT-SIDE COMPLETE MARKER
// =========================================================

function renderFileCompletionMarker(
  item
) {

  if (
    !isIdentityLinkFileComplete(
      item
    )
  ) {

    return `
      <div
        class="result-column"
        aria-hidden="true"
      ></div>
    `;

  }


  return `
    <div
      class="result-column"
      title="IdentityLink file complete"
    >

      <div
        class="subject-result-indicator positive"
        aria-label="Complete"
      >
        ✓
      </div>

      <span class="file-complete-label">
        Complete
      </span>

    </div>
  `;

}


// =========================================================
// OUTCOME SUMMARY
// =========================================================

function renderFileOutcomeSummary(
  item
) {

  const processed =
    item.fingerprint_processing_status ===
    "completed";


  if (!processed) {

    if (
      item.fingerprint_processing_status ===
      "submitted"
    ) {

      return `
        <div class="outcome-summary pending">

          <span class="request-label">
            Fingerprint Outcome
          </span>

          <span class="outcome-pending">
            Processing pending
          </span>

        </div>
      `;

    }


    return `
      <div class="outcome-summary empty"></div>
    `;

  }


  const identityVerified =
    item.identity_result ===
    "verified";


  const nextOfKinProvided =
    item.next_of_kin_result ===
    "provided";


  const identityText =
    identityVerified
      ? (
          item.verified_identity_name ||
          "Identity Verified"
        )
      : "No Identity Verified";


  const nextOfKinText =
    nextOfKinProvided
      ? "Next of Kin Provided"
      : "No Next of Kin";


  return `
    <div class="outcome-summary">

      <span class="request-label">
        Fingerprint Outcome
      </span>


      <div
        class="outcome-line ${
          identityVerified
            ? "positive"
            : "negative"
        }"
      >

        <span class="outcome-icon">
          ${
            identityVerified
              ? "✓"
              : "×"
          }
        </span>

        <strong>
          ${escapeHtml(
            identityText
          )}
        </strong>

      </div>


      <div
        class="outcome-line ${
          nextOfKinProvided
            ? "positive"
            : "negative"
        }"
      >

        <span class="outcome-icon">
          ${
            nextOfKinProvided
              ? "✓"
              : "×"
          }
        </span>

        <strong>
          ${escapeHtml(
            nextOfKinText
          )}
        </strong>

      </div>

    </div>
  `;

}

  function renderRequests() {

    if (!requestList) {
      return;
    }


    $("recordSummary").textContent =
      `${currentRequests.length} record${currentRequests.length === 1 ? "" : "s"} shown`;


    if (
      !currentRequests.length
    ) {

      requestList.innerHTML =
        `
          <div class="empty-state">
            No IdentityLink requests match the current search.
          </div>
        `;

      return;

    }


    requestList.innerHTML =
      currentRequests
        .map(
          item => {

            const statusClass =
              `status-${escapeHtml(item.status)}`;


            return `
             <article
  class="request-row ${
    isIdentityLinkFileComplete(item)
      ? "file-work-complete"
      : ""
  }"
>

  ${renderFileCompletionMarker(
    item
  )}

                <div>

                  <span class="request-label">
                    Request
                  </span>

                  <span class="request-number">
                    ${escapeHtml(item.request_number)}
                  </span>

                  <span class="request-detail-small">
                   IdentityLink Subject File
                  </span>

                </div>


                <div class="request-main">

                  <span class="request-label">
                    Patient Alias
                  </span>

                  <strong>
                    ${escapeHtml(item.patient_alias)}
                  </strong>

                  <span>
                    MRN: ${escapeHtml(item.mrn_patient_number)}
                  </span>

                </div>
                ${renderFileOutcomeSummary(
                  item
                )}

                <div>

                  <span class="request-label">
                    Last Known Location
                  </span>

                  ${escapeHtml(item.room_last_known_location)}

                </div>


                <div>

                  <span class="request-label">
                    Submitted By
                  </span>

                  ${escapeHtml(item.submitted_by_name)}

                  <span class="request-detail-small">
                    ${escapeHtml(formatDateTime(item.submitted_at))}
                  </span>

                </div>


                <div>

                  <div class="action-mini-list">

  ${renderMiniAction(
    item,
    "image_request",
    "Image",
    item.image_status
  )}

  ${renderMiniAction(
    item,
    "fingerprint",
    "Fingerprint",
    item.fingerprint_status
  )}

  <span class="request-detail-small">
    ${Number(item.subject_image_count || 0)}
    subject image${Number(item.subject_image_count || 0) === 1 ? "" : "s"}
  </span>

</div>


                <div>

                  <button
                    class="button secondary open-request-button"
                    type="button"
                    data-request-id="${escapeHtml(item.request_id)}"
                  >
                    Open
                  </button>

                </div>

              </article>
            `;

          }
        )
        .join("");


    document
      .querySelectorAll(
        ".open-request-button"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              openRequestDetail(
                button.dataset.requestId
              )
          );

        }
      );

    document
  .querySelectorAll(
    ".request-action-button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        async event => {

          event.stopPropagation();


          await requestAdditionalAction(
            button.dataset.requestId,
            button.dataset.actionType
          );

        }
      );

    }
  );

}

  // =========================================================
  // DASHBOARD COUNTS
  // =========================================================

  async function loadDashboardCounts() {

    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_management_requests",
        {
          p_search:
            null,

          p_status:
            null
        }
      );


    if (error) {
      throw error;
    }


    const all =
      data ||
      [];

const pendingActions =
  all.reduce(
    (
      total,
      item
    ) =>
      total +
      (
        item.image_status ===
        "pending"
          ? 1
          : 0
      ) +
      (
        item.fingerprint_status ===
        "pending"
          ? 1
          : 0
      ),
    0
  );


const changesActions =
  all.reduce(
    (
      total,
      item
    ) =>
      total +
      (
        item.image_status ===
        "changes_requested"
          ? 1
          : 0
      ) +
      (
        item.fingerprint_status ===
        "changes_requested"
          ? 1
          : 0
      ),
    0
  );


const approvedActions =
  all.reduce(
    (
      total,
      item
    ) =>
      total +
      (
        item.image_status ===
        "approved"
          ? 1
          : 0
      ) +
      (
        item.fingerprint_status ===
        "approved"
          ? 1
          : 0
      ),
    0
  );


$("pendingCount").textContent =
  String(
    pendingActions
  );


$("changesCount").textContent =
  String(
    changesActions
  );


$("approvedCount").textContent =
  String(
    approvedActions
  );


$("totalCount").textContent =
  String(
    all.length
  );

  }



  // =========================================================
  // SEARCH
  // =========================================================

  $("searchButton")
    ?.addEventListener(
      "click",
      async () => {

        try {

          await loadRequests();

        }
        catch (error) {

          console.error(
            "IdentityLink search error:",
            error
          );

          showMessage(
            error.message ||
            "Unable to search IdentityLink.",
            "error"
          );

        }

      }
    );


  searchInput
    ?.addEventListener(
      "keydown",
      async event => {

        if (
          event.key !==
          "Enter"
        ) {
          return;
        }

        event.preventDefault();


        try {

          await loadRequests();

        }
        catch (error) {

          showMessage(
            error.message ||
            "Unable to search IdentityLink.",
            "error"
          );

        }

      }
    );


  statusFilter
    ?.addEventListener(
      "change",
      async () => {

        try {

          await loadRequests();

        }
        catch (error) {

          showMessage(
            error.message ||
            "Unable to filter IdentityLink.",
            "error"
          );

        }

      }
    );


  document
    .querySelectorAll(
      "[data-status-filter]"
    )
    .forEach(
      card => {

        card.addEventListener(
          "click",
          async () => {

            statusFilter.value =
              card.dataset.statusFilter ||
              "";

            try {

              await loadRequests();

            }
            catch (error) {

              showMessage(
                error.message ||
                "Unable to filter IdentityLink.",
                "error"
              );

            }

          }
        );

      }
    );



  // =========================================================
  // NEW REQUEST MODAL
  // =========================================================

function openNewRequestModal() {

  requestForm.reset();


  $("editingRequestId").value =
    "";


  $("requestSelectionSection")
    .classList
    .remove("hidden");


  $("initialLocationField")
    .classList
    .remove("hidden");


  $("lastKnownLocation")
    .required =
    true;


  $("requestModalTitle").textContent =
    "New IdentityLink Subject File";


  $("submitRequestButton").textContent =
    "Submit for Approval";


  requestModal.classList.remove(
    "hidden"
  );

}

  
  function closeRequestModal() {

    requestModal.classList.add(
      "hidden"
    );

  }


  $("newRequestButton")
    ?.addEventListener(
      "click",
      openNewRequestModal
    );


  $("closeRequestModalButton")
    ?.addEventListener(
      "click",
      closeRequestModal
    );


  $("cancelRequestButton")
    ?.addEventListener(
      "click",
      closeRequestModal
    );

  

  // =========================================================
  // FORM VALUES
  // =========================================================

 function getSubjectFormValues() {

  return {

    p_patient_alias:
      $("patientAlias")
        .value
        .trim(),

    p_mrn_patient_number:
      $("mrnPatientNumber")
        .value
        .trim(),

    p_identifying_factors:
      $("identifyingFactors")
        .value
        .trim() ||
      null,

    p_source_organization:
      $("sourceOrganization")
        .value
        .trim() ||
      null,

    p_source_requester_name:
      $("sourceRequesterName")
        .value
        .trim() ||
      null,

    p_source_requester_email:
      $("sourceRequesterEmail")
        .value
        .trim() ||
      null,

    p_source_requester_phone:
      $("sourceRequesterPhone")
        .value
        .trim() ||
      null,

    p_source_reference_number:
      $("sourceReferenceNumber")
        .value
        .trim() ||
      null,

    p_manager_notes:
      $("managerNotes")
        .value
        .trim() ||
      null

  };

}


  // =========================================================
  // CREATE / UPDATE REQUEST
  // =========================================================

 requestForm
  ?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const submitButton =
        $("submitRequestButton");


      submitButton.disabled =
        true;


      const originalText =
        submitButton.textContent;


      submitButton.textContent =
        "Saving…";


      try {

        const editingId =
          $("editingRequestId")
            .value;


        const subjectValues =
          getSubjectFormValues();


        let result;


        // =====================================================
        // EDIT EXISTING SUBJECT INFORMATION
        // =====================================================

        if (editingId) {

          result =
            await db.rpc(
              "update_identitylink_subject_file",
              {
                p_request_id:
                  editingId,

                ...subjectValues
              }
            );

        }


        // =====================================================
        // CREATE NEW SUBJECT FILE
        // =====================================================

        else {

          const requestImage =
            $("requestImage")
              .checked;


          const requestFingerprint =
            $("requestFingerprint")
              .checked;


          if (
            !requestImage &&
            !requestFingerprint
          ) {

            throw new Error(
              "Select Image Request, Fingerprint Request, or both."
            );

          }


          const currentLocation =
            $("lastKnownLocation")
              .value
              .trim();


          if (!currentLocation) {

            throw new Error(
              "Current patient location is required."
            );

          }


          result =
            await db.rpc(
              "create_identitylink_subject_file",
              {

                p_request_image:
                  requestImage,

                p_request_fingerprint:
                  requestFingerprint,

                p_room_last_known_location:
                  currentLocation,

                ...subjectValues

              }
            );

        }


        if (result.error) {
          throw result.error;
        }


        closeRequestModal();


        showMessage(
          editingId
            ? "IdentityLink subject information updated."
            : `IdentityLink file ${result.data?.request_number || ""} submitted for approval.`,
          "success"
        );


        await Promise.all([
          loadRequests(),
          loadDashboardCounts()
        ]);


        if (
          result.data?.request_id
        ) {

          await openRequestDetail(
            result.data.request_id
          );

        }
        else if (
          editingId
        ) {

          await openRequestDetail(
            editingId
          );

        }

      }
      catch (error) {

        console.error(
          "IdentityLink save error:",
          error
        );


        showMessage(
          error.message ||
          "Unable to save IdentityLink record.",
          "error"
        );

      }
      finally {

        submitButton.disabled =
          false;

        submitButton.textContent =
          originalText;

      }

    }
  );


  // =========================================================
  // EDIT REQUEST
  // =========================================================

function openEditRequest(
  request
) {

  if (
    !isRequestOpen(request)
  ) {

    showMessage(
      "This IdentityLink subject file is no longer open.",
      "error"
    );

    return;

  }


  requestForm.reset();


  $("editingRequestId").value =
    request.id;


  // Existing authorization tracks are managed
  // from the subject file, not from normal editing.

  $("requestSelectionSection")
    .classList
    .add("hidden");


  // Location has its own audited workflow.

  $("initialLocationField")
    .classList
    .add("hidden");


  $("lastKnownLocation")
    .required =
    false;


  $("patientAlias").value =
    request.patient_alias ||
    "";


  $("mrnPatientNumber").value =
    request.mrn_patient_number ||
    "";


  $("identifyingFactors").value =
    request.identifying_factors ||
    "";


  $("sourceOrganization").value =
    request.source_organization ||
    "";


  $("sourceRequesterName").value =
    request.source_requester_name ||
    "";


  $("sourceRequesterEmail").value =
    request.source_requester_email ||
    "";


  $("sourceRequesterPhone").value =
    request.source_requester_phone ||
    "";


  $("sourceReferenceNumber").value =
    request.source_reference_number ||
    "";


  $("managerNotes").value =
    request.manager_notes ||
    "";


  $("requestModalTitle").textContent =
    `Edit ${request.request_number}`;


  $("submitRequestButton").textContent =
    "Save Subject Information";


  requestModal.classList.remove(
    "hidden"
  );

}

  async function requestAdditionalAction(
  requestId,
  actionType
) {

  const label =
    actionType ===
    "image_request"
      ? "Image Request"
      : "Fingerprint Request";


  const confirmed =
    window.confirm(
      `Submit ${label} for approval on this existing IdentityLink file?`
    );


  if (!confirmed) {
    return;
  }


  try {

    const {
      error
    } =
      await db.rpc(
        "request_identitylink_action",
        {
          p_request_id:
            requestId,

          p_action_type:
            actionType
        }
      );


    if (error) {
      throw error;
    }


    showMessage(
      `${label} submitted for approval.`,
      "success"
    );


    await Promise.all([
      loadRequests(),
      loadDashboardCounts()
    ]);


    if (
      !detailModal
        .classList
        .contains("hidden")
    ) {

      await openRequestDetail(
        requestId
      );

    }

  }
  catch (error) {

    console.error(
      "IdentityLink additional request error:",
      error
    );


    showMessage(
      error.message ||
      `Unable to submit ${label}.`,
      "error"
    );

  }

}

// =========================================================
// REQUEST DETAIL
// =========================================================

async function openRequestDetail(
  requestId
) {

  detailModal.classList.remove(
    "hidden"
  );


  detailBody.innerHTML =
    '<div class="loading-state">Loading IdentityLink request…</div>';


  const [
    detailResult,
    imageProcessingResult,
    fingerprintProcessingResult
  ] =
    await Promise.all([

      db.rpc(
        "get_identitylink_management_request_detail",
        {
          p_request_id:
            requestId
        }
      ),

      db.rpc(
        "get_identitylink_image_processing",
        {
          p_request_id:
            requestId
        }
      ),

      db.rpc(
        "get_identitylink_fingerprint_processing",
        {
          p_request_id:
            requestId
        }
      )

    ]);


  if (detailResult.error) {

    detailModal.classList.add(
      "hidden"
    );

    throw detailResult.error;

  }


  if (imageProcessingResult.error) {
    throw imageProcessingResult.error;
  }


  if (fingerprintProcessingResult.error) {
    throw fingerprintProcessingResult.error;
  }


  currentDetail =
    detailResult.data;


  currentDetail.image_processing =
    imageProcessingResult.data || {
      status: "not_started"
    };


  currentDetail.fingerprint_processing =
    fingerprintProcessingResult.data || {
      status: "not_started",
      identity_result: null,
      identity_name: null,
      next_of_kin_result: null
    };


  await renderRequestDetail();

}

async function renderRequestDetail() {

  if (!currentDetail?.request) {
    return;
  }


  const request =
    currentDetail.request;


  const actions =
    currentDetail.actions ||
    [];


  const actionApprovals =
    currentDetail.action_approvals ||
    [];


  const locationHistory =
    currentDetail.location_history ||
    [];


  const files =
    currentDetail.files ||
    [];


  const activity =
    currentDetail.activity ||
    [];


  const imageProcessing =
    currentDetail.image_processing || {
      status: "not_started"
    };


  const fingerprintProcessing =
    currentDetail.fingerprint_processing || {
      status: "not_started",
      identity_result: null,
      identity_name: null,
      next_of_kin_result: null
    };


  $("detailRequestNumber").textContent =
    request.request_number;


  const canModify =
    isRequestOpen(request);


  detailBody.innerHTML = `

    <div class="detail-top">

      <div>

        <span
          class="status-pill ${
            isRequestOpen(request)
              ? "status-pending"
              : "status-completed"
          }"
        >
          ${
            isRequestOpen(request)
              ? "Open Subject File"
              : escapeHtml(
                  request.case_status ||
                  request.status ||
                  "Closed"
                )
          }
        </span>


        <div class="request-detail-small">

          Submitted
          ${escapeHtml(
            formatDateTime(
              request.submitted_at
            )
          )}

          by

          ${escapeHtml(
            request.submitted_by_name
          )}

        </div>

      </div>


      <div class="detail-actions">

        ${
          canModify
            ? `
                <button
                  id="editCurrentRequestButton"
                  class="button secondary"
                  type="button"
                >
                  Edit Subject Information
                </button>
              `
            : ""
        }


        ${
          canModify
            ? `
                <button
                  id="cancelCurrentRequestButton"
                  class="button danger"
                  type="button"
                >
                  Cancel File
                </button>
              `
            : ""
        }

      </div>

    </div>
  
      <!-- ================================================
           SUBJECT INFORMATION
      ================================================= -->

      <div class="detail-grid">

        ${detailItem(
          "Patient Alias",
          request.patient_alias
        )}


        ${detailItem(
          "MRN / Patient Number",
          request.mrn_patient_number
        )}


        ${detailItem(
          "Outside Organization",
          request.source_organization
        )}


        ${detailItem(
          "Outside Reference",
          request.source_reference_number
        )}


        ${detailItem(
          "Requester's Name",
          request.source_requester_name
        )}


        ${detailItem(
          "Requester's Email",
          request.source_requester_email
        )}


        ${detailItem(
          "Requester's Phone",
          request.source_requester_phone
        )}


        ${detailItem(
          "Other Identifying Factors",
          request.identifying_factors,
          true
        )}


        ${detailItem(
          "Management Notes",
          request.manager_notes,
          true
        )}

      </div>



      <!-- ================================================
           LOCATION
      ================================================= -->

      <section class="detail-section">

        <div class="detail-section-head">

          <div>

            <h3>
              Patient Location
            </h3>

            <div class="request-detail-small">
              Current location and movement history
            </div>

          </div>

        </div>


        <div class="location-panel">

          <div class="location-panel-top">

            <div>

              <div class="current-location-label">
                Current Location
              </div>

              <div class="current-location-value">

                ${escapeHtml(
                  request.room_last_known_location
                )}

              </div>

            </div>


            ${
              canModify
                ? `
                    <button
                      id="updateLocationButton"
                      class="button secondary"
                      type="button"
                    >
                      Update Location
                    </button>
                  `
                : ""
            }

          </div>


          <div
            id="locationHistory"
            class="location-history"
          >

            ${renderLocationHistory(
              locationHistory
            )}

          </div>

        </div>

      </section>



      <!-- ================================================
           AUTHORIZATIONS
      ================================================= -->

      <section class="detail-section">

        <div class="detail-section-head">

          <div>

            <h3>
              Identification Authorizations
            </h3>

            <div class="request-detail-small">
              Image and fingerprint authorization are
              tracked independently.
            </div>

          </div>

        </div>


        <div class="authorization-grid">

         ${renderAuthorizationCard(
  request,
  actions,
  actionApprovals,
  "image_request",
  "Image Request",
  imageProcessing,
  canModify
)}


${renderAuthorizationCard(
  request,
  actions,
  actionApprovals,
  "fingerprint",
  "Fingerprint Request",
  fingerprintProcessing,
  canModify
)}

        </div>

      </section>



      <!-- ================================================
           SUBJECT IMAGES
      ================================================= -->

      <section class="detail-section">

        <div class="detail-section-head">

          <div>

            <h3>
              Subject Images
            </h3>

            <div class="request-detail-small">
              Secure photographs associated with this
              unidentified subject.
            </div>

          </div>

        </div>


        ${
          canModify
            ? `
                <div class="upload-panel">

  <div class="upload-selection">

    <label>

      <span>
        Select Subject Image(s)
      </span>

      <input
        id="subjectImageFile"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
      >

    </label>


    <div
      id="selectedImageLabelList"
      class="selected-image-label-list"
    ></div>


    <button
      id="uploadSubjectImageButton"
      class="button primary"
      type="button"
      disabled
    >
      Upload Images
    </button>

  </div>

</div>
              `
            : ""
        }


        <div
          id="subjectImageGrid"
          class="image-grid"
        >

          <div class="loading-state">
            Loading images…
          </div>

        </div>

      </section>



      <!-- ================================================
           APPROVAL HISTORY
      ================================================= -->

      <section class="detail-section">

        <div class="detail-section-head">

          <h3>
            Approval History
          </h3>

        </div>

        <div id="approvalHistory"></div>

      </section>



      <!-- ================================================
           ACTIVITY HISTORY
      ================================================= -->

      <section class="detail-section">

        <div class="detail-section-head">

          <h3>
            Activity History
          </h3>

        </div>

        <div
          id="activityHistory"
          class="activity-list"
        ></div>

      </section>

    `;



    // =========================================================
    // REQUEST AN UNREQUESTED AUTHORIZATION
    // =========================================================

    document
      .querySelectorAll(
        ".request-detail-action-button"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () =>
              requestAdditionalAction(
                button.dataset.requestId,
                button.dataset.actionType
              )
          );

        }
      );

    // =========================================================
    // AUTHORIZATION PROGRESS
    // =========================================================

    wireAuthorizationProgressControls(
      request.id
    );
function wireAuthorizationProgressControls(
  requestId
) {

  // =======================================================
  // IMAGE COMPLETED
  // =======================================================

  $("imageCompletedCheckbox")
    ?.addEventListener(
      "change",
      async event => {

        if (!event.target.checked) {
          return;
        }


        event.target.disabled =
          true;


        try {

          const {
            error
          } =
            await db.rpc(
              "mark_identitylink_image_completed",
              {
                p_request_id:
                  requestId
              }
            );


          if (error) {
            throw error;
          }


          showMessage(
            "Image marked completed.",
            "success"
          );


          await openRequestDetail(
            requestId
          );

        }
        catch (error) {

          event.target.checked =
            false;

          event.target.disabled =
            false;


          showMessage(
            error.message ||
            "Unable to mark image completed.",
            "error"
          );

        }

      }
    );


  // =======================================================
  // FINGERPRINTS SUBMITTED
  // =======================================================

  $("fingerprintSubmittedCheckbox")
    ?.addEventListener(
      "change",
      async event => {

        if (!event.target.checked) {
          return;
        }


        event.target.disabled =
          true;


        try {

          // First try the simple RPC signature.
          // Older/newer database versions may only accept p_request_id.
          let result =
            await db.rpc(
              "mark_identitylink_fingerprints_submitted",
              {
                p_request_id:
                  requestId
              }
            );


          // If this deployment expects the optional notes parameter,
          // retry with the two-argument signature.
          if (
            result.error &&
            (
              result.error.code === "PGRST202" ||
              /function|schema cache|parameter|argument/i.test(
                result.error.message || ""
              )
            )
          ) {

            result =
              await db.rpc(
                "mark_identitylink_fingerprints_submitted",
                {
                  p_request_id:
                    requestId,

                  p_submission_notes:
                    null
                }
              );

          }


          if (result.error) {
            throw result.error;
          }


          showMessage(
            "Fingerprints marked submitted for processing.",
            "success"
          );


          await openRequestDetail(
            requestId
          );

        }
        catch (error) {

          console.error(
            "IdentityLink fingerprint submission error:",
            error
          );

          event.target.checked =
            false;

          event.target.disabled =
            false;


          showMessage(
            error.message ||
            "Unable to mark fingerprints submitted.",
            "error"
          );

        }

      }
    );


  // =======================================================
  // PROCESSED
  // =======================================================

  const processedCheckbox =
    $("fingerprintProcessedCheckbox");


  const resultsPanel =
    $("fingerprintResultsPanel");


  processedCheckbox
    ?.addEventListener(
      "change",
      event => {

        if (!resultsPanel) {
          return;
        }


        resultsPanel.hidden =
          !event.target.checked;

      }
    );

// =======================================================
// VERIFIED IDENTITY NAME
// =======================================================

const identityNameWrap =
  $("verifiedIdentityNameWrap");


const identityNameInput =
  $("verifiedIdentityName");


document
  .querySelectorAll(
    'input[name="fingerprintIdentityResult"]'
  )
  .forEach(
    radio => {

      radio.addEventListener(
        "change",
        event => {

          const verified =
            event.target.value ===
              "verified" &&
            event.target.checked;


          if (identityNameWrap) {

            identityNameWrap.hidden =
              !verified;

          }


          if (
            !verified &&
            identityNameInput
          ) {

            identityNameInput.value =
              "";

          }

        }
      );

    }
  );
  
  // =======================================================
  // SAVE RESULTS
  // =======================================================

  $("saveFingerprintResultsButton")
    ?.addEventListener(
      "click",
      async event => {

        const button =
          event.currentTarget;


        const identityResult =
          document.querySelector(
            'input[name="fingerprintIdentityResult"]:checked'
          )
            ?.value ||
          null;


        const identityName =
          $("verifiedIdentityName")
            ?.value
            ?.trim() ||
          null;


        const nextOfKinResult =
          document.querySelector(
            'input[name="fingerprintNokResult"]:checked'
          )
            ?.value ||
          null;


        if (
          !identityResult ||
          !nextOfKinResult
        ) {

          showMessage(
            "Select both an identity result and a next-of-kin result.",
            "error"
          );

          return;

        }


        if (
          identityResult === "verified" &&
          !identityName
        ) {

          showMessage(
            "Enter the verified identity name.",
            "error"
          );

          $("verifiedIdentityName")
            ?.focus();

          return;

        }


        button.disabled =
          true;

        button.textContent =
          "Saving Results…";


        try {

          // Deployed Supabase signature:
          // record_identitylink_fingerprint_results(
          //   p_request_id uuid,
          //   p_identity_result text,
          //   p_next_of_kin_result text,
          //   p_notes text
          // )
          const result =
            await db.rpc(
              "record_identitylink_fingerprint_results",
              {
                p_request_id:
                  requestId,

                p_identity_result:
                  identityResult,

                p_next_of_kin_result:
                  nextOfKinResult,

                p_notes:
                  identityResult === "verified" &&
                  identityName
                    ? `Verified Identity Name: ${identityName}`
                    : null
              }
            );


          if (result.error) {
            throw result.error;
          }


          showMessage(
            "Fingerprint processing results saved.",
            "success"
          );


          await Promise.all([
            loadRequests(),
            loadDashboardCounts()
          ]);


          await openRequestDetail(
            requestId
          );

        }
        catch (error) {

          console.error(
            "IdentityLink fingerprint results save error:",
            error
          );


          button.disabled =
            false;

          button.textContent =
            "Save Processing Results";


          showMessage(
            error.message ||
            "Unable to save fingerprint processing results.",
            "error"
          );

        }

      }
    );

}
  
    // =========================================================
    // EDIT SUBJECT
    // =========================================================

    $("editCurrentRequestButton")
      ?.addEventListener(
        "click",
        () => {

          openEditRequest(
            request
          );

        }
      );



    // =========================================================
    // UPDATE LOCATION
    // =========================================================

    $("updateLocationButton")
      ?.addEventListener(
        "click",
        async () => {

          const newLocation =
            window.prompt(
              "Enter the patient's new current location:",
              request.room_last_known_location ||
              ""
            );


          if (
            newLocation ===
            null
          ) {
            return;
          }


          if (
            !newLocation.trim()
          ) {

            showMessage(
              "Current location is required.",
              "error"
            );

            return;

          }


          const reason =
            window.prompt(
              "Optional: reason or note for this location change:"
            );


          try {

            const {
              error
            } =
              await db.rpc(
                "update_identitylink_location",
                {

                  p_request_id:
                    request.id,

                  p_new_location:
                    newLocation.trim(),

                  p_change_reason:
                    reason?.trim() ||
                    null

                }
              );


            if (error) {
              throw error;
            }


            showMessage(
              "Patient location updated and added to location history.",
              "success"
            );


            await Promise.all([
              loadRequests(),
              loadDashboardCounts()
            ]);


            await openRequestDetail(
              request.id
            );

          }
          catch (error) {

            console.error(
              "IdentityLink location update error:",
              error
            );


            showMessage(
              error.message ||
              "Unable to update patient location.",
              "error"
            );

          }

        }
      );



    // =========================================================
    // CANCEL FILE
    // =========================================================

    $("cancelCurrentRequestButton")
      ?.addEventListener(
        "click",
        async () => {

          const reason =
            window.prompt(
              "Enter the reason for cancelling this IdentityLink file:"
            );


          if (
            reason ===
            null
          ) {
            return;
          }


          if (
            !reason.trim()
          ) {

            showMessage(
              "A cancellation reason is required.",
              "error"
            );

            return;

          }


          try {

            const {
              error
            } =
              await db.rpc(
                "cancel_identitylink_request",
                {

                  p_request_id:
                    request.id,

                  p_reason:
                    reason.trim()

                }
              );


            if (error) {
              throw error;
            }


            showMessage(
              "IdentityLink file cancelled.",
              "success"
            );


            await Promise.all([
              loadRequests(),
              loadDashboardCounts()
            ]);


            await openRequestDetail(
              request.id
            );

          }
          catch (error) {

            console.error(
              "IdentityLink cancellation error:",
              error
            );


            showMessage(
              error.message ||
              "Unable to cancel IdentityLink file.",
              "error"
            );

          }

        }
      );


// =========================================================
// SUBJECT IMAGE UPLOAD EVENTS
// =========================================================

$("subjectImageFile")
  ?.addEventListener(
    "change",
    renderSelectedImageLabels
  );


$("uploadSubjectImageButton")
  ?.addEventListener(
    "click",
    () =>
      uploadSubjectImage(
        request.id
      )
  );



// =========================================================
// RENDER IMAGES / HISTORY
// =========================================================

await renderSubjectImages(
  files.filter(
    file =>
      file.file_type ===
      "subject_image"
  )
);


renderApprovalHistory(
  actionApprovals
);


renderActivityHistory(
  activity
);


} 

  // =========================================================
// AUTHORIZATION CARD
// =========================================================

function renderAuthorizationCard(
  request,
  actions,
  approvals,
  actionType,
  label,
  processing,
  canModify
) {

  const action =
    actions.find(
      item =>
        item.action_type ===
        actionType
    );


  const status =
    action?.status ||
    "not_requested";


  const approverInitiated =
    approvals.some(
      approval =>
        approval.action_type ===
          actionType &&
        approval.action_snapshot
          ?.approver_activated_action ===
          true
    );


  if (
    status ===
    "not_requested"
  ) {

    return `
      <article class="authorization-card not-requested">

        <h4>
          ${escapeHtml(label)}
        </h4>

        <div class="authorization-status">

          <span class="not-requested-pill">
            Not Requested
          </span>

        </div>

        <div class="authorization-meta">
          This authorization has not been requested.
        </div>

        <div class="authorization-actions">

          <button
            class="button secondary request-detail-action-button"
            type="button"
            data-request-id="${escapeHtml(request.id)}"
            data-action-type="${escapeHtml(actionType)}"
          >
            ${
              actionType === "image_request"
                ? "Request Image Approval"
                : "Request Fingerprint Approval"
            }
          </button>

        </div>

      </article>
    `;

  }


  return `
    <article class="authorization-card ${escapeHtml(status)}">

      <h4>
        ${escapeHtml(label)}
      </h4>

      <div class="authorization-status">

        <span class="status-pill status-${escapeHtml(status)}">
          ${escapeHtml(statusLabel(status))}
        </span>

      </div>


      ${
        approverInitiated
          ? `
              <span class="approver-initiated-badge">
                APPROVER INITIATED
              </span>
            `
          : ""
      }


         <div class="authorization-meta">

        ${
          action?.requested_by_name
            ? `
                Requested / Activated by:
                <strong>
                  ${escapeHtml(action.requested_by_name)}
                </strong>
                <br>
              `
            : ""
        }

        ${
          action?.requested_at
            ? escapeHtml(
                formatDateTime(
                  action.requested_at
                )
              )
            : ""
        }

      </div>


      ${
        status === "approved"
          ? renderAuthorizationProgressControls(
              request.id,
              actionType,
              processing,
              canModify
            )
          : ""
      }


    </article>
  `;

}

// =========================================================
// AUTHORIZATION PROGRESS CONTROLS
// =========================================================

function renderAuthorizationProgressControls(
  requestId,
  actionType,
  processing,
  canModify
) {

  const status =
    processing?.status ||
    "not_started";


  // =======================================================
  // IMAGE COMPLETED
  // =======================================================

  if (
    actionType ===
    "image_request"
  ) {

    const completed =
      status ===
      "completed";


    return `
      <div class="authorization-progress">

        <label class="workflow-checkbox">

          <input
            id="imageCompletedCheckbox"
            type="checkbox"
            data-request-id="${escapeHtml(requestId)}"
            ${completed ? "checked" : ""}
            ${
              completed
                ? "disabled"
                : ""
            }
          >

          <span>
            Image Completed
          </span>

        </label>


        ${
          completed
            ? `
                <div class="workflow-complete-meta">

                  ✓ Image Completed

                  ${
                    processing.completed_by_name
                      ? `
                          by
                          ${escapeHtml(
                            processing.completed_by_name
                          )}
                        `
                      : ""
                  }

                  ${
                    processing.completed_at
                      ? `
                          <br>
                          ${escapeHtml(
                            formatDateTime(
                              processing.completed_at
                            )
                          )}
                        `
                      : ""
                  }

                </div>
              `
            : ""
        }

      </div>
    `;

  }


  // =======================================================
  // FINGERPRINT PROCESSING
  // =======================================================

  const submitted =
    status === "submitted" ||
    status === "completed";


  const processed =
    status === "completed";


  const identityResult =
    processing?.identity_result ||
    "";


  const identityName =
    processing?.identity_name ||
    (
      typeof processing?.results_notes === "string" &&
      processing.results_notes.startsWith(
        "Verified Identity Name:"
      )
        ? processing.results_notes
            .replace(
              /^Verified Identity Name:\s*/,
              ""
            )
            .trim()
        : ""
    );


  const nextOfKinResult =
    processing?.next_of_kin_result ||
    "";


  const identityResultLabel =
    identityResult === "verified"
      ? "Identity Verified"
      : identityResult === "unverified"
        ? "Identity Not Verified"
        : "Not recorded";


  const nextOfKinResultLabel =
    nextOfKinResult === "provided"
      ? "Next of Kin Provided"
      : nextOfKinResult === "no_next_of_kin"
        ? "No Next of Kin"
        : "Not recorded";


  if (processed) {

    return `
      <div class="authorization-progress fingerprint-progress">

        <label class="workflow-checkbox">

          <input
            id="fingerprintSubmittedCheckbox"
            type="checkbox"
            data-request-id="${escapeHtml(requestId)}"
            checked
            disabled
          >

          <span>
            Fingerprints Submitted
          </span>

        </label>


        <label class="workflow-checkbox">

          <input
            id="fingerprintProcessedCheckbox"
            type="checkbox"
            data-request-id="${escapeHtml(requestId)}"
            checked
            disabled
          >

          <span>
            Processed
          </span>

        </label>


        <div class="workflow-complete-meta fingerprint-complete-meta">

          <strong>
            ✓ Fingerprint Processing Completed
          </strong>

          <div>
            Identity Result:
            <strong>
              ${escapeHtml(identityResultLabel)}
            </strong>
          </div>

          ${
            identityResult === "verified" &&
            identityName
              ? `
                  <div>
                    Verified Identity Name:
                    <strong>
                      ${escapeHtml(identityName)}
                    </strong>
                  </div>
                `
              : ""
          }

          <div>
            Next of Kin:
            <strong>
              ${escapeHtml(nextOfKinResultLabel)}
            </strong>
          </div>

          ${
            processing?.results_recorded_by_name
              ? `
                  <div>
                    Recorded by:
                    <strong>
                      ${escapeHtml(
                        processing.results_recorded_by_name
                      )}
                    </strong>
                  </div>
                `
              : ""
          }

          ${
            processing?.results_recorded_at
              ? `
                  <div>
                    ${escapeHtml(
                      formatDateTime(
                        processing.results_recorded_at
                      )
                    )}
                  </div>
                `
              : ""
          }

        </div>

      </div>
    `;

  }


  return `
    <div class="authorization-progress fingerprint-progress">


      <label class="workflow-checkbox">

        <input
          id="fingerprintSubmittedCheckbox"
          type="checkbox"
          data-request-id="${escapeHtml(requestId)}"
          ${submitted ? "checked" : ""}
          ${
            submitted
              ? "disabled"
              : ""
          }
        >

        <span>
          Fingerprints Submitted
        </span>

      </label>


      <label class="workflow-checkbox">

        <input
          id="fingerprintProcessedCheckbox"
          type="checkbox"
          data-request-id="${escapeHtml(requestId)}"
          ${processed ? "checked" : ""}
          ${
            !submitted ||
            processed
              ? "disabled"
              : ""
          }
        >

        <span>
          Processed
        </span>

      </label>


      <div
        id="fingerprintResultsPanel"
        class="fingerprint-results-panel"
        ${processed ? "" : "hidden"}
      >


        <div class="fingerprint-result-group">

          <strong>
            Identity Result
          </strong>


          <label class="workflow-radio">

            <input
              type="radio"
              name="fingerprintIdentityResult"
              value="verified"
              ${
                identityResult === "verified"
                  ? "checked"
                  : ""
              }
            >

            Identity Verified

          </label>

<div
  id="verifiedIdentityNameWrap"
  class="verified-identity-name"
  ${identityResult === "verified" ? "" : "hidden"}
>

  <label for="verifiedIdentityName">
    Verified Identity Name
  </label>

  <input
    id="verifiedIdentityName"
    type="text"
    maxlength="150"
    autocomplete="off"
    placeholder="Enter verified first and last name"
    value="${escapeHtml(identityName)}"
  >

  <small>
    Enter the name returned through fingerprint identification.
  </small>

</div>
          <label class="workflow-radio">

            <input
              type="radio"
              name="fingerprintIdentityResult"
              value="unverified"
              ${
                identityResult === "unverified"
                  ? "checked"
                  : ""
              }
            >


            Identity Not Verified

          </label>

        </div>


        <div class="fingerprint-result-group">

          <strong>
            Next of Kin
          </strong>


          <label class="workflow-radio">

            <input
              type="radio"
              name="fingerprintNokResult"
              value="provided"
              ${
                nextOfKinResult === "provided"
                  ? "checked"
                  : ""
              }
            >

            Next of Kin Provided

          </label>


          <label class="workflow-radio">

            <input
              type="radio"
              name="fingerprintNokResult"
              value="no_next_of_kin"
              ${
                nextOfKinResult === "no_next_of_kin"
                  ? "checked"
                  : ""
              }
            >

            No Next of Kin

          </label>

        </div>


        <button
          id="saveFingerprintResultsButton"
          class="button primary"
          type="button"
        >
          ${
            processed
              ? "Update Processing Results"
              : "Save Processing Results"
          }
        </button>

      </div>

    </div>
  `;

}
  
// =========================================================
// LOCATION HISTORY
// =========================================================

function renderLocationHistory(
  history
) {

  if (
    !history.length
  ) {

    return `
      <div class="empty-state">
        No location history recorded.
      </div>
    `;

  }


  return history
    .map(
      item => `
        <article class="location-history-item">

          <strong>
            ${escapeHtml(item.new_location)}
          </strong>

          ${
            item.previous_location
              ? `
                  <div>
                    Previous:
                    ${escapeHtml(item.previous_location)}
                  </div>
                `
              : `
                  <div>
                    Initial location
                  </div>
                `
          }

          ${
            item.change_reason
              ? `
                  <div>
                    ${escapeHtml(item.change_reason)}
                  </div>
                `
              : ""
          }

          <span>
            ${escapeHtml(item.changed_by_name)}
            •
            ${escapeHtml(formatDateTime(item.changed_at))}
          </span>

        </article>
      `
    )
    .join("");

}


// =========================================================
// DETAIL ITEM
// =========================================================

function detailItem(
  label,
  value,
  wide = false
) {

  return `
    <div class="detail-item ${wide ? "wide" : ""}">

      <span class="label">
        ${escapeHtml(label)}
      </span>

      <div class="value">
        ${escapeHtml(value || "—")}
      </div>

    </div>
  `;

}
  
     // =========================================================
  // SUBJECT IMAGE UPLOAD
  // =========================================================

  function renderSelectedImageLabels() {

    const fileInput =
      $("subjectImageFile");

    const container =
      $("selectedImageLabelList");

    const uploadButton =
      $("uploadSubjectImageButton");


    if (
      !fileInput ||
      !container ||
      !uploadButton
    ) {
      return;
    }


    const files =
      Array.from(
        fileInput.files ||
        []
      );


    if (!files.length) {

      container.innerHTML =
        "";

      uploadButton.disabled =
        true;

      return;
    }


    container.innerHTML =
      files
        .map(
          (
            file,
            index
          ) => `
            <div class="selected-image-label-row">

              <div class="selected-image-file">

                <span class="selected-image-number">
                  ${index + 1}
                </span>

                <div>

                  <strong>
                    ${escapeHtml(file.name)}
                  </strong>

                  <span>
                    ${formatFileSize(file.size)}
                  </span>

                </div>

              </div>


              <label>

                <span>
                  Image Label
                </span>

                <input
                  class="subject-image-label-input"
                  type="text"
                  data-image-index="${index}"
                  placeholder="Example: Front facial image"
                  required
                >

              </label>

            </div>
          `
        )
        .join("");


    uploadButton.disabled =
      false;

  }



  function formatFileSize(
    bytes
  ) {

    if (
      !Number.isFinite(bytes)
    ) {
      return "";
    }


    if (
      bytes <
      1024 * 1024
    ) {

      return `${
        Math.max(
          1,
          Math.round(
            bytes / 1024
          )
        )
      } KB`;

    }


    return `${
      (
        bytes /
        (
          1024 *
          1024
        )
      )
        .toFixed(1)
    } MB`;

  }



  async function uploadSubjectImage(
    requestId
  ) {

    const fileInput =
      $("subjectImageFile");

    const uploadButton =
      $("uploadSubjectImageButton");


    if (
      !fileInput ||
      !uploadButton
    ) {
      return;
    }


    const files =
      Array.from(
        fileInput.files ||
        []
      );


    if (!files.length) {

      showMessage(
        "Select at least one image before uploading.",
        "error"
      );

      return;
    }


    const labelInputs =
      Array.from(
        document.querySelectorAll(
          ".subject-image-label-input"
        )
      );


    const labels =
      files.map(
        (
          file,
          index
        ) => {

          const input =
            labelInputs.find(
              item =>
                Number(
                  item.dataset.imageIndex
                ) ===
                index
            );


          return input
            ?.value
            ?.trim() ||
            "";

        }
      );


    const missingLabelIndex =
      labels.findIndex(
        label =>
          !label
      );


    if (
      missingLabelIndex !==
      -1
    ) {

      showMessage(
        `Enter a label for image ${
          missingLabelIndex + 1
        } before uploading.`,
        "error"
      );


      labelInputs[
        missingLabelIndex
      ]
        ?.focus();


      return;

    }


    const allowedTypes =
      [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];


    const invalidFile =
      files.find(
        file =>
          !allowedTypes.includes(
            file.type
          )
      );


    if (invalidFile) {

      showMessage(
        `${invalidFile.name} must be JPEG, PNG, or WebP.`,
        "error"
      );

      return;

    }


    const oversizedFile =
      files.find(
        file =>
          file.size >
          15728640
      );


    if (oversizedFile) {

      showMessage(
        `${oversizedFile.name} exceeds the 15 MB limit.`,
        "error"
      );

      return;

    }


    const originalText =
      uploadButton.textContent;


    uploadButton.disabled =
      true;


    let uploadedCount =
      0;


    try {

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {

        const file =
          files[index];


        const label =
          labels[index];


        uploadButton.textContent =
          `Uploading ${index + 1} of ${files.length}…`;


        const extension =
          (
            file.name
              .split(".")
              .pop() ||
            "jpg"
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]/g,
              ""
            ) ||
          "jpg";


        const storageName =
          `${crypto.randomUUID()}.${extension}`;


        const storagePath =
          `requests/${requestId}/subject/${storageName}`;


        // -----------------------------------------------------
        // UPLOAD TO PRIVATE STORAGE
        // -----------------------------------------------------

        const {
          error: uploadError
        } =
          await db.storage
            .from(
              "identitylink-subject-files"
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
                  file.type

              }
            );


        if (uploadError) {

          throw new Error(
            `${file.name}: ${
              uploadError.message ||
              "Storage upload failed."
            }`
          );

        }


        // -----------------------------------------------------
        // REGISTER WITH IDENTITYLINK
        // -----------------------------------------------------

        const {
          error: registerError
        } =
          await db.rpc(
            "register_identitylink_subject_image",
            {

              p_request_id:
                requestId,

              p_storage_path:
                storagePath,

              p_file_name:
                file.name,

              p_mime_type:
                file.type,

              p_file_size_bytes:
                file.size,

              p_description:
                label

            }
          );


        if (registerError) {

          throw new Error(
            `${file.name}: ${
              registerError.message ||
              "Unable to register subject image."
            }`
          );

        }


        uploadedCount +=
          1;

      }


      fileInput.value =
        "";


      const labelList =
        $("selectedImageLabelList");


      if (labelList) {

        labelList.innerHTML =
          "";

      }


      showMessage(
        `${uploadedCount} subject image${
          uploadedCount === 1
            ? ""
            : "s"
        } uploaded securely.`,
        "success"
      );


      await Promise.all([
        loadRequests(),
        loadDashboardCounts()
      ]);


      await openRequestDetail(
        requestId
      );

    }
    catch (error) {

      console.error(
        "IdentityLink image upload error:",
        error
      );


      const partialMessage =
        uploadedCount > 0
          ? `${uploadedCount} image${
              uploadedCount === 1
                ? ""
                : "s"
            } uploaded before the error. `
          : "";


      showMessage(
        partialMessage +
        (
          error.message ||
          "Unable to upload subject images."
        ),
        "error"
      );

    }
    finally {

      uploadButton.disabled =
        false;


      uploadButton.textContent =
        originalText ||
        "Upload Images";

    }

  }



  // =========================================================
  // SUBJECT IMAGE DISPLAY
  // =========================================================

  async function renderSubjectImages(
    images
  ) {

    const grid =
      $("subjectImageGrid");


    if (!grid) {
      return;
    }


    if (
      !images.length
    ) {

      grid.innerHTML =
        `
          <div class="empty-state">
            No subject images have been uploaded.
          </div>
        `;

      return;

    }


    const cards =
      [];


    for (
      const image
      of images
    ) {

      const {
        data,
        error
      } =
        await db.storage
          .from(
            "identitylink-subject-files"
          )
          .createSignedUrl(
            image.storage_path,
            900
          );


      if (
        error ||
        !data?.signedUrl
      ) {

        cards.push(
          `
            <article class="image-card subject-image-card">

              <div class="image-info">

                <strong>
                  ${escapeHtml(
                    image.description ||
                    image.file_name
                  )}
                </strong>

                <span>
                  Image unavailable
                </span>

              </div>

            </article>
          `
        );

        continue;

      }


      cards.push(
        `
          <article class="image-card subject-image-card">

            ${
              isRequestOpen(
                currentDetail?.request
              )
                  ? `
                      <button
                        class="subject-image-delete-button"
                        type="button"
                        data-file-id="${escapeHtml(image.id)}"
                        data-storage-path="${escapeHtml(image.storage_path)}"
                        data-file-label="${escapeHtml(
                          image.description ||
                          image.file_name
                        )}"
                        title="Delete this image"
                        aria-label="Delete ${escapeHtml(
                          image.description ||
                          image.file_name
                        )}"
                      >
                        ×
                      </button>
                    `
                  : ""
            }


            <img
              src="${escapeHtml(data.signedUrl)}"
              alt="${escapeHtml(
                image.description ||
                "IdentityLink subject image"
              )}"
              data-full-image="${escapeHtml(
                data.signedUrl
              )}"
            >


            <div class="image-info">

              <strong>
                ${escapeHtml(
                  image.description ||
                  image.file_name
                )}
              </strong>


              <span>
                ${escapeHtml(
                  image.file_name
                )}
              </span>


              <span>
                Uploaded by
                ${escapeHtml(
                  image.uploaded_by_name
                )}
              </span>


              <span>
                ${escapeHtml(
                  formatDateTime(
                    image.created_at
                  )
                )}
              </span>

            </div>

          </article>
        `
      );

    }


    // IMPORTANT:
    // Put the generated cards into the page BEFORE
    // attaching click/delete listeners.

    grid.innerHTML =
      cards.join("");


    // =======================================================
    // FULL IMAGE VIEWER
    // =======================================================

    grid
      .querySelectorAll(
        "[data-full-image]"
      )
      .forEach(
        image => {

          image.addEventListener(
            "click",
            () => {

              fullImage.src =
                image.dataset.fullImage;


              imageModal.classList.remove(
                "hidden"
              );

            }
          );

        }
      );


    // =======================================================
    // DELETE IMAGE
    // =======================================================

    grid
      .querySelectorAll(
        ".subject-image-delete-button"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            async event => {

              event.stopPropagation();


              const fileId =
                button.dataset.fileId;


              const storagePath =
                button.dataset.storagePath;


              const label =
                button.dataset.fileLabel ||
                "this image";


              const requestId =
                currentDetail
                  ?.request
                  ?.id;


              if (!requestId) {

                showMessage(
                  "Unable to determine the IdentityLink subject file.",
                  "error"
                );

                return;

              }


              const confirmed =
                window.confirm(
                  `Delete "${label}" from this IdentityLink subject file?`
                );


              if (!confirmed) {
                return;
              }


              button.disabled =
                true;


              try {

                // ------------------------------------------------
                // REMOVE FROM PRIVATE STORAGE
                // ------------------------------------------------

                const {
                  error: storageError
                } =
                  await db.storage
                    .from(
                      "identitylink-subject-files"
                    )
                    .remove(
                      [
                        storagePath
                      ]
                    );


                if (storageError) {
                  throw storageError;
                }


                // ------------------------------------------------
                // REMOVE IDENTITYLINK FILE RECORD
                // ------------------------------------------------

                const {
                  error: recordError
                } =
                  await db.rpc(
                    "delete_identitylink_subject_image_record",
                    {

                      p_file_id:
                        fileId

                    }
                  );


                if (recordError) {
                  throw recordError;
                }


                showMessage(
                  `"${label}" deleted.`,
                  "success"
                );


                await Promise.all([
                  loadRequests(),
                  loadDashboardCounts()
                ]);


                await openRequestDetail(
                  requestId
                );

              }
              catch (error) {

                console.error(
                  "IdentityLink image deletion error:",
                  error
                );


                showMessage(
                  error.message ||
                  "Unable to delete subject image.",
                  "error"
                );


                button.disabled =
                  false;

              }

            }
          );

        }
      );

  }

  // =========================================================
  // APPROVAL HISTORY
  // =========================================================

  function renderApprovalHistory(
    approvals
  ) {

    const container =
      $("approvalHistory");


    if (!container) {
      return;
    }


    if (
      !approvals.length
    ) {

      container.innerHTML =
        `
          <div class="empty-state">
            No approval decision has been recorded.
          </div>
        `;

      return;

    }


    container.innerHTML =
      approvals
        .map(
          approval => `
            <article class="approval-card">

          <strong>
  ${
    approval.action_type ===
    "image_request"
      ? "Image Request"
      : "Fingerprint Request"
  }
</strong>

<br><br>      
              <span class="status-pill status-${escapeHtml(approval.decision)}">
                ${escapeHtml(statusLabel(approval.decision))}
              </span>

              <p>
                <strong>
                  ${escapeHtml(approval.approver_display_name)}
                </strong>
              </p>

              ${
                approval.decision_notes
                  ? `
                      <p>
                        ${escapeHtml(approval.decision_notes)}
                      </p>
                    `
                  : ""
              }

              ${
                approval.typed_signature
                  ? `
                      <p>
                        <strong>
                          Electronic Signature:
                        </strong>
                        ${escapeHtml(approval.typed_signature)}
                      </p>
                    `
                  : ""
              }

              <div class="request-detail-small">
                ${
                  escapeHtml(
                    formatDateTime(
                      approval.signed_at ||
                      approval.created_at
                    )
                  )
                }
              </div>

            </article>
          `
        )
        .join("");

  }



  // =========================================================
  // ACTIVITY HISTORY
  // =========================================================

  function renderActivityHistory(
    activity
  ) {

    const container =
      $("activityHistory");


    if (!container) {
      return;
    }


    if (
      !activity.length
    ) {

      container.innerHTML =
        `
          <div class="empty-state">
            No activity has been recorded.
          </div>
        `;

      return;

    }


    container.innerHTML =
      activity
        .map(
          item => `
            <article class="activity-item">

              <strong>
                ${escapeHtml(
                  String(
                    item.action_type ||
                    ""
                  )
                    .replaceAll("_", " ")
                    .replace(
                      /\b\w/g,
                      character =>
                        character.toUpperCase()
                    )
                )}
              </strong>

              ${
                item.notes
                  ? `
                      <div>
                        ${escapeHtml(item.notes)}
                      </div>
                    `
                  : ""
              }

              <span>
                ${escapeHtml(item.actor_display_name)}
                •
                ${escapeHtml(formatDateTime(item.occurred_at))}
              </span>

            </article>
          `
        )
        .join("");

  }



  // =========================================================
  // CLOSE MODALS
  // =========================================================

  $("closeDetailModalButton")
    ?.addEventListener(
      "click",
      () => {

        detailModal.classList.add(
          "hidden"
        );

        currentDetail =
          null;

      }
    );


  $("closeImageModalButton")
    ?.addEventListener(
      "click",
      () => {

        imageModal.classList.add(
          "hidden"
        );

        fullImage.src =
          "";

      }
    );


  imageModal
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          imageModal
        ) {

          imageModal.classList.add(
            "hidden"
          );

          fullImage.src =
            "";

        }

      }
    );



  // =========================================================
  // REFRESH
  // =========================================================

  $("refreshButton")
    ?.addEventListener(
      "click",
      async () => {

        const button =
          $("refreshButton");


        button.disabled =
          true;


        const original =
          button.textContent;


        button.textContent =
          "Refreshing…";


        try {

          await Promise.all([
            loadRequests(),
            loadDashboardCounts()
          ]);


          showMessage(
            "IdentityLink refreshed.",
            "success"
          );

        }
        catch (error) {

          console.error(
            "IdentityLink refresh error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to refresh IdentityLink.",
            "error"
          );

        }
        finally {

          button.disabled =
            false;

          button.textContent =
            original;

        }

      }
    );



  // =========================================================
  // INITIAL LOAD
  // =========================================================

  try {

    await Promise.all([
      loadRequests(),
      loadDashboardCounts()
    ]);

  }
  catch (error) {

    console.error(
      "IdentityLink initial load error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to load IdentityLink.",
      "error"
    );


    if (requestList) {

      requestList.innerHTML =
        `
          <div class="empty-state">
            IdentityLink records could not be loaded.
          </div>
        `;

    }

  }

})();
