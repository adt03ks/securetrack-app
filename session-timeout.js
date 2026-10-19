(() => {
  "use strict";

  // =========================================================
  // SECURETRACK SESSION TIMEOUT
  // =========================================================

  const INACTIVITY_LIMIT =
  60 * 1000; // 1 minute

  const WARNING_BEFORE =
    30 * 1000; // warning at 30 seconds

  const ABSOLUTE_SESSION_LIMIT =
    12 * 60 * 60 * 1000; // 12 hours

  const LAST_ACTIVITY_KEY =
    "securetrack:lastActivity";

  const SESSION_STARTED_KEY =
    "securetrack:sessionStarted";

  const FORCE_LOGOUT_KEY =
    "securetrack:forceLogout";

  let warningTimer = null;
  let logoutTimer = null;
  let absoluteTimer = null;

  let warningVisible = false;
  let logoutInProgress = false;

  // =========================================================
  // CREATE WARNING DIALOG
  // =========================================================

  function installWarningDialog() {

    if (
      document.getElementById(
        "securetrackTimeoutOverlay"
      )
    ) {
      return;
    }

    const overlay =
      document.createElement("div");

    overlay.id =
      "securetrackTimeoutOverlay";

    overlay.hidden = true;

    overlay.innerHTML = `
      <div class="securetrack-timeout-card">

        <div class="securetrack-timeout-eyebrow">
          SECURE SESSION
        </div>

        <h2>
          Your session is about to expire
        </h2>

        <p>
          For your security, SecureTrack will sign you out
          after a period of inactivity.
        </p>

        <p class="securetrack-timeout-warning">
          You will be signed out in approximately
          2 minutes.
        </p>

        <div class="securetrack-timeout-actions">

          <button
            id="securetrackStaySignedIn"
            type="button"
            class="securetrack-timeout-primary"
          >
            Stay Signed In
          </button>

          <button
            id="securetrackSignOutNow"
            type="button"
            class="securetrack-timeout-secondary"
          >
            Sign Out Now
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(
      overlay
    );

    const style =
      document.createElement("style");

    style.textContent = `

      #securetrackTimeoutOverlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 22px;
        background:
          rgba(0, 0, 0, .82);
        backdrop-filter:
          blur(7px);
      }

      #securetrackTimeoutOverlay[hidden] {
        display: none !important;
      }

      .securetrack-timeout-card {
        width:
          min(460px, 100%);
        padding:
          28px;
        border:
          1px solid #3c434b;
        border-radius:
          18px;
        background:
          #0d1115;
        box-shadow:
          0 24px 80px
          rgba(0,0,0,.65);
        color:
          #f4f6f8;
        text-align:
          center;
      }

      .securetrack-timeout-card h2 {
        margin:
          7px 0 12px;
      }

      .securetrack-timeout-card p {
        color:
          #aeb6be;
        line-height:
          1.55;
      }

      .securetrack-timeout-eyebrow {
        color:
          #ff7800;
        font-size:
          11px;
        font-weight:
          900;
        letter-spacing:
          .14em;
      }

      .securetrack-timeout-warning {
        color:
          #ffc58f !important;
        font-weight:
          800;
      }

      .securetrack-timeout-actions {
        display:
          flex;
        gap:
          10px;
        justify-content:
          center;
        margin-top:
          22px;
        flex-wrap:
          wrap;
      }

      .securetrack-timeout-primary,
      .securetrack-timeout-secondary {
        min-height:
          44px;
        padding:
          11px 16px;
        border-radius:
          10px;
        font-weight:
          900;
        cursor:
          pointer;
      }

      .securetrack-timeout-primary {
        border:
          1px solid #ff7800;
        background:
          #ff7800;
        color:
          #111;
      }

      .securetrack-timeout-secondary {
        border:
          1px solid #49515a;
        background:
          #171c21;
        color:
          #fff;
      }

    `;

    document.head.appendChild(
      style
    );

    document
      .getElementById(
        "securetrackStaySignedIn"
      )
      ?.addEventListener(
        "click",
        () => {

          hideWarning();

          recordActivity(
            true
          );

        }
      );

    document
      .getElementById(
        "securetrackSignOutNow"
      )
      ?.addEventListener(
        "click",
        () => {

          secureLogout(
            "manual_timeout"
          );

        }
      );
  }


  // =========================================================
  // WARNING
  // =========================================================

  function showWarning() {

    if (
      warningVisible ||
      logoutInProgress
    ) {
      return;
    }

    const overlay =
      document.getElementById(
        "securetrackTimeoutOverlay"
      );

    if (!overlay) {
      return;
    }

    warningVisible =
      true;

    overlay.hidden =
      false;

  }


  function hideWarning() {

    warningVisible =
      false;

    const overlay =
      document.getElementById(
        "securetrackTimeoutOverlay"
      );

    if (overlay) {
      overlay.hidden =
        true;
    }

  }


  // =========================================================
  // GET LAST ACTIVITY
  // =========================================================

  function getLastActivity() {

    const stored =
      Number(
        localStorage.getItem(
          LAST_ACTIVITY_KEY
        )
      );

    return Number.isFinite(
      stored
    ) &&
    stored > 0
      ? stored
      : Date.now();

  }


  // =========================================================
  // ACTIVITY
  // =========================================================

  function recordActivity(
    force = false
  ) {

    if (
      logoutInProgress
    ) {
      return;
    }

    const now =
      Date.now();

    const previous =
      getLastActivity();

    /*
      Avoid constantly writing to localStorage
      from high-frequency browser events.
    */
    if (
      !force &&
      now - previous < 5000
    ) {
      return;
    }

    localStorage.setItem(
      LAST_ACTIVITY_KEY,
      String(now)
    );

    hideWarning();

    scheduleTimers();
  }


  // =========================================================
  // TIMERS
  // =========================================================

  function clearTimers() {

    if (warningTimer) {
      clearTimeout(
        warningTimer
      );
    }

    if (logoutTimer) {
      clearTimeout(
        logoutTimer
      );
    }

    warningTimer =
      null;

    logoutTimer =
      null;
  }


  function scheduleTimers() {

    clearTimers();

    const now =
      Date.now();

    const lastActivity =
      getLastActivity();

    const elapsed =
      now -
      lastActivity;

    const remaining =
      INACTIVITY_LIMIT -
      elapsed;

    if (
      remaining <= 0
    ) {

      secureLogout(
        "inactivity"
      );

      return;
    }

    const warningDelay =
      Math.max(
        0,
        remaining -
        WARNING_BEFORE
      );

    warningTimer =
      setTimeout(
        showWarning,
        warningDelay
      );

    logoutTimer =
      setTimeout(
        () => {

          secureLogout(
            "inactivity"
          );

        },
        remaining
      );
  }


  // =========================================================
  // ABSOLUTE SESSION LIMIT
  // =========================================================

  function scheduleAbsoluteLimit() {

    let sessionStarted =
      Number(
        sessionStorage.getItem(
          SESSION_STARTED_KEY
        )
      );

    if (
      !Number.isFinite(
        sessionStarted
      ) ||
      sessionStarted <= 0
    ) {

      sessionStarted =
        Date.now();

      sessionStorage.setItem(
        SESSION_STARTED_KEY,
        String(
          sessionStarted
        )
      );
    }

    const elapsed =
      Date.now() -
      sessionStarted;

    const remaining =
      ABSOLUTE_SESSION_LIMIT -
      elapsed;

    if (
      remaining <= 0
    ) {

      secureLogout(
        "absolute_session_limit"
      );

      return;
    }

    if (
      absoluteTimer
    ) {
      clearTimeout(
        absoluteTimer
      );
    }

    absoluteTimer =
      setTimeout(
        () => {

          secureLogout(
            "absolute_session_limit"
          );

        },
        remaining
      );
  }


  // =========================================================
  // SIGN OUT
  // =========================================================

 async function secureLogout(
  reason = "timeout"
) {

  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;

  clearTimers();

  if (absoluteTimer) {
    clearTimeout(
      absoluteTimer
    );
  }

  hideWarning();

  try {

    localStorage.setItem(
      FORCE_LOGOUT_KEY,
      String(
        Date.now()
      )
    );

    /*
      Sign out directly through Supabase.

      Do not use page-specific SecureTrack
      sign-out helpers here because some
      perform their own relative redirect.
    */

    const db =
      window.SecureTrackAuth?.db ||
      window.SecureTrackManager?.db;

    if (db?.auth?.signOut) {

      await db.auth.signOut();

    }

  }
  catch (error) {

    console.error(
      "SecureTrack timeout logout failed:",
      error
    );

  }
  finally {

    localStorage.removeItem(
      LAST_ACTIVITY_KEY
    );

    sessionStorage.removeItem(
      SESSION_STARTED_KEY
    );

    const next =
      window.location.pathname +
      window.location.search;

    const loginUrl =
      new URL(
        "/login.html",
        window.location.origin
      );

    loginUrl.searchParams.set(
      "reason",
      reason
    );

    loginUrl.searchParams.set(
      "next",
      next
    );

    window.location.replace(
      loginUrl.href
    );

  }

}
  // =========================================================
  // CROSS-TAB SECURITY
  // =========================================================

  window.addEventListener(
    "storage",
    event => {

      if (
        event.key ===
        LAST_ACTIVITY_KEY &&
        event.newValue
      ) {

        hideWarning();

        scheduleTimers();

      }

      if (
        event.key ===
        FORCE_LOGOUT_KEY &&
        event.newValue
      ) {

        secureLogout(
          "signed_out_elsewhere"
        );

      }

    }
  );


  // =========================================================
  // ACTIVITY EVENTS
  // =========================================================

  const activityEvents = [
    "pointerdown",
    "keydown",
    "touchstart",
    "scroll"
  ];

  activityEvents.forEach(
    eventName => {

      window.addEventListener(
        eventName,
        () => recordActivity(),
        {
          passive:
            eventName !==
            "keydown"
        }
      );

    }
  );


  // =========================================================
  // PAGE VISIBILITY
  //
  // Returning to an old/background tab does NOT automatically
  // reset inactivity. We check whether it should already have
  // expired.
  // =========================================================

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        scheduleTimers();

      }

    }
  );


  // =========================================================
  // INITIALIZE
  // =========================================================

  function initialize() {

    installWarningDialog();

    if (
      !localStorage.getItem(
        LAST_ACTIVITY_KEY
      )
    ) {

      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(
          Date.now()
        )
      );
    }

    scheduleTimers();

    scheduleAbsoluteLimit();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true
      }
    );

  }
  else {

    initialize();

  }

})();
