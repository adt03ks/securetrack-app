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
  const roles = auth.roles || [];

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
  const receivedAt = document.getElementById("receivedAt");
  const receivedBy = document.getElementById("receivedBy");
  const notes = document.getElementById("notes");
  const timeline = document.getElementById("timeline");

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
  const releaseWitness = document.getElementById("releaseWitness");
  const releaseNotes = document.getElementById("releaseNotes");
  const confirmReleaseButton = document.getElementById("confirmReleaseButton");

  const disposeForm = document.getElementById("disposeForm");
  const disposeWitness = document.getElementById("disposeWitness");
  const disposeNotes = document.getElementById("disposeNotes");
  const confirmDisposeButton = document.getElementById("confirmDisposeButton");

  let currentItem = null;

  function roleLabel(list) {
    const order = ["admin", "manager", "team_lead", "senior_officer", "dispatcher", "officer"];
    const found = order.find(role => list.includes(role));
    return (found || list[0] || "user").replaceAll("_", " ");
  }

  function showMessage(element, message, type = "info") {
    element.textContent = message;
    element.className = `message show ${type}`;
  }

  function clearMessage(element) {
    element.textContent = "";
    element.className = "message";
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  }

  function safe(value) {
    return value === null || value === undefined || String(value).trim() === ""
      ? "—"
      : String(value);
  }

  function setUserDisplay() {
    currentUserName.textContent = profile.display_name || auth.user.email || "SecureTrack User";
    currentUserRole.textContent = roleLabel(roles);
  }

  function openModal(modal, focusElement) {
    clearMessage(actionResult);
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    setTimeout(() => focusElement?.focus(), 0);
  }

  function closeModal(modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }

  function renderRecord(item) {
    propertyNumber.textContent = safe(item.property_number);
    dgNumber.textContent = safe(item.dg_number);
    mrnNumber.textContent = safe(item.mrn_number);
    description.textContent = safe(item.description);
    category.textContent = safe(item.category);
    storageLocation.textContent = safe(item.current_storage_location);
    locationReceived.textContent = safe(item.location_received);
    receivedAt.textContent = formatDate(item.received_at);
    receivedBy.textContent = safe(item.received_by_name);
    notes.textContent = safe(item.notes);

    statusPill.className = `status-pill ${item.status || ""}`;
    statusPill.textContent = safe(item.status).replaceAll("_", " ");

    const active = item.status === "stored";
    moveButton.disabled = !active;
    releaseButton.disabled = !active;

    const managerAccess = roles.includes("manager") || roles.includes("admin");
    disposeButton.classList.toggle("hidden", !managerAccess);
    disposeButton.disabled = !active;

    if (!active) {
      actionHelp.textContent =
        `This record is ${String(item.status).replaceAll("_", " ")}. No further standard property movement is permitted.`;
    } else {
      actionHelp.textContent =
        "Actions are recorded automatically in the chain of custody.";
    }
  }

  function timelineMeta(event) {
    const lines = [];

    if (event.event_type === "received") {
      if (event.from_location) lines.push(`Received at: ${event.from_location}`);
      if (event.to_location) lines.push(`Stored at: ${event.to_location}`);
    }

    if (event.event_type === "relocated") {
      if (event.from_location) lines.push(`From: ${event.from_location}`);
      if (event.to_location) lines.push(`To: ${event.to_location}`);
    }

    if (event.event_type === "released") {
      if (event.from_location) lines.push(`Released from: ${event.from_location}`);
      if (event.released_to) lines.push(`Released to: ${event.released_to}`);
      if (event.witness) lines.push(`Witness: ${event.witness}`);
    }

    if (event.event_type === "disposed") {
      if (event.from_location) lines.push(`Removed from: ${event.from_location}`);
      if (event.witness) lines.push(`Witness: ${event.witness}`);
    }

    lines.push(`Recorded by: ${safe(event.actor_display_name)}`);
    return lines;
  }

  function renderTimeline(events) {
    timeline.innerHTML = "";

    if (!events.length) {
      timeline.innerHTML =
        '<div class="empty-cell">No chain-of-custody events found.</div>';
      return;
    }

    events.forEach(event => {
      const wrapper = document.createElement("article");
      wrapper.className = "timeline-event";

      const dot = document.createElement("div");
      dot.className = "timeline-dot";

      const body = document.createElement("div");
      body.className = "timeline-body";

      const head = document.createElement("div");
      head.className = "timeline-head";

      const type = document.createElement("div");
      type.className = "timeline-type";
      type.textContent = String(event.event_type || "event").replaceAll("_", " ");

      const time = document.createElement("div");
      time.className = "timeline-time";
      time.textContent = formatDate(event.occurred_at);

      head.append(type, time);
      body.appendChild(head);

      const meta = document.createElement("div");
      meta.className = "timeline-meta";
      timelineMeta(event).forEach(line => {
        const row = document.createElement("div");
        row.textContent = line;
        meta.appendChild(row);
      });
      body.appendChild(meta);

      if (event.notes) {
        const note = document.createElement("div");
        note.className = "timeline-notes";
        note.textContent = event.notes;
        body.appendChild(note);
      }

      wrapper.append(dot, body);
      timeline.appendChild(wrapper);
    });
  }

  async function loadRecord() {
    clearMessage(pageMessage);

    if (!itemId) {
      showMessage(pageMessage, "No property record was selected.", "error");
      return;
    }

    try {
      const [itemResult, eventResult] = await Promise.all([
        db
          .from("property_items")
          .select(
            "id, property_number, dg_number, mrn_number, description, category, location_received, current_storage_location, status, received_at, received_by_name, notes, created_at, updated_at"
          )
          .eq("id", itemId)
          .single(),

        db
          .from("property_events")
          .select(
            "id, event_type, actor_display_name, occurred_at, from_location, to_location, released_to, witness, notes"
          )
          .eq("property_item_id", itemId)
          .order("occurred_at", { ascending: true })
      ]);

      if (itemResult.error) throw itemResult.error;
      if (eventResult.error) throw eventResult.error;

      currentItem = itemResult.data;
      renderRecord(currentItem);
      renderTimeline(eventResult.data || []);
      recordContent.hidden = false;
    } catch (error) {
      console.error("Property record load error:", error);
      showMessage(
        pageMessage,
        error.message || "Unable to load this property record.",
        "error"
      );
    }
  }

  moveButton.addEventListener("click", () => {
    if (!currentItem || currentItem.status !== "stored") return;
    moveToLocation.value = "";
    moveNotes.value = "";
    openModal(moveModal, moveToLocation);
  });

  releaseButton.addEventListener("click", () => {
    if (!currentItem || currentItem.status !== "stored") return;
    releaseForm.reset();
    openModal(releaseModal, releasedTo);
  });

  disposeButton.addEventListener("click", () => {
    if (!currentItem || currentItem.status !== "stored") return;
    disposeForm.reset();
    openModal(disposeModal, disposeNotes);
  });

  document.querySelectorAll(".modal-cancel").forEach(button => {
    button.addEventListener("click", () => {
      closeModal(button.closest(".modal-backdrop"));
    });
  });

  document.querySelectorAll(".modal-backdrop").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".modal-backdrop.show").forEach(closeModal);
  });

  moveForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentItem) return;

    confirmMoveButton.disabled = true;
    confirmMoveButton.textContent = "Recording…";

    try {
      const { error } = await db.rpc("move_property_item", {
        p_property_number: currentItem.property_number,
        p_to_location: moveToLocation.value.trim(),
        p_notes: moveNotes.value.trim() || null
      });

      if (error) throw error;

      closeModal(moveModal);
      showMessage(actionResult, "Property move recorded successfully.", "success");
      await loadRecord();
    } catch (error) {
      console.error("Move property error:", error);
      showMessage(actionResult, error.message || "Unable to move property.", "error");
      closeModal(moveModal);
    } finally {
      confirmMoveButton.disabled = false;
      confirmMoveButton.textContent = "Record Move";
    }
  });

  releaseForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentItem) return;

    const confirmed = window.confirm(
      `Release ${currentItem.property_number} to "${releasedTo.value.trim()}"? This will close the record as released.`
    );

    if (!confirmed) return;

    confirmReleaseButton.disabled = true;
    confirmReleaseButton.textContent = "Releasing…";

    try {
      const { error } = await db.rpc("release_property_item", {
        p_property_number: currentItem.property_number,
        p_released_to: releasedTo.value.trim(),
        p_witness: releaseWitness.value.trim() || null,
        p_notes: releaseNotes.value.trim() || null
      });

      if (error) throw error;

      closeModal(releaseModal);
      showMessage(actionResult, "Property release recorded successfully.", "success");
      await loadRecord();
    } catch (error) {
      console.error("Release property error:", error);
      showMessage(actionResult, error.message || "Unable to release property.", "error");
      closeModal(releaseModal);
    } finally {
      confirmReleaseButton.disabled = false;
      confirmReleaseButton.textContent = "Confirm Release";
    }
  });

  disposeForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentItem) return;

    const confirmed = window.confirm(
      `Dispose ${currentItem.property_number}? This action will be permanently recorded in the chain of custody.`
    );

    if (!confirmed) return;

    confirmDisposeButton.disabled = true;
    confirmDisposeButton.textContent = "Recording…";

    try {
      const { error } = await db.rpc("dispose_property_item", {
        p_property_number: currentItem.property_number,
        p_witness: disposeWitness.value.trim() || null,
        p_notes: disposeNotes.value.trim()
      });

      if (error) throw error;

      closeModal(disposeModal);
      showMessage(actionResult, "Property disposal recorded successfully.", "success");
      await loadRecord();
    } catch (error) {
      console.error("Dispose property error:", error);
      showMessage(actionResult, error.message || "Unable to dispose property.", "error");
      closeModal(disposeModal);
    } finally {
      confirmDisposeButton.disabled = false;
      confirmDisposeButton.textContent = "Confirm Disposal";
    }
  });

  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    signOutButton.textContent = "Signing Out…";
    await db.auth.signOut();
    window.location.replace(new URL("login.html", auth.appRootUrl || "../").href);
  });

  setUserDisplay();
  await loadRecord();
})();
