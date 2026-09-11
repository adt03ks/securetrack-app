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

  const currentUserName = document.getElementById("currentUserName");
  const currentUserRole = document.getElementById("currentUserRole");
  const receivingOfficer = document.getElementById("receivingOfficer");
  const signOutButton = document.getElementById("signOutButton");

  const storedCount = document.getElementById("storedCount");
  const releasedCount = document.getElementById("releasedCount");
  const disposedCount = document.getElementById("disposedCount");
  const totalCount = document.getElementById("totalCount");

  const intakeForm = document.getElementById("propertyIntakeForm");
  const dgNumber = document.getElementById("dgNumber");
  const mrnNumber = document.getElementById("mrnNumber");
  const description = document.getElementById("description");
  const category = document.getElementById("category");
  const receivedAt = document.getElementById("receivedAt");
  const locationReceived = document.getElementById("locationReceived");
  const storageLocation = document.getElementById("storageLocation");
  const notes = document.getElementById("notes");
  const intakeResult = document.getElementById("intakeResult");
  const savePropertyButton = document.getElementById("savePropertyButton");
  const clearPropertyButton = document.getElementById("clearPropertyButton");

  const searchForm = document.getElementById("propertySearchForm");
  const searchInput = document.getElementById("propertySearchInput");
  const searchButton = document.getElementById("propertySearchButton");
  const searchMessage = document.getElementById("searchMessage");
  const resultsBody = document.getElementById("propertyResultsBody");

  function roleLabel(roles) {
    const order = ["admin", "manager", "team_lead", "senior_officer", "dispatcher", "officer"];
    const found = order.find(role => roles.includes(role));
    return (found || roles[0] || "user").replaceAll("_", " ");
  }

  function showMessage(element, message, type = "info") {
    element.textContent = message;
    element.className = `message show ${type}`;
  }

  function clearMessage(element) {
    element.textContent = "";
    element.className = "message";
  }

  function localDateTimeValue(date = new Date()) {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  }

  function setUserDisplay() {
    const name = profile.display_name || auth.user.email || "SecureTrack User";
    currentUserName.textContent = name;
    currentUserRole.textContent = roleLabel(auth.roles || []);
    receivingOfficer.value = name;
  }

  async function loadSummary() {
    const { data, error } = await db
      .from("property_items")
      .select("status");

    if (error) {
      console.error("Property summary load error:", error);
      storedCount.textContent = "—";
      releasedCount.textContent = "—";
      disposedCount.textContent = "—";
      totalCount.textContent = "—";
      return;
    }

    const rows = data || [];
    storedCount.textContent = rows.filter(row => row.status === "stored").length;
    releasedCount.textContent = rows.filter(row => row.status === "released").length;
    disposedCount.textContent = rows.filter(row => row.status === "disposed").length;
    totalCount.textContent = rows.length;
  }

  function clearIntakeForm({ keepMessage = false } = {}) {
    intakeForm.reset();
    receivedAt.value = localDateTimeValue();
    receivingOfficer.value = profile.display_name || auth.user.email || "SecureTrack User";
    if (!keepMessage) clearMessage(intakeResult);
  }

  function renderSearchResults(rows) {
    resultsBody.innerHTML = "";

    if (!rows.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 8;
      td.className = "empty-cell";
      td.textContent = "No matching property records found.";
      tr.appendChild(td);
      resultsBody.appendChild(tr);
      return;
    }

    rows.forEach(item => {
      const tr = document.createElement("tr");

      const values = [
        { value: item.property_number || "—", className: "property-number" },
        { value: item.dg_number || "—" },
        { value: item.mrn_number || "—" },
        { value: item.description || "—" },
        { value: item.category || "—" },
        { value: item.current_storage_location || "—" }
      ];

      values.forEach(entry => {
        const td = document.createElement("td");
        td.textContent = entry.value;
        if (entry.className) td.className = entry.className;
        tr.appendChild(td);
      });

      const statusTd = document.createElement("td");
      const status = document.createElement("span");
      status.className = `status-pill ${item.status || ""}`;
      status.textContent = String(item.status || "—").replaceAll("_", " ");
      statusTd.appendChild(status);
      tr.appendChild(statusTd);

      const dateTd = document.createElement("td");
      dateTd.textContent = formatDate(item.received_at);
      tr.appendChild(dateTd);

      resultsBody.appendChild(tr);
    });
  }

  async function runSearch(searchTerm = "") {
    searchButton.disabled = true;
    searchButton.textContent = "Searching…";
    clearMessage(searchMessage);

    try {
      const { data, error } = await db.rpc("search_property_items", {
        p_search: searchTerm.trim()
      });

      if (error) throw error;

      const rows = data || [];
      renderSearchResults(rows);

      if (searchTerm.trim()) {
        showMessage(
          searchMessage,
          `${rows.length} matching record${rows.length === 1 ? "" : "s"} found.`,
          rows.length ? "success" : "info"
        );
      } else {
        showMessage(
          searchMessage,
          `Showing ${rows.length} most recent property record${rows.length === 1 ? "" : "s"}.`,
          "info"
        );
      }
    } catch (error) {
      console.error("Property search error:", error);
      showMessage(
        searchMessage,
        error.message || "Unable to search property records.",
        "error"
      );
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search";
    }
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(item => item.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(panel => panel.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.panel)?.classList.add("active");

      if (tab.dataset.panel === "searchPanel" && resultsBody.children.length <= 1) {
        searchInput.focus();
      }
    });
  });

  intakeForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage(intakeResult);

    const receivedDate = new Date(receivedAt.value);

    if (!receivedAt.value || Number.isNaN(receivedDate.getTime())) {
      showMessage(intakeResult, "Enter a valid received date and time.", "error");
      receivedAt.focus();
      return;
    }

    savePropertyButton.disabled = true;
    savePropertyButton.textContent = "Creating Record…";

    try {
      const { data, error } = await db.rpc("create_property_item", {
        p_description: description.value.trim(),
        p_category: category.value,
        p_location_received: locationReceived.value.trim(),
        p_storage_location: storageLocation.value.trim(),
        p_dg_number: dgNumber.value.trim() || null,
        p_mrn_number: mrnNumber.value.trim() || null,
        p_notes: notes.value.trim() || null,
        p_received_at: receivedDate.toISOString()
      });

      if (error) throw error;

      const propertyNumber = data?.property_number || "Property record";

      clearIntakeForm({ keepMessage: true });
      showMessage(
        intakeResult,
        `${propertyNumber} created successfully. Match this Property ID to the physical property form.`,
        "success"
      );

      await loadSummary();
    } catch (error) {
      console.error("Create property error:", error);
      showMessage(
        intakeResult,
        error.message || "Unable to create property record.",
        "error"
      );
    } finally {
      savePropertyButton.disabled = false;
      savePropertyButton.textContent = "Create Property Record";
    }
  });

  clearPropertyButton.addEventListener("click", () => clearIntakeForm());

  searchForm.addEventListener("submit", event => {
    event.preventDefault();
    runSearch(searchInput.value);
  });

  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    signOutButton.textContent = "Signing Out…";
    await db.auth.signOut();
    window.location.replace(new URL("login.html", auth.appRootUrl || "../").href);
  });

  setUserDisplay();
  receivedAt.value = localDateTimeValue();
  await loadSummary();
})();
