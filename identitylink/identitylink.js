(async function () {

  "use strict";


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


    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_management_requests",
        {
          p_search:
            searchValue,

          p_status:
            statusValue
        }
      );


    if (error) {
      throw error;
    }


    currentRequests =
      data ||
      [];


    renderRequests();

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
              <article class="request-row">

                <div>

                  <span class="request-label">
                    Request
                  </span>

                  <span class="request-number">
                    ${escapeHtml(item.request_number)}
                  </span>

                  <span class="request-detail-small">
                    ${escapeHtml(requestTypeLabel(item.request_type))}
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

                  <span class="status-pill ${statusClass}">
                    ${escapeHtml(statusLabel(item.status))}
                  </span>

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


    $("pendingCount").textContent =
      String(
        all.filter(
          item =>
            item.status ===
            "pending"
        ).length
      );


    $("changesCount").textContent =
      String(
        all.filter(
          item =>
            item.status ===
            "changes_requested"
        ).length
      );


    $("approvedCount").textContent =
      String(
        all.filter(
          item =>
            item.status ===
            "approved"
        ).length
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

    $("requestModalTitle").textContent =
      "New Identity Request";

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

  function getRequestFormValues() {

    return {

      p_request_type:
        $("requestType").value,

      p_patient_alias:
        $("patientAlias").value.trim(),

      p_mrn_patient_number:
        $("mrnPatientNumber").value.trim(),

      p_room_last_known_location:
        $("lastKnownLocation").value.trim(),

      p_identifying_factors:
        $("identifyingFactors").value.trim() ||
        null,

      p_source_organization:
        $("sourceOrganization").value.trim() ||
        null,

      p_source_requester_name:
        $("sourceRequesterName").value.trim() ||
        null,

      p_source_requester_email:
        $("sourceRequesterEmail").value.trim() ||
        null,

      p_source_requester_phone:
        $("sourceRequesterPhone").value.trim() ||
        null,

      p_source_reference_number:
        $("sourceReferenceNumber").value.trim() ||
        null,

      p_manager_notes:
        $("managerNotes").value.trim() ||
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

          const values =
            getRequestFormValues();


          const editingId =
            $("editingRequestId")
              .value;


          let result;


          if (editingId) {

            result =
              await db.rpc(
                "update_identitylink_request",
                {
                  p_request_id:
                    editingId,

                  ...values
                }
              );

          }
          else {

            result =
              await db.rpc(
                "create_identitylink_request",
                values
              );

          }


          if (result.error) {
            throw result.error;
          }


          closeRequestModal();


          showMessage(
            editingId
              ? "IdentityLink request updated and submitted for approval."
              : `IdentityLink request ${result.data?.request_number || ""} submitted for approval.`,
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

        }
        catch (error) {

          console.error(
            "IdentityLink request save error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to save IdentityLink request.",
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
      ![
        "pending",
        "changes_requested"
      ].includes(
        request.status
      )
    ) {

      showMessage(
        "This IdentityLink request can no longer be edited.",
        "error"
      );

      return;

    }


    $("editingRequestId").value =
      request.id;


    $("requestType").value =
      request.request_type ||
      "";


    $("patientAlias").value =
      request.patient_alias ||
      "";


    $("mrnPatientNumber").value =
      request.mrn_patient_number ||
      "";


    $("lastKnownLocation").value =
      request.room_last_known_location ||
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
      request.status ===
      "changes_requested"
        ? "Save & Resubmit"
        : "Save Changes";


    requestModal.classList.remove(
      "hidden"
    );

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


    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_management_request_detail",
        {
          p_request_id:
            requestId
        }
      );


    if (error) {

      detailModal.classList.add(
        "hidden"
      );

      throw error;

    }


    currentDetail =
      data;


    renderRequestDetail();

  }



  async function renderRequestDetail() {

    if (
      !currentDetail?.request
    ) {
      return;
    }


    const request =
      currentDetail.request;


    const files =
      currentDetail.files ||
      [];


    const approvals =
      currentDetail.approvals ||
      [];


    const activity =
      currentDetail.activity ||
      [];


    $("detailRequestNumber").textContent =
      request.request_number;


    const canModify =
      [
        "pending",
        "changes_requested"
      ].includes(
        request.status
      );


    detailBody.innerHTML =
      `

        <div class="detail-top">

          <div>

            <span class="status-pill status-${escapeHtml(request.status)}">
              ${escapeHtml(statusLabel(request.status))}
            </span>

            <div class="request-detail-small">
              Submitted
              ${escapeHtml(formatDateTime(request.submitted_at))}
              by
              ${escapeHtml(request.submitted_by_name)}
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
                      Edit Request
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
                      Cancel Request
                    </button>
                  `
                : ""
            }

          </div>

        </div>



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
            "Request Type",
            requestTypeLabel(
              request.request_type
            )
          )}

          ${detailItem(
            "Room / Last Known Location",
            request.room_last_known_location
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

                    <div class="upload-row">

                      <label>

                        <span>
                          Select Subject Image
                        </span>

                        <input
                          id="subjectImageFile"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                        >

                      </label>


                      <label>

                        <span>
                          Image Description
                        </span>

                        <input
                          id="subjectImageDescription"
                          type="text"
                          placeholder="Example: Front facial image"
                        >

                      </label>


                      <button
                        id="uploadSubjectImageButton"
                        class="button primary"
                        type="button"
                      >
                        Upload Image
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



        <section class="detail-section">

          <div class="detail-section-head">

            <h3>
              Approval History
            </h3>

          </div>

          <div id="approvalHistory"></div>

        </section>



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


    $("editCurrentRequestButton")
      ?.addEventListener(
        "click",
        () => {

          openEditRequest(
            request
          );

        }
      );


    $("cancelCurrentRequestButton")
      ?.addEventListener(
        "click",
        async () => {

          const reason =
            window.prompt(
              "Enter the reason for cancelling this IdentityLink request:"
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
              "IdentityLink request cancelled.",
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

            showMessage(
              error.message ||
              "Unable to cancel request.",
              "error"
            );

          }

        }
      );


    $("uploadSubjectImageButton")
      ?.addEventListener(
        "click",
        () =>
          uploadSubjectImage(
            request.id
          )
      );


    await renderSubjectImages(
      files.filter(
        file =>
          file.file_type ===
          "subject_image"
      )
    );


    renderApprovalHistory(
      approvals
    );


    renderActivityHistory(
      activity
    );

  }



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

  async function uploadSubjectImage(
    requestId
  ) {

    const fileInput =
      $("subjectImageFile");


    const descriptionInput =
      $("subjectImageDescription");


    const uploadButton =
      $("uploadSubjectImageButton");


    const file =
      fileInput?.files?.[0];


    if (!file) {

      showMessage(
        "Select an image before uploading.",
        "error"
      );

      return;

    }


    const allowedTypes =
      [
        "image/jpeg",
        "image/png",
        "image/webp"
      ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      showMessage(
        "Subject images must be JPEG, PNG, or WebP.",
        "error"
      );

      return;

    }


    if (
      file.size >
      15728640
    ) {

      showMessage(
        "Subject images may not exceed 15 MB.",
        "error"
      );

      return;

    }


    uploadButton.disabled =
      true;


    uploadButton.textContent =
      "Uploading…";


    try {

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
        throw uploadError;
      }


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
              descriptionInput
                ?.value
                ?.trim() ||
              null

          }
        );


      if (registerError) {
        throw registerError;
      }


      showMessage(
        "Subject image uploaded securely.",
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


      showMessage(
        error.message ||
        "Unable to upload subject image.",
        "error"
      );

    }
    finally {

      uploadButton.disabled =
        false;

      uploadButton.textContent =
        "Upload Image";

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
            <article class="image-card">

              <div class="image-info">

                <strong>
                  ${escapeHtml(image.file_name)}
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
          <article class="image-card">

            <img
              src="${escapeHtml(data.signedUrl)}"
              alt="${escapeHtml(image.description || "IdentityLink subject image")}"
              data-full-image="${escapeHtml(data.signedUrl)}"
            >

            <div class="image-info">

              <strong>
                ${escapeHtml(image.description || image.file_name)}
              </strong>

              <span>
                Uploaded by
                ${escapeHtml(image.uploaded_by_name)}
              </span>

              <span>
                ${escapeHtml(formatDateTime(image.created_at))}
              </span>

            </div>

          </article>
        `
      );

    }


    grid.innerHTML =
      cards.join("");


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
