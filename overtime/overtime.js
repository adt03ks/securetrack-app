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

  let opportunities = [];
  let myRequests = [];
  let pendingRequests = [];

  function roleLabel(list) {
    const order = ["admin","manager","team_lead","senior_officer","dispatcher","officer"];
    const found = order.find(role => list.includes(role));
    return (found || list[0] || "user").replaceAll("_"," ");
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
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  function formatTime(value) {
    if (!value) return "";
    const [hourString, minute = "00"] = String(value).split(":");
    let hour = Number(hourString);
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${suffix}`;
  }

  function setUserDisplay() {
    currentUserName.textContent =
      profile.display_name || auth.user.email || "SecureTrack User";

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
        "id, opportunity_date, shift_name, start_time, end_time, location, total_openings, filled_openings, requirements, notes, status, created_by_name, created_at"
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

    const openItems = opportunities.filter(item => item.status === "open");

    if (!openItems.length) {
      opportunityList.innerHTML =
        '<div class="empty">No open overtime opportunities.</div>';
      return;
    }

    const mySignupMap =
      new Map(myRequests.map(request => [request.opportunity_id, request]));

    openItems.forEach(item => {
      const remaining =
        Math.max(item.total_openings - item.filled_openings, 0);

      const card = document.createElement("article");
      card.className = "opportunity-card";

      const date = document.createElement("div");
      date.className = "eyebrow";
      date.textContent = item.opportunity_date;

      const title = document.createElement("h3");
      title.textContent = `${item.shift_name} • ${item.location}`;

      const meta = document.createElement("div");
      meta.className = "opportunity-meta";

      if (item.start_time || item.end_time) {
        const time = document.createElement("div");
        time.textContent =
          `Time: ${formatTime(item.start_time) || "—"} - ${formatTime(item.end_time) || "—"}`;
        meta.appendChild(time);
      }

      if (item.requirements) {
        const req = document.createElement("div");
        req.textContent = `Requirements: ${item.requirements}`;
        meta.appendChild(req);
      }

      if (item.notes) {
        const note = document.createElement("div");
        note.textContent = `Notes: ${item.notes}`;
        meta.appendChild(note);
      }

      const openings = document.createElement("div");
      openings.className = "opportunity-openings";
      openings.textContent =
        `${remaining} of ${item.total_openings} opening(s) remaining`;

      card.append(date, title, meta, openings);

      if (isOperational) {
        const actions = document.createElement("div");
        actions.className = "opportunity-actions";

        const existing = mySignupMap.get(item.id);

        if (existing && ["pending","approved"].includes(existing.status)) {
          const status = document.createElement("span");
          status.className = `status-pill ${existing.status}`;
          status.textContent = existing.status;
          actions.appendChild(status);
        } else {
          const signup = document.createElement("button");
          signup.type = "button";
          signup.className = "button primary";
          signup.textContent = remaining > 0 ? "Request Overtime" : "Full";
          signup.disabled = remaining <= 0;
          signup.addEventListener("click", () => requestOvertime(item));
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
      .select("id, opportunity_id, status, requested_at, reviewed_at, manager_notes")
      .eq("user_id", auth.user.id)
      .order("requested_at", { ascending: false });

    if (error) throw error;

    myRequests = data || [];

    myPendingCount.textContent =
      myRequests.filter(item => item.status === "pending").length;

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
      new Map(opportunities.map(item => [item.id, item]));

    myRequests.forEach(request => {
      const opportunity = opportunityMap.get(request.opportunity_id);
      const tr = document.createElement("tr");

      const dateTd = document.createElement("td");
      dateTd.textContent = opportunity?.opportunity_date || "—";

      const shiftTd = document.createElement("td");
      shiftTd.textContent = opportunity?.shift_name || "—";

      const locationTd = document.createElement("td");
      locationTd.textContent = opportunity?.location || "—";

      const statusTd = document.createElement("td");
      const status = document.createElement("span");
      status.className = `status-pill ${request.status}`;
      status.textContent = request.status;
      statusTd.appendChild(status);

      const requestedTd = document.createElement("td");
      requestedTd.textContent = formatDate(request.requested_at);

      const actionTd = document.createElement("td");

      if (["pending","approved"].includes(request.status)) {
        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.className = "button danger small";
        cancel.textContent = "Cancel";
        cancel.addEventListener("click", () => cancelSignup(request));
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
      .select("id, opportunity_id, user_id, display_name, status, requested_at")
      .eq("status", "pending")
      .order("requested_at", { ascending: true });

    if (error) throw error;

    pendingRequests = data || [];
    managerPendingCount.textContent = pendingRequests.length;
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
      new Map(opportunities.map(item => [item.id, item]));

    pendingRequests.forEach(request => {
      const opportunity = opportunityMap.get(request.opportunity_id);
      const tr = document.createElement("tr");

      const employeeTd = document.createElement("td");
      employeeTd.textContent = request.display_name;

      const dateTd = document.createElement("td");
      dateTd.textContent = opportunity?.opportunity_date || "—";

      const shiftTd = document.createElement("td");
      shiftTd.textContent = opportunity?.shift_name || "—";

      const locationTd = document.createElement("td");
      locationTd.textContent = opportunity?.location || "—";

      const requestedTd = document.createElement("td");
      requestedTd.textContent = formatDate(request.requested_at);

      const actionTd = document.createElement("td");
      actionTd.className = "inline-actions";

      const approve = document.createElement("button");
      approve.type = "button";
      approve.className = "button approve small";
      approve.textContent = "Approve";
      approve.addEventListener("click", () =>
        openReviewModal(request, opportunity, "approved")
      );

      const deny = document.createElement("button");
      deny.type = "button";
      deny.className = "button deny small";
      deny.textContent = "Deny";
      deny.addEventListener("click", () =>
        openReviewModal(request, opportunity, "denied")
      );

      actionTd.append(approve, deny);

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
      const tr = document.createElement("tr");

      const dateTd = document.createElement("td");
      dateTd.textContent = item.opportunity_date;

      const shiftTd = document.createElement("td");
      shiftTd.textContent = item.shift_name;

      const locationTd = document.createElement("td");
      locationTd.textContent = item.location;

      const filledTd = document.createElement("td");
      filledTd.textContent = `${item.filled_openings}/${item.total_openings}`;

      const statusTd = document.createElement("td");
      const status = document.createElement("span");
      status.className = `status-pill ${item.status}`;
      status.textContent = item.status;
      statusTd.appendChild(status);

      const manageTd = document.createElement("td");
      manageTd.className = "inline-actions";

      const choices =
        item.status === "open"
          ? [["closed","Close"],["cancelled","Cancel"]]
          : [["open","Reopen"]];

      choices.forEach(([statusValue, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className =
          statusValue === "cancelled"
            ? "button danger small"
            : "button secondary small";

        button.textContent = label;
        button.addEventListener("click", () =>
          setOpportunityStatus(item, statusValue)
        );

        manageTd.appendChild(button);
      });

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

  async function requestOvertime(opportunity) {
    clearMessage();

    const confirmed =
      window.confirm(
        `Request overtime for ${opportunity.opportunity_date} ${opportunity.shift_name} at ${opportunity.location}?`
      );

    if (!confirmed) return;

    try {
      const { error } = await db.rpc(
        "request_overtime_signup",
        {
          p_opportunity_id: opportunity.id
        }
      );

      if (error) throw error;

      showMessage(
        "Overtime request submitted for manager approval.",
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error("Overtime request error:", error);

      showMessage(
        error.message || "Unable to request overtime.",
        "error"
      );
    }
  }

  async function cancelSignup(request) {
    const confirmed =
      window.confirm("Cancel this overtime request?");

    if (!confirmed) return;

    try {
      const { error } = await db.rpc(
        "cancel_overtime_signup",
        {
          p_signup_id: request.id
        }
      );

      if (error) throw error;

      showMessage(
        "Overtime request cancelled.",
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error("Overtime cancellation error:", error);

      showMessage(
        error.message || "Unable to cancel overtime request.",
        "error"
      );
    }
  }

  function openReviewModal(request, opportunity, decision) {
    reviewSignupId.value = request.id;
    reviewDecision.value = decision;
    reviewNotes.value = "";

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
    reviewModal.setAttribute("aria-hidden", "false");
  }

  function closeReviewModal() {
    reviewModal.classList.remove("show");
    reviewModal.setAttribute("aria-hidden", "true");
  }

  reviewForm.addEventListener("submit", async event => {
    event.preventDefault();

    confirmReviewButton.disabled = true;

    try {
      const { error } = await db.rpc(
        "review_overtime_signup",
        {
          p_signup_id: reviewSignupId.value,
          p_decision: reviewDecision.value,
          p_notes: reviewNotes.value.trim() || null
        }
      );

      if (error) throw error;

      closeReviewModal();

      showMessage(
        `Overtime request ${reviewDecision.value}.`,
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error("Overtime review error:", error);

      showMessage(
        error.message || "Unable to review overtime request.",
        "error"
      );

    } finally {
      confirmReviewButton.disabled = false;
    }
  });

  cancelReviewButton.addEventListener(
    "click",
    closeReviewModal
  );

  reviewModal.addEventListener("click", event => {
    if (event.target === reviewModal) {
      closeReviewModal();
    }
  });

  async function setOpportunityStatus(item, status) {
    const confirmed =
      window.confirm(
        `${status === "open" ? "Reopen" : status === "closed" ? "Close" : "Cancel"} this overtime opportunity?`
      );

    if (!confirmed) return;

    try {
      const { error } = await db.rpc(
        "set_overtime_opportunity_status",
        {
          p_opportunity_id: item.id,
          p_status: status
        }
      );

      if (error) throw error;

      showMessage(
        `Overtime opportunity ${status}.`,
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error("Opportunity status error:", error);

      showMessage(
        error.message || "Unable to update overtime opportunity.",
        "error"
      );
    }
  }

  createOpportunityForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    createOpportunityButton.disabled = true;
    createOpportunityButton.textContent = "Creating…";

    try {
      const { error } = await db.rpc(
        "create_overtime_opportunity",
        {
          p_opportunity_date: opportunityDate.value,
          p_shift_name: opportunityShift.value.trim(),
          p_location: opportunityLocation.value.trim(),
          p_total_openings: Number(totalOpenings.value),
          p_start_time: startTime.value || null,
          p_end_time: endTime.value || null,
          p_requirements: requirements.value.trim() || null,
          p_notes: opportunityNotes.value.trim() || null
        }
      );

      if (error) throw error;

      createOpportunityForm.reset();
      opportunityDate.value = todayLocal();
      totalOpenings.value = "1";

      showMessage(
        "Overtime opportunity created.",
        "success"
      );

      await refreshAll();

    } catch (error) {
      console.error("Create overtime opportunity error:", error);

      showMessage(
        error.message || "Unable to create overtime opportunity.",
        "error"
      );

    } finally {
      createOpportunityButton.disabled = false;
      createOpportunityButton.textContent = "Create Opportunity";
    }
  });

  async function refreshAll() {
    await loadOpportunities();
    await loadMyRequests();
    await loadPendingReviews();
  }

  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing…";

    try {
      await refreshAll();

    } catch (error) {
      console.error("Overtime refresh error:", error);

      showMessage(
        error.message || "Unable to refresh overtime.",
        "error"
      );

    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh";
    }
  });

  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    signOutButton.textContent = "Signing Out…";

    await db.auth.signOut();

    window.location.replace(
      new URL(
        "login.html",
        auth.appRootUrl || "../"
      ).href
    );
  });

  setUserDisplay();
  opportunityDate.value = todayLocal();

  try {
    await refreshAll();

  } catch (error) {
    console.error("Overtime initialization error:", error);

    showMessage(
      error.message || "Unable to load Overtime.",
      "error"
    );
  }
})();
