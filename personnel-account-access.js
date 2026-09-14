(function () {

  "use strict";


  // ========================================================
  // SECURETRACK PERSONNEL ACCOUNT ACCESS
  // ========================================================

  let statusMap =
    new Map();


  let scanTimer =
    null;


  let loadingStatuses =
    false;


  // ========================================================
  // STYLES
  // ========================================================

  const style =
    document.createElement(
      "style"
    );


  style.textContent = `

    .st-account-access {

      margin-top: 14px;
      padding: 12px 13px;

      border:
        1px solid #30363d;

      border-radius:
        11px;

      background:
        rgba(10,13,16,.55);

    }


    .st-account-access-title {

      margin-bottom: 7px;

      color:
        #8d969f;

      font-size:
        10px;

      font-weight:
        900;

      letter-spacing:
        .10em;

      text-transform:
        uppercase;

    }


    .st-account-access-row {

      display: flex;

      align-items: center;

      justify-content:
        space-between;

      gap: 12px;

      flex-wrap: wrap;

    }


    .st-account-status {

      display:
        inline-flex;

      align-items:
        center;

      gap:
        6px;

      font-size:
        12px;

      font-weight:
        850;

    }


    .st-account-status.active {

      color:
        #73d69e;

    }


    .st-account-status.pending {

      color:
        #ffc074;

    }


    .st-account-status.inactive {

      color:
        #b9c0c7;

    }


    .st-account-status.error {

      color:
        #ff9da0;

    }


    .st-account-meta {

      margin-top:
        5px;

      color:
        #858e97;

      font-size:
        10px;

      line-height:
        1.4;

    }


    .st-account-invite-button {

      border:
        1px solid #ff7800;

      border-radius:
        8px;

      background:
        rgba(255,120,0,.10);

      color:
        #ffd1aa;

      padding:
        7px 10px;

      cursor:
        pointer;

      font-size:
        11px;

      font-weight:
        850;

    }


    .st-account-invite-button:hover {

      background:
        rgba(255,120,0,.18);

    }


    .st-account-invite-button:disabled {

      opacity:
        .55;

      cursor:
        not-allowed;

    }


    .st-account-message {

      margin-top:
        8px;

      font-size:
        10px;

      line-height:
        1.4;

    }


    .st-account-message.error {

      color:
        #ff9da0;

    }


    .st-account-message.success {

      color:
        #73d69e;

    }

  `;


  document.head.appendChild(
    style
  );


  // ========================================================
  // DATE FORMAT
  // ========================================================

  function formatDateTime(
    value
  ) {

    if (!value) {
      return "";
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

      return "";

    }


    return date.toLocaleString(
      [],
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


  // ========================================================
  // FIND PERSONNEL CARD
  // ========================================================

  function findCard(
    editButton
  ) {

    return editButton.closest(
      [
        "[data-personnel-card]",
        ".personnel-card",
        ".person-card",
        ".employee-card",
        ".staff-card",
        ".personnel-item",
        "article"
      ].join(",")
    );

  }


  // ========================================================
  // LOAD ACCOUNT STATUS
  // ========================================================

  async function loadStatuses() {

    if (
      loadingStatuses
    ) {

      return;

    }


    const STM =
      window.SecureTrackManager;


    if (
      !STM?.db
    ) {

      return;

    }


    loadingStatuses =
      true;


    try {

      const {
        data,
        error
      } =
        await STM.db.rpc(
          "get_personnel_account_access_status"
        );


      if (error) {

        console.error(
          "Unable to load account access status:",
          error
        );

        return;

      }


      statusMap =
        new Map(
          (data || [])
            .map(
              row => [
                row.user_id,
                row
              ]
            )
        );


      scanCards();

    }
    finally {

      loadingStatuses =
        false;

    }

  }


  // ========================================================
  // SEND / RESEND INVITATION
  // ========================================================

  async function sendInvite(
    userId,
    button,
    message
  ) {

    const STM =
      window.SecureTrackManager;


    if (
      !STM?.getSession
    ) {

      message.textContent =
        "SecureTrack session unavailable.";

      message.className =
        "st-account-message error";

      return;

    }


    button.disabled =
      true;


    const originalText =
      button.textContent;


    button.textContent =
      "Sending…";


    message.textContent =
      "";


    try {

      const session =
        await STM.getSession();


      if (
        !session?.access_token
      ) {

        throw new Error(
          "Your SecureTrack session has expired. Sign in again."
        );

      }


      const response =
        await fetch(

          `${window.SECURETRACK_CONFIG.supabaseUrl}/functions/v1/personnel-send-invite`,

          {

            method:
              "POST",


            headers: {

              "Content-Type":
                "application/json",


              "Authorization":
                `Bearer ${session.access_token}`,


              "apikey":
                window.SECURETRACK_CONFIG.supabaseAnonKey

            },


            body:
              JSON.stringify(
                {
                  user_id:
                    userId
                }
              )

          }

        );


      let result =
        null;


      try {

        result =
          await response.json();

      }
      catch {

        result =
          {};

      }


      if (
        !response.ok
      ) {

        throw new Error(
          result?.error ||
          `Unable to send invitation (${response.status}).`
        );

      }


      message.textContent =
        result?.warning ||
        "Invitation sent successfully.";


      message.className =
        "st-account-message success";


      await loadStatuses();

    }
    catch (error) {

      console.error(
        "SecureTrack invitation error:",
        error
      );


      let text =
        error?.message ||
        "Unable to send invitation.";


      if (
        text
          .toLowerCase()
          .includes(
            "rate limit"
          )
      ) {

        text =
          "Supabase email limit is temporarily active. Please try again later.";

      }


      message.textContent =
        text;


      message.className =
        "st-account-message error";


      button.disabled =
        false;


      button.textContent =
        originalText;

    }

  }


  // ========================================================
  // BUILD ACCOUNT ACCESS BLOCK
  // ========================================================

  function decorateCard(
    editButton
  ) {

    const userId =
      editButton.dataset.id;


    if (!userId) {
      return;
    }


    const card =
      findCard(
        editButton
      );


    if (!card) {
      return;
    }


    /*
      Remove any earlier copy so a card refresh
      can never create duplicate account controls.
    */

    card
      .querySelectorAll(
        ".st-account-access"
      )
      .forEach(
        element =>
          element.remove()
      );


    const account =
      statusMap.get(
        userId
      );


    /*
      If this person is not returned by our secured RPC,
      do not expose account controls.
    */

    if (!account) {
      return;
    }


    const box =
      document.createElement(
        "div"
      );


    box.className =
      "st-account-access";


    box.dataset.userId =
      userId;


    const title =
      document.createElement(
        "div"
      );


    title.className =
      "st-account-access-title";


    title.textContent =
      "Account Access";


    const row =
      document.createElement(
        "div"
      );


    row.className =
      "st-account-access-row";


    const left =
      document.createElement(
        "div"
      );


    const status =
      document.createElement(
        "div"
      );


    status.className =
      "st-account-status";


    const meta =
      document.createElement(
        "div"
      );


    meta.className =
      "st-account-meta";


    const message =
      document.createElement(
        "div"
      );


    message.className =
      "st-account-message";


    // ======================================================
    // ACTIVE
    // ======================================================

    if (
      account.account_status ===
      "active"
    ) {

      status.classList.add(
        "active"
      );


      status.textContent =
        "✓ Active";


      if (
        account.setup_completed_at
      ) {

        meta.textContent =
          "Setup completed " +
          formatDateTime(
            account.setup_completed_at
          );

      }

    }


    // ======================================================
    // INVITE SENT
    // ======================================================

    else if (
      account.account_status ===
      "invite_sent"
    ) {

      status.classList.add(
        "pending"
      );


      status.textContent =
        "◷ Invite Sent";


      if (
        account.invite_sent_at
      ) {

        meta.textContent =
          "Sent " +
          formatDateTime(
            account.invite_sent_at
          );

      }


      if (
        account.can_send_invite
      ) {

        const resend =
          document.createElement(
            "button"
          );


        resend.type =
          "button";


        resend.className =
          "st-account-invite-button";


        resend.textContent =
          "Resend Invite";


        resend.addEventListener(
          "click",
          () =>
            sendInvite(
              userId,
              resend,
              message
            )
        );


        row.appendChild(
          resend
        );

      }

    }


    // ======================================================
    // EMAIL REQUIRED
    // ======================================================

    else if (
      account.account_status ===
      "email_required"
    ) {

      status.classList.add(
        "error"
      );


      status.textContent =
        "⚠ Email Required";


      meta.textContent =
        "Add a valid email address before sending account access.";

    }


    // ======================================================
    // NOT INVITED
    // ======================================================

    else {

      status.classList.add(
        "inactive"
      );


      status.textContent =
        "○ Not Set Up";


      if (
        account.can_send_invite
      ) {

        const send =
          document.createElement(
            "button"
          );


        send.type =
          "button";


        send.className =
          "st-account-invite-button";


        send.textContent =
          "Send Invite";


        send.addEventListener(
          "click",
          () =>
            sendInvite(
              userId,
              send,
              message
            )
        );


        row.appendChild(
          send
        );

      }

    }


    left.append(
      status,
      meta
    );


    row.prepend(
      left
    );


    box.append(
      title,
      row,
      message
    );


    /*
      Put Account Access immediately before the
      card's existing Edit button area whenever possible.
    */

    const actionArea =
      editButton.parentElement;


    if (actionArea) {

      actionArea.insertBefore(
        box,
        editButton
      );

    }
    else {

      card.appendChild(
        box
      );

    }

  }


  // ========================================================
  // SCAN PERSONNEL CARDS
  // ========================================================

  function scanCards() {

    document
      .querySelectorAll(
        'button[data-action="edit"][data-id]'
      )
      .forEach(
        button =>
          decorateCard(
            button
          )
      );

  }


  function scheduleScan() {

    clearTimeout(
      scanTimer
    );


    scanTimer =
      setTimeout(
        () => {

          if (
            statusMap.size
          ) {

            scanCards();

          }

        },
        100
      );

  }


  // ========================================================
  // WATCH FOR CARD REFRESHES
  // ========================================================

  const observer =
    new MutationObserver(
      mutations => {

        /*
          Ignore mutations caused only by this helper,
          otherwise adding our Account Access block could
          continuously trigger itself.
        */

        const relevant =
          mutations.some(
            mutation =>
              [
                ...mutation.addedNodes
              ].some(
                node =>
                  node.nodeType === 1 &&
                  !node.classList?.contains(
                    "st-account-access"
                  )
              )
          );


        if (
          relevant
        ) {

          scheduleScan();

        }

      }
    );


  observer.observe(
    document.body,
    {
      childList:
        true,

      subtree:
        true
    }
  );


  // ========================================================
  // INITIAL LOAD
  // ========================================================

  function start() {

    loadStatuses();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  }
  else {

    start();

  }


  // ========================================================
  // PUBLIC REFRESH
  // ========================================================

  window.SecureTrackAccountAccess = {

    refresh:
      loadStatuses

  };


})();
