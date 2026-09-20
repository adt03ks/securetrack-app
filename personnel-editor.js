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



  // ========================================================
  // OUTSIDE OFFICER EDITOR
  // ========================================================

  const outsideStyle = document.createElement("style");

  outsideStyle.textContent = `
    .outside-officer-overlay[hidden] { display:none !important; }
    .outside-officer-overlay {
      position:fixed; inset:0; z-index:10020; display:flex;
      align-items:flex-start; justify-content:center; padding:32px 16px;
      overflow-y:auto; background:rgba(0,0,0,.82); backdrop-filter:blur(4px);
    }
    .outside-officer-modal {
      width:min(940px,100%); overflow:hidden; border:1px solid #3b4249;
      border-radius:18px; background:linear-gradient(145deg,#0b0e11,#11151a);
      box-shadow:0 24px 80px rgba(0,0,0,.6);
    }
    .outside-officer-head {
      display:flex; justify-content:space-between; gap:18px; align-items:flex-start;
      padding:22px 24px; border-bottom:1px solid #2d333a;
    }
    .outside-officer-head h2 { margin:4px 0 0; }
    .outside-officer-close {
      width:38px; height:38px; border:1px solid #3b4249; border-radius:10px;
      background:#11151a; color:#fff; cursor:pointer; font-size:20px;
    }
    .outside-officer-body { padding:24px; }
    .outside-officer-photo-area {
      display:flex; gap:18px; align-items:center; margin-bottom:22px; padding-bottom:20px;
      border-bottom:1px solid #292f35;
    }
    .outside-officer-photo {
      width:92px; height:92px; min-width:92px; border-radius:50%; overflow:hidden;
      display:flex; align-items:center; justify-content:center; border:2px solid #414850;
      background:linear-gradient(145deg,#272e35,#11151a); color:#ff922b;
      font-size:27px; font-weight:900; letter-spacing:.04em;
    }
    .outside-officer-photo img {
      width:100%; height:100%; object-fit:cover; object-position:center; display:block;
    }
    .outside-officer-photo-tools { flex:1; min-width:0; }
    .outside-officer-photo-tools input { max-width:100%; }
    .outside-officer-photo-note { color:#8f979f; font-size:12px; margin-top:7px; line-height:1.45; }
    .outside-officer-photo-actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
    .outside-officer-grid {
      display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px;
    }
    .outside-officer-field { display:flex; flex-direction:column; gap:6px; }
    .outside-officer-field.full { grid-column:1 / -1; }
    .outside-officer-field label { color:#b8bec5; font-size:12px; font-weight:800; }
    .outside-officer-field input,
    .outside-officer-field select,
    .outside-officer-field textarea {
      width:100%; border:1px solid #383f46; border-radius:10px; background:#080b0e;
      color:#f4f6f7; padding:11px 12px; font:inherit;
    }
    .outside-officer-field textarea { min-height:92px; resize:vertical; }
    .outside-officer-field input:focus,
    .outside-officer-field select:focus,
    .outside-officer-field textarea:focus {
      outline:2px solid rgba(255,120,0,.25); border-color:#ff7800;
    }
    .outside-officer-section {
      margin-top:24px; padding-top:20px; border-top:1px solid #292f35;
    }
    .outside-officer-qualification-list { display:grid; gap:9px; margin-top:12px; }
    .outside-officer-qualification-row {
      display:flex; justify-content:space-between; gap:12px; align-items:center;
      border:1px solid #333a41; border-radius:11px; padding:11px 12px; background:#0a0d10;
    }
    .outside-officer-qualification-meta { color:#9aa2aa; font-size:12px; margin-top:3px; }
    .outside-officer-chip {
      display:inline-flex; border:1px solid #3d444b; border-radius:999px;
      padding:4px 7px; font-size:10px; font-weight:850; margin-left:6px;
    }
    .outside-officer-chip.verified { color:#9adea8; border-color:rgba(87,187,109,.4); }
    .outside-officer-chip.unverified { color:#ffbf79; border-color:rgba(255,146,43,.4); }
    .outside-officer-footer {
      display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;
      padding:18px 24px; border-top:1px solid #2d333a;
    }
    .outside-officer-footer-right { display:flex; gap:10px; flex-wrap:wrap; }
    .outside-officer-message {
      display:none; margin-top:18px; padding:11px 13px; border-radius:10px;
    }
    .outside-officer-message.success {
      display:block; color:#9adea8; border:1px solid rgba(87,187,109,.4);
      background:rgba(87,187,109,.08);
    }
    .outside-officer-message.error {
      display:block; color:#ffadad; border:1px solid rgba(224,74,74,.45);
      background:rgba(224,74,74,.08);
    }
    .outside-officer-message.info {
      display:block; color:#ffbf79; border:1px solid rgba(255,146,43,.35);
      background:rgba(255,146,43,.07);
    }
    .outside-officer-qualification-form {
      display:grid; grid-template-columns:150px 1fr auto; gap:10px; align-items:end; margin-top:13px;
    }
    .outside-officer-verified-check {
      min-height:44px; display:flex; align-items:center; gap:8px; border:1px solid #383f46;
      border-radius:10px; padding:9px 11px; background:#080b0e; color:#d6dade; white-space:nowrap;
    }
    .outside-officer-verified-check input { width:17px; height:17px; }

    .outside-officer-armed-check {
      min-height:45px; display:flex; align-items:center; gap:10px;
      border:1px solid #343a41; border-radius:10px; padding:10px 12px;
      background:#0a0d10; color:#f4f6f7; font-weight:800; cursor:pointer;
    }
    .outside-officer-armed-check input {
      width:18px; height:18px; accent-color:#ff7800;
    }
    .outside-officer-armed-note {
      margin-top:6px; color:#8f979f; font-size:11px; line-height:1.45;
    }

    .st-outside-rank-with-shield {
      display:flex !important; align-items:center; gap:6px;
    }
    .st-outside-armed-shield {
      width:16px; height:18px; display:inline-flex; align-items:center;
      justify-content:center; flex:0 0 auto;
    }
    .st-outside-armed-shield svg {
      width:16px; height:18px; display:block;
      fill:#d84b4b; stroke:#ff9292; stroke-width:1;
    }

    @media (max-width:760px) {
      .outside-officer-grid,
      .outside-officer-qualification-form { grid-template-columns:1fr; }
      .outside-officer-field.full { grid-column:auto; }
      .outside-officer-photo-area { align-items:flex-start; }
    }
  `;

  document.head.appendChild(outsideStyle);

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div id="outsideOfficerEditorOverlay" class="outside-officer-overlay" hidden>
        <section class="outside-officer-modal" role="dialog" aria-modal="true" aria-labelledby="outsideOfficerEditorTitle">
          <header class="outside-officer-head">
            <div>
              <div class="eyebrow">Outside Officer Directory</div>
              <h2 id="outsideOfficerEditorTitle">Add Outside Officer</h2>
              <p id="outsideOfficerEditorSubtitle" class="subtle" style="margin-bottom:0;">
                Officers from another campus who may work overtime here.
              </p>
            </div>
            <button id="outsideOfficerEditorClose" class="outside-officer-close" type="button" aria-label="Close">×</button>
          </header>

          <div class="outside-officer-body">
            <section class="outside-officer-photo-area">
              <div id="outsideOfficerPhoto" class="outside-officer-photo">?</div>
              <div class="outside-officer-photo-tools">
                <strong>Outside Officer Photo</strong>
                <div class="outside-officer-photo-note">
                  Optional but recommended so supervisors can quickly identify the officer.
                  JPG, PNG or WebP. Maximum file size: 5 MB.
                </div>
                <input
                  id="outsideOfficerPhotoInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style="margin-top:10px;"
                >
                <div class="outside-officer-photo-actions">
                  <button
                    id="outsideOfficerRemovePhoto"
                    class="personnel-editor-danger"
                    type="button"
                    hidden
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            </section>

            <div class="outside-officer-grid">
              <div class="outside-officer-field">
                <label for="outsideOfficerFirstName">First Name *</label>
                <input id="outsideOfficerFirstName" type="text" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerMiddleInitial">Middle Initial</label>
                <input id="outsideOfficerMiddleInitial" type="text" maxlength="1" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerLastName">Last Name *</label>
                <input id="outsideOfficerLastName" type="text" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerNickname">Nickname</label>
                <input id="outsideOfficerNickname" type="text" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerPhone">Telephone Number *</label>
                <input id="outsideOfficerPhone" type="tel" autocomplete="tel">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerEmail">Email Address *</label>
                <input id="outsideOfficerEmail" type="email" autocomplete="email">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerEmployeeNumber">Employee Number</label>
                <input id="outsideOfficerEmployeeNumber" type="text" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerRank">Rank *</label>
                <select id="outsideOfficerRank">
                  <option value="officer">Officer</option>
                  <option value="senior_officer">Senior Officer</option>
                  <option value="team_lead">Team Lead</option>
                </select>
              </div>

              <div class="outside-officer-field">
                <label>Armed Qualification</label>
                <label class="outside-officer-armed-check">
                  <input id="outsideOfficerArmed" type="checkbox">
                  <span>Officer is currently Armed Qualified</span>
                </label>
                <div class="outside-officer-armed-note">
                  Checking this automatically maintains the verified ARMED qualification
                  and displays the red shield on the officer card.
                </div>
              </div>

              <div class="outside-officer-field full">
                <label for="outsideOfficerHomeCampus">Home Campus *</label>
                <input id="outsideOfficerHomeCampus" type="text" placeholder="Example: TMC, Memorial City, Sugar Land" autocomplete="off">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerBirthDate">Date of Birth</label>
                <input id="outsideOfficerBirthDate" type="date">
              </div>
              <div class="outside-officer-field">
                <label for="outsideOfficerHireDate">Hire Date</label>
                <input id="outsideOfficerHireDate" type="date">
              </div>
              <div class="outside-officer-field full">
                <label for="outsideOfficerNotes">Notes</label>
                <textarea id="outsideOfficerNotes" placeholder="Optional directory or overtime notes"></textarea>
              </div>
            </div>

            <section id="outsideOfficerQualificationsSection" class="outside-officer-section" hidden>
              <div class="eyebrow">Qualifications</div>
              <h3 style="margin:5px 0;">Outside Officer Qualifications</h3>
              <p class="subtle" style="margin-bottom:0;">
                Add and verify qualifications before using them for overtime eligibility decisions.
              </p>
              <div id="outsideOfficerQualificationList" class="outside-officer-qualification-list"></div>
              <div class="outside-officer-qualification-form">
                <div class="outside-officer-field">
                  <label for="outsideQualificationCode">Code</label>
                  <input id="outsideQualificationCode" type="text" placeholder="ARMED" autocomplete="off">
                </div>
                <div class="outside-officer-field">
                  <label for="outsideQualificationName">Qualification Name</label>
                  <input id="outsideQualificationName" type="text" placeholder="Armed Qualification" autocomplete="off">
                </div>
                <label class="outside-officer-verified-check">
                  <input id="outsideQualificationVerified" type="checkbox"> Verified
                </label>
              </div>
              <div class="outside-officer-field" style="margin-top:10px;">
                <label for="outsideQualificationNotes">Qualification Notes</label>
                <input id="outsideQualificationNotes" type="text" placeholder="Optional qualification notes" autocomplete="off">
              </div>
              <div style="margin-top:10px;">
                <button id="outsideQualificationSave" class="personnel-editor-secondary" type="button">
                  Add / Update Qualification
                </button>
              </div>
            </section>

            <div id="outsideOfficerEditorMessage" class="outside-officer-message"></div>
          </div>

          <footer class="outside-officer-footer">
            <button id="outsideOfficerActiveToggle" class="personnel-editor-danger" type="button" hidden>
              Mark Inactive
            </button>
            <div class="outside-officer-footer-right">
              <button id="outsideOfficerEditorCancel" class="personnel-editor-secondary" type="button">Cancel</button>
              <button id="outsideOfficerEditorSave" class="personnel-editor-primary" type="button">Save Outside Officer</button>
            </div>
          </footer>
        </section>
      </div>
    `
  );

  const outsideOverlay = document.getElementById("outsideOfficerEditorOverlay");
  const outsideTitle = document.getElementById("outsideOfficerEditorTitle");
  const outsideSubtitle = document.getElementById("outsideOfficerEditorSubtitle");
  const outsideMessage = document.getElementById("outsideOfficerEditorMessage");
  const outsideSaveButton = document.getElementById("outsideOfficerEditorSave");
  const outsideActiveToggle = document.getElementById("outsideOfficerActiveToggle");
  const outsideQualificationsSection = document.getElementById("outsideOfficerQualificationsSection");
  const outsideQualificationList = document.getElementById("outsideOfficerQualificationList");
  const outsideArmed = document.getElementById("outsideOfficerArmed");
  const outsidePhoto = document.getElementById("outsideOfficerPhoto");
  const outsidePhotoInput = document.getElementById("outsideOfficerPhotoInput");
  const outsideRemovePhotoButton = document.getElementById("outsideOfficerRemovePhoto");

  const outsideFields = {
    firstName: document.getElementById("outsideOfficerFirstName"),
    middleInitial: document.getElementById("outsideOfficerMiddleInitial"),
    lastName: document.getElementById("outsideOfficerLastName"),
    nickname: document.getElementById("outsideOfficerNickname"),
    phone: document.getElementById("outsideOfficerPhone"),
    email: document.getElementById("outsideOfficerEmail"),
    employeeNumber: document.getElementById("outsideOfficerEmployeeNumber"),
    rank: document.getElementById("outsideOfficerRank"),
    homeCampus: document.getElementById("outsideOfficerHomeCampus"),
    birthDate: document.getElementById("outsideOfficerBirthDate"),
    hireDate: document.getElementById("outsideOfficerHireDate"),
    notes: document.getElementById("outsideOfficerNotes")
  };

  const outsideQualificationFields = {
    code: document.getElementById("outsideQualificationCode"),
    name: document.getElementById("outsideQualificationName"),
    verified: document.getElementById("outsideQualificationVerified"),
    notes: document.getElementById("outsideQualificationNotes")
  };

  const outsideQualificationSave = document.getElementById("outsideQualificationSave");
  let currentOutsideOfficer = null;
  let currentOutsideQualifications = [];
  let outsideArmedInitial = false;
  let selectedOutsidePhotoFile = null;

  const outsideArmedCache = new Map();
  const outsideOfficerRecordCache = new Map();
  const outsidePhotoUrlCache = new Map();
  let outsideOfficerDirectoryLoadPromise = null;

  function outsideNullable(value) {
    const clean = String(value || "").trim();
    return clean || null;
  }

  function setOutsideMessage(text, type = "info") {
    outsideMessage.textContent = text || "";
    outsideMessage.className = "outside-officer-message " + type;
  }

  function clearOutsideMessage() {
    outsideMessage.textContent = "";
    outsideMessage.className = "outside-officer-message";
  }

  function outsideInitials(person) {
    const first = String(person?.first_name || "").trim();
    const last = String(person?.last_name || "").trim();
    if (first || last) {
      return ((first[0] || "") + (last[0] || "")).toUpperCase();
    }
    const display = String(person?.display_name || "").trim();
    const parts = display.split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  async function outsideSignedPhotoURL(path) {
    if (!path) return null;
    if (outsidePhotoUrlCache.has(path)) {
      return outsidePhotoUrlCache.get(path);
    }

    const { data, error } = await db
      .storage
      .from("officer-profile-photos")
      .createSignedUrl(path, 3600);

    if (error) {
      console.warn("Unable to create outside officer photo URL:", error);
      return null;
    }

    const url = data?.signedUrl || null;
    if (url) outsidePhotoUrlCache.set(path, url);
    return url;
  }

  async function renderOutsideEditorPhoto(person = null) {
    if (!outsidePhoto) return;

    outsidePhoto.innerHTML = "";
    outsidePhoto.textContent = outsideInitials(person || {});
    outsideRemovePhotoButton.hidden = !(
      selectedOutsidePhotoFile || person?.profile_photo_path
    );

    if (selectedOutsidePhotoFile) {
      const reader = new FileReader();
      reader.onload = () => {
        outsidePhoto.innerHTML = "";
        const img = document.createElement("img");
        img.src = reader.result;
        img.alt = "Selected outside officer photo";
        outsidePhoto.appendChild(img);
      };
      reader.readAsDataURL(selectedOutsidePhotoFile);
      return;
    }

    if (!person?.profile_photo_path) return;

    const url = await outsideSignedPhotoURL(person.profile_photo_path);
    if (!url) return;

    outsidePhoto.innerHTML = "";
    const img = document.createElement("img");
    img.src = url;
    img.alt = (person.display_name || "Outside officer") + " profile photo";
    img.addEventListener("error", () => {
      outsidePhoto.innerHTML = "";
      outsidePhoto.textContent = outsideInitials(person);
    });
    outsidePhoto.appendChild(img);
  }

  async function loadOutsideOfficerRecordCache(force = false) {
    if (!force && outsideOfficerRecordCache.size) return;
    if (outsideOfficerDirectoryLoadPromise) {
      await outsideOfficerDirectoryLoadPromise;
      return;
    }

    outsideOfficerDirectoryLoadPromise = (async () => {
      const { data, error } = await db.rpc(
        "get_outside_officer_directory",
        { p_include_inactive: true }
      );
      if (error) throw error;
      outsideOfficerRecordCache.clear();
      (data || []).forEach(person => {
        outsideOfficerRecordCache.set(
          String(person.outside_officer_id),
          person
        );
      });
    })();

    try {
      await outsideOfficerDirectoryLoadPromise;
    }
    finally {
      outsideOfficerDirectoryLoadPromise = null;
    }
  }

  async function getOutsideOfficerRecordCached(outsideOfficerId) {
    const key = String(outsideOfficerId || "");
    if (!key) return null;
    await loadOutsideOfficerRecordCache(false);
    return outsideOfficerRecordCache.get(key) || null;
  }

  async function uploadOutsideOfficerPhoto(outsideOfficerId) {
    if (!selectedOutsidePhotoFile || !outsideOfficerId) return null;

    const extensions = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };
    const extension = extensions[selectedOutsidePhotoFile.type];
    if (!extension) {
      throw new Error("Photo must be JPG, PNG or WebP.");
    }

    const newPath =
      "outside-officers/" +
      outsideOfficerId +
      "/profile-" +
      Date.now() +
      "." +
      extension;

    const oldPath = currentOutsideOfficer?.profile_photo_path || null;

    const { error: uploadError } = await db
      .storage
      .from("officer-profile-photos")
      .upload(newPath, selectedOutsidePhotoFile, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { error: savePathError } = await db.rpc(
      "set_outside_officer_profile_photo",
      {
        p_outside_officer_id: outsideOfficerId,
        p_profile_photo_path: newPath
      }
    );

    if (savePathError) {
      await db
        .storage
        .from("officer-profile-photos")
        .remove([newPath]);
      throw savePathError;
    }

    if (oldPath && oldPath !== newPath) {
      const { error: removeOldError } = await db
        .storage
        .from("officer-profile-photos")
        .remove([oldPath]);
      if (removeOldError) {
        console.warn("Old outside officer photo could not be removed:", removeOldError);
      }
      outsidePhotoUrlCache.delete(oldPath);
    }

    selectedOutsidePhotoFile = null;
    outsidePhotoInput.value = "";
    outsideOfficerRecordCache.clear();
    return newPath;
  }

  function resetOutsideForm() {
    Object.values(outsideFields).forEach(field => {
      if (field.tagName === "SELECT") field.value = "officer";
      else field.value = "";
    });
    outsideQualificationFields.code.value = "";
    outsideQualificationFields.name.value = "";
    outsideQualificationFields.verified.checked = false;
    outsideQualificationFields.notes.value = "";
    outsideArmed.checked = false;
    outsideArmedInitial = false;
    selectedOutsidePhotoFile = null;
    outsidePhotoInput.value = "";
    outsidePhoto.innerHTML = "";
    outsidePhoto.textContent = "?";
    outsideRemovePhotoButton.hidden = true;
    currentOutsideOfficer = null;
    currentOutsideQualifications = [];
    outsideQualificationsSection.hidden = true;
    outsideActiveToggle.hidden = true;
    outsideQualificationList.innerHTML = "";
    clearOutsideMessage();
  }

  outsidePhotoInput.addEventListener("change", async event => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      selectedOutsidePhotoFile = null;
      await renderOutsideEditorPhoto(currentOutsideOfficer);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      outsidePhotoInput.value = "";
      selectedOutsidePhotoFile = null;
      setOutsideMessage("Photo must be JPG, PNG or WebP.", "error");
      await renderOutsideEditorPhoto(currentOutsideOfficer);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      outsidePhotoInput.value = "";
      selectedOutsidePhotoFile = null;
      setOutsideMessage("Photo must be 5 MB or smaller.", "error");
      await renderOutsideEditorPhoto(currentOutsideOfficer);
      return;
    }

    selectedOutsidePhotoFile = file;
    clearOutsideMessage();
    await renderOutsideEditorPhoto(currentOutsideOfficer);
  });

  outsideRemovePhotoButton.addEventListener("click", async () => {
    clearOutsideMessage();

    if (selectedOutsidePhotoFile) {
      selectedOutsidePhotoFile = null;
      outsidePhotoInput.value = "";
      await renderOutsideEditorPhoto(currentOutsideOfficer);
      setOutsideMessage("Selected photo cleared.", "info");
      return;
    }

    if (!currentOutsideOfficer?.profile_photo_path) return;

    const confirmed = window.confirm(
      "Remove this outside officer's profile photo?"
    );
    if (!confirmed) return;

    const oldPath = currentOutsideOfficer.profile_photo_path;
    const { error } = await db.rpc(
      "set_outside_officer_profile_photo",
      {
        p_outside_officer_id: currentOutsideOfficer.outside_officer_id,
        p_profile_photo_path: null
      }
    );

    if (error) {
      setOutsideMessage(error.message, "error");
      return;
    }

    const { error: storageError } = await db
      .storage
      .from("officer-profile-photos")
      .remove([oldPath]);

    if (storageError) {
      console.warn(
        "Outside officer photo pointer was cleared, but file removal failed:",
        storageError
      );
    }

    currentOutsideOfficer.profile_photo_path = null;
    outsidePhotoUrlCache.delete(oldPath);
    outsideOfficerRecordCache.clear();
    await renderOutsideEditorPhoto(currentOutsideOfficer);
    await refreshOutsideDirectory();
    scheduleOutsideOfficerCardScan();
    setOutsideMessage("Outside officer photo removed.", "success");
  });

  async function getOutsideOfficerById(outsideOfficerId) {
    await loadOutsideOfficerRecordCache(true);
    return outsideOfficerRecordCache.get(
      String(outsideOfficerId)
    ) || null;
  }

  async function loadOutsideQualifications(outsideOfficerId) {
    const { data, error } = await db.rpc(
      "get_outside_officer_qualifications",
      { p_outside_officer_id: outsideOfficerId }
    );
    if (error) throw error;
    currentOutsideQualifications = data || [];

    const armedQualification =
      currentOutsideQualifications.find(item =>
        String(item.qualification_code || "").trim().toUpperCase() === "ARMED" &&
        item.status === "active" &&
        item.verification_status === "verified"
      );

    outsideArmedInitial = Boolean(armedQualification);
    outsideArmed.checked = outsideArmedInitial;

    outsideArmedCache.set(
      String(outsideOfficerId),
      outsideArmedInitial
    );

    renderOutsideQualifications();
    scheduleOutsideOfficerCardScan();
  }

  function renderOutsideQualifications() {
    if (!currentOutsideQualifications.length) {
      outsideQualificationList.innerHTML = '<div class="subtle">No qualifications recorded.</div>';
      return;
    }
    outsideQualificationList.innerHTML = "";
    currentOutsideQualifications.forEach(item => {
      const row = document.createElement("div");
      row.className = "outside-officer-qualification-row";
      const text = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = item.qualification_name || item.qualification_code || "Qualification";
      const verified = document.createElement("span");
      const isVerified = item.verification_status === "verified";
      verified.className = "outside-officer-chip " + (isVerified ? "verified" : "unverified");
      verified.textContent = isVerified ? "VERIFIED" : "UNVERIFIED";
      title.appendChild(verified);
      const meta = document.createElement("div");
      meta.className = "outside-officer-qualification-meta";
      meta.textContent = `${item.qualification_code || "—"} • ${item.status || "—"}`;
      text.append(title, meta);
      row.appendChild(text);
      if (item.status === "active") {
        const revoke = document.createElement("button");
        revoke.type = "button";
        revoke.className = "personnel-editor-danger";
        revoke.textContent = "Revoke";
        revoke.addEventListener("click", async () => {
          if (!currentOutsideOfficer) return;
          const confirmed = window.confirm(`Revoke ${item.qualification_name || item.qualification_code}?`);
          if (!confirmed) return;
          const { error } = await db.rpc(
            "revoke_outside_officer_qualification",
            {
              p_outside_officer_id: currentOutsideOfficer.outside_officer_id,
              p_qualification_code: item.qualification_code,
              p_notes: "Revoked through Personnel Administration"
            }
          );
          if (error) {
            setOutsideMessage(error.message, "error");
            return;
          }
          await loadOutsideQualifications(currentOutsideOfficer.outside_officer_id);

          if (
            String(
              item.qualification_code || ""
            )
              .trim()
              .toUpperCase() ===
              "ARMED"
          ) {
            outsideArmedCache.delete(
              String(
                currentOutsideOfficer.outside_officer_id
              )
            );
            await refreshOutsideDirectory();
            scheduleOutsideOfficerCardScan();
          }

          setOutsideMessage("Qualification revoked.", "success");
        });
        row.appendChild(revoke);
      }
      outsideQualificationList.appendChild(row);
    });
  }

  async function syncOutsideArmedQualification(
    outsideOfficerId,
    desiredArmed,
    initialArmed
  ) {
    if (!outsideOfficerId || desiredArmed === initialArmed) {
      return;
    }

    if (desiredArmed) {
      const { error } = await db.rpc(
        "set_outside_officer_qualification",
        {
          p_outside_officer_id: outsideOfficerId,
          p_qualification_code: "ARMED",
          p_qualification_name: "Armed Qualification",
          p_verified: true,
          p_notes: "Updated through Personnel Administration"
        }
      );

      if (error) throw error;
    }
    else {
      const { error } = await db.rpc(
        "revoke_outside_officer_qualification",
        {
          p_outside_officer_id: outsideOfficerId,
          p_qualification_code: "ARMED",
          p_notes: "Armed qualification removed through Personnel Administration"
        }
      );

      if (error) throw error;
    }

    outsideArmedCache.delete(String(outsideOfficerId));
  }

  async function resolveCreatedOutsideOfficerId(
    response,
    payload
  ) {
    const result = response?.data;

    const directId =
      result?.outside_officer_id ||
      result?.id ||
      result?.officer_id ||
      null;

    if (directId) {
      return directId;
    }

    const { data, error } = await db.rpc(
      "get_outside_officer_directory",
      {
        p_include_inactive: true
      }
    );

    if (error) {
      throw error;
    }

    const normalizedEmail =
      String(payload.p_email || "")
        .trim()
        .toLowerCase();

    const normalizedEmployee =
      String(payload.p_employee_number || "")
        .trim()
        .toLowerCase();

    const matches =
      (data || []).filter(person => {
        const emailMatch =
          normalizedEmail &&
          String(person.email || "")
            .trim()
            .toLowerCase() ===
            normalizedEmail;

        const employeeMatch =
          normalizedEmployee &&
          String(person.employee_number || "")
            .trim()
            .toLowerCase() ===
            normalizedEmployee;

        return emailMatch || employeeMatch;
      });

    if (matches.length === 1) {
      return matches[0].outside_officer_id;
    }

    return null;
  }

  function outsideArmedShieldMarkup() {
    return `
      <span
        class="st-outside-armed-shield"
        title="Armed Qualified"
        aria-label="Armed Qualified"
      >
        <svg
          viewBox="0 0 24 28"
          aria-hidden="true"
        >
          <path
            d="
              M12 1
              L22 5
              V12
              C22 19
              17.5 24.5
              12 27
              C6.5 24.5
              2 19
              2 12
              V5
              Z
            "
          ></path>
        </svg>
      </span>
    `;
  }

  async function getOutsideArmedStatus(
    outsideOfficerId,
    force = false
  ) {
    const key = String(outsideOfficerId);

    if (
      !force &&
      outsideArmedCache.has(key)
    ) {
      return outsideArmedCache.get(key);
    }

    const { data, error } = await db.rpc(
      "get_outside_officer_qualifications",
      {
        p_outside_officer_id:
          outsideOfficerId
      }
    );

    if (error) {
      console.warn(
        "Unable to load outside officer armed status:",
        error
      );
      return false;
    }

    const isArmed =
      (data || []).some(item =>
        String(
          item.qualification_code || ""
        )
          .trim()
          .toUpperCase() ===
          "ARMED" &&
        item.status === "active" &&
        item.verification_status === "verified"
      );

    outsideArmedCache.set(
      key,
      isArmed
    );

    return isArmed;
  }

  async function decorateOutsideOfficerCard(
    card,
    outsideOfficerId
  ) {
    if (
      !card ||
      !outsideOfficerId
    ) {
      return;
    }

    const key =
      String(
        outsideOfficerId
      );

    if (
      card.dataset
        .securetrackOutsideArmedDecorating ===
        key
    ) {
      return;
    }

    card.dataset
      .securetrackOutsideArmedDecorating =
        key;

    try {
      const [isArmed, officerRecord] =
        await Promise.all([
          getOutsideArmedStatus(
            outsideOfficerId
          ),
          getOutsideOfficerRecordCached(
            outsideOfficerId
          )
        ]);

      const avatar =
        card.querySelector(
          ".avatar"
        );

      if (avatar && officerRecord) {
        const photoPath =
          officerRecord.profile_photo_path ||
          null;

        if (photoPath) {
          const photoUrl =
            await outsideSignedPhotoURL(
              photoPath
            );

          if (photoUrl) {
            avatar.innerHTML = "";
            const image = document.createElement("img");
            image.src = photoUrl;
            image.alt =
              (officerRecord.display_name || "Outside officer") +
              " profile photo";
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.objectFit = "cover";
            image.style.objectPosition = "center";
            image.addEventListener("error", () => {
              avatar.innerHTML = "";
              avatar.textContent = outsideInitials(officerRecord);
            });
            avatar.appendChild(image);
          }
        }
        else {
          avatar.innerHTML = "";
          avatar.textContent = outsideInitials(officerRecord);
        }
      }

      card
        .querySelectorAll(
          ".st-outside-armed-shield"
        )
        .forEach(
          element =>
            element.remove()
        );

      const rankLine =
        card.querySelector(
          ".person-rank"
        );

      if (!rankLine) {
        return;
      }

      rankLine.classList.remove(
        "st-outside-rank-with-shield"
      );

      if (isArmed) {
        rankLine.classList.add(
          "st-outside-rank-with-shield"
        );

        rankLine.insertAdjacentHTML(
          "afterbegin",
          outsideArmedShieldMarkup()
        );
      }

      card.dataset
        .securetrackOutsideArmedDecorated =
          key;
    }
    finally {
      delete card.dataset
        .securetrackOutsideArmedDecorating;
    }
  }

  function scanOutsideOfficerCards() {
    document
      .querySelectorAll(
        'button[data-outside-action="edit"][data-id]'
      )
      .forEach(button => {
        const card =
          button.closest(
            ".person-card"
          );

        const outsideOfficerId =
          button.dataset.id;

        decorateOutsideOfficerCard(
          card,
          outsideOfficerId
        );
      });
  }

  let outsideOfficerCardScanTimer =
    null;

  function scheduleOutsideOfficerCardScan() {
    clearTimeout(
      outsideOfficerCardScanTimer
    );

    outsideOfficerCardScanTimer =
      setTimeout(
        scanOutsideOfficerCards,
        80
      );
  }

  const outsideOfficerGrid =
    document.getElementById(
      "outsideOfficerGrid"
    );

  if (outsideOfficerGrid) {
    new MutationObserver(
      scheduleOutsideOfficerCardScan
    ).observe(
      outsideOfficerGrid,
      {
        childList: true,
        subtree: true
      }
    );
  }

  scheduleOutsideOfficerCardScan();


  function populateOutsideForm(person) {
    outsideFields.firstName.value = person.first_name || "";
    outsideFields.middleInitial.value = person.middle_initial || "";
    outsideFields.lastName.value = person.last_name || "";
    outsideFields.nickname.value = person.nickname || "";
    outsideFields.phone.value = person.phone_number || "";
    outsideFields.email.value = person.email || "";
    outsideFields.employeeNumber.value = person.employee_number || "";
    outsideFields.rank.value = person.rank || "officer";
    outsideFields.homeCampus.value = person.home_campus || "";
    outsideFields.birthDate.value = person.birth_date || "";
    outsideFields.hireDate.value = person.hire_date || "";
    outsideFields.notes.value = person.notes || "";
    renderOutsideEditorPhoto(person);
  }

  async function openOutsideAdd() {
    resetOutsideForm();
    outsideTitle.textContent = "Add Outside Officer";
    outsideSubtitle.textContent = "Create a reusable outside-officer record for overtime assignments.";
    outsideSaveButton.textContent = "Add Outside Officer";
    outsideOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    renderOutsideEditorPhoto(null);
    setTimeout(() => outsideFields.firstName.focus(), 50);
  }

  async function openOutsideEdit(outsideOfficerId) {
    resetOutsideForm();
    outsideTitle.textContent = "Edit Outside Officer";
    outsideSubtitle.textContent = "Loading outside officer record...";
    outsideSaveButton.textContent = "Save Outside Officer";
    outsideSaveButton.disabled = true;
    outsideOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    try {
      const person = await getOutsideOfficerById(outsideOfficerId);
      if (!person) throw new Error("Outside officer record was not found.");
      currentOutsideOfficer = person;
      populateOutsideForm(person);
      outsideSubtitle.textContent = person.display_name || "Outside Officer";
      outsideQualificationsSection.hidden = false;
      outsideActiveToggle.hidden = false;
      outsideActiveToggle.textContent = person.is_active === false ? "Reactivate Officer" : "Mark Inactive";
      await loadOutsideQualifications(person.outside_officer_id);
    }
    catch (error) {
      console.error("Outside officer editor load failed:", error);
      setOutsideMessage(error.message || "Outside officer record could not be loaded.", "error");
    }
    finally {
      outsideSaveButton.disabled = false;
    }
  }

  function closeOutsideEditor() {
    outsideOverlay.hidden = true;
    document.body.style.overflow = "";
    resetOutsideForm();
  }

  function validateOutsideForm() {
    if (!outsideFields.firstName.value.trim()) {
      setOutsideMessage("First name is required.", "error");
      outsideFields.firstName.focus();
      return false;
    }
    if (!outsideFields.lastName.value.trim()) {
      setOutsideMessage("Last name is required.", "error");
      outsideFields.lastName.focus();
      return false;
    }
    if (outsideFields.middleInitial.value.trim() && !/^[A-Za-z]$/.test(outsideFields.middleInitial.value.trim())) {
      setOutsideMessage("Middle initial must contain one letter.", "error");
      outsideFields.middleInitial.focus();
      return false;
    }
    if (!outsideFields.phone.value.trim()) {
      setOutsideMessage("Telephone number is required.", "error");
      outsideFields.phone.focus();
      return false;
    }
    if (!outsideFields.email.value.trim()) {
      setOutsideMessage("Email address is required.", "error");
      outsideFields.email.focus();
      return false;
    }
    if (!outsideFields.homeCampus.value.trim()) {
      setOutsideMessage("Home campus is required for overtime assignments.", "error");
      outsideFields.homeCampus.focus();
      return false;
    }
    return true;
  }

  function outsideRpcPayload() {
    return {
      p_first_name: outsideFields.firstName.value.trim(),
      p_middle_initial: outsideNullable(outsideFields.middleInitial.value),
      p_last_name: outsideFields.lastName.value.trim(),
      p_nickname: outsideNullable(outsideFields.nickname.value),
      p_phone_number: outsideFields.phone.value.trim(),
      p_email: outsideFields.email.value.trim(),
      p_rank: outsideFields.rank.value,
      p_home_campus: outsideNullable(outsideFields.homeCampus.value),
      p_employee_number: outsideNullable(outsideFields.employeeNumber.value),
      p_birth_date: outsideFields.birthDate.value || null,
      p_hire_date: outsideFields.hireDate.value || null,
      p_notes: outsideNullable(outsideFields.notes.value)
    };
  }

  async function refreshOutsideDirectory() {
    const refresh = document.getElementById("refreshOutsideButton");
    if (refresh) refresh.click();
  }

  outsideSaveButton.addEventListener("click", async () => {
    clearOutsideMessage();
    if (!validateOutsideForm()) return;
    outsideSaveButton.disabled = true;
    const oldText = outsideSaveButton.textContent;
    outsideSaveButton.textContent = "Saving...";
    try {
      const payload = outsideRpcPayload();
      let response;
      const editingExisting = Boolean(currentOutsideOfficer);
      let outsideOfficerId =
        currentOutsideOfficer?.outside_officer_id ||
        null;

      if (editingExisting) {
        response = await db.rpc(
          "update_outside_officer",
          {
            p_outside_officer_id: outsideOfficerId,
            ...payload
          }
        );
      }
      else {
        response = await db.rpc(
          "create_outside_officer",
          payload
        );
      }

      if (response.error) {
        throw response.error;
      }

      if (!outsideOfficerId) {
        outsideOfficerId =
          await resolveCreatedOutsideOfficerId(
            response,
            payload
          );
      }

      if (selectedOutsidePhotoFile) {
        if (!outsideOfficerId) {
          throw new Error(
            "Outside officer was saved, but the new directory ID could not be resolved for the photo upload. Reopen the officer and upload the photo."
          );
        }

        const savedPhotoPath =
          await uploadOutsideOfficerPhoto(
            outsideOfficerId
          );

        if (currentOutsideOfficer && savedPhotoPath) {
          currentOutsideOfficer.profile_photo_path =
            savedPhotoPath;
        }
      }

      if (
        outsideArmed.checked &&
        !outsideOfficerId
      ) {
        setOutsideMessage(
          "Outside officer was saved, but the Armed Qualified setting could not be applied automatically. Reopen the officer and check Armed Qualified.",
          "info"
        );
      }
      else if (outsideOfficerId) {
        await syncOutsideArmedQualification(
          outsideOfficerId,
          outsideArmed.checked,
          editingExisting
            ? outsideArmedInitial
            : false
        );

        outsideArmedInitial =
          outsideArmed.checked;
      }

      outsideArmedCache.delete(
        String(
          outsideOfficerId || ""
        )
      );
      outsideOfficerRecordCache.clear();

      await refreshOutsideDirectory();
      scheduleOutsideOfficerCardScan();

      if (
        outsideArmed.checked &&
        !outsideOfficerId
      ) {
        return;
      }

      setOutsideMessage(
        editingExisting
          ? "Outside officer updated successfully."
          : "Outside officer added successfully.",
        "success"
      );

      setTimeout(
        closeOutsideEditor,
        650
      );
    }
    catch (error) {
      console.error("Outside officer save failed:", error);
      setOutsideMessage(error.message || "Outside officer could not be saved.", "error");
    }
    finally {
      outsideSaveButton.disabled = false;
      outsideSaveButton.textContent = oldText;
    }
  });

  outsideQualificationSave.addEventListener("click", async () => {
    if (!currentOutsideOfficer) return;
    clearOutsideMessage();
    const code = outsideQualificationFields.code.value.trim().toUpperCase();
    const name = outsideQualificationFields.name.value.trim();
    if (!code || !name) {
      setOutsideMessage("Qualification code and name are required.", "error");
      return;
    }
    outsideQualificationSave.disabled = true;
    outsideQualificationSave.textContent = "Saving...";
    try {
      const { error } = await db.rpc(
        "set_outside_officer_qualification",
        {
          p_outside_officer_id: currentOutsideOfficer.outside_officer_id,
          p_qualification_code: code,
          p_qualification_name: name,
          p_verified: outsideQualificationFields.verified.checked,
          p_notes: outsideNullable(outsideQualificationFields.notes.value)
        }
      );
      if (error) throw error;
      outsideQualificationFields.code.value = "";
      outsideQualificationFields.name.value = "";
      outsideQualificationFields.verified.checked = false;
      outsideQualificationFields.notes.value = "";
      await loadOutsideQualifications(currentOutsideOfficer.outside_officer_id);

      if (code === "ARMED") {
        outsideArmedCache.delete(
          String(
            currentOutsideOfficer.outside_officer_id
          )
        );
      }

      await refreshOutsideDirectory();
      scheduleOutsideOfficerCardScan();
      setOutsideMessage("Qualification saved.", "success");
    }
    catch (error) {
      console.error("Outside officer qualification save failed:", error);
      setOutsideMessage(error.message || "Qualification could not be saved.", "error");
    }
    finally {
      outsideQualificationSave.disabled = false;
      outsideQualificationSave.textContent = "Add / Update Qualification";
    }
  });

  outsideActiveToggle.addEventListener("click", async () => {
    if (!currentOutsideOfficer) return;
    const nextActive = currentOutsideOfficer.is_active === false;
    const confirmed = window.confirm(
      nextActive ? "Reactivate this outside officer?" : "Mark this outside officer inactive? Existing history will be preserved."
    );
    if (!confirmed) return;
    const { error } = await db.rpc(
      "set_outside_officer_active",
      {
        p_outside_officer_id: currentOutsideOfficer.outside_officer_id,
        p_is_active: nextActive,
        p_reason: nextActive ? "Reactivated through Personnel Administration" : "Marked inactive through Personnel Administration"
      }
    );
    if (error) {
      setOutsideMessage(error.message, "error");
      return;
    }
    currentOutsideOfficer.is_active = nextActive;
    await refreshOutsideDirectory();
    setOutsideMessage(nextActive ? "Outside officer reactivated." : "Outside officer marked inactive.", "success");
    setTimeout(closeOutsideEditor, 650);
  });

  function outsideHistorySummary(outsideOfficerId) {
    getOutsideOfficerById(outsideOfficerId)
      .then(person => {
        if (!person) throw new Error("Outside officer record was not found.");
        const completed = Number(person.completed_overtime_count || 0);
        const last = person.last_overtime_worked_at
          ? new Date(person.last_overtime_worked_at).toLocaleString()
          : "No completed overtime recorded";
        window.alert(
          `${person.display_name}\n\nCompleted overtime assignments: ${completed}\nLast overtime worked: ${last}`
        );
      })
      .catch(error => {
        window.alert(error.message || "Unable to load overtime history summary.");
      });
  }

  document.getElementById("outsideOfficerEditorClose").addEventListener("click", closeOutsideEditor);
  document.getElementById("outsideOfficerEditorCancel").addEventListener("click", closeOutsideEditor);

  outsideOverlay.addEventListener("click", event => {
    if (event.target === outsideOverlay) closeOutsideEditor();
  });

  document.addEventListener(
    "click",
    event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.id === "addOutsideButton") {
        event.preventDefault();
        event.stopImmediatePropagation();
        openOutsideAdd();
        return;
      }
      const outsideAction = button.dataset.outsideAction;
      if (!outsideAction) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const outsideOfficerId = button.dataset.id;
      if (!outsideOfficerId) return;
      if (outsideAction === "edit") {
        openOutsideEdit(outsideOfficerId);
        return;
      }
      if (outsideAction === "qualifications") {
        openOutsideEdit(outsideOfficerId).then(() => {
          setTimeout(
            () => outsideQualificationsSection.scrollIntoView({ behavior:"smooth", block:"start" }),
            80
          );
        });
        return;
      }
      if (outsideAction === "history") outsideHistorySummary(outsideOfficerId);
    },
    true
  );

  window.SecureTrackOutsideOfficerEditor = {
    add: openOutsideAdd,
    edit: openOutsideEdit,
    qualifications: openOutsideEdit,
    history: outsideHistorySummary,
    refresh: refreshOutsideDirectory
  };

})();
