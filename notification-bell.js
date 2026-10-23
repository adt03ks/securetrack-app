
/* =========================================
   SECURETRACK OP
   UNIVERSAL NOTIFICATION CENTER
   ========================================= */

(function () {
  "use strict";

  let client = null;
  let userId = null;
  let channel = null;
  let pollTimer = null;

  let items = [];
  let root = null;
  let button = null;
  let panel = null;
  let badge = null;

  let refreshPromise = null;

  function node(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function showError(message) {
    if (!panel) return;

    const old = panel.querySelector(
      ".st-notification-message"
    );

    if (old) old.remove();

    if (message) {
      panel.append(
        node(
          "div",
          "st-notification-message",
          message
        )
      );
    }
  }

  function safePath(path) {
    if (typeof path !== "string") return null;

    const value = path.trim();

    if (
      !value.startsWith("/") ||
      value.startsWith("//") ||
      /[\\\u0000-\u001f]/.test(value)
    ) {
      return null;
    }

    return value;
  }

  function timeLabel(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString();
  }

  function render() {
    if (!panel || !badge || !button) return;

    const count = items.filter(
      item => !item.read_at
    ).length;

    badge.textContent =
      count > 99 ? "99+" : String(count);

    badge.classList.toggle(
      "is-visible",
      count > 0
    );

    button.setAttribute(
      "aria-label",
      `Notifications, ${count} unread`
    );

    panel.replaceChildren();

    const header = node(
      "div",
      "st-notification-heading"
    );

    header.append(
      node(
        "strong",
        "",
        `Notifications (${count} unread)`
      )
    );

    const markAll = node(
      "button",
      "st-notification-markall",
      "Mark all read"
    );

    markAll.type = "button";
    markAll.disabled = count === 0;

    markAll.addEventListener(
      "click",
      markAllRead
    );

    header.append(markAll);
    panel.append(header);

    if (!items.length) {
      panel.append(
        node(
          "div",
          "st-notification-empty",
          "No notifications yet."
        )
      );

      return;
    }

    for (const item of items) {
      const entry = node(
        "button",
        "st-notification-entry" +
          (!item.read_at ? " is-unread" : "")
      );

      entry.type = "button";

      entry.append(
        node(
          "span",
          "st-notification-entry-title",
          item.title || "Notification"
        )
      );

      entry.append(
        node(
          "span",
          "st-notification-entry-body",
          item.message || ""
        )
      );

      const status = item.resolved_at
        ? "Resolved"
        : item.action_required
          ? "Action required"
          : "Information";

      entry.append(
        node(
          "span",
          "st-notification-entry-meta",
          status + " · " +
            timeLabel(item.created_at)
        )
      );

      entry.addEventListener(
        "click",
        async () => {
          if (!item.read_at) {
            const { error } = await client.rpc(
              "mark_user_notification_read",
              {
                p_notification_id: item.id
              }
            );

            if (error) {
              showError(
                "Could not mark notification read."
              );
              return;
            }
          }

          const path = safePath(
            item.action_path
          );

          if (path) {
            window.location.assign(path);
          } else {
            await refresh();
          }
        }
      );

      panel.append(entry);
    }
  }

  async function refresh() {
    if (!client || !userId) return;

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = (async () => {
      const { data, error } = await client
        .from("user_notifications")
        .select(
          "id,title,message,read_at," +
          "resolved_at,action_required," +
          "action_path,created_at"
        )
        .eq("recipient_user_id", userId)
        .order("created_at", {
          ascending: false
        })
        .limit(100);

      if (error) {
        showError(
          "Notifications unavailable."
        );
        return;
      }

      items = data || [];
      render();
    })();

    try {
      await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  async function markAllRead() {
    const { error } = await client.rpc(
      "mark_all_user_notifications_read"
    );

    if (error) {
      showError(
        "Could not mark all notifications read."
      );
      return;
    }

    await refresh();
  }

  function mount(container) {
    root = node(
      "div",
      "st-notification-root"
    );

    button = node(
      "button",
      "st-notification-toggle"
    );

    button.type = "button";

    button.setAttribute(
      "aria-label",
      "Notifications"
    );

    button.setAttribute(
      "aria-expanded",
      "false"
    );

    button.innerHTML = `
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path
          d="M18 8a6 6 0 0 0-12 0
             c0 7-3 7-3 9h18
             c0-2-3-2-3-9"
        />
        <path d="M10 21h4"/>
      </svg>
    `;

    badge = node(
      "span",
      "st-notification-badge",
      "0"
    );

    button.append(badge);

    panel = node(
      "div",
      "st-notification-panel"
    );

    panel.hidden = true;

    button.addEventListener(
      "click",
      () => {
        panel.hidden = !panel.hidden;

        button.setAttribute(
          "aria-expanded",
          String(!panel.hidden)
        );
      }
    );

    document.addEventListener(
      "click",
      event => {
        if (
          root &&
          !root.contains(event.target)
        ) {
          panel.hidden = true;

          button.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );

    root.append(button, panel);
    container.append(root);

    render();
  }

  function destroy() {
    if (pollTimer) {
      clearInterval(pollTimer);
    }

    if (channel && client) {
      client.removeChannel(channel);
    }

    pollTimer = null;
    channel = null;

    if (root) root.remove();

    root = null;
    button = null;
    panel = null;
    badge = null;

    items = [];
    client = null;
    userId = null;
  }

  async function init({
    client: suppliedClient,
    userId: suppliedUserId,
    target = "#securetrack-notification-mount"
  } = {}) {

    if (
      !suppliedClient ||
      typeof suppliedClient.from !== "function" ||
      !suppliedClient.auth
    ) {
      console.error(
        "SecureTrack Notifications: " +
        "Authenticated Supabase client required."
      );
      return false;
    }

    const { data, error } =
      await suppliedClient.auth.getUser();

    const user = data?.user;

    if (
      error ||
      !user ||
      (
        suppliedUserId &&
        suppliedUserId !== user.id
      )
    ) {
      console.error(
        "Notification session not available."
      );
      return false;
    }

    const container =
      document.querySelector(target);

    if (!container) {
      console.error(
        "Notification mount container missing."
      );
      return false;
    }

    destroy();

    client = suppliedClient;
    userId = user.id;

    mount(container);

    await refresh();

    // Refresh periodically if Realtime is unavailable.
    pollTimer = setInterval(
      refresh,
      30000
    );

    // Listen for live notification changes.
    if (typeof client.channel === "function") {
      channel = client
        .channel("st-bell-" + userId)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_notifications",
            filter:
              "recipient_user_id=eq." +
              userId
          },
          () => refresh()
        )
        .subscribe();
    }

    return true;
  }

  window.SecureTrackNotifications = {
    init,
    refresh,
    destroy
  };

})();
