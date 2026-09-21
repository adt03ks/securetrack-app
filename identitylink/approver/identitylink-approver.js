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
      String(value ?? "")
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

        return String(value);

      }


      return date.toLocaleString();

    };


  const statusLabel =
    value => {

      const labels = {

        not_requested:
          "Not Requested",

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

        open:
          "Open",

        closed:
          "Closed"

      };


      return labels[value] ||
        value ||
        "Unknown";

    };


  const actionLabel =
    value =>
      value === "image_request"
        ? "Image Request"
        : value === "fingerprint"
          ? "Fingerprint Request"
          : value ||
            "Authorization";


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
  // SUPABASE CLIENT
  // =========================================================

  const cfg =
    window.SECURETRACK_CONFIG ||
    {};


  if (
    !cfg.supabaseUrl ||
    !cfg.supabaseAnonKey
  ) {

    showMessage(
      "IdentityLink configuration is unavailable.",
      "error"
    );

    return;

  }


  if (
    !window.supabase?.createClient
  ) {

    showMessage(
      "The Supabase client could not be loaded.",
      "error"
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



  // =========================================================
  // ELEMENT REFERENCES / STATE
  // =========================================================

  const loginView =
    $("loginView");


  const appView =
    $("appView");


  const loginForm =
    $("loginForm");


  const requestList =
    $("requestList");


  const searchInput =
    $("searchInput");


  const statusFilter =
    $("statusFilter");


  const detailModal =
    $("detailModal");


  const detailBody =
    $("detailBody");


  const decisionModal =
    $("decisionModal");


  const decisionForm =
    $("decisionForm");


  const imageModal =
    $("imageModal");


  const fullImage =
    $("fullImage");


  let currentRequests =
    [];


  let currentDetail =
    null;


  let accessContext =
    null;



  // =========================================================
  // VIEW HELPERS
  // =========================================================

  function showLoginView() {

    loginView
      ?.classList
      .remove("hidden");


    appView
      ?.classList
      .add("hidden");

  }


  function showAppView() {

    loginView
      ?.classList
      .add("hidden");


    appView
      ?.classList
      .remove("hidden");

  }



  // =========================================================
  // ACCESS VERIFICATION
  // =========================================================

  async function getAccessContext() {

    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_access_context"
      );


    if (error) {
      throw error;
    }


    return Array.isArray(data)
      ? data[0] || null
      : data || null;

  }


  async function verifyApproverAccess() {

    const {
      data: {
        session
      },
      error:
        sessionError
    } =
      await db
        .auth
        .getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session) {

      accessContext =
        null;


      showLoginView();


      return false;

    }


    const context =
      await getAccessContext();


    if (
      !context?.is_approver ||
      !context?.identitylink_access
    ) {

      accessContext =
        context;


      showLoginView();


      return false;

    }


    accessContext =
      context;


    $("currentUserName").textContent =
      context.display_name ||
      session.user.email ||
      "IdentityLink Approver";


    showAppView();


    return true;

  }



  // =========================================================
  // LOGIN / SIGN OUT
  // =========================================================

  loginForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const email =
          $("loginEmail")
            .value
            .trim();


        const password =
          $("loginPassword")
            .value;


        const button =
          $("loginButton");


        const originalText =
          button.textContent;


        button.disabled =
          true;


        button.textContent =
          "Signing In…";


        try {

          const {
            error
          } =
            await db
              .auth
              .signInWithPassword(
                {
                  email,
                  password
                }
              );


          if (error) {
            throw error;
          }


          const allowed =
            await verifyApproverAccess();


          if (!allowed) {

            showMessage(
              "This account is not the active IdentityLink approver.",
              "error"
            );


            return;

          }


          showMessage(
            "IdentityLink approval portal ready.",
            "success"
          );


          await loadPortal();

        }
        catch (error) {

          console.error(
            "IdentityLink approver login error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to sign in.",
            "error"
          );

        }
        finally {

          button.disabled =
            false;


          button.textContent =
            originalText;

        }

      }
    );


  $("signOutButton")
    ?.addEventListener(
      "click",
      async () => {

        try {

          await db
            .auth
            .signOut();

        }
        finally {

          currentRequests =
            [];


          currentDetail =
            null;


          accessContext =
            null;


          showLoginView();


          if (loginForm) {

            loginForm.reset();

          }

        }

      }
    );



  // =========================================================
  // DASHBOARD
  // =========================================================

  async function loadDashboard() {

    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_approver_dashboard"
      );


    if (error) {
      throw error;
    }


    const dashboard =
      data ||
      {};


    $("pendingCount").textContent =
      String(
        dashboard.pending_actions ||
        0
      );


    $("changesCount").textContent =
      String(
        dashboard.changes_requested_actions ||
        0
      );


    $("approvedCount").textContent =
      String(
        dashboard.approved_actions ||
        0
      );


    $("totalCount").textContent =
      String(
        dashboard.total_subject_files ||
        0
      );

  }



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
        "get_identitylink_approver_requests",
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


  function renderMiniAction(
    label,
    status
  ) {

    const currentStatus =
      status ||
      "not_requested";


    return `
      <div
        class="action-mini ${
          currentStatus ===
          "not_requested"
            ? "not-requested"
            : "active"
        }"
      >

        <strong>
          ${escapeHtml(label)}
        </strong>

        <span>
          ${escapeHtml(
            statusLabel(
              currentStatus
            )
          )}
        </span>

      </div>
    `;

  }


  function renderRequests() {

    if (!requestList) {
      return;
    }


    $("recordSummary").textContent =
      `${currentRequests.length} record${
        currentRequests.length === 1
          ? ""
          : "s"
      } shown`;


    if (
      !currentRequests.length
    ) {

      requestList.innerHTML =
        `
          <div class="empty-state">
            No IdentityLink records match the current search.
          </div>
        `;


      return;

    }


    requestList.innerHTML =
      currentRequests
        .map(
          item => `
            <article class="request-row">


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
                  MRN:
                  ${escapeHtml(item.mrn_patient_number)}
                </span>

              </div>


              <div>

                <span class="request-label">
                  Current Location
                </span>

                ${escapeHtml(
                  item.room_last_known_location
                )}

              </div>


              <div>

                <span class="request-label">
                  Submitted
                </span>

                ${escapeHtml(
                  item.submitted_by_name
                )}

                <span class="request-detail-small">
                  ${escapeHtml(
                    formatDateTime(
                      item.submitted_at
                    )
                  )}
                </span>

              </div>


              <div class="action-mini-list">

                ${renderMiniAction(
                  "Image",
                  item.image_status
                )}

                ${renderMiniAction(
                  "Fingerprint",
                  item.fingerprint_status
                )}

                <span class="request-detail-small">

                  ${Number(
                    item.subject_image_count ||
                    0
                  )}

                  subject image${
                    Number(
                      item.subject_image_count ||
                      0
                    ) === 1
                      ? ""
                      : "s"
                  }

                </span>

              </div>


              <div>

                <button
                  class="button secondary open-request-button"
                  type="button"
                  data-request-id="${escapeHtml(item.request_id)}"
                >
                  Review
                </button>

              </div>


            </article>
          `
        )
        .join("");


    requestList
      .querySelectorAll(
        ".open-request-button"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              openRequestDetail(
                button.dataset.requestId
              )
                .catch(
                  error => {

                    console.error(
                      "IdentityLink approver detail error:",
                      error
                    );


                    showMessage(
                      error.message ||
                      "Unable to load IdentityLink subject file.",
                      "error"
                    );

                  }
                );

            }
          );

        }
      );

  }



  // =========================================================
  // SEARCH / FILTER
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
            "IdentityLink approver search error:",
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

            if (statusFilter) {

              statusFilter.value =
                card.dataset.statusFilter ||
                "";

            }


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
  // REQUEST DETAIL
  // =========================================================

  async function openRequestDetail(
    requestId
  ) {

    detailModal
      ?.classList
      .remove("hidden");


    if (detailBody) {

      detailBody.innerHTML =
        '<div class="loading-state">Loading IdentityLink request…</div>';

    }


    const {
      data,
      error
    } =
      await db.rpc(
        "get_identitylink_approver_request_detail",
        {

          p_request_id:
            requestId

        }
      );


    if (error) {

      detailModal
        ?.classList
        .add("hidden");


      throw error;

    }


    currentDetail =
      data;


    await renderRequestDetail();

  }


  async function renderRequestDetail() {

    if (
      !currentDetail?.request ||
      !detailBody
    ) {
      return;
    }


    const request =
      currentDetail.request;


    const actions =
      currentDetail.actions ||
      [];


    const files =
      currentDetail.files ||
      [];


    const approvals =
      currentDetail.action_approvals ||
      [];


    const locationHistory =
      currentDetail.location_history ||
      [];


    const activity =
      currentDetail.activity ||
      [];


    $("detailRequestNumber").textContent =
      request.request_number;


    detailBody.innerHTML =
      `
        <div class="detail-top">

          <div>

            <span
              class="status-pill ${
                request.case_status ===
                "open"
                  ? "status-pending"
                  : "status-completed"
              }"
            >

              ${escapeHtml(
                request.case_status ===
                "open"
                  ? "Open Subject File"
                  : statusLabel(
                      request.case_status
                    )
              )}

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
            "Current Location",
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

            </div>


            <div class="location-history">

              ${renderLocationHistory(
                locationHistory
              )}

            </div>

          </div>

        </section>



        <section class="detail-section">

          <div class="detail-section-head">

            <div>

              <h3>
                Identification Authorizations
              </h3>

              <div class="request-detail-small">
                Review Image and Fingerprint authorization independently.
              </div>

            </div>

          </div>


          <div class="authorization-grid">

            ${renderAuthorizationCard(
              request,
              actions,
              approvals,
              "image_request",
              "Image Request"
            )}


            ${renderAuthorizationCard(
              request,
              actions,
              approvals,
              "fingerprint",
              "Fingerprint Request"
            )}

          </div>

        </section>



        <section class="detail-section">

          <div class="detail-section-head">

            <div>

              <h3>
                Subject Images
              </h3>

              <div class="request-detail-small">
                Secure photographs associated with this unidentified subject.
              </div>

            </div>

          </div>


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


    detailBody
      .querySelectorAll(
        "[data-decision]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              openDecisionModal(
                button.dataset.requestId,
                button.dataset.actionType,
                button.dataset.decision,
                button.dataset.activate ===
                  "true"
              );

            }
          );

        }
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
  // AUTHORIZATION CARDS
  // =========================================================

  function renderAuthorizationCard(
    request,
    actions,
    approvals,
    actionType,
    label
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


    let actionButtons =
      "";


    if (
      request.case_status ===
      "open"
    ) {

      if (
        status ===
        "pending"
      ) {

        actionButtons =
          `
            <div class="authorization-actions">

              <button
                class="button primary"
                type="button"
                data-decision="approve"
                data-request-id="${escapeHtml(request.id)}"
                data-action-type="${escapeHtml(actionType)}"
                data-activate="false"
              >
                Approve
              </button>


              <button
                class="button secondary"
                type="button"
                data-decision="changes"
                data-request-id="${escapeHtml(request.id)}"
                data-action-type="${escapeHtml(actionType)}"
                data-activate="false"
              >
                Request Changes
              </button>


              <button
                class="button danger"
                type="button"
                data-decision="deny"
                data-request-id="${escapeHtml(request.id)}"
                data-action-type="${escapeHtml(actionType)}"
                data-activate="false"
              >
                Deny
              </button>

            </div>
          `;

      }
      else if (
        status ===
        "not_requested"
      ) {

        actionButtons =
          `
            <div class="authorization-actions">

              <button
                class="button primary"
                type="button"
                data-decision="activate_approve"
                data-request-id="${escapeHtml(request.id)}"
                data-action-type="${escapeHtml(actionType)}"
                data-activate="true"
              >
                Activate & Approve
              </button>

            </div>
          `;

      }

    }


    return `
      <article class="authorization-card ${escapeHtml(status)}">


        <h4>
          ${escapeHtml(label)}
        </h4>


        <div class="authorization-status">

          ${
            status ===
            "not_requested"
              ? `
                  <span class="not-requested-pill">
                    Not Requested
                  </span>
                `
              : `
                  <span class="status-pill status-${escapeHtml(status)}">
                    ${escapeHtml(
                      statusLabel(status)
                    )}
                  </span>
                `
          }

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
                    ${escapeHtml(
                      action.requested_by_name
                    )}
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
              : status ===
                "not_requested"
                ? "Management has not requested this authorization."
                : ""
          }

        </div>


        ${actionButtons}


      </article>
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
                      ${escapeHtml(
                        item.previous_location
                      )}
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
                      ${escapeHtml(
                        item.change_reason
                      )}
                    </div>
                  `
                : ""
            }


            <span>

              ${escapeHtml(
                item.changed_by_name
              )}

              •

              ${escapeHtml(
                formatDateTime(
                  item.changed_at
                )
              )}

            </span>

          </article>
        `
      )
      .join("");

  }



  // =========================================================
  // DECISION MODAL
  // =========================================================

  function openDecisionModal(
    requestId,
    actionType,
    decision,
    activate = false
  ) {

    const label =
      actionLabel(
        actionType
      );


    $("decisionRequestId").value =
      requestId;


    $("decisionActionType").value =
      actionType;


    $("decisionType").value =
      decision;


    $("decisionActivateAction").value =
      activate
        ? "true"
        : "false";


    $("decisionNotes").value =
      "";


    $("typedSignature").value =
      "";


    $("certificationCheck").checked =
      false;


    const signatureSection =
      $("signatureSection");


    const notesLabel =
      $("decisionNotesLabel");


    const notesInput =
      $("decisionNotes");


    const submitButton =
      $("submitDecisionButton");


    const certificationText =
      $("certificationText");


    $("decisionActionSummary").innerHTML =
      `
        <strong>
          ${escapeHtml(label)}
        </strong>

        <div class="request-detail-small">

          ${escapeHtml(
            currentDetail
              ?.request
              ?.request_number ||
            "IdentityLink Request"
          )}

          •

          ${escapeHtml(
            currentDetail
              ?.request
              ?.patient_alias ||
            "Unknown Patient"
          )}

        </div>
      `;


    if (
      decision ===
      "approve" ||
      decision ===
      "activate_approve"
    ) {

      $("decisionModalTitle").textContent =
        decision ===
        "activate_approve"
          ? `Activate & Approve ${label}`
          : `Approve ${label}`;


      signatureSection
        .classList
        .remove("hidden");


      notesLabel.textContent =
        "Approval Notes";


      notesInput.placeholder =
        "Optional approval notes";


      notesInput.required =
        false;


      submitButton.textContent =
        decision ===
        "activate_approve"
          ? "Activate & Approve"
          : "Approve Authorization";


      certificationText.textContent =
        decision ===
        "activate_approve"
          ? `I certify that I am independently activating and approving this ${label}. This action will be permanently recorded as APPROVER INITIATED.`
          : `I certify that I reviewed this ${label} and approve the requested identification authorization.`;

    }
    else if (
      decision ===
      "changes"
    ) {

      $("decisionModalTitle").textContent =
        `Request Changes — ${label}`;


      signatureSection
        .classList
        .add("hidden");


      notesLabel.textContent =
        "Required Changes";


      notesInput.placeholder =
        "Describe what management must correct or provide";


      notesInput.required =
        true;


      submitButton.textContent =
        "Request Changes";

    }
    else if (
      decision ===
      "deny"
    ) {

      $("decisionModalTitle").textContent =
        `Deny ${label}`;


      signatureSection
        .classList
        .add("hidden");


      notesLabel.textContent =
        "Denial Reason";


      notesInput.placeholder =
        "Explain why this authorization is being denied";


      notesInput.required =
        true;


      submitButton.textContent =
        "Deny Authorization";

    }


    decisionModal
      ?.classList
      .remove("hidden");

  }


  function closeDecisionModal() {

    decisionModal
      ?.classList
      .add("hidden");


    if (decisionForm) {

      decisionForm.reset();

    }

  }


  decisionForm
    ?.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        const requestId =
          $("decisionRequestId").value;


        const actionType =
          $("decisionActionType").value;


        const decision =
          $("decisionType").value;


        const activate =
          $("decisionActivateAction")
            .value ===
          "true";


        const notes =
          $("decisionNotes")
            .value
            .trim();


        const signature =
          $("typedSignature")
            .value
            .trim();


        const certificationAccepted =
          $("certificationCheck")
            .checked;


        const button =
          $("submitDecisionButton");


        const originalText =
          button.textContent;


        try {

          button.disabled =
            true;


          button.textContent =
            "Submitting…";


          let error =
            null;


          if (
            decision ===
            "approve" ||
            decision ===
            "activate_approve"
          ) {

            if (!signature) {

              throw new Error(
                "Type your full name to electronically sign this authorization."
              );

            }


            if (
              !certificationAccepted
            ) {

              throw new Error(
                "Confirm the electronic signature certification before approving."
              );

            }


            const result =
              await db.rpc(
                "approve_identitylink_action",
                {

                  p_request_id:
                    requestId,

                  p_action_type:
                    actionType,

                  p_typed_signature:
                    signature,

                  p_decision_notes:
                    notes ||
                    null,

                  p_activate_if_not_requested:
                    activate

                }
              );


            error =
              result.error;

          }
          else if (
            decision ===
            "changes"
          ) {

            if (!notes) {

              throw new Error(
                "Describe the required changes before submitting."
              );

            }


            const result =
              await db.rpc(
                "request_identitylink_action_changes",
                {

                  p_request_id:
                    requestId,

                  p_action_type:
                    actionType,

                  p_notes:
                    notes

                }
              );


            error =
              result.error;

          }
          else if (
            decision ===
            "deny"
          ) {

            if (!notes) {

              throw new Error(
                "A denial reason is required."
              );

            }


            const result =
              await db.rpc(
                "deny_identitylink_action",
                {

                  p_request_id:
                    requestId,

                  p_action_type:
                    actionType,

                  p_reason:
                    notes

                }
              );


            error =
              result.error;

          }
          else {

            throw new Error(
              "IdentityLink decision type is invalid."
            );

          }


          if (error) {
            throw error;
          }


          closeDecisionModal();


          showMessage(
            decision ===
            "changes"
              ? "Changes requested successfully."
              : decision ===
                "deny"
                ? "Authorization denied."
                : activate
                  ? "Authorization activated and approved."
                  : "Authorization approved.",
            "success"
          );


          await Promise.all([
            loadDashboard(),
            loadRequests()
          ]);


          await openRequestDetail(
            requestId
          );

        }
        catch (error) {

          console.error(
            "IdentityLink authorization decision error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to submit the authorization decision.",
            "error"
          );

        }
        finally {

          button.disabled =
            false;


          button.textContent =
            originalText;

        }

      }
    );



  // =========================================================
  // SUBJECT IMAGE DISPLAY — VIEW ONLY
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
        await db
          .storage
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
                  ${escapeHtml(
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
          <article class="image-card">

            <img
              src="${escapeHtml(
                data.signedUrl
              )}"
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


              imageModal
                ?.classList
                .remove("hidden");

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
          approval => {

            const approverInitiated =
              approval
                .action_snapshot
                ?.approver_activated_action ===
              true;


            return `
              <article class="approval-card">

                <strong>
                  ${escapeHtml(
                    actionLabel(
                      approval.action_type
                    )
                  )}
                </strong>


                ${
                  approverInitiated
                    ? `
                        <span class="approver-initiated-badge">
                          APPROVER INITIATED
                        </span>
                      `
                    : ""
                }


                <br><br>


                <span
                  class="status-pill status-${escapeHtml(
                    approval.decision
                  )}"
                >
                  ${escapeHtml(
                    statusLabel(
                      approval.decision
                    )
                  )}
                </span>


                <p>

                  <strong>
                    ${escapeHtml(
                      approval.approver_display_name
                    )}
                  </strong>

                </p>


                ${
                  approval.decision_notes
                    ? `
                        <p>
                          ${escapeHtml(
                            approval.decision_notes
                          )}
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

                          ${escapeHtml(
                            approval.typed_signature
                          )}

                        </p>
                      `
                    : ""
                }


                <div class="request-detail-small">

                  ${escapeHtml(
                    formatDateTime(
                      approval.signed_at ||
                      approval.created_at
                    )
                  )}

                </div>

              </article>
            `;

          }
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
                    .replaceAll(
                      "_",
                      " "
                    )
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
                        ${escapeHtml(
                          item.notes
                        )}
                      </div>
                    `
                  : ""
              }


              <span>

                ${escapeHtml(
                  item.actor_display_name
                )}

                •

                ${escapeHtml(
                  formatDateTime(
                    item.occurred_at
                  )
                )}

              </span>

            </article>
          `
        )
        .join("");

  }



  // =========================================================
  // MODAL CLOSE CONTROLS
  // =========================================================

  $("closeDetailModalButton")
    ?.addEventListener(
      "click",
      () => {

        detailModal
          ?.classList
          .add("hidden");


        currentDetail =
          null;

      }
    );


  $("closeDecisionModalButton")
    ?.addEventListener(
      "click",
      closeDecisionModal
    );


  $("cancelDecisionButton")
    ?.addEventListener(
      "click",
      closeDecisionModal
    );


  $("closeImageModalButton")
    ?.addEventListener(
      "click",
      () => {

        imageModal
          ?.classList
          .add("hidden");


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

          imageModal
            .classList
            .add("hidden");


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


        const originalText =
          button.textContent;


        button.disabled =
          true;


        button.textContent =
          "Refreshing…";


        try {

          await Promise.all([
            loadDashboard(),
            loadRequests()
          ]);


          showMessage(
            "IdentityLink refreshed.",
            "success"
          );

        }
        catch (error) {

          console.error(
            "IdentityLink approver refresh error:",
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
            originalText;

        }

      }
    );



  // =========================================================
  // PORTAL LOAD
  // =========================================================

  async function loadPortal() {

    await Promise.all([
      loadDashboard(),
      loadRequests()
    ]);

  }



  // =========================================================
  // INITIALIZATION
  // =========================================================

  try {

    const allowed =
      await verifyApproverAccess();


    if (allowed) {

      await loadPortal();

    }

  }
  catch (error) {

    console.error(
      "IdentityLink approver initialization error:",
      error
    );


    showLoginView();


    showMessage(
      error.message ||
      "Unable to initialize the IdentityLink approval portal.",
      "error"
    );

  }


})();
