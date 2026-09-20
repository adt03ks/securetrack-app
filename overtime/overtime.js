(async function () {
  "use strict";

  // =========================================================
  // AUTH
  // =========================================================

  const BUILD_ID = "2026-09-19-1826";
  console.log(`SecureTrack Overtime build ${BUILD_ID}`);


  async function buildAuthFallback() {

    const cfg =
      window.SECURETRACK_CONFIG || {};


    if (
      !window.supabase ||
      !cfg.supabaseUrl ||
      !cfg.supabaseAnonKey
    ) {
      throw new Error(
        "SecureTrack configuration is unavailable."
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
      data: { session },
      error: sessionError
    } =
      await fallbackDb.auth.getSession();


    if (sessionError) {
      throw sessionError;
    }


    if (!session?.user) {
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
            "id, display_name, employee_number, email, is_active"
          )
          .eq(
            "id",
            session.user.id
          )
          .maybeSingle(),

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
      profileResult.data || {};


    const roles =
      (rolesResult.data || [])
        .map(row => row.role);


    const fallbackAuth = {
      db: fallbackDb,
      session,
      user: session.user,
      profile,
      roles
    };


    window.SecureTrackAuth =
      window.SecureTrackAuth ||
      fallbackAuth;


    return fallbackAuth;

  }


  function waitForAuth() {

    if (window.SecureTrackAuth) {
      return Promise.resolve(
        window.SecureTrackAuth
      );
    }


    return new Promise(
      (resolve, reject) => {

        let settled = false;


        const finish = authValue => {

          if (settled) {
            return;
          }


          settled = true;


          document.removeEventListener(
            "securetrack:authorized",
            handler
          );


          resolve(authValue);

        };


        const handler = event => {

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

              if (window.SecureTrackAuth) {
                finish(
                  window.SecureTrackAuth
                );
                return;
              }


              const fallbackAuth =
                await buildAuthFallback();


              if (!fallbackAuth) {
                throw new Error(
                  "No active SecureTrack session was found."
                );
              }


              finish(
                fallbackAuth
              );

            }

            catch (error) {

              if (!settled) {
                settled = true;

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


  let auth;


  try {

    auth =
      await waitForAuth();

  }

  catch (error) {

    console.error(
      "SecureTrack overtime authentication failed:",
      error
    );


    const nameEl =
      document.getElementById(
        "currentUserName"
      );


    const messageEl =
      document.getElementById(
        "pageMessage"
      );


    const listEl =
      document.getElementById(
        "opportunityList"
      );


    if (nameEl) {
      nameEl.textContent =
        "Authentication unavailable";
    }


    if (messageEl) {
      messageEl.textContent =
        error.message ||
        "Unable to initialize SecureTrack authentication.";

      messageEl.className =
        "message show error";
    }


    if (listEl) {
      listEl.innerHTML =
        '<div class="empty">Unable to initialize SecureTrack authentication.</div>';
    }


    return;

  }


  if (
    !auth?.db ||
    !auth?.user
  ) {

    console.error(
      "SecureTrack authentication returned without a database client or user.",
      auth
    );

    return;
  }


  const db =
    auth.db;


  const profile =
    auth.profile || {};


  const roles =
    auth.roles || [];


  const isManager =
    roles.includes(
      "manager"
    ) ||
    roles.includes(
      "director"
    ) ||
    roles.includes(
      "admin"
    );


  const isOperational =
    roles.some(
      role =>
        [
          "officer",
          "dispatcher",
          "senior_officer",
          "team_lead"
        ].includes(
          role
        )
    );


  const $ =
    id =>
      document.getElementById(
        id
      );


  // =========================================================
  // ELEMENTS
  // =========================================================

  const currentUserName =
    $("currentUserName");

  const currentUserRole =
    $("currentUserRole");

  const signOutButton =
    $("signOutButton");

  const pageMessage =
    $("pageMessage");


  const openCount =
    $("openCount");

  const myPendingCount =
    $("myPendingCount");

  const managerPendingStat =
    $("managerPendingStat");

  const managerPendingCount =
    $("managerPendingCount");


  const managerCreateSection =
    $("managerCreateSection");

  const managerReviewSection =
    $("managerReviewSection");

  const managerManageSection =
    $("managerManageSection");


  const createOpportunityForm =
    $("createOpportunityForm");

  const opportunityDate =
    $("opportunityDate");

  const opportunityShift =
    $("opportunityShift");

  const startTime =
    $("startTime");

  const endTime =
    $("endTime");

  const opportunityLocation =
    $("opportunityLocation");

  const totalOpenings =
    $("totalOpenings");

  const requirements =
    $("requirements");

  const opportunityNotes =
    $("opportunityNotes");

  const createOpportunityButton =
    $("createOpportunityButton");


  const refreshButton =
    $("refreshButton");

  const opportunityList =
    $("opportunityList");

  const myRequestsSection =
    $("myRequestsSection");

  const myRequestsBody =
    $("myRequestsBody");

  const pendingReviewBody =
    $("pendingReviewBody");

  const manageOpportunityBody =
    $("manageOpportunityBody");


  const reviewModal =
    $("reviewModal");

  const reviewForm =
    $("reviewForm");

  const reviewSignupId =
    $("reviewSignupId");

  const reviewDecision =
    $("reviewDecision");

  const reviewSummary =
    $("reviewSummary");

  const reviewNotes =
    $("reviewNotes");

  const confirmReviewButton =
    $("confirmReviewButton");

  const cancelReviewButton =
    $("cancelReviewButton");


  const detailModal =
    $("detailModal");

  const detailModalTitle =
    $("detailModalTitle");

  const detailSummary =
    $("detailSummary");

  const detailInfo =
    $("detailInfo");

  const detailSignupBody =
    $("detailSignupBody");

  const historyList =
    $("historyList");

  const closeDetailButton =
    $("closeDetailButton");


  const editModal =
    $("editModal");

  const editOpportunityForm =
    $("editOpportunityForm");

  const editOpportunityId =
    $("editOpportunityId");

  const editOpportunityDate =
    $("editOpportunityDate");

  const editOpportunityShift =
    $("editOpportunityShift");

  const editStartTime =
    $("editStartTime");

  const editEndTime =
    $("editEndTime");

  const editOpportunityLocation =
    $("editOpportunityLocation");

  const editTotalOpenings =
    $("editTotalOpenings");

  const editRequirements =
    $("editRequirements");

  const editOpportunityNotes =
    $("editOpportunityNotes");

  const saveEditButton =
    $("saveEditButton");

  const closeEditButton =
    $("closeEditButton");

  const cancelEditButton =
    $("cancelEditButton");


  const offCampusModal =
    $("offCampusModal");

  const offCampusForm =
    $("offCampusForm");

  const offCampusOpportunityId =
    $("offCampusOpportunityId");

  const offCampusSummary =
    $("offCampusSummary");

  const offCampusOfficerSearch =
    $("offCampusOfficerSearch");

  const offCampusOfficerSearchButton =
    $("offCampusOfficerSearchButton");

  const offCampusOfficerResults =
    $("offCampusOfficerResults");

  const offCampusSelectedOfficerId =
    $("offCampusSelectedOfficerId");

  const offCampusSelectedOfficer =
    $("offCampusSelectedOfficer");

  const offCampusSelectedOfficerName =
    $("offCampusSelectedOfficerName");

  const offCampusSelectedOfficerDetails =
    $("offCampusSelectedOfficerDetails");

  const offCampusPickerMessage =
    $("offCampusPickerMessage");

  const offCampusNotes =
    $("offCampusNotes");

  const confirmOffCampusButton =
    $("confirmOffCampusButton");

  const cancelOffCampusButton =
    $("cancelOffCampusButton");


  let opportunities =
    [];

  let myRequests =
    [];

  let pendingRequests =
    [];

  let currentDetailOpportunityId =
    null;


  // =========================================================
  // HELPERS
  // =========================================================

  function roleLabel(
    list
  ) {

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
      order.find(
        role =>
          list.includes(
            role
          )
      );


    return (
      found ||
      list[0] ||
      "user"
    ).replaceAll(
      "_",
      " "
    );

  }


  function showMessage(
    message,
    type = "info"
  ) {

    if (!pageMessage) {
      return;
    }


    pageMessage.textContent =
      message;


    pageMessage.className =
      `message show ${type}`;

  }


  function clearMessage() {

    if (!pageMessage) {
      return;
    }


    pageMessage.textContent =
      "";


    pageMessage.className =
      "message";

  }


  function todayLocal() {

    const d =
      new Date();


    const offset =
      d.getTimezoneOffset();


    return new Date(
      d.getTime() -
      offset * 60000
    )
      .toISOString()
      .slice(
        0,
        10
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
        value
      );


    return Number.isNaN(
      date.getTime()
    )
      ? String(
          value
        )
      : date.toLocaleString();

  }


  function formatTime(
    value
  ) {

    if (!value) {
      return "";
    }


    const [
      hourString,
      minute = "00"
    ] =
      String(
        value
      ).split(
        ":"
      );


    let hour =
      Number(
        hourString
      );


    const suffix =
      hour >= 12
        ? "PM"
        : "AM";


    hour =
      hour % 12 ||
      12;


    return `${hour}:${minute} ${suffix}`;

  }


  function setUserDisplay() {

    if (
      currentUserName
    ) {

      currentUserName.textContent =
        profile.display_name ||
        auth.user.email ||
        "SecureTrack User";

    }


    if (
      currentUserRole
    ) {

      currentUserRole.textContent =
        roleLabel(
          roles
        );

    }


    if (
      managerCreateSection
    ) {

      managerCreateSection.hidden =
        !isManager;

    }


    if (
      managerReviewSection
    ) {

      managerReviewSection.hidden =
        !isManager;

    }


    if (
      managerManageSection
    ) {

      managerManageSection.hidden =
        !isManager;

    }


    if (
      managerPendingStat
    ) {

      managerPendingStat.hidden =
        !isManager;

    }


    if (
      myRequestsSection
    ) {

      myRequestsSection.hidden =
        !isOperational;

    }

  }


  /*
    Populate the user immediately.

    This prevents the page from staying on
    "Signed in as Loading..." if a later
    database query fails.
  */

  setUserDisplay();


  if (
    opportunityDate
  ) {

    opportunityDate.value =
      todayLocal();

  }


  // =========================================================
  // LOAD OPPORTUNITIES
  // =========================================================

  async function loadOpportunities() {

    const {
      data,
      error
    } =
      await db
        .from(
          "overtime_opportunities"
        )
        .select(
          "id, opportunity_date, shift_name, start_time, end_time, location, total_openings, filled_openings, requirements, notes, status, created_by_name, created_at, updated_at"
        )
        .order(
          "opportunity_date",
          {
            ascending:
              true
          }
        )
        .order(
          "start_time",
          {
            ascending:
              true
          }
        );


    if (
      error
    ) {
      throw error;
    }


    opportunities =
      data || [];


    renderOpportunities();

    renderManageOpportunities();


    if (
      openCount
    ) {

      openCount.textContent =
        String(
          opportunities.filter(
            item =>
              item.status ===
              "open" &&
              item.filled_openings <
              item.total_openings
          ).length
        );

    }

  }


  // =========================================================
  // RENDER OPEN OPPORTUNITIES
  // =========================================================

  function renderOpportunities() {

    if (
      !opportunityList
    ) {
      return;
    }


    opportunityList.innerHTML =
      "";


    const openItems =
      opportunities.filter(
        item =>
          item.status ===
          "open"
      );


    if (
      !openItems.length
    ) {

      opportunityList.innerHTML =
        '<div class="empty">No open overtime opportunities.</div>';


      return;

    }


    const mySignupMap =
      new Map(
        myRequests.map(
          request => [
            request.opportunity_id,
            request
          ]
        )
      );


    openItems.forEach(
      item => {

        const remaining =
          Math.max(

            Number(
              item.total_openings ||
              0
            )

            -

            Number(
              item.filled_openings ||
              0
            ),

            0

          );


        const card =
          document.createElement(
            "article"
          );


        card.className =
          "opportunity-card";


        const date =
          document.createElement(
            "div"
          );


        date.className =
          "eyebrow";


        date.textContent =
          item.opportunity_date ||
          "—";


        const title =
          document.createElement(
            "h3"
          );


        title.textContent =
          `${item.shift_name || "—"} • ` +
          `${item.location || "—"}`;


        const meta =
          document.createElement(
            "div"
          );


        meta.className =
          "opportunity-meta";


        if (
          item.start_time ||
          item.end_time
        ) {

          const time =
            document.createElement(
              "div"
            );


          time.textContent =

            `Time: ${formatTime(
              item.start_time
            ) || "—"} - `

            +

            `${formatTime(
              item.end_time
            ) || "—"}`;


          meta.appendChild(
            time
          );

        }


        if (
          item.requirements
        ) {

          const req =
            document.createElement(
              "div"
            );


          req.textContent =
            `Requirements: ${item.requirements}`;


          meta.appendChild(
            req
          );

        }


        if (
          item.notes
        ) {

          const note =
            document.createElement(
              "div"
            );


          note.textContent =
            `Notes: ${item.notes}`;


          meta.appendChild(
            note
          );

        }


        const openings =
          document.createElement(
            "div"
          );


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


        if (
          isOperational
        ) {

          const actions =
            document.createElement(
              "div"
            );


          actions.className =
            "opportunity-actions";


          const existing =
            mySignupMap.get(
              item.id
            );


          if (
            existing &&
            [
              "pending",
              "approved"
            ].includes(
              existing.status
            )
          ) {

            const status =
              document.createElement(
                "span"
              );


            status.className =
              `status-pill ${existing.status}`;


            status.textContent =
              existing.status;


            actions.appendChild(
              status
            );

          }

          else {

            const signup =
              document.createElement(
                "button"
              );


            signup.type =
              "button";


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
              () =>
                requestOvertime(
                  item
                )
            );


            actions.appendChild(
              signup
            );

          }


          card.appendChild(
            actions
          );

        }


        opportunityList.appendChild(
          card
        );

      }
    );

  }


  // =========================================================
  // MY REQUESTS
  // =========================================================

  async function loadMyRequests() {

    if (
      !isOperational
    ) {

      myRequests =
        [];


      if (
        myPendingCount
      ) {

        myPendingCount.textContent =
          "0";

      }


      renderOpportunities();


      return;

    }


    const {
      data,
      error
    } =
      await db
        .from(
          "overtime_signups"
        )
        .select(
          "id, opportunity_id, status, requested_at, reviewed_at, manager_notes"
        )
        .eq(
          "user_id",
          auth.user.id
        )
        .order(
          "requested_at",
          {
            ascending:
              false
          }
        );


    if (
      error
    ) {
      throw error;
    }


    myRequests =
      data || [];


    if (
      myPendingCount
    ) {

      myPendingCount.textContent =
        String(
          myRequests.filter(
            item =>
              item.status ===
              "pending"
          ).length
        );

    }


    renderMyRequests();

    renderOpportunities();

  }


  function renderMyRequests() {

    if (
      !myRequestsBody
    ) {
      return;
    }


    myRequestsBody.innerHTML =
      "";


    if (
      !myRequests.length
    ) {

      myRequestsBody.innerHTML =
        '<tr><td colspan="6" class="empty">No overtime requests.</td></tr>';


      return;

    }


    const opportunityMap =
      new Map(
        opportunities.map(
          item => [
            item.id,
            item
          ]
        )
      );


    myRequests.forEach(
      request => {

        const opportunity =
          opportunityMap.get(
            request.opportunity_id
          );


        const tr =
          document.createElement(
            "tr"
          );


        const dateTd =
          document.createElement(
            "td"
          );


        dateTd.textContent =
          opportunity?.opportunity_date ||
          "—";


        const shiftTd =
          document.createElement(
            "td"
          );


        shiftTd.textContent =
          opportunity?.shift_name ||
          "—";


        const typeTd =
          document.createElement(
            "td"
          );


        typeTd.textContent =
          opportunity?.location ||
          "—";


        const statusTd =
          document.createElement(
            "td"
          );


        const status =
          document.createElement(
            "span"
          );


        status.className =
          `status-pill ${request.status}`;


        status.textContent =
          request.status;


        statusTd.appendChild(
          status
        );


        const requestedTd =
          document.createElement(
            "td"
          );


        requestedTd.textContent =
          formatDate(
            request.requested_at
          );


        const actionTd =
          document.createElement(
            "td"
          );


        if (
          [
            "pending",
            "approved"
          ].includes(
            request.status
          )
        ) {

          const cancel =
            document.createElement(
              "button"
            );


          cancel.type =
            "button";


          cancel.className =
            "button danger small";


          cancel.textContent =
            "Cancel";


          cancel.addEventListener(
            "click",
            () =>
              cancelSignup(
                request
              )
          );


          actionTd.appendChild(
            cancel
          );

        }

        else {

          actionTd.textContent =
            "—";

        }


        tr.append(
          dateTd,
          shiftTd,
          typeTd,
          statusTd,
          requestedTd,
          actionTd
        );


        myRequestsBody.appendChild(
          tr
        );

      }
    );

  }


  // =========================================================
  // PENDING MANAGEMENT REVIEW
  // =========================================================

  async function loadPendingReviews() {

    if (
      !isManager
    ) {

      pendingRequests =
        [];


      return;

    }


    const {
      data,
      error
    } =
      await db
        .from(
          "overtime_signups"
        )
        .select(
          "id, opportunity_id, user_id, display_name, status, requested_at"
        )
        .eq(
          "status",
          "pending"
        )
        .order(
          "requested_at",
          {
            ascending:
              true
          }
        );


    if (
      error
    ) {
      throw error;
    }


    pendingRequests =
      data || [];


    if (
      managerPendingCount
    ) {

      managerPendingCount.textContent =
        String(
          pendingRequests.length
        );

    }


    renderPendingReviews();

  }


  function renderPendingReviews() {

    if (
      !pendingReviewBody
    ) {
      return;
    }


    pendingReviewBody.innerHTML =
      "";


    if (
      !pendingRequests.length
    ) {

      pendingReviewBody.innerHTML =
        '<tr><td colspan="6" class="empty">No pending overtime requests.</td></tr>';


      return;

    }


    const opportunityMap =
      new Map(
        opportunities.map(
          item => [
            item.id,
            item
          ]
        )
      );


    pendingRequests.forEach(
      request => {

        const opportunity =
          opportunityMap.get(
            request.opportunity_id
          );


        const tr =
          document.createElement(
            "tr"
          );


        const employeeTd =
          document.createElement(
            "td"
          );


        employeeTd.textContent =
          request.display_name ||
          "—";


        const dateTd =
          document.createElement(
            "td"
          );


        dateTd.textContent =
          opportunity?.opportunity_date ||
          "—";


        const shiftTd =
          document.createElement(
            "td"
          );


        shiftTd.textContent =
          opportunity?.shift_name ||
          "—";


        const typeTd =
          document.createElement(
            "td"
          );


        typeTd.textContent =
          opportunity?.location ||
          "—";


        const requestedTd =
          document.createElement(
            "td"
          );


        requestedTd.textContent =
          formatDate(
            request.requested_at
          );


        const actionTd =
          document.createElement(
            "td"
          );


        actionTd.className =
          "inline-actions";


        const approve =
          document.createElement(
            "button"
          );


        approve.type =
          "button";


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
          document.createElement(
            "button"
          );


        deny.type =
          "button";


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
          typeTd,
          requestedTd,
          actionTd
        );


        pendingReviewBody.appendChild(
          tr
        );

      }
    );

  }


  function openReviewModal(
    request,
    opportunity,
    decision
  ) {

    if (
      !reviewModal
    ) {
      return;
    }


    reviewSignupId.value =
      request.id;


    reviewDecision.value =
      decision;


    reviewNotes.value =
      "";


    reviewSummary.textContent =

      `${decision === "approved"
        ? "Approve"
        : "Deny"} `

      +

      `${request.display_name} for `

      +

      `${opportunity?.opportunity_date || ""} `

      +

      `${opportunity?.shift_name || ""} `

      +

      `${opportunity?.location || ""}?`;


    confirmReviewButton.textContent =
      decision ===
      "approved"
        ? "Approve Request"
        : "Deny Request";


    confirmReviewButton.className =
      decision ===
      "approved"
        ? "button approve"
        : "button deny";


    reviewModal.classList.add(
      "show"
    );


    reviewModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function closeReviewModal() {

    if (
      !reviewModal
    ) {
      return;
    }


    reviewModal.classList.remove(
      "show"
    );


    reviewModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  // =========================================================
  // MANAGE OPPORTUNITIES
  // =========================================================

  function renderManageOpportunities() {

    if (
      !isManager ||
      !manageOpportunityBody
    ) {
      return;
    }


    manageOpportunityBody.innerHTML =
      "";


    if (
      !opportunities.length
    ) {

      manageOpportunityBody.innerHTML =
        '<tr><td colspan="6" class="empty">No opportunities found.</td></tr>';


      return;

    }


    opportunities.forEach(
      item => {

        const tr =
          document.createElement(
            "tr"
          );


        const dateTd =
          document.createElement(
            "td"
          );


        dateTd.textContent =
          item.opportunity_date ||
          "—";


        const shiftTd =
          document.createElement(
            "td"
          );


        shiftTd.textContent =
          item.shift_name ||
          "—";


        const typeTd =
          document.createElement(
            "td"
          );


        typeTd.textContent =
          item.location ||
          "—";


        const filledTd =
          document.createElement(
            "td"
          );


        filledTd.textContent =
          `${item.filled_openings}/${item.total_openings}`;


        const statusTd =
          document.createElement(
            "td"
          );


        const status =
          document.createElement(
            "span"
          );


        status.className =
          `status-pill ${item.status}`;


        status.textContent =
          item.status;


        statusTd.appendChild(
          status
        );


        const manageTd =
          document.createElement(
            "td"
          );


        manageTd.className =
          "inline-actions";


        const details =
          document.createElement(
            "button"
          );


        details.type =
          "button";


        details.className =
          "button secondary small";


        details.textContent =
          "View Details";


        details.addEventListener(
          "click",
          () =>
            openDetail(
              item
            )
        );


        manageTd.appendChild(
          details
        );


        const edit =
          document.createElement(
            "button"
          );


        edit.type =
          "button";


        edit.className =
          "button secondary small";


        edit.textContent =
          "Edit";


        edit.addEventListener(
          "click",
          () =>
            openEditModal(
              item
            )
        );


        manageTd.appendChild(
          edit
        );


        const remaining =
          Math.max(

            Number(
              item.total_openings ||
              0
            )

            -

            Number(
              item.filled_openings ||
              0
            ),

            0

          );


       if (
  item.status === "open" &&
  remaining > 0
) {

  const offCampus =
    document.createElement("button");

  offCampus.type =
    "button";

  offCampus.className =
    "button primary small fill-off-campus-button";

  offCampus.textContent =
    "Fill Off-Campus";

  // Force button to remain active.
  offCampus.disabled =
    false;

  offCampus.style.pointerEvents =
    "auto";

  offCampus.style.cursor =
    "pointer";

  offCampus.addEventListener(
    "click",
    event => {

      event.preventDefault();
      event.stopPropagation();

      console.log(
        "Opening off-campus modal:",
        item
      );

      openOffCampusModal(
        item
      );

    }
  );

  manageTd.appendChild(
    offCampus
  );

}

        const choices =

          item.status ===
          "open"

            ? [
                [
                  "closed",
                  "Close"
                ],
                [
                  "cancelled",
                  "Cancel"
                ]
              ]

            : item.status ===
              "closed"

              ? [
                  [
                    "open",
                    "Reopen"
                  ]
                ]

              : [];


        choices.forEach(
          ([
            statusValue,
            label
          ]) => {

            const button =
              document.createElement(
                "button"
              );


            button.type =
              "button";


            button.className =

              statusValue ===
              "cancelled"

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


            manageTd.appendChild(
              button
            );

          }
        );


        tr.append(
          dateTd,
          shiftTd,
          typeTd,
          filledTd,
          statusTd,
          manageTd
        );


        manageOpportunityBody.appendChild(
          tr
        );

      }
    );

  }


  // =========================================================
  // REQUEST OVERTIME
  // =========================================================

  async function requestOvertime(
    opportunity
  ) {

    clearMessage();


    const confirmed =
      window.confirm(

        `Request overtime for ${opportunity.opportunity_date} `

        +

        `${opportunity.shift_name} • ${opportunity.location}?`

      );


    if (
      !confirmed
    ) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "request_overtime_signup",
          {
            p_opportunity_id:
              opportunity.id
          }
        );


      if (
        error
      ) {
        throw error;
      }


      showMessage(
        "Overtime request submitted for manager approval.",
        "success"
      );


      await refreshAll();

    }

    catch (
      error
    ) {

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


  // =========================================================
  // CANCEL OFFICER REQUEST
  // =========================================================

  async function cancelSignup(
    request
  ) {

    const confirmed =
      window.confirm(
        "Cancel this overtime request?"
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "cancel_overtime_signup",
          {
            p_signup_id:
              request.id
          }
        );


      if (
        error
      ) {
        throw error;
      }


      showMessage(
        "Overtime request cancelled.",
        "success"
      );


      await refreshAll();

    }

    catch (
      error
    ) {

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


  // =========================================================
  // SET OPPORTUNITY STATUS
  // =========================================================

  async function setOpportunityStatus(
    item,
    statusValue
  ) {

    const verb =

      statusValue ===
      "open"

        ? "Reopen"

        : statusValue ===
          "closed"

          ? "Close"

          : "Cancel";


    if (
      !window.confirm(
        `${verb} this overtime opportunity?`
      )
    ) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "set_overtime_opportunity_status",
          {
            p_opportunity_id:
              item.id,

            p_status:
              statusValue
          }
        );


      if (
        error
      ) {
        throw error;
      }


      showMessage(
        `Overtime opportunity ${statusValue}.`,
        "success"
      );


      await refreshAll();

    }

    catch (
      error
    ) {

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


  // =========================================================
  // CREATE OVERTIME
  // =========================================================

  if (
    createOpportunityForm
  ) {

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

          const {
            error
          } =
            await db.rpc(
              "create_overtime_opportunity",
              {

                p_opportunity_date:
                  opportunityDate.value,

                p_shift_name:
                  opportunityShift.value.trim(),

                p_location:
                  opportunityLocation.value,

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


          if (
            error
          ) {
            throw error;
          }


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

        }

        catch (
          error
        ) {

          console.error(
            "Create overtime opportunity error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to create overtime opportunity.",
            "error"
          );

        }

        finally {

          createOpportunityButton.disabled =
            false;


          createOpportunityButton.textContent =
            "Create Opportunity";

        }

      }
    );

  }


  // =========================================================
  // EDIT OVERTIME
  // =========================================================

  function openEditModal(
    item
  ) {

    editOpportunityId.value =
      item.id;


    editOpportunityDate.value =
      item.opportunity_date ||
      "";


    editOpportunityShift.value =
      item.shift_name ||
      "";


    editStartTime.value =
      item.start_time

        ? String(
            item.start_time
          ).slice(
            0,
            5
          )

        : "";


    editEndTime.value =
      item.end_time

        ? String(
            item.end_time
          ).slice(
            0,
            5
          )

        : "";


    editOpportunityLocation.value =
      item.location ||
      "";


    editTotalOpenings.value =
      item.total_openings;


    editRequirements.value =
      item.requirements ||
      "";


    editOpportunityNotes.value =
      item.notes ||
      "";


    editModal.classList.add(
      "show"
    );


    editModal.setAttribute(
      "aria-hidden",
      "false"
    );

  }


  function closeEditModal() {

    if (
      !editModal
    ) {
      return;
    }


    editModal.classList.remove(
      "show"
    );


    editModal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  if (
    editOpportunityForm
  ) {

    editOpportunityForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        saveEditButton.disabled =
          true;


        saveEditButton.textContent =
          "Saving…";


        try {

          const {
            error
          } =
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
                  editOpportunityLocation.value,

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


          if (
            error
          ) {
            throw error;
          }


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

        }

        catch (
          error
        ) {

          console.error(
            "Update overtime opportunity error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to update overtime opportunity.",
            "error"
          );

        }

        finally {

          saveEditButton.disabled =
            false;


          saveEditButton.textContent =
            "Save Changes";

        }

      }
    );

  }


  closeEditButton
    ?.addEventListener(
      "click",
      closeEditModal
    );


  cancelEditButton
    ?.addEventListener(
      "click",
      closeEditModal
    );


  editModal
    ?.addEventListener(
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


  // =========================================================
  // OUTSIDE OFFICER DIRECTORY -> OVERTIME ASSIGNMENT
  // =========================================================

  let selectedOutsideOfficer =
    null;

  let outsideOfficerSearchTimer =
    null;


  function setOffCampusPickerMessage(
    text,
    type = ""
  ) {

    if (!offCampusPickerMessage) {
      return;
    }

    offCampusPickerMessage.textContent =
      text || "";

    offCampusPickerMessage.style.display =
      text
        ? "block"
        : "none";

    offCampusPickerMessage.style.color =
      type === "error"
        ? "#ffadad"
        : type === "success"
          ? "#9adea8"
          : "#aeb6be";

    offCampusPickerMessage.style.borderColor =
      type === "error"
        ? "rgba(224,74,74,.45)"
        : type === "success"
          ? "rgba(87,187,109,.40)"
          : "#343a41";
  }


  function normalizeQualificationList(
    value
  ) {

    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (
      typeof value === "object"
    ) {
      return Object.values(value);
    }

    try {
      const parsed =
        JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed;
      }

      if (
        parsed &&
        typeof parsed === "object"
      ) {
        return Object.values(parsed);
      }
    }
    catch (_) {
      // Ignore non-JSON qualification text.
    }

    return [];
  }


  function isVerifiedArmedOutsideOfficer(
    officer
  ) {

    return normalizeQualificationList(
      officer?.qualifications
    ).some(item => {

      const code =
        String(
          item?.qualification_code ||
          item?.code ||
          ""
        )
          .trim()
          .toUpperCase();

      const status =
        String(
          item?.status ||
          "active"
        )
          .trim()
          .toLowerCase();

      const verification =
        String(
          item?.verification_status ||
          (
            item?.verified === true
              ? "verified"
              : ""
          )
        )
          .trim()
          .toLowerCase();

      return (
        code === "ARMED" &&
        status !== "revoked" &&
        (
          verification === "verified" ||
          item?.verified === true
        )
      );
    });
  }


  function outsideOfficerMetaText(
    officer
  ) {

    const parts = [];

    if (officer?.officer_rank) {
      parts.push(
        roleLabel([
          officer.officer_rank
        ])
      );
    }

    if (officer?.home_campus) {
      parts.push(
        officer.home_campus
      );
    }

    if (officer?.employee_number) {
      parts.push(
        `#${officer.employee_number}`
      );
    }

    if (
      isVerifiedArmedOutsideOfficer(
        officer
      )
    ) {
      parts.push(
        "🛡 Armed Qualified"
      );
    }

    return parts.join(" • ");
  }


  function clearSelectedOutsideOfficer() {

    selectedOutsideOfficer =
      null;

    if (offCampusSelectedOfficerId) {
      offCampusSelectedOfficerId.value =
        "";
    }

    if (offCampusSelectedOfficer) {
      offCampusSelectedOfficer.hidden =
        true;
    }

    if (offCampusSelectedOfficerName) {
      offCampusSelectedOfficerName.textContent =
        "—";
    }

    if (offCampusSelectedOfficerDetails) {
      offCampusSelectedOfficerDetails.textContent =
        "—";
    }

    if (confirmOffCampusButton) {
      confirmOffCampusButton.disabled =
        true;
    }
  }


  function selectOutsideOfficer(
    officer
  ) {

    selectedOutsideOfficer =
      officer;

    if (offCampusSelectedOfficerId) {
      offCampusSelectedOfficerId.value =
        officer.outside_officer_id ||
        "";
    }

    if (offCampusSelectedOfficerName) {
      offCampusSelectedOfficerName.textContent =
        officer.display_name ||
        "Outside Officer";
    }

    if (offCampusSelectedOfficerDetails) {
      offCampusSelectedOfficerDetails.textContent =
        outsideOfficerMetaText(
          officer
        ) ||
        "Outside Officer Directory";
    }

    if (offCampusSelectedOfficer) {
      offCampusSelectedOfficer.hidden =
        false;
    }

    if (offCampusOfficerSearch) {
      offCampusOfficerSearch.value =
        officer.display_name ||
        "";
    }

    if (offCampusOfficerResults) {
      offCampusOfficerResults.innerHTML =
        "";
    }

    if (confirmOffCampusButton) {
      confirmOffCampusButton.disabled =
        false;
    }

    setOffCampusPickerMessage(
      `${officer.display_name || "Outside officer"} selected.`,
      "success"
    );
  }


  function renderOutsideOfficerResults(
    rows
  ) {

    if (!offCampusOfficerResults) {
      return;
    }

    offCampusOfficerResults.innerHTML =
      "";

    const list =
      Array.isArray(rows)
        ? rows
        : [];

    if (!list.length) {

      const empty =
        document.createElement(
          "div"
        );

      empty.textContent =
        "No active outside officers match this search. Add the officer in Personnel Administration first.";

      empty.style.padding =
        "12px";

      empty.style.color =
        "#9aa2aa";

      offCampusOfficerResults.appendChild(
        empty
      );

      return;
    }


    list.forEach(officer => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.style.width =
        "100%";

      button.style.display =
        "flex";

      button.style.alignItems =
        "center";

      button.style.justifyContent =
        "space-between";

      button.style.gap =
        "12px";

      button.style.padding =
        "12px 13px";

      button.style.margin =
        "0";

      button.style.border =
        "0";

      button.style.borderBottom =
        "1px solid #2d333a";

      button.style.background =
        "#0b0e11";

      button.style.color =
        "#fff";

      button.style.cursor =
        "pointer";

      button.style.textAlign =
        "left";


      const left =
        document.createElement(
          "div"
        );

      const name =
        document.createElement(
          "strong"
        );

      name.textContent =
        officer.display_name ||
        "Outside Officer";

      name.style.display =
        "block";


      const meta =
        document.createElement(
          "div"
        );

      meta.textContent =
        outsideOfficerMetaText(
          officer
        ) ||
        "Outside Officer Directory";

      meta.style.marginTop =
        "4px";

      meta.style.fontSize =
        "12px";

      meta.style.color =
        "#9aa2aa";

      left.appendChild(name);
      left.appendChild(meta);


      const choose =
        document.createElement(
          "span"
        );

      choose.textContent =
        "Select";

      choose.style.color =
        "#ff922b";

      choose.style.fontWeight =
        "800";

      choose.style.whiteSpace =
        "nowrap";


      button.appendChild(left);
      button.appendChild(choose);

      button.addEventListener(
        "click",
        () =>
          selectOutsideOfficer(
            officer
          )
      );

      offCampusOfficerResults.appendChild(
        button
      );
    });
  }


  async function loadOutsideOfficerMatches(
    searchText = ""
  ) {

    if (!offCampusOfficerResults) {
      return;
    }

    offCampusOfficerResults.innerHTML =
      '<div style="padding:12px;color:#9aa2aa;">Loading outside officers…</div>';

    setOffCampusPickerMessage(
      ""
    );

    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "search_outside_officers_for_overtime",
          {
            p_search:
              searchText.trim() ||
              null,

            p_rank:
              null,

            p_home_campus:
              null,

            p_qualification_code:
              null,

            p_verified_only:
              false
          }
        );

      if (error) {
        throw error;
      }

      renderOutsideOfficerResults(
        data || []
      );

    }
    catch (error) {

      console.error(
        "Outside officer directory search failed:",
        error
      );

      offCampusOfficerResults.innerHTML =
        "";

      setOffCampusPickerMessage(
        error.message ||
        "Unable to load the Outside Officer Directory.",
        "error"
      );
    }
  }


  function openOffCampusModal(
    opportunity
  ) {

    if (
      !offCampusModal ||
      !offCampusForm ||
      !offCampusOpportunityId ||
      !offCampusOfficerSearch ||
      !offCampusSelectedOfficerId
    ) {

      console.error(
        "Outside officer overtime modal elements are missing."
      );

      showMessage(
        "The outside officer assignment form is unavailable.",
        "error"
      );

      return;
    }


    clearMessage();
    offCampusForm.reset();
    clearSelectedOutsideOfficer();
    setOffCampusPickerMessage(
      ""
    );

    offCampusOpportunityId.value =
      opportunity.id;


    const remaining =
      Math.max(
        Number(
          opportunity.total_openings ||
          0
        ) -
        Number(
          opportunity.filled_openings ||
          0
        ),
        0
      );


    const timeText =
      opportunity.start_time ||
      opportunity.end_time
        ? `${formatTime(opportunity.start_time) || "—"} - ${formatTime(opportunity.end_time) || "—"}`
        : "Time not specified";


    if (offCampusSummary) {
      offCampusSummary.textContent =
        `${opportunity.opportunity_date || "—"} • ` +
        `${opportunity.shift_name || "—"} • ` +
        `${opportunity.location || "—"} • ` +
        `${timeText} • ` +
        `${remaining} opening(s) remaining`;
    }


    offCampusModal.classList.add(
      "show"
    );

    offCampusModal.setAttribute(
      "aria-hidden",
      "false"
    );

    offCampusModal.style.display =
      "flex";


    loadOutsideOfficerMatches(
      ""
    );

    setTimeout(
      () =>
        offCampusOfficerSearch.focus(),
      50
    );
  }


  function closeOffCampusModal() {

    if (!offCampusModal) {
      return;
    }

    clearTimeout(
      outsideOfficerSearchTimer
    );

    offCampusModal.classList.remove(
      "show"
    );

    offCampusModal.setAttribute(
      "aria-hidden",
      "true"
    );

    offCampusModal.style.display =
      "";

    if (offCampusForm) {
      offCampusForm.reset();
    }

    if (offCampusOpportunityId) {
      offCampusOpportunityId.value =
        "";
    }

    if (offCampusSummary) {
      offCampusSummary.textContent =
        "";
    }

    if (offCampusOfficerResults) {
      offCampusOfficerResults.innerHTML =
        "";
    }

    clearSelectedOutsideOfficer();
    setOffCampusPickerMessage(
      ""
    );
  }


  offCampusOfficerSearch
    ?.addEventListener(
      "input",
      () => {

        clearSelectedOutsideOfficer();

        clearTimeout(
          outsideOfficerSearchTimer
        );

        outsideOfficerSearchTimer =
          setTimeout(
            () =>
              loadOutsideOfficerMatches(
                offCampusOfficerSearch.value ||
                ""
              ),
            250
          );
      }
    );


  offCampusOfficerSearchButton
    ?.addEventListener(
      "click",
      () => {

        clearSelectedOutsideOfficer();

        loadOutsideOfficerMatches(
          offCampusOfficerSearch?.value ||
          ""
        );
      }
    );


  cancelOffCampusButton
    ?.addEventListener(
      "click",
      closeOffCampusModal
    );


  offCampusModal
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          offCampusModal
        ) {
          closeOffCampusModal();
        }
      }
    );


  if (offCampusForm) {

    offCampusForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();
        clearMessage();
        setOffCampusPickerMessage(
          ""
        );


        const opportunityId =
          offCampusOpportunityId
            ?.value
            ?.trim() ||
          "";


        const outsideOfficerId =
          offCampusSelectedOfficerId
            ?.value
            ?.trim() ||
          "";


        const notes =
          offCampusNotes
            ?.value
            ?.trim() ||
          "";


        if (!opportunityId) {

          setOffCampusPickerMessage(
            "The overtime opportunity could not be identified.",
            "error"
          );

          return;
        }


        if (!outsideOfficerId) {

          setOffCampusPickerMessage(
            "Search for an outside officer and select the officer before filling the opening.",
            "error"
          );

          offCampusOfficerSearch?.focus();

          return;
        }


        if (confirmOffCampusButton) {

          confirmOffCampusButton.disabled =
            true;

          confirmOffCampusButton.textContent =
            "Filling Opening…";
        }


        try {

          const {
            data,
            error
          } =
            await db.rpc(
              "assign_outside_officer_to_overtime",
              {
                p_opportunity_id:
                  opportunityId,

                p_outside_officer_id:
                  outsideOfficerId,

                p_notes:
                  notes ||
                  null
              }
            );


          if (error) {
            throw error;
          }


          const officerName =
            selectedOutsideOfficer
              ?.display_name ||
            data?.display_name ||
            data?.officer_name ||
            "Outside officer";


          closeOffCampusModal();

          showMessage(
            `${officerName} was assigned to the overtime opportunity.`,
            "success"
          );


          await refreshAll();


          if (
            currentDetailOpportunityId ===
            opportunityId
          ) {
            await loadDetail(
              opportunityId
            );
          }

        }
        catch (error) {

          console.error(
            "Outside officer overtime assignment error:",
            error
          );

          setOffCampusPickerMessage(
            error.message ||
            "Unable to assign this outside officer to the overtime opportunity.",
            "error"
          );

        }
        finally {

          if (confirmOffCampusButton) {

            confirmOffCampusButton.disabled =
              !offCampusSelectedOfficerId
                ?.value;

            confirmOffCampusButton.textContent =
              "Fill Overtime Opening";
          }
        }
      }
    );
  }


  // =========================================================
  // DETAIL MODAL
  // =========================================================

  function openDetail(
    item
  ) {

    currentDetailOpportunityId =
      item.id;


    detailModal.classList.add(
      "show"
    );


    detailModal.setAttribute(
      "aria-hidden",
      "false"
    );


    loadDetail(
      item.id
    );

  }


  function closeDetailModal() {

    currentDetailOpportunityId =
      null;


    detailModal
      ?.classList
      .remove(
        "show"
      );


    detailModal
      ?.setAttribute(
        "aria-hidden",
        "true"
      );

  }


  closeDetailButton
    ?.addEventListener(
      "click",
      closeDetailModal
    );


  detailModal
    ?.addEventListener(
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


    detailInfo.innerHTML =
      "";


    detailSignupBody.innerHTML =
      '<tr><td colspan="6" class="empty">Loading requests…</td></tr>';


    historyList.innerHTML =
      '<div class="empty">Loading history…</div>';


    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "get_overtime_opportunity_detail",
          {
            p_opportunity_id:
              opportunityId
          }
        );


      if (
        error
      ) {
        throw error;
      }


      const opportunity =
        data?.opportunity ||
        {};


      const signups =
        data?.signups ||
        [];


      const history =
        data?.history ||
        [];


      detailModalTitle.textContent =

        `${opportunity.shift_name || "Overtime"} • `

        +

        `${opportunity.location || ""}`;


      detailSummary.textContent =

        `${opportunity.opportunity_date || ""} • `

        +

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

    }

    catch (
      error
    ) {

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
      document.createElement(
        "div"
      );


    item.className =
      "detail-item";


    const labelEl =
      document.createElement(
        "span"
      );


    labelEl.textContent =
      label;


    const valueEl =
      document.createElement(
        "strong"
      );


    valueEl.textContent =
      value ||
      "—";


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

    detailInfo.innerHTML =
      "";


    addDetailItem(
      "Date",
      opportunity.opportunity_date
    );


    addDetailItem(
      "Shift",
      opportunity.shift_name
    );


    addDetailItem(
      "Overtime Type",
      opportunity.location
    );


    addDetailItem(

      "Time",

      opportunity.start_time ||
      opportunity.end_time

        ? `${formatTime(
            opportunity.start_time
          ) || "—"} - `

          +

          `${formatTime(
            opportunity.end_time
          ) || "—"}`

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

    detailSignupBody.innerHTML =
      "";


    if (
      !signups.length
    ) {

      detailSignupBody.innerHTML =
        '<tr><td colspan="6" class="empty">No requests for this opportunity.</td></tr>';


      return;

    }


    signups.forEach(
      signup => {

        const tr =
          document.createElement(
            "tr"
          );


        const employeeTd =
          document.createElement(
            "td"
          );


        employeeTd.textContent =
          signup.display_name ||
          "—";


        if (
          signup.assignment_source ===
          "off_campus_manual"
        ) {

          employeeTd.appendChild(
            document.createElement(
              "br"
            )
          );


          const source =
            document.createElement(
              "span"
            );


          source.className =
            "offcampus-source-label";


          source.textContent =

            signup.outside_officer_campus

              ? `Off-Campus • ${signup.outside_officer_campus}`

              : "Off-Campus Help";


          employeeTd.appendChild(
            source
          );

        }


        const statusTd =
          document.createElement(
            "td"
          );


        const status =
          document.createElement(
            "span"
          );


        status.className =
          `status-pill ${signup.status}`;


        status.textContent =
          signup.status;


        statusTd.appendChild(
          status
        );


        const requestedTd =
          document.createElement(
            "td"
          );


        requestedTd.textContent =
          formatDate(

            signup.requested_at ||

            signup.assigned_at

          );


        const reviewedTd =
          document.createElement(
            "td"
          );


        reviewedTd.textContent =

          signup.reviewed_by_name ||

          signup.assigned_by_name ||

          "—";


        const notesTd =
          document.createElement(
            "td"
          );


        notesTd.textContent =
          signup.manager_notes ||
          "—";


        const actionTd =
          document.createElement(
            "td"
          );


        actionTd.className =
          "inline-actions";


        if (
          signup.status ===
          "pending"
        ) {

          const approve =
            document.createElement(
              "button"
            );


          approve.type =
            "button";


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
            document.createElement(
              "button"
            );


          deny.type =
            "button";


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

        }

        else if (
          signup.status ===
          "approved"
        ) {

          const complete =
            document.createElement(
              "button"
            );


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


          if (
            signup.assignment_source ===
            "off_campus_manual"
          ) {

            const remove =
              document.createElement(
                "button"
              );


            remove.type =
              "button";


            remove.className =
              "button danger small";


            remove.textContent =
              "Remove Assignment";


            remove.addEventListener(
              "click",
              () =>
                removeOffCampusAssignment(
                  signup
                )
            );


            actionTd.appendChild(
              remove
            );

          }

        }

        else {

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

      }
    );

  }


  // =========================================================
  // HISTORY
  // =========================================================

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

      labels[action]

      ||

      String(
        action ||
        "Activity"
      ).replaceAll(
        "_",
        " "
      )

    );

  }


  function renderHistory(
    history
  ) {

    historyList.innerHTML =
      "";


    if (
      !history.length
    ) {

      historyList.innerHTML =
        '<div class="empty">No history found.</div>';


      return;

    }


    history.forEach(
      item => {

        const row =
          document.createElement(
            "article"
          );


        row.className =
          "history-item";


        const title =
          document.createElement(
            "strong"
          );


        title.textContent =
          historyLabel(
            item.action_type
          );


        const description =
          document.createElement(
            "div"
          );


        const who =
          item.display_name

            ? ` • ${item.display_name}`

            : "";


        description.textContent =
          `${item.actor_display_name || "SecureTrack"}${who}`;


        const time =
          document.createElement(
            "small"
          );


        time.textContent =
          formatDate(
            item.occurred_at
          );


        row.append(
          title,
          description
        );


        if (
          item.notes
        ) {

          const notes =
            document.createElement(
              "small"
            );


          notes.textContent =
            item.notes;


          row.appendChild(
            notes
          );

        }


        row.appendChild(
          time
        );


        historyList.appendChild(
          row
        );

      }
    );

  }


  // =========================================================
  // COMPLETE ASSIGNMENT
  // =========================================================

  async function completeSignup(
    signup
  ) {

    if (
      !window.confirm(
        `Mark ${signup.display_name} overtime assignment as completed?`
      )
    ) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "complete_overtime_signup",
          {
            p_signup_id:
              signup.id
          }
        );


      if (
        error
      ) {
        throw error;
      }


      showMessage(
        "Overtime assignment marked completed.",
        "success"
      );


      await refreshAll();


      if (
        currentDetailOpportunityId
      ) {

        await loadDetail(
          currentDetailOpportunityId
        );

      }

    }

    catch (
      error
    ) {

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


  // =========================================================
  // REMOVE OFF-CAMPUS ASSIGNMENT
  // =========================================================

  async function removeOffCampusAssignment(
    signup
  ) {

    const reason =
      window.prompt(

        `Remove ${signup.display_name} from this overtime assignment?\n\n`

        +

        "Enter a reason for the change:"

      );


    if (
      reason === null
    ) {
      return;
    }


    if (
      !window.confirm(

        `Confirm removal of ${signup.display_name}?\n\n`

        +

        "The overtime opening will become available again."

      )
    ) {
      return;
    }


    try {

      const {
        error
      } =
        await db.rpc(
          "remove_off_campus_overtime_assignment",
          {

            p_signup_id:
              signup.id,

            p_reason:
              reason.trim() ||
              null

          }
        );


      if (
        error
      ) {
        throw error;
      }


      showMessage(

        `${signup.display_name} was removed. `

        +

        "The overtime opening is available again.",

        "success"

      );


      await refreshAll();


      if (
        currentDetailOpportunityId
      ) {

        await loadDetail(
          currentDetailOpportunityId
        );

      }

    }

    catch (
      error
    ) {

      console.error(
        "Remove off-campus overtime error:",
        error
      );


      showMessage(
        error.message ||
        "Unable to remove the off-campus assignment.",
        "error"
      );

    }

  }


  // =========================================================
  // REVIEW SUBMIT
  // =========================================================

  if (
    reviewForm
  ) {

    reviewForm.addEventListener(
      "submit",
      async event => {

        event.preventDefault();


        confirmReviewButton.disabled =
          true;


        try {

          const {
            error
          } =
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


          if (
            error
          ) {
            throw error;
          }


          closeReviewModal();


          showMessage(
            `Overtime request ${reviewDecision.value}.`,
            "success"
          );


          await refreshAll();


          if (
            currentDetailOpportunityId
          ) {

            await loadDetail(
              currentDetailOpportunityId
            );

          }

        }

        catch (
          error
        ) {

          console.error(
            "Overtime review error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to review overtime request.",
            "error"
          );

        }

        finally {

          confirmReviewButton.disabled =
            false;

        }

      }
    );

  }


  cancelReviewButton
    ?.addEventListener(
      "click",
      closeReviewModal
    );


  reviewModal
    ?.addEventListener(
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


  // =========================================================
  // ESCAPE KEY
  // =========================================================

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      if (
        offCampusModal
          ?.classList
          .contains(
            "show"
          )
      ) {
        closeOffCampusModal();
      }

      if (
        editModal
          ?.classList
          .contains(
            "show"
          )
      ) {
        closeEditModal();
      }

      if (
        detailModal
          ?.classList
          .contains(
            "show"
          )
      ) {
        closeDetailModal();
      }

      if (
        reviewModal
          ?.classList
          .contains(
            "show"
          )
      ) {
        closeReviewModal();
      }
    }
  );

  // =========================================================
  // REFRESH BUTTON
  // =========================================================

  refreshButton
    ?.addEventListener(
      "click",
      async () => {

        refreshButton.disabled =
          true;


        refreshButton.textContent =
          "Refreshing…";


        try {

          await refreshAll();

        }

        catch (
          error
        ) {

          console.error(
            "Overtime refresh error:",
            error
          );


          showMessage(
            error.message ||
            "Unable to refresh overtime.",
            "error"
          );

        }

        finally {

          refreshButton.disabled =
            false;


          refreshButton.textContent =
            "Refresh";

        }

      }
    );


  // =========================================================
  // SIGN OUT
  // =========================================================

  signOutButton
    ?.addEventListener(
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


  // =========================================================
  // REFRESH ALL
  // =========================================================

  async function refreshAll() {

    await loadOpportunities();

    await loadMyRequests();

    await loadPendingReviews();

  }


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  try {

    await refreshAll();

  }

  catch (
    error
  ) {

    console.error(
      "Overtime initialization error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to load Overtime.",
      "error"
    );


    /*
      Do not leave the opportunity panel permanently
      displaying "Loading..." if the database fails.
    */

    if (
      opportunityList
        ?.textContent
        ?.includes(
          "Loading"
        )
    ) {

      opportunityList.innerHTML =
        '<div class="empty">Unable to load overtime opportunities. Check the console for details.</div>';

    }

  }

})();
