(async function () {
  "use strict";

  function waitForAuth() {
    if (window.SecureTrackAuth) return Promise.resolve(window.SecureTrackAuth);

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
  const roles = auth.roles || [];

  const isManager =
    roles.includes("manager") ||
    roles.includes("admin");

  const isOperational =
    roles.some(role =>
      ["officer","dispatcher","senior_officer","team_lead"].includes(role)
    );

  const currentUserName = document.getElementById("currentUserName");
  const currentUserRole = document.getElementById("currentUserRole");
  const signOutButton = document.getElementById("signOutButton");
  const pageMessage = document.getElementById("pageMessage");

  const openCount = document.getElementById("openCount");
  const myPendingCount = document.getElementById("myPendingCount");
  const managerPendingStat = document.getElementById("managerPendingStat");
  const managerPendingCount = document.getElementById("managerPendingCount");

  const managerCreateSection = document.getElementById("managerCreateSection");
  const managerReviewSection = document.getElementById("managerReviewSection");
  const managerManageSection = document.getElementById("managerManageSection");

  const createOpportunityForm = document.getElementById("createOpportunityForm");
  const opportunityDate = document.getElementById("opportunityDate");
  const opportunityShift = document.getElementById("opportunityShift");
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");
  const opportunityLocation = document.getElementById("opportunityLocation");
  const totalOpenings = document.getElementById("totalOpenings");
  const requirements = document.getElementById("requirements");
  const opportunityNotes = document.getElementById("opportunityNotes");
  const createOpportunityButton = document.getElementById("createOpportunityButton");

  const refreshButton = document.getElementById("refreshButton");
  const opportunityList = document.getElementById("opportunityList");
  const myRequestsSection = document.getElementById("myRequestsSection");
  const myRequestsBody = document.getElementById("myRequestsBody");
  const pendingReviewBody = document.getElementById("pendingReviewBody");
  const manageOpportunityBody = document.getElementById("manageOpportunityBody");

  const reviewModal = document.getElementById("reviewModal");
  const reviewForm = document.getElementById("reviewForm");
  const reviewSignupId = document.getElementById("reviewSignupId");
  const reviewDecision = document.getElementById("reviewDecision");
  const reviewSummary = document.getElementById("reviewSummary");
  const reviewNotes = document.getElementById("reviewNotes");
  const confirmReviewButton = document.getElementById("confirmReviewButton");
  const cancelReviewButton = document.getElementById("cancelReviewButton");

  const detailModal = document.getElementById("detailModal");
  const detailModalTitle = document.getElementById("detailModalTitle");
  const detailSummary = document.getElementById("detailSummary");
  const detailInfo = document.getElementById("detailInfo");
  const detailSignupBody = document.getElementById("detailSignupBody");
  const historyList = document.getElementById("historyList");
  const closeDetailButton = document.getElementById("closeDetailButton");

  const editModal = document.getElementById("editModal");
  const editOpportunityForm = document.getElementById("editOpportunityForm");
  const editOpportunityId = document.getElementById("editOpportunityId");
  const editOpportunityDate = document.getElementById("editOpportunityDate");
  const editOpportunityShift = document.getElementById("editOpportunityShift");
  const editStartTime = document.getElementById("editStartTime");
  const editEndTime = document.getElementById("editEndTime");
  const editOpportunityLocation = document.getElementById("editOpportunityLocation");
  const editTotalOpenings = document.getElementById("editTotalOpenings");
  const editRequirements = document.getElementById("editRequirements");
  const editOpportunityNotes = document.getElementById("editOpportunityNotes");
  const saveEditButton = document.getElementById("saveEditButton");
  const closeEditButton = document.getElementById("closeEditButton");
  const cancelEditButton = document.getElementById("cancelEditButton");

  let opportunities = [];
  let myRequests = [];
  let pendingRequests = [];
  let currentDetailOpportunityId = null;

  function roleLabel(list) {
    const order = [
      "admin","manager","team_lead",
      "senior_officer","dispatcher","officer"
    ];

    const found =
      order.find(role => list.includes(role));

    return (found || list[0] || "user")
      .replaceAll("_"," ");
  }

  function showMessage(message, type = "info") {
    pageMessage.textContent = message;
    pageMessage.className = `message show ${type}`;
  }

  function clearMessage() {
    pageMessage.textContent = "";
    pageMessage.className = "message";
  }

  function todayLocal() {
    const d = new Date();
    const offset = d.getTimezoneOffset();

    return new Date(
      d.getTime() - offset * 60000
    )
      .toISOString()
      .slice(0,10);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString();
  }

  function formatTime(value) {
    if (!value) return "";

    const [hourString, minute = "00"] =
      String(value).split(":");

    let hour = Number(hourString);
    const suffix = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;
  }

  function setUserDisplay() {
    currentUserName.textContent =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";

    currentUserRole.textContent =
      roleLabel(roles);

    managerCreateSection.hidden = !isManager;
    managerReviewSection.hidden = !isManager;
    managerManageSection.hidden = !isManager;
    managerPendingStat.hidden = !isManager;

    myRequestsSection.hidden = !isOperational;
  }

  async function loadOpportunities() {
    const { data, error } = await db
      .from("overtime_opportunities")
      .select(
        "id, opportunity_date, shift_name, start_time, end_time, location, total_openings, filled_openings, requirements, notes, status, created_by_name, created_at, updated_at"
      )
      .order("opportunity_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    opportunities = data || [];

    renderOpportunities();
    renderManageOpportunities();

    openCount.textContent =
      opportunities.filter(item =>
        item.status === "open" &&
        item.filled_openings < item.total_openings
      ).length;
  }

  function renderOpportunities() {
    opportunityList.innerHTML = "";

    const openItems =
      opportunities.filter(item =>
        item.status === "open"
      );

    if (!openItems.length) {
      opportunityList.innerHTML =
        '<div class="empty">No open overtime opportunities.</div>';
      return;
    }

    const mySignupMap =
      new Map(
        myRequests.map(request => [
          request.opportunity_id,
          request
        ])
      );

    openItems.forEach(item => {
      const remaining =
        Math.max(
          item.total_openings -
          item.filled_openings,
          0
        );

      const card =
        document.createElement("article");

      card.className =
        "opportunity-card";

      const date =
        document.createElement("div");

      date.className = "eyebrow";
      date.textContent = item.opportunity_date;

      const title =
        document.createElement("h3");

      title.textContent =
        `${item.shift_name} • ${item.location}`;

      const meta =
        document.createElement("div");

      meta.className =
        "opportunity-meta";

      if (
        item.start_time ||
        item.end_time
      ) {
        const time =
          document.createElement("div");

        time.textContent =
          `Time: ${formatTime(item.start_time) || "—"} - ` +
          `${formatTime(item.end_time) || "—"}`;

        meta.appendChild(time);
      }

      if (item.requirements) {
        const req =
          document.createElement("div");

        req.textContent =
          `Requirements: ${item.requirements}`;

        meta.appendChild(req);
      }

      if (item.notes) {
        const note =
          document.createElement("div");

        note.textContent =
          `Notes: ${item.notes}`;

        meta.appendChild(note);
      }

      const openings =
        document.createElement("div");

      openings.className =
        "opportunity-openings";

      openings.textContent =
        `${remaining} of ${item.total_openings} opening(s) remaining`;

      card.append(
        date,
        title,
        meta,
        openings
      );

      if (isOperational) {
        const actions =
          document.createElement("div");

        actions.className =
          "opportunity-actions";

        const existing =
          mySignupMap.get(item.id);

        if (
          existing &&
          ["pending","approved"].includes(
            existing.status
          )
        ) {
          const status =
            document.createElement("span");

          status.className =
            `status-pill ${existing.status}`;

          status.textContent =
            existing.status;

          actions.appendChild(status);

        } else {
          const signup =
            document.createElement("button");

          signup.type = "button";
          signup.className =
            "button primary";

          signup.textContent =
            remaining > 0
              ? "Request Overtime"
              : "Full";

          signup.disabled =
            remaining <= 0;

          signup.addEventListener(
            "click",
            () => requestOvertime(item)
          );

          actions.appendChild(signup);
        }

        card.appendChild(actions);
      }

      opportunityList.appendChild(card);
    });
  }

  async function loadMyRequests() {
    if (!isOperational) {
      myRequests = [];
      myPendingCount.textContent = "0";
      renderOpportunities();
      return;
    }

    const { data, error } = await db
      .from("overtime_signups")
      .select(
        "id, opportunity_id, status, requested_at, reviewed_at, manager_notes"
      )
      .eq("user_id", auth.user.id)
      .order("requested_at", { ascending: false });

    if (error) throw error;

    myRequests = data || [];

    myPendingCount.textContent =
      myRequests.filter(item =>
        item.status === "pending"
      ).length;

    renderMyRequests();
    renderOpportunities();
  }

  function renderMyRequests() {
    myRequestsBody.innerHTML = "";

    if (!myRequests.length) {
      myRequestsBody.innerHTML =
        '<tr><td colspan="6" class="empty">No overtime requests.</td></tr>';
      return;
    }

    const opportunityMap =
      new Map(
        opportunities.map(item => [
          item.id,
          item
        ])
      );

    myRequests.forEach(request => {
      const opportunity =
        opportunityMap.get(
          request.opportunity_id
        );

      const tr =
        document.createElement("tr");

      const dateTd =
        document.createElement("td");

      dateTd.textContent =
        opportunity?.opportunity_date ||
        "—";

      const shiftTd =
        document.createElement("td");

      shiftTd.textContent =
        opportunity?.shift_name ||
        "—";

      const locationTd =
        document.createElement("td");

      locationTd.textContent =
        opportunity?.location ||
        "—";

      const statusTd =
        document.createElement("td");

      const status =
        document.createElement("span");

      status.className =
        `status-pill ${request.status}`;

      status.textContent =
        request.status;

      statusTd.appendChild(status);

      const requestedTd =
        document.createElement("td");

      requestedTd.textContent =
        formatDate(
          request.requested_at
        );

      const actionTd =
        document.createElement("td");

      if (
        ["pending","approved"].includes(
          request.status
        )
      ) {
        const cancel =
          document.createElement("button");

        cancel.type = "button";
        cancel.className =
          "button danger small";

        cancel.textContent =
          "Cancel";

        cancel.addEventListener(
          "click",
          () => cancelSignup(request)
        );

        actionTd.appendChild(cancel);

      } else {
        actionTd.textContent = "—";
      }

      tr.append(
        dateTd,
        shiftTd,
        locationTd,
        statusTd,
        requestedTd,
        actionTd
      );

      myRequestsBody.appendChild(tr);
    });
  }

  async function loadPendingReviews() {
    if (!isManager) {
      pendingRequests = [];
      return;
    }

    const { data, error } = await db
      .from("overtime_signups")
      .select(
        "id, opportunity_id, user_id, display_name, status, requested_at"
      )
      .eq("status", "pending")
      .order("requested_at", { ascending: true });

    if (error) throw error;

    pendingRequests = data || [];

    managerPendingCount.textContent =
      pendingRequests.length;

    renderPendingReviews();
  }

  function renderPendingReviews() {
    pendingReviewBody.innerHTML = "";

    if (!pendingRequests.length) {
      pendingReviewBody.innerHTML =
        '<tr><td colspan="6" class="empty">No pending overtime requests.</td></tr>';
      return;
    }

    const opportunityMap =
      new Map(
        opportunities.map(item => [
          item.id,
          item
        ])
      );

    pendingRequests.forEach(request => {
      const opportunity =
        opportunityMap.get(
          request.opportunity_id
        );

      const tr =
        document.createElement("tr");

      const employeeTd =
        document.createElement("td");

      employeeTd.textContent =
        request.display_name;

      const dateTd =
        document.createElement("td");

      dateTd.textContent =
        opportunity?.opportunity_date ||
        "—";

      const shiftTd =
        document.createElement("td");

      shiftTd.textContent =
        opportunity?.shift_name ||
        "—";

      const locationTd =
        document.createElement("td");

      locationTd.textContent =
        opportunity?.location ||
        "—";

      const requestedTd =
        document.createElement("td");

      requestedTd.textContent =
        formatDate(
          request.requested_at
        );

      const actionTd =
        document.createElement("td");

      actionTd.className =
        "inline-actions";

      const approve =
        document.createElement("button");

      approve.type = "button";
      approve.className =
        "button approve small";
      approve.textContent =
        "Approve";

      approve.addEventListener(
        "click",
        () =>
          openReviewModal(
            request,
            opportunity,
            "approved"
          )
      );

      const deny =
        document.createElement("button");

      deny.type = "button";
      deny.className =
        "button deny small";
      deny.textContent =
        "Deny";

      deny.addEventListener(
        "click",
        () =>
          openReviewModal(
            request,
            opportunity,
            "denied"
          )
      );

      actionTd.append(
        approve,
        deny
      );

      tr.append(
        employeeTd,
        dateTd,
        shiftTd,
        locationTd,
        requestedTd,
        actionTd
      );

      pendingReviewBody.appendChild(tr);
    });
  }

  function renderManageOpportunities() {
    if (!isManager) return;

    manageOpportunityBody.innerHTML = "";

    if (!opportunities.length) {
      manageOpportunityBody.innerHTML =
        '<tr><td colspan="6" class="empty">No opportunities found.</td></tr>';
      return;
    }

    opportunities.forEach(item => {
      const tr =
        document.createElement("tr");

      const dateTd =
        document.createElement("td");

      dateTd.textContent =
        item.opportunity_date;

      const shiftTd =
        document.createElement("td");

      shiftTd.textContent =
        item.shift_name;

      const locationTd =
        document.createElement("td");

      locationTd.textContent =
        item.location;

      const filledTd =
        document.createElement("td");

      filledTd.textContent =
        `${item.filled_openings}/${item.total_openings}`;

      const statusTd =
        document.createElement("td");

      const status =
        document.createElement("span");

      status.className =
        `status-pill ${item.status}`;

      status.textContent =
        item.status;

      statusTd.appendChild(status);

      const manageTd =
        document.createElement("td");

      manageTd.className =
        "inline-actions";

      const details =
        document.createElement("button");

      details.type = "button";
      details.className =
        "button secondary small";
      details.textContent =
        "View Details";

      details.addEventListener(
        "click",
        () => openDetail(item)
      );

      const edit =
        document.createElement("button");

      edit.type = "button";
      edit.className =
        "button secondary small";
      edit.textContent = "Edit";

      edit.addEventListener(
        "click",
        () => openEditModal(item)
      );

      manageTd.append(
        details,
        edit
      );

      const choices =
        item.status === "open"
          ? [
              ["closed","Close"],
              ["cancelled","Cancel"]
            ]
          : item.status === "closed"
            ? [["open","Reopen"]]
            : [];

      choices.forEach(
        ([statusValue,label]) => {
          const button =
            document.createElement("button");

          button.type = "button";

          button.className =
            statusValue === "cancelled"
              ? "button danger small"
              : "button secondary small";

          button.textContent =
            label;

          button.addEventListener(
            "click",
            () =>
              setOpportunityStatus(
                item,
                statusValue
              )
          );

          manageTd.appendChild(button);
        }
      );

      tr.append(
        dateTd,
        shiftTd,
        locationTd,
        filledTd,
        statusTd,
        manageTd
      );

      manageOpportunityBody.appendChild(tr);
    });
  }

  async function requestOvertime(
    opportunity
  ) {
    clearMessage();

    const confirmed =
      window.confirm(
        `Request overtime for ${opportunity.opportunity_date} ` +
        `${opportunity.shift_name} at ${opportunity.location}?`
      );

    if (!confirmed) return;

    try {
      const { error } =
        await db.rpc(
          "request_overtime_signup",
          {
            p_opportunity_id:
              opportunity.id
          }
        );

      if (error) throw error;

      showMessage(
        "Overtime request submitted for manager approval.",
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error(
        "Overtime request error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to request overtime.",
        "error"
      );
    }
  }

  async function cancelSignup(
    request
  ) {
    const confirmed =
      window.confirm(
        "Cancel this overtime request?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await db.rpc(
          "cancel_overtime_signup",
          {
            p_signup_id:
              request.id
          }
        );

      if (error) throw error;

      showMessage(
        "Overtime request cancelled.",
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error(
        "Overtime cancellation error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to cancel overtime request.",
        "error"
      );
    }
  }

  function openReviewModal(
    request,
    opportunity,
    decision
  ) {
    reviewSignupId.value =
      request.id;

    reviewDecision.value =
      decision;

    reviewNotes.value =
      "";

    reviewSummary.textContent =
      `${decision === "approved" ? "Approve" : "Deny"} ` +
      `${request.display_name} for ` +
      `${opportunity?.opportunity_date || ""} ` +
      `${opportunity?.shift_name || ""} ` +
      `${opportunity?.location || ""}?`;

    confirmReviewButton.textContent =
      decision === "approved"
        ? "Approve Request"
        : "Deny Request";

    confirmReviewButton.className =
      decision === "approved"
        ? "button approve"
        : "button deny";

    reviewModal.classList.add("show");

    reviewModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function closeReviewModal() {
    reviewModal.classList.remove(
      "show"
    );

    reviewModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  reviewForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      confirmReviewButton.disabled =
        true;

      try {
        const { error } =
          await db.rpc(
            "review_overtime_signup",
            {
              p_signup_id:
                reviewSignupId.value,

              p_decision:
                reviewDecision.value,

              p_notes:
                reviewNotes.value.trim() ||
                null
            }
          );

        if (error) throw error;

        closeReviewModal();

        showMessage(
          `Overtime request ${reviewDecision.value}.`,
          "success"
        );

        await refreshAll();

        if (currentDetailOpportunityId) {
          await loadDetail(
            currentDetailOpportunityId
          );
        }

      } catch (error) {
        console.error(
          "Overtime review error:",
          error
        );

        showMessage(
          error.message ||
          "Unable to review overtime request.",
          "error"
        );

      } finally {
        confirmReviewButton.disabled =
          false;
      }
    }
  );

  cancelReviewButton.addEventListener(
    "click",
    closeReviewModal
  );

  reviewModal.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        reviewModal
      ) {
        closeReviewModal();
      }
    }
  );

  async function setOpportunityStatus(
    item,
    status
  ) {
    const confirmed =
      window.confirm(
        `${status === "open" ? "Reopen" : status === "closed" ? "Close" : "Cancel"} ` +
        "this overtime opportunity?"
      );

    if (!confirmed) return;

    try {
      const { error } =
        await db.rpc(
          "set_overtime_opportunity_status",
          {
            p_opportunity_id:
              item.id,

            p_status:
              status
          }
        );

      if (error) throw error;

      showMessage(
        `Overtime opportunity ${status}.`,
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error(
        "Opportunity status error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to update overtime opportunity.",
        "error"
      );
    }
  }

  createOpportunityForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();
      clearMessage();

      createOpportunityButton.disabled =
        true;

      createOpportunityButton.textContent =
        "Creating…";

      try {
        const { error } =
          await db.rpc(
            "create_overtime_opportunity",
            {
              p_opportunity_date:
                opportunityDate.value,

              p_shift_name:
                opportunityShift.value.trim(),

              p_location:
                opportunityLocation.value.trim(),

              p_total_openings:
                Number(
                  totalOpenings.value
                ),

              p_start_time:
                startTime.value ||
                null,

              p_end_time:
                endTime.value ||
                null,

              p_requirements:
                requirements.value.trim() ||
                null,

              p_notes:
                opportunityNotes.value.trim() ||
                null
            }
          );

        if (error) throw error;

        createOpportunityForm.reset();

        opportunityDate.value =
          todayLocal();

        totalOpenings.value =
          "1";

        showMessage(
          "Overtime opportunity created.",
          "success"
        );

        await refreshAll();

      } catch (error) {
        console.error(
          "Create overtime opportunity error:",
          error
        );

        showMessage(
          error.message ||
          "Unable to create overtime opportunity.",
          "error"
        );

      } finally {
        createOpportunityButton.disabled =
          false;

        createOpportunityButton.textContent =
          "Create Opportunity";
      }
    }
  );

  function openEditModal(item) {
    editOpportunityId.value =
      item.id;

    editOpportunityDate.value =
      item.opportunity_date || "";

    editOpportunityShift.value =
      item.shift_name || "";

    editStartTime.value =
      item.start_time
        ? String(item.start_time).slice(0,5)
        : "";

    editEndTime.value =
      item.end_time
        ? String(item.end_time).slice(0,5)
        : "";

    editOpportunityLocation.value =
      item.location || "";

    editTotalOpenings.value =
      item.total_openings;

    editRequirements.value =
      item.requirements || "";

    editOpportunityNotes.value =
      item.notes || "";

    editModal.classList.add(
      "show"
    );

    editModal.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  function closeEditModal() {
    editModal.classList.remove(
      "show"
    );

    editModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  editOpportunityForm.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      saveEditButton.disabled =
        true;

      saveEditButton.textContent =
        "Saving…";

      try {
        const { error } =
          await db.rpc(
            "update_overtime_opportunity",
            {
              p_opportunity_id:
                editOpportunityId.value,

              p_opportunity_date:
                editOpportunityDate.value,

              p_shift_name:
                editOpportunityShift.value.trim(),

              p_location:
                editOpportunityLocation.value.trim(),

              p_total_openings:
                Number(
                  editTotalOpenings.value
                ),

              p_start_time:
                editStartTime.value ||
                null,

              p_end_time:
                editEndTime.value ||
                null,

              p_requirements:
                editRequirements.value.trim() ||
                null,

              p_notes:
                editOpportunityNotes.value.trim() ||
                null
            }
          );

        if (error) throw error;

        const editedId =
          editOpportunityId.value;

        closeEditModal();

        showMessage(
          "Overtime opportunity updated.",
          "success"
        );

        await refreshAll();

        if (
          currentDetailOpportunityId ===
          editedId
        ) {
          await loadDetail(
            editedId
          );
        }

      } catch (error) {
        console.error(
          "Update overtime opportunity error:",
          error
        );

        showMessage(
          error.message ||
          "Unable to update overtime opportunity.",
          "error"
        );

      } finally {
        saveEditButton.disabled =
          false;

        saveEditButton.textContent =
          "Save Changes";
      }
    }
  );

  closeEditButton.addEventListener(
    "click",
    closeEditModal
  );

  cancelEditButton.addEventListener(
    "click",
    closeEditModal
  );

  editModal.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        editModal
      ) {
        closeEditModal();
      }
    }
  );

  function openDetail(item) {
    currentDetailOpportunityId =
      item.id;

    detailModal.classList.add(
      "show"
    );

    detailModal.setAttribute(
      "aria-hidden",
      "false"
    );

    loadDetail(item.id);
  }

  function closeDetailModal() {
    currentDetailOpportunityId =
      null;

    detailModal.classList.remove(
      "show"
    );

    detailModal.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  closeDetailButton.addEventListener(
    "click",
    closeDetailModal
  );

  detailModal.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        detailModal
      ) {
        closeDetailModal();
      }
    }
  );

  async function loadDetail(
    opportunityId
  ) {
    detailSummary.textContent =
      "Loading…";

    detailInfo.innerHTML = "";
    detailSignupBody.innerHTML =
      '<tr><td colspan="6" class="empty">Loading requests…</td></tr>';

    historyList.innerHTML =
      '<div class="empty">Loading history…</div>';

    try {
      const { data, error } =
        await db.rpc(
          "get_overtime_opportunity_detail",
          {
            p_opportunity_id:
              opportunityId
          }
        );

      if (error) throw error;

      const opportunity =
        data?.opportunity || {};

      const signups =
        data?.signups || [];

      const history =
        data?.history || [];

      detailModalTitle.textContent =
        `${opportunity.shift_name || "Overtime"} • ` +
        `${opportunity.location || ""}`;

      detailSummary.textContent =
        `${opportunity.opportunity_date || ""} • ` +
        `${opportunity.status || ""}`;

      renderDetailInfo(
        opportunity
      );

      renderDetailSignups(
        signups,
        opportunity
      );

      renderHistory(
        history
      );

    } catch (error) {
      console.error(
        "Overtime detail error:",
        error
      );

      detailSummary.textContent =
        "Unable to load opportunity details.";

      showMessage(
        error.message ||
        "Unable to load overtime details.",
        "error"
      );
    }
  }

  function addDetailItem(
    label,
    value
  ) {
    const item =
      document.createElement("div");

    item.className =
      "detail-item";

    const labelEl =
      document.createElement("span");

    labelEl.textContent =
      label;

    const valueEl =
      document.createElement("strong");

    valueEl.textContent =
      value || "—";

    item.append(
      labelEl,
      valueEl
    );

    detailInfo.appendChild(
      item
    );
  }

  function renderDetailInfo(
    opportunity
  ) {
    detailInfo.innerHTML = "";

    addDetailItem(
      "Date",
      opportunity.opportunity_date
    );

    addDetailItem(
      "Shift",
      opportunity.shift_name
    );

    addDetailItem(
      "Location",
      opportunity.location
    );

    addDetailItem(
      "Time",
      opportunity.start_time ||
      opportunity.end_time
        ? `${formatTime(opportunity.start_time) || "—"} - ${formatTime(opportunity.end_time) || "—"}`
        : "—"
    );

    addDetailItem(
      "Openings",
      `${opportunity.filled_openings || 0}/${opportunity.total_openings || 0} filled`
    );

    addDetailItem(
      "Status",
      opportunity.status
    );

    addDetailItem(
      "Requirements",
      opportunity.requirements
    );

    addDetailItem(
      "Notes",
      opportunity.notes
    );

    addDetailItem(
      "Created By",
      opportunity.created_by_name
    );
  }

  function renderDetailSignups(
    signups,
    opportunity
  ) {
    detailSignupBody.innerHTML = "";

    if (!signups.length) {
      detailSignupBody.innerHTML =
        '<tr><td colspan="6" class="empty">No requests for this opportunity.</td></tr>';
      return;
    }

    signups.forEach(signup => {
      const tr =
        document.createElement("tr");

      const employeeTd =
        document.createElement("td");

      employeeTd.textContent =
        signup.display_name || "—";

      const statusTd =
        document.createElement("td");

      const status =
        document.createElement("span");

      status.className =
        `status-pill ${signup.status}`;

      status.textContent =
        signup.status;

      statusTd.appendChild(status);

      const requestedTd =
        document.createElement("td");

      requestedTd.textContent =
        formatDate(
          signup.requested_at
        );

      const reviewedTd =
        document.createElement("td");

      reviewedTd.textContent =
        signup.reviewed_by_name ||
        "—";

      const notesTd =
        document.createElement("td");

      notesTd.textContent =
        signup.manager_notes ||
        "—";

      const actionTd =
        document.createElement("td");

      actionTd.className =
        "inline-actions";

      if (
        signup.status ===
        "pending"
      ) {
        const approve =
          document.createElement("button");

        approve.type = "button";
        approve.className =
          "button approve small";
        approve.textContent =
          "Approve";

        approve.addEventListener(
          "click",
          () =>
            openReviewModal(
              signup,
              opportunity,
              "approved"
            )
        );

        const deny =
          document.createElement("button");

        deny.type = "button";
        deny.className =
          "button deny small";
        deny.textContent =
          "Deny";

        deny.addEventListener(
          "click",
          () =>
            openReviewModal(
              signup,
              opportunity,
              "denied"
            )
        );

        actionTd.append(
          approve,
          deny
        );

      } else if (
        signup.status ===
        "approved"
      ) {
        const complete =
          document.createElement("button");

        complete.type =
          "button";

        complete.className =
          "button approve small";

        complete.textContent =
          "Mark Completed";

        complete.addEventListener(
          "click",
          () =>
            completeSignup(
              signup
            )
        );

        actionTd.appendChild(
          complete
        );

      } else {
        actionTd.textContent =
          "—";
      }

      tr.append(
        employeeTd,
        statusTd,
        requestedTd,
        reviewedTd,
        notesTd,
        actionTd
      );

      detailSignupBody.appendChild(
        tr
      );
    });
  }

  function historyLabel(
    action
  ) {
    const labels = {
      opportunity_created:
        "Opportunity Created",

      opportunity_updated:
        "Opportunity Updated",

      signup_requested:
        "Overtime Requested",

      approved:
        "Request Approved",

      denied:
        "Request Denied",

      cancelled:
        "Request Cancelled",

      opportunity_closed:
        "Opportunity Closed",

      opportunity_reopened:
        "Opportunity Reopened",

      opportunity_cancelled:
        "Opportunity Cancelled",

      completed:
        "Overtime Completed"
    };

    return (
      labels[action] ||
      String(action || "Activity")
        .replaceAll("_"," ")
    );
  }

  function renderHistory(
    history
  ) {
    historyList.innerHTML = "";

    if (!history.length) {
      historyList.innerHTML =
        '<div class="empty">No history found.</div>';
      return;
    }

    history.forEach(item => {
      const row =
        document.createElement("article");

      row.className =
        "history-item";

      const title =
        document.createElement("strong");

      title.textContent =
        historyLabel(
          item.action_type
        );

      const description =
        document.createElement("div");

      const who =
        item.display_name
          ? ` • ${item.display_name}`
          : "";

      description.textContent =
        `${item.actor_display_name || "SecureTrack"}${who}`;

      const time =
        document.createElement("small");

      time.textContent =
        formatDate(
          item.occurred_at
        );

      row.append(
        title,
        description
      );

      if (item.notes) {
        const notes =
          document.createElement("small");

        notes.textContent =
          item.notes;

        row.appendChild(notes);
      }

      row.appendChild(time);

      historyList.appendChild(
        row
      );
    });
  }

  async function completeSignup(
    signup
  ) {
    const confirmed =
      window.confirm(
        `Mark ${signup.display_name} overtime assignment as completed?`
      );

    if (!confirmed) return;

    try {
      const { error } =
        await db.rpc(
          "complete_overtime_signup",
          {
            p_signup_id:
              signup.id
          }
        );

      if (error) throw error;

      showMessage(
        "Overtime assignment marked completed.",
        "success"
      );

      await refreshAll();

      if (currentDetailOpportunityId) {
        await loadDetail(
          currentDetailOpportunityId
        );
      }

    } catch (error) {
      console.error(
        "Complete overtime error:",
        error
      );

      showMessage(
        error.message ||
        "Unable to complete overtime assignment.",
        "error"
      );
    }
  }

  async function refreshAll() {
    await loadOpportunities();
    await loadMyRequests();
    await loadPendingReviews();
  }

  refreshButton.addEventListener(
    "click",
    async () => {
      refreshButton.disabled =
        true;

      refreshButton.textContent =
        "Refreshing…";

      try {
        await refreshAll();

      } catch (error) {
        console.error(
          "Overtime refresh error:",
          error
        );

        showMessage(
          error.message ||
          "Unable to refresh overtime.",
          "error"
        );

      } finally {
        refreshButton.disabled =
          false;

        refreshButton.textContent =
          "Refresh";
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

      await db.auth.signOut();

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

  opportunityDate.value =
    todayLocal();

  try {
    await refreshAll();

  } catch (error) {
    console.error(
      "Overtime initialization error:",
      error
    );

    showMessage(
      error.message ||
      "Unable to load Overtime.",
      "error"
    );
  }

})();
