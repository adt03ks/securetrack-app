(async function () {

  "use strict";


  // =========================================================
  // WAIT FOR SECURETRACK AUTHORIZATION
  // =========================================================

  function waitForAuth(
    timeoutMs = 6000
  ) {

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

        const startedAt =
          Date.now();


        const timer =
          window.setInterval(
            () => {

              if (
                window.SecureTrackAuth
              ) {

                window.clearInterval(
                  timer
                );


                resolve(
                  window.SecureTrackAuth
                );


                return;

              }


              if (
                Date.now() -
                  startedAt >=
                timeoutMs
              ) {

                window.clearInterval(
                  timer
                );


                reject(
                  new Error(
                    "SecureTrack authorization did not initialize."
                  )
                );

              }

            },
            100
          );

      }
    );

  }


  // =========================================================
  // AUTHENTICATION
  // =========================================================

  let auth;


  try {

    auth =
      await waitForAuth();

  }
  catch (error) {

    console.error(
      "SecureTrack Lost & Found authentication failed:",
      error
    );


    return;

  }


  if (
    !auth?.db ||
    !auth?.user
  ) {

    console.error(
      "SecureTrack authorization returned without a database client or user."
    );


    return;

  }


  const db =
    auth.db;


  const profile =
    auth.profile || {};


  const roles =
    Array.isArray(
      auth.roles
    )
      ? auth.roles
      : [];


  // Management controls final Lost & Found disposal.

  const canDispose =
    roles.includes(
      "manager"
    ) ||
    roles.includes(
      "director"
    ) ||
    roles.includes(
      "admin"
    );


  // =========================================================
  // PAGE ELEMENTS
  // =========================================================

  const panel =
    document.getElementById(
      "lostFoundPanel"
    );


  if (
    !panel
  ) {

    console.warn(
      "Lost & Found panel was not found in the Property page."
    );


    return;

  }


  const form =
    document.getElementById(
      "lostFoundForm"
    );


  const description =
    document.getElementById(
      "lostFoundDescription"
    );


  const turnedInBy =
    document.getElementById(
      "lostFoundTurnedInBy"
    );


  const turnedInAt =
    document.getElementById(
      "lostFoundTurnedInAt"
    );


  const storage =
    document.getElementById(
      "lostFoundStorage"
    );


  const receivedBy =
    document.getElementById(
      "lostFoundReceivedBy"
    );


  const notes =
    document.getElementById(
      "lostFoundNotes"
    );


  const message =
    document.getElementById(
      "lostFoundMessage"
    );


  const saveButton =
    document.getElementById(
      "saveLostFoundButton"
    );


  const clearButton =
    document.getElementById(
      "clearLostFoundButton"
    );


  const searchForm =
    document.getElementById(
      "lostFoundSearchForm"
    );


  const searchInput =
    document.getElementById(
      "lostFoundSearchInput"
    );


  const resultsBody =
    document.getElementById(
      "lostFoundResultsBody"
    );


  const refreshButton =
    document.getElementById(
      "refreshLostFoundButton"
    );


  const activeCount =
    document.getElementById(
      "lostFoundActiveCount"
    );


  const dueCount =
    document.getElementById(
      "lostFoundDueCount"
    );


  const closedCount =
    document.getElementById(
      "lostFoundClosedCount"
    );


  // =========================================================
  // BASIC HELPERS
  // =========================================================

  function localDateTimeValue(
    date = new Date()
  ) {

    const local =
      new Date(
        date.getTime() -
        date.getTimezoneOffset() *
          60000
      );


    return local
      .toISOString()
      .slice(
        0,
        16
      );

  }


  function formatDate(
    value
  ) {

    if (
      !value
    ) {

      return "—";

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

      return "—";

    }


    return date
      .toLocaleString();

  }


  function showMessage(
    text,
    type = "info"
  ) {

    if (
      !message
    ) {
      return;
    }


    message.textContent =
      text;


    message.className =
      `message show ${type}`;

  }


  function clearMessage() {

    if (
      !message
    ) {
      return;
    }


    message.textContent =
      "";


    message.className =
      "message";

  }


  // =========================================================
  // LOST & FOUND AGE DISPLAY
  // =========================================================

  function lostFoundAgeInfo(
    ageDays,
    disposalEligible
  ) {

    const days =
      Number(
        ageDays || 0
      );


    if (
      disposalEligible
    ) {

      return {

        className:
          "age-band age-due",

        text:
          `${days} day${days === 1 ? "" : "s"} • Disposal Due`

      };

    }


    if (
      days >= 6
    ) {

      return {

        className:
          "age-band age-warning",

        text:
          `${days} days • Expires Soon`

      };

    }


    return {

      className:
        "age-band age-fresh",

      text:
        `${days} day${days === 1 ? "" : "s"}`

    };

  }


  // =========================================================
  // RESET INTAKE FORM
  // =========================================================

  function resetForm(
    {
      keepMessage = false
    } = {}
  ) {

    if (
      !form
    ) {
      return;
    }


    form.reset();


    turnedInAt.value =
      localDateTimeValue();


    receivedBy.value =
      profile.display_name ||
      auth.user.email ||
      "SecureTrack User";


    if (
      !keepMessage
    ) {

      clearMessage();

    }

  }


  // =========================================================
  // LOAD LOST & FOUND SUMMARY COUNTS
  // =========================================================

  async function loadSummary() {

    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "search_lost_found_items",
          {
            p_search:
              ""
          }
        );


      if (
        error
      ) {

        throw error;

      }


      const rows =
        data || [];


      const activeRows =
        rows.filter(
          item =>
            item.status ===
              "active"
        );


      const dueRows =
        activeRows.filter(
          item =>
            item.disposal_eligible ===
              true
        );


      const closedRows =
        rows.filter(
          item =>
            item.status ===
              "returned" ||
            item.status ===
              "disposed"
        );


      if (
        activeCount
      ) {

        activeCount.textContent =
          String(
            activeRows.length
          );

      }


      if (
        dueCount
      ) {

        dueCount.textContent =
          String(
            dueRows.length
          );

      }


      if (
        closedCount
      ) {

        closedCount.textContent =
          String(
            closedRows.length
          );

      }

    }
    catch (error) {

      console.error(
        "Lost & Found summary load error:",
        error
      );


      if (
        activeCount
      ) {

        activeCount.textContent =
          "—";

      }


      if (
        dueCount
      ) {

        dueCount.textContent =
          "—";

      }


      if (
        closedCount
      ) {

        closedCount.textContent =
          "—";

      }

    }

  }


  // =========================================================
  // RETURN ITEM TO OWNER
  // =========================================================

  async function returnToOwner(
    item
  ) {

    const returnedTo =
      window.prompt(
        `Who is ${item.lost_found_number} being returned to?`
      );


    if (
      returnedTo ===
        null
    ) {

      return;

    }


    if (
      !returnedTo.trim()
    ) {

      window.alert(
        "Returned-to name is required."
      );


      return;

    }


    const returnNotes =
      window.prompt(
        "Return notes (optional):"
      );


    const confirmed =
      window.confirm(
        `Confirm ${item.lost_found_number} is being returned to ${returnedTo.trim()}?`
      );


    if (
      !confirmed
    ) {

      return;

    }


    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "return_lost_found_item",
          {

            p_lost_found_number:
              item.lost_found_number,

            p_returned_to:
              returnedTo.trim(),

            p_notes:
              returnNotes?.trim() ||
              null

          }
        );


      if (
        error
      ) {

        throw error;

      }


      console.log(
        "SecureTrack Lost & Found return:",
        data
      );


      showMessage(
        `${item.lost_found_number} was returned successfully.`,
        "success"
      );


      await Promise.all([
        loadRows(
          searchInput.value
        ),
        loadSummary()
      ]);

    }
    catch (error) {

      console.error(
        "Lost & Found return error:",
        error
      );


      window.alert(
        error?.message ||
        "Unable to return this item."
      );

    }

  }


  // =========================================================
  // DISPOSE LOST & FOUND ITEM
  // =========================================================

  async function disposeItem(
    item
  ) {

    if (
      !canDispose
    ) {

      window.alert(
        "Management authorization is required to dispose of Lost & Found property."
      );


      return;

    }


    if (
      item.disposal_eligible !==
      true
    ) {

      window.alert(
        `${item.lost_found_number} has not completed the required 7-day retention period.`
      );


      return;

    }


    const method =
      window.prompt(
        `Enter the disposal method for ${item.lost_found_number}:`
      );


    if (
      method ===
        null
    ) {

      return;

    }


    if (
      !method.trim()
    ) {

      window.alert(
        "Disposal method is required."
      );


      return;

    }


    const disposalNotes =
      window.prompt(
        "Disposal notes (optional):"
      );


    const confirmed =
      window.confirm(
        `Confirm that ${item.lost_found_number} has been physically disposed? This will remove the item from active Lost & Found inventory.`
      );


    if (
      !confirmed
    ) {

      return;

    }


    try {

      const {
        data,
        error
      } =
        await db.rpc(
          "dispose_lost_found_item",
          {

            p_lost_found_number:
              item.lost_found_number,

            p_disposal_method:
              method.trim(),

            p_notes:
              disposalNotes?.trim() ||
              null

          }
        );


      if (
        error
      ) {

        throw error;

      }


      console.log(
        "SecureTrack Lost & Found disposal:",
        data
      );


      showMessage(
        `${item.lost_found_number} was marked disposed and removed from active inventory.`,
        "success"
      );


      await Promise.all([
        loadRows(
          searchInput.value
        ),
        loadSummary()
      ]);

    }
    catch (error) {

      console.error(
        "Lost & Found disposal error:",
        error
      );


      window.alert(
        error?.message ||
        "Unable to dispose this item."
      );

    }

  }


  // =========================================================
  // RENDER LOST & FOUND INVENTORY
  // =========================================================

  function renderRows(
    rows
  ) {

    if (
      !resultsBody
    ) {

      return;

    }


    resultsBody.innerHTML =
      "";


    if (
      !rows.length
    ) {

      const tr =
        document.createElement(
          "tr"
        );


      const td =
        document.createElement(
          "td"
        );


      td.colSpan =
        8;


      td.className =
        "empty-cell";


      td.textContent =
        "No Lost & Found records found.";


      tr.appendChild(
        td
      );


      resultsBody.appendChild(
        tr
      );


      return;

    }


    rows.forEach(
      item => {

        const tr =
          document.createElement(
            "tr"
          );


        // =====================================
        // ITEM ID
        // =====================================

        const numberTd =
          document.createElement(
            "td"
          );


        numberTd.textContent =
          item.lost_found_number ||
          "—";


        numberTd.className =
          "property-number";


        tr.appendChild(
          numberTd
        );


        // =====================================
        // DESCRIPTION
        // =====================================

        const descriptionTd =
          document.createElement(
            "td"
          );


        descriptionTd.textContent =
          item.description ||
          "—";


        tr.appendChild(
          descriptionTd
        );


        // =====================================
        // TURNED IN BY
        // =====================================

        const turnedInTd =
          document.createElement(
            "td"
          );


        turnedInTd.textContent =
          item.turned_in_by ||
          "—";


        tr.appendChild(
          turnedInTd
        );


        // =====================================
        // STORAGE
        // =====================================

        const storageTd =
          document.createElement(
            "td"
          );


        storageTd.textContent =
          item.storage_location ||
          "—";


        tr.appendChild(
          storageTd
        );


        // =====================================
        // AGE
        // =====================================

        const ageTd =
          document.createElement(
            "td"
          );


        const ageInfo =
          lostFoundAgeInfo(
            item.age_days,
            item.disposal_eligible
          );


        const ageBadge =
          document.createElement(
            "span"
          );


        ageBadge.className =
          ageInfo.className;


        ageBadge.textContent =
          ageInfo.text;


        ageTd.appendChild(
          ageBadge
        );


        tr.appendChild(
          ageTd
        );


        // =====================================
        // DISPOSAL ELIGIBLE
        // =====================================

        const eligibleTd =
          document.createElement(
            "td"
          );


        if (
          item.status !==
            "active"
        ) {

          eligibleTd.textContent =
            "—";

        }
        else if (
          item.disposal_eligible ===
            true
        ) {

          eligibleTd.textContent =
            "Eligible Now";

        }
        else {

          eligibleTd.textContent =
            formatDate(
              item.disposal_eligible_at
            );

        }


        tr.appendChild(
          eligibleTd
        );


        // =====================================
        // STATUS
        // =====================================

        const statusTd =
          document.createElement(
            "td"
          );


        const statusBadge =
          document.createElement(
            "span"
          );


        statusBadge.className =
          `status-pill ${item.status || ""}`;


        statusBadge.textContent =
          String(
            item.status ||
            "—"
          )
            .replaceAll(
              "_",
              " "
            );


        statusTd.appendChild(
          statusBadge
        );


        tr.appendChild(
          statusTd
        );


        // =====================================
        // ACTIONS
        // =====================================

        const actionTd =
          document.createElement(
            "td"
          );


        const actionStack =
          document.createElement(
            "div"
          );


        actionStack.className =
          "property-action-stack";


        if (
          item.status ===
            "active"
        ) {

          // -----------------------------------
          // RETURN TO OWNER
          // -----------------------------------

          const returnButton =
            document.createElement(
              "button"
            );


          returnButton.type =
            "button";


          returnButton.className =
            "button secondary compact";


          returnButton.textContent =
            "Return to Owner";


          returnButton.addEventListener(
            "click",
            async () => {

              await returnToOwner(
                item
              );

            }
          );


          actionStack.appendChild(
            returnButton
          );


          // -----------------------------------
          // DISPOSAL
          // -----------------------------------

          const disposalButton =
            document.createElement(
              "button"
            );


          disposalButton.type =
            "button";


          disposalButton.className =
            "button secondary compact";


          if (
            item.disposal_eligible !==
              true
          ) {

            disposalButton.textContent =
              "7-Day Hold";


            disposalButton.disabled =
              true;


            disposalButton.title =
              `Disposal becomes available ${formatDate(
                item.disposal_eligible_at
              )}`;

          }
          else if (
            !canDispose
          ) {

            disposalButton.textContent =
              "Management Disposal";


            disposalButton.disabled =
              true;


            disposalButton.title =
              "Manager, Director, or Administrator authorization is required.";

          }
          else {

            disposalButton.textContent =
              "Dispose Item";


            disposalButton.className =
              "button secondary compact danger-action";


            disposalButton.addEventListener(
              "click",
              async () => {

                await disposeItem(
                  item
                );

              }
            );

          }


          actionStack.appendChild(
            disposalButton
          );

        }


        actionTd.appendChild(
          actionStack
        );


        tr.appendChild(
          actionTd
        );


        resultsBody.appendChild(
          tr
        );

      }
    );

  }


  // =========================================================
  // LOAD / SEARCH LOST & FOUND
  // =========================================================

  async function loadRows(
    searchTerm = ""
  ) {

    if (
      !resultsBody
    ) {

      return;

    }


    try {

      resultsBody.innerHTML =
        `
          <tr>
            <td
              colspan="8"
              class="empty-cell"
            >
              Loading Lost &amp; Found records…
            </td>
          </tr>
        `;


      const {
        data,
        error
      } =
        await db.rpc(
          "search_lost_found_items",
          {

            p_search:
              String(
                searchTerm ||
                ""
              ).trim()

          }
        );


      if (
        error
      ) {

        throw error;

      }


      renderRows(
        data || []
      );

    }
    catch (error) {

      console.error(
        "Lost & Found search error:",
        error
      );


      resultsBody.innerHTML =
        `
          <tr>
            <td
              colspan="8"
              class="empty-cell"
            >
              Unable to load Lost &amp; Found records.
            </td>
          </tr>
        `;


      throw error;

    }

  }


  // =========================================================
  // CREATE LOST & FOUND RECORD
  // =========================================================

  form?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      clearMessage();


      if (
        !description.value.trim()
      ) {

        showMessage(
          "Enter an item description.",
          "error"
        );


        description.focus();


        return;

      }


      if (
        !turnedInBy.value.trim()
      ) {

        showMessage(
          "Enter who turned the item in.",
          "error"
        );


        turnedInBy.focus();


        return;

      }


      if (
        !turnedInAt.value
      ) {

        showMessage(
          "Enter the date and time the item was turned in.",
          "error"
        );


        turnedInAt.focus();


        return;

      }


      if (
        !storage.value.trim()
      ) {

        showMessage(
          "Enter the locker or storage location.",
          "error"
        );


        storage.focus();


        return;

      }


      saveButton.disabled =
        true;


      saveButton.textContent =
        "Saving…";


      try {

        const {
          data,
          error
        } =
          await db.rpc(
            "create_lost_found_item",
            {

              p_description:
                description.value
                  .trim(),

              p_turned_in_by:
                turnedInBy.value
                  .trim(),

              p_storage_location:
                storage.value
                  .trim(),

              p_notes:
                notes.value
                  .trim() ||
                null,

              p_turned_in_at:
                new Date(
                  turnedInAt.value
                )
                  .toISOString()

            }
          );


        if (
          error
        ) {

          throw error;

        }


        console.log(
          "SecureTrack Lost & Found item created:",
          data
        );


        const number =
          data?.lost_found_number ||
          "Lost & Found item";


        resetForm({
          keepMessage:
            true
        });


        showMessage(
          `${number} was added successfully. The 7-day retention period has started.`,
          "success"
        );


        await Promise.all([
          loadRows(
            searchInput.value
          ),
          loadSummary()
        ]);

      }
      catch (error) {

        console.error(
          "Lost & Found create error:",
          error
        );


        showMessage(
          error?.message ||
          "Unable to add the Lost & Found item.",
          "error"
        );

      }
      finally {

        saveButton.disabled =
          false;


        saveButton.textContent =
          "Add Lost & Found Item";

      }

    }
  );


  // =========================================================
  // CLEAR FORM
  // =========================================================

  clearButton?.addEventListener(
    "click",
    () => {

      resetForm();

    }
  );


  // =========================================================
  // SEARCH
  // =========================================================

  searchForm?.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      try {

        await loadRows(
          searchInput.value
        );

      }
      catch (error) {

        console.error(
          "Lost & Found search failed:",
          error
        );

      }

    }
  );


  // =========================================================
  // REFRESH
  // =========================================================

  refreshButton?.addEventListener(
    "click",
    async () => {

      try {

        await Promise.all([
          loadRows(
            searchInput.value
          ),
          loadSummary()
        ]);

      }
      catch (error) {

        console.error(
          "Lost & Found refresh failed:",
          error
        );

      }

    }
  );


  // =========================================================
  // REFRESH WHEN LOST & FOUND TAB IS OPENED
  // =========================================================

  document
    .querySelector(
      '[data-panel="lostFoundPanel"]'
    )
    ?.addEventListener(
      "click",
      async () => {

        try {

          await Promise.all([
            loadRows(
              searchInput.value
            ),
            loadSummary()
          ]);

        }
        catch (error) {

          console.error(
            "Lost & Found tab refresh failed:",
            error
          );

        }

      }
    );


  // =========================================================
  // INITIALIZE
  // =========================================================

  resetForm();


  try {

    await Promise.all([
      loadRows(
        ""
      ),
      loadSummary()
    ]);

  }
  catch (error) {

    console.error(
      "Lost & Found initialization error:",
      error
    );

  }


})();
