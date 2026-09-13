(function () {

  "use strict";

  const STM = window.SecureTrackManager;

  if (!STM) {
    console.error(
      "SecureTrackManager is required for Personnel Editor."
    );
    return;
  }

  const db = STM.db;

  let currentPersonnel = null;
  let selectedPhotoFile = null;


  // ========================================================
  // STYLES
  // ========================================================

  const style = document.createElement("style");

  style.textContent = `

    [hidden] {
      display: none !important;
    }

    .personnel-editor-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;

      display: flex;
      align-items: flex-start;
      justify-content: center;

      padding: 35px 16px;

      overflow-y: auto;

      background:
        rgba(0,0,0,.78);

      backdrop-filter:
        blur(4px);
    }

    .personnel-editor-modal {
      width: min(920px, 100%);
      border: 1px solid #3b4249;
      border-radius: 18px;

      background:
        linear-gradient(
          145deg,
          #0b0e11,
          #11151a
        );

      box-shadow:
        0 24px 80px
        rgba(0,0,0,.55);

      overflow: hidden;
    }

    .personnel-editor-head {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: flex-start;

      padding: 22px 24px;

      border-bottom:
        1px solid #2d333a;
    }

    .personnel-editor-head h2 {
      margin: 4px 0 0;
    }

    .personnel-editor-close {
      border: 1px solid #3b4249;
      background: #11151a;
      color: #fff;

      width: 38px;
      height: 38px;

      border-radius: 10px;

      cursor: pointer;

      font-size: 20px;
    }

    .personnel-editor-body {
      padding: 24px;
    }

    .personnel-editor-photo-area {
      display: flex;
      gap: 18px;
      align-items: center;

      margin-bottom: 24px;

      padding-bottom: 22px;

      border-bottom:
        1px solid #292f35;
    }

    .personnel-editor-photo {
      width: 92px;
      height: 92px;
      min-width: 92px;

      border-radius: 50%;

      display: flex;
      align-items: center;
      justify-content: center;

      overflow: hidden;

      border:
        2px solid #414850;

      background:
        linear-gradient(
          145deg,
          #272e35,
          #11151a
        );

      color: #ff922b;

      font-size: 27px;
      font-weight: 900;
    }

    .personnel-editor-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .personnel-editor-photo-tools {
      flex: 1;
    }

    .personnel-editor-photo-tools input {
      max-width: 100%;
    }

    .personnel-editor-photo-note {
      color: #8f979f;
      font-size: 12px;
      margin-top: 7px;
    }

    .personnel-editor-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 16px;
    }

    .personnel-editor-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .personnel-editor-field.full {
      grid-column: 1 / -1;
    }

    .personnel-editor-field label {
      color: #b8bec5;
      font-size: 12px;
      font-weight: 800;
    }

    .personnel-editor-field input,
    .personnel-editor-field select {

      width: 100%;

      border:
        1px solid #383f46;

      border-radius: 10px;

      background:
        #080b0e;

      color:
        #f4f6f7;

      padding:
        11px 12px;

      font: inherit;
    }

    .personnel-editor-field input:focus,
    .personnel-editor-field select:focus {

      outline:
        2px solid
        rgba(255,120,0,.25);

      border-color:
        #ff7800;
    }

    .personnel-editor-field input[readonly],
    .personnel-editor-field select:disabled {

      opacity: .6;
      cursor: not-allowed;
    }

    .personnel-editor-check {
      display: flex;
      align-items: center;
      gap: 10px;

      min-height: 45px;

      border:
        1px solid #343a41;

      border-radius:
        10px;

      padding:
        10px 12px;

      background:
        #0a0d10;
    }

    .personnel-editor-check input {
      width: 18px;
      height: 18px;
    }

    .personnel-editor-divider {
      margin:
        24px 0 18px;

      border-top:
        1px solid #292f35;
    }

    .personnel-editor-qualifications {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;

      margin-top: 10px;
    }

    .personnel-editor-qualification {
      border:
        1px solid #3c444b;

      border-radius:
        999px;

      padding:
        6px 9px;

      font-size:
        11px;

      font-weight:
        800;
    }

    .personnel-editor-qualification.active {
      color: #9adea8;

      border-color:
        rgba(87,187,109,.4);
    }

    .personnel-editor-qualification.revoked {
      color: #ff9292;

      border-color:
        rgba(224,74,74,.4);
    }

    .personnel-editor-email-note {
      color: #949ca4;
      font-size: 11px;
      margin-top: 4px;
    }

    .personnel-editor-message {
      display: none;

      margin-top:
        18px;

      padding:
        11px 13px;

      border-radius:
        10px;
    }

    .personnel-editor-message.success {

      display: block;

      color:
        #9adea8;

      border:
        1px solid
        rgba(87,187,109,.4);

      background:
        rgba(87,187,109,.08);
    }

    .personnel-editor-message.error {

      display: block;

      color:
        #ffadad;

      border:
        1px solid
        rgba(224,74,74,.45);

      background:
        rgba(224,74,74,.08);
    }

    .personnel-editor-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;

      padding:
        18px 24px;

      border-top:
        1px solid #2d333a;
    }

    .personnel-editor-secondary,
    .personnel-editor-primary,
    .personnel-editor-danger {

      border-radius:
        10px;

      padding:
        10px 15px;

      cursor: pointer;

      font-weight:
        850;
    }

    .personnel-editor-secondary {
      border:
        1px solid #3c434a;

      background:
        #12171c;

      color:
        #fff;
    }

    .personnel-editor-primary {
      border:
        1px solid #ff7800;

      background:
        #ff7800;

      color:
        #111;
    }

    .personnel-editor-danger {
      border:
        1px solid
        rgba(225,77,77,.5);

      background:
        rgba(225,77,77,.08);

      color:
        #ff9b9b;
    }

    .personnel-editor-primary:disabled {
      opacity: .5;
      cursor: wait;
    }

    @media (max-width: 700px) {

      .personnel-editor-grid {
        grid-template-columns:
          1fr;
      }

      .personnel-editor-field.full {
        grid-column: auto;
      }

      .personnel-editor-photo-area {
        align-items: flex-start;
      }

    }

  `;

  document.head.appendChild(style);


  // ========================================================
  // MODAL
  // ========================================================

  document.body.insertAdjacentHTML(
    "beforeend",
    `

    <div
      id="personnelEditorOverlay"
      class="personnel-editor-overlay"
      hidden
    >

      <section
        class="personnel-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personnelEditorTitle"
      >

        <header
          class="personnel-editor-head"
        >

          <div>

            <div class="eyebrow">
              Personnel Administration
            </div>

            <h2 id="personnelEditorTitle">
              Edit Personnel
            </h2>

            <p
              id="personnelEditorSubtitle"
              class="subtle"
              style="margin-bottom:0;"
            >
              —
            </p>

          </div>

          <button
            id="personnelEditorClose"
            class="personnel-editor-close"
            type="button"
            aria-label="Close"
          >
            ×
          </button>

        </header>


        <div
          class="personnel-editor-body"
        >


          <!-- PHOTO -->

          <section
            class="personnel-editor-photo-area"
          >

            <div
              id="personnelEditorPhoto"
              class="personnel-editor-photo"
            >
              —
            </div>


            <div
              class="personnel-editor-photo-tools"
            >

              <strong>
                Officer Photo
              </strong>

              <div
                class="personnel-editor-photo-note"
              >
                Optional. JPG, PNG or WebP.
                Maximum file size: 5 MB.
              </div>

              <input
                id="personnelEditorPhotoInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style="margin-top:10px;"
              >

              <div
                style="
                  display:flex;
                  gap:8px;
                  margin-top:10px;
                "
              >

                <button
                  id="personnelEditorRemovePhoto"
                  class="personnel-editor-danger"
                  type="button"
                  hidden
                >
                  Remove Photo
                </button>

              </div>

            </div>

          </section>


          <!-- PERSONNEL FIELDS -->

          <div
            class="personnel-editor-grid"
          >


            <div
              class="personnel-editor-field"
            >

              <label for="personnelFirstName">
                First Name
              </label>

              <input
                id="personnelFirstName"
                type="text"
                autocomplete="off"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelMiddleInitial">
                Middle Initial
              </label>

              <input
                id="personnelMiddleInitial"
                type="text"
                maxlength="1"
                autocomplete="off"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelLastName">
                Last Name
              </label>

              <input
                id="personnelLastName"
                type="text"
                autocomplete="off"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelNickname">
                Nickname
              </label>

              <input
                id="personnelNickname"
                type="text"
                autocomplete="off"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelEmployeeNumber">
                Employee Number
              </label>

              <input
                id="personnelEmployeeNumber"
                type="text"
                autocomplete="off"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelPhone">
                Telephone Number
              </label>

              <input
                id="personnelPhone"
                type="tel"
                autocomplete="tel"
              >

            </div>


            <div
              class="personnel-editor-field full"
            >

              <label for="personnelEmail">
                Email Address / Login
              </label>

              <input
                id="personnelEmail"
                type="email"
                readonly
              >

              <div
                class="personnel-editor-email-note"
              >
                Email changes will be enabled when
                SecureTrack Auth synchronization is
                connected. This prevents the profile
                email and login email from becoming
                different.
              </div>

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelBirthDate">
                Date of Birth
              </label>

              <input
                id="personnelBirthDate"
                type="date"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelHireDate">
                Hire Date
              </label>

              <input
                id="personnelHireDate"
                type="date"
              >

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelRank">
                Rank
              </label>

              <select
                id="personnelRank"
              >

                <option value="officer">
                  Officer
                </option>

                <option value="senior_officer">
                  Senior Officer
                </option>

                <option value="team_lead">
                  Team Lead
                </option>

                <option value="dispatcher">
                  Dispatcher
                </option>

                <option value="manager">
                  Manager
                </option>

                <option value="director">
                  Director
                </option>

                <option value="admin">
                  Administrator
                </option>

              </select>

            </div>


            <div
              class="personnel-editor-field"
            >

              <label for="personnelShift">
                Normal Shift
              </label>

              <select
                id="personnelShift"
              >

                <option value="">
                  Unassigned
                </option>

                <option value="Alpha">
                  Alpha
                </option>

                <option value="Bravo">
                  Bravo
                </option>

                <option value="Charlie">
                  Charlie
                </option>

                <option value="Delta">
                  Delta
                </option>

              </select>

            </div>


            <div
              class="personnel-editor-field full"
            >

              <label>
                Armed Qualification
              </label>

              <label
                class="personnel-editor-check"
              >

                <input
                  id="personnelArmed"
                  type="checkbox"
                >

                <span>
                  Officer is currently
                  Armed Qualified
                </span>

              </label>

            </div>

          </div>


          <div
            class="personnel-editor-divider"
          ></div>


          <!-- QUALIFICATIONS -->

          <section>

            <div class="eyebrow">
              Qualifications
            </div>

            <h3
              style="margin:5px 0;"
            >
              Current Qualifications
            </h3>

            <p class="subtle">
              Armed status can be updated above.
              Additional qualification-management
              controls will be connected separately.
            </p>

            <div
              id="personnelQualifications"
              class="personnel-editor-qualifications"
            >
            </div>

          </section>


          <div
            id="personnelEditorMessage"
            class="personnel-editor-message"
          ></div>


        </div>


        <footer
          class="personnel-editor-footer"
        >

          <button
            id="personnelEditorCancel"
            class="personnel-editor-secondary"
            type="button"
          >
            Cancel
          </button>

          <button
            id="personnelEditorSave"
            class="personnel-editor-primary"
            type="button"
          >
            Save Personnel
          </button>

        </footer>

      </section>

    </div>

    `
  );


  // ========================================================
  // DOM REFERENCES
  // ========================================================

  const overlay =
    document.getElementById(
      "personnelEditorOverlay"
    );

  const photo =
    document.getElementById(
      "personnelEditorPhoto"
    );

  const photoInput =
    document.getElementById(
      "personnelEditorPhotoInput"
    );

  const removePhotoButton =
    document.getElementById(
      "personnelEditorRemovePhoto"
    );

  const firstName =
    document.getElementById(
      "personnelFirstName"
    );

  const middleInitial =
    document.getElementById(
      "personnelMiddleInitial"
    );

  const lastName =
    document.getElementById(
      "personnelLastName"
    );

  const nickname =
    document.getElementById(
      "personnelNickname"
    );

  const employeeNumber =
    document.getElementById(
      "personnelEmployeeNumber"
    );

  const phone =
    document.getElementById(
      "personnelPhone"
    );

  const email =
    document.getElementById(
      "personnelEmail"
    );

  const birthDate =
    document.getElementById(
      "personnelBirthDate"
    );

  const hireDate =
    document.getElementById(
      "personnelHireDate"
    );

  const rank =
    document.getElementById(
      "personnelRank"
    );

  const shift =
    document.getElementById(
      "personnelShift"
    );

  const armed =
    document.getElementById(
      "personnelArmed"
    );

  const qualifications =
    document.getElementById(
      "personnelQualifications"
    );

  const message =
    document.getElementById(
      "personnelEditorMessage"
    );

  const saveButton =
    document.getElementById(
      "personnelEditorSave"
    );


  // ========================================================
  // HELPERS
  // ========================================================

  function initialsFor(person) {

    const first =
      String(
        person.first_name || ""
      ).trim();

    const last =
      String(
        person.last_name || ""
      ).trim();

    if (first || last) {

      return (
        (first[0] || "") +
        (last[0] || "")
      ).toUpperCase();

    }

    return "?";

  }


  function nullable(value) {

    const clean =
      String(
        value || ""
      ).trim();

    return clean || null;

  }


  function setMessage(
    text,
    type
  ) {

    message.textContent =
      text;

    message.className =
      "personnel-editor-message " +
      type;

  }


  function clearMessage() {

    message.textContent = "";

    message.className =
      "personnel-editor-message";

  }


  async function signedPhotoURL(
    path
  ) {

    if (!path) {
      return null;
    }

    const {
      data,
      error
    } =
      await db
        .storage
        .from(
          "officer-profile-photos"
        )
        .createSignedUrl(
          path,
          3600
        );

    if (error) {

      console.warn(
        "Unable to create signed photo URL:",
        error
      );

      return null;
    }

    return data?.signedUrl || null;

  }


  async function renderPhoto(
    person
  ) {

    photo.textContent =
      initialsFor(person);

    removePhotoButton.hidden =
      !person.profile_photo_path;

    if (!person.profile_photo_path) {
      return;
    }

    const url =
      await signedPhotoURL(
        person.profile_photo_path
      );

    if (!url) {
      return;
    }

    photo.innerHTML = "";

    const img =
      document.createElement(
        "img"
      );

    img.src = url;

    img.alt =
      person.display_name ||
      "Officer photo";

    photo.appendChild(img);

  }


  function renderQualifications(
    items
  ) {

    const list =
      Array.isArray(items)
        ? items
        : [];

    if (!list.length) {

      qualifications.innerHTML =
        `
          <span class="subtle">
            No qualifications recorded.
          </span>
        `;

      return;
    }

    qualifications.innerHTML =
      list
        .map(item => {

          const status =
            item.status === "active"
              ? "active"
              : "revoked";

          return `
            <span
              class="
                personnel-editor-qualification
                ${status}
              "
            >
              ${String(
                item.name ||
                item.code ||
                "Qualification"
              )}
            </span>
          `;

        })
        .join("");

  }


  // ========================================================
  // OPEN EDITOR
  // ========================================================

  async function openEditor(
    userId
  ) {

    clearMessage();

    selectedPhotoFile = null;

    photoInput.value = "";

    saveButton.disabled = true;

    overlay.hidden = false;

    document.body.style.overflow =
      "hidden";

    document.getElementById(
      "personnelEditorSubtitle"
    ).textContent =
      "Loading personnel record...";


    const {
      data,
      error
    } =
      await db.rpc(
        "get_personnel_admin_record",
        {
          p_user_id: userId
        }
      );


    if (error) {

      console.error(
        "Personnel record error:",
        error
      );

      setMessage(
        error.message,
        "error"
      );

      saveButton.disabled = false;

      return;
    }


    currentPersonnel =
      data;


    document.getElementById(
      "personnelEditorSubtitle"
    ).textContent =
      currentPersonnel.display_name ||
      "Personnel Record";


    firstName.value =
      currentPersonnel.first_name ||
      "";

    middleInitial.value =
      currentPersonnel.middle_initial ||
      "";

    lastName.value =
      currentPersonnel.last_name ||
      "";

    nickname.value =
      currentPersonnel.nickname ||
      "";

    employeeNumber.value =
      currentPersonnel.employee_number ||
      "";

    phone.value =
      currentPersonnel.phone_number ||
      "";

    email.value =
      currentPersonnel.email ||
      "";

    birthDate.value =
      currentPersonnel.birth_date ||
      "";

    hireDate.value =
      currentPersonnel.hire_date ||
      "";

    rank.value =
      currentPersonnel.rank ||
      "officer";

    shift.value =
      currentPersonnel.shift_name ||
      "";

    armed.checked =
      currentPersonnel.is_armed ===
      true;


    const operationalRanks =
      [
        "officer",
        "senior_officer",
        "team_lead"
      ];


    const rankCanChange =
      operationalRanks.includes(
        currentPersonnel.rank
      );


    /*
      Manager / Director / Admin /
      Dispatcher rank changes are intentionally
      not permitted through set_officer_rank().
    */

    rank.disabled =
      !rankCanChange;


    shift.disabled =
      !rankCanChange;


    armed.disabled =
      !rankCanChange;


    renderQualifications(
      currentPersonnel.qualifications
    );


    await renderPhoto(
      currentPersonnel
    );


    saveButton.disabled = false;

  }


  // ========================================================
  // CLOSE EDITOR
  // ========================================================

  function closeEditor() {

    overlay.hidden = true;

    document.body.style.overflow =
      "";

    currentPersonnel = null;

    selectedPhotoFile = null;

    photoInput.value = "";

    clearMessage();

  }


  // ========================================================
  // PHOTO SELECTION
  // ========================================================

  photoInput.addEventListener(
    "change",
    event => {

      const file =
        event.target.files?.[0];

      if (!file) {

        selectedPhotoFile =
          null;

        return;
      }


      const allowed =
        [
          "image/jpeg",
          "image/png",
          "image/webp"
        ];


      if (
        !allowed.includes(
          file.type
        )
      ) {

        photoInput.value = "";

        selectedPhotoFile =
          null;

        setMessage(
          "Photo must be JPG, PNG or WebP.",
          "error"
        );

        return;
      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        photoInput.value = "";

        selectedPhotoFile =
          null;

        setMessage(
          "Photo must be 5 MB or smaller.",
          "error"
        );

        return;
      }


      selectedPhotoFile =
        file;


      const reader =
        new FileReader();


      reader.onload =
        function () {

          photo.innerHTML = "";

          const img =
            document.createElement(
              "img"
            );

          img.src =
            reader.result;

          img.alt =
            "Selected officer photo";

          photo.appendChild(
            img
          );

        };


      reader.readAsDataURL(
        file
      );

      clearMessage();

    }
  );


  // ========================================================
  // UPLOAD PHOTO
  // ========================================================

  async function uploadSelectedPhoto() {

    if (
      !selectedPhotoFile ||
      !currentPersonnel
    ) {
      return;
    }


    const extensions = {

      "image/jpeg":
        "jpg",

      "image/png":
        "png",

      "image/webp":
        "webp"

    };


    const extension =
      extensions[
        selectedPhotoFile.type
      ];


    const newPath =
      currentPersonnel.user_id +
      "/profile-" +
      Date.now() +
      "." +
      extension;


    const oldPath =
      currentPersonnel
        .profile_photo_path;


    const {
      error: uploadError
    } =
      await db
        .storage
        .from(
          "officer-profile-photos"
        )
        .upload(
          newPath,
          selectedPhotoFile,
          {
            cacheControl:
              "3600",

            upsert:
              false
          }
        );


    if (uploadError) {
      throw uploadError;
    }


    const {
      error: savePathError
    } =
      await db.rpc(
        "set_personnel_profile_photo",
        {

          p_user_id:
            currentPersonnel.user_id,

          p_profile_photo_path:
            newPath

        }
      );


    if (savePathError) {

      /*
        Clean up the newly uploaded object
        if database assignment fails.
      */

      await db
        .storage
        .from(
          "officer-profile-photos"
        )
        .remove(
          [newPath]
        );

      throw savePathError;
    }


    /*
      Remove the old photo only AFTER
      the new photo is successfully saved.
    */

    if (
      oldPath &&
      oldPath !== newPath
    ) {

      const {
        error: removeOldError
      } =
        await db
          .storage
          .from(
            "officer-profile-photos"
          )
          .remove(
            [oldPath]
          );


      if (removeOldError) {

        console.warn(
          "Old officer photo could not be removed:",
          removeOldError
        );

      }

    }


    currentPersonnel
      .profile_photo_path =
        newPath;

  }


  // ========================================================
  // REMOVE PHOTO
  // ========================================================

  removePhotoButton.addEventListener(
    "click",
    async () => {

      if (
        !currentPersonnel ||
        !currentPersonnel
          .profile_photo_path
      ) {
        return;
      }


      const confirmed =
        window.confirm(
          "Remove this officer's profile photo?"
        );


      if (!confirmed) {
        return;
      }


      clearMessage();


      const oldPath =
        currentPersonnel
          .profile_photo_path;


      const {
        error
      } =
        await db.rpc(
          "set_personnel_profile_photo",
          {

            p_user_id:
              currentPersonnel.user_id,

            p_profile_photo_path:
              null

          }
        );


      if (error) {

        setMessage(
          error.message,
          "error"
        );

        return;
      }


      /*
        Database pointer is already cleared.
        Failure to delete the storage object
        does not restore the profile photo.
      */

      const {
        error: storageError
      } =
        await db
          .storage
          .from(
            "officer-profile-photos"
          )
          .remove(
            [oldPath]
          );


      if (storageError) {

        console.warn(
          "Photo record was cleared, but old file removal failed:",
          storageError
        );

      }


      currentPersonnel
        .profile_photo_path =
          null;


      await renderPhoto(
        currentPersonnel
      );


      setMessage(
        "Officer photo removed.",
        "success"
      );

    }
  );


  // ========================================================
  // SAVE PERSONNEL
  // ========================================================

  saveButton.addEventListener(
    "click",
    async () => {

      if (!currentPersonnel) {
        return;
      }


      clearMessage();


      if (
        !firstName.value.trim() ||
        !lastName.value.trim()
      ) {

        setMessage(
          "First name and last name are required.",
          "error"
        );

        return;
      }


      if (
        middleInitial.value.trim()
        &&
        !/^[A-Za-z]$/.test(
          middleInitial.value.trim()
        )
      ) {

        setMessage(
          "Middle initial must contain one letter.",
          "error"
        );

        return;
      }


      saveButton.disabled =
        true;

      saveButton.textContent =
        "Saving...";


      try {


        // ----------------------------------------
        // BASIC PERSONNEL PROFILE
        // ----------------------------------------

        const {
          error: profileError
        } =
          await db.rpc(
            "update_personnel_admin_profile",
            {

              p_user_id:
                currentPersonnel.user_id,

              p_first_name:
                firstName.value.trim(),

              p_middle_initial:
                nullable(
                  middleInitial.value
                ),

              p_last_name:
                lastName.value.trim(),

              p_nickname:
                nullable(
                  nickname.value
                ),

              p_employee_number:
                nullable(
                  employeeNumber.value
                ),

              p_phone_number:
                nullable(
                  phone.value
                ),

              p_birth_date:
                birthDate.value ||
                null,

              p_hire_date:
                hireDate.value ||
                null

            }
          );


        if (profileError) {
          throw profileError;
        }


        const operationalRanks =
          [
            "officer",
            "senior_officer",
            "team_lead"
          ];


        const operational =
          operationalRanks.includes(
            currentPersonnel.rank
          );


        // ----------------------------------------
        // RANK
        // ----------------------------------------

        if (
          operational &&
          rank.value !==
            currentPersonnel.rank
        ) {

          const {
            error: rankError
          } =
            await db.rpc(
              "set_officer_rank",
              {

                p_user_id:
                  currentPersonnel.user_id,

                p_rank:
                  rank.value

              }
            );


          if (rankError) {
            throw rankError;
          }

        }


        // ----------------------------------------
        // NORMAL SHIFT
        // ----------------------------------------

        if (
          operational &&
          shift.value &&
          shift.value !==
            (
              currentPersonnel.shift_name ||
              ""
            )
        ) {

          const {
            error: shiftError
          } =
            await db.rpc(
              "set_officer_shift",
              {

                p_user_id:
                  currentPersonnel.user_id,

                p_shift_name:
                  shift.value

              }
            );


          if (shiftError) {
            throw shiftError;
          }

        }


        // ----------------------------------------
        // ARMED QUALIFICATION
        // ----------------------------------------

        if (
          operational &&
          armed.checked !==
            (
              currentPersonnel.is_armed ===
              true
            )
        ) {

          const {
            error: armedError
          } =
            await db.rpc(
              "set_officer_armed_qualification",
              {

                p_user_id:
                  currentPersonnel.user_id,

                p_is_armed:
                  armed.checked,

                p_notes:
                  "Updated through Personnel Administration"

              }
            );


          if (armedError) {
            throw armedError;
          }

        }


        // ----------------------------------------
        // PHOTO
        // ----------------------------------------

        if (selectedPhotoFile) {

          await uploadSelectedPhoto();

        }


        setMessage(
          "Personnel record updated successfully.",
          "success"
        );


        /*
          Refresh the personnel cards behind
          the editor.
        */

        const refresh =
          document.getElementById(
            "refreshActiveButton"
          );


        if (refresh) {
          refresh.click();
        }


        setTimeout(
          () => {

            closeEditor();

          },
          650
        );


      }
      catch (error) {

        console.error(
          "Personnel save failed:",
          error
        );


        setMessage(
          error.message ||
          "Personnel record could not be saved.",
          "error"
        );

      }
      finally {

        saveButton.disabled =
          false;

        saveButton.textContent =
          "Save Personnel";

      }

    }
  );


  // ========================================================
  // CLOSE EVENTS
  // ========================================================

  document
    .getElementById(
      "personnelEditorClose"
    )
    .addEventListener(
      "click",
      closeEditor
    );


  document
    .getElementById(
      "personnelEditorCancel"
    )
    .addEventListener(
      "click",
      closeEditor
    );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        closeEditor();

      }

    }
  );


  // ========================================================
  // INTERCEPT EXISTING EDIT BUTTON
  //
  // Capture phase prevents the older placeholder
  // alert in personnel-administration.html
  // from firing.
  // ========================================================

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          'button[data-action="edit"]'
        );


      if (!button) {
        return;
      }


      event.preventDefault();

      event.stopImmediatePropagation();


      const userId =
        button.dataset.id;


      if (!userId) {
        return;
      }


      await openEditor(
        userId
      );

    },
    true
  );


})();
