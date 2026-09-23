(function () {

  "use strict";

  const STM =
    window.SecureTrackManager;

  if (!STM) {

    console.error(
      "SecureTrackManager is required for Personnel Onboarding."
    );

    return;

  }

  const db =
    STM.db;

  let selectedPhotoFile =
    null;


  // ========================================================
  // STYLES
  // ========================================================

  const style =
    document.createElement(
      "style"
    );

  style.textContent = `

    .onboarding-overlay {
      position: fixed;
      inset: 0;
      z-index: 10000;

      display: flex;
      align-items: flex-start;
      justify-content: center;

      padding: 32px 16px;

      overflow-y: auto;

      background:
        rgba(0,0,0,.80);

      backdrop-filter:
        blur(4px);
    }

    .onboarding-modal {
      width: min(900px, 100%);

      border:
        1px solid #3b4249;

      border-radius:
        18px;

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

    .onboarding-head {
      display: flex;
      justify-content: space-between;
      gap: 18px;

      padding: 22px 24px;

      border-bottom:
        1px solid #2d333a;
    }

    .onboarding-head h2 {
      margin:
        4px 0 0;
    }

    .onboarding-close {
      width: 38px;
      height: 38px;

      border:
        1px solid #3b4249;

      border-radius:
        10px;

      background:
        #11151a;

      color:
        #fff;

      font-size:
        20px;

      cursor:
        pointer;
    }

    .onboarding-body {
      padding: 24px;
    }

    .onboarding-grid {
      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 16px;
    }

    .onboarding-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .onboarding-field.full {
      grid-column:
        1 / -1;
    }

    .onboarding-field label {
      color:
        #b8bec5;

      font-size:
        12px;

      font-weight:
        800;
    }

    .onboarding-field input,
    .onboarding-field select {

      width: 100%;

      box-sizing: border-box;

      padding:
        11px 12px;

      border:
        1px solid #383f46;

      border-radius:
        10px;

      background:
        #080b0e;

      color:
        #f4f6f7;

      font: inherit;
    }

    .onboarding-field input:focus,
    .onboarding-field select:focus {

      outline:
        2px solid
        rgba(255,120,0,.25);

      border-color:
        #ff7800;
    }

    .onboarding-check {
      display: flex;
      align-items: center;
      gap: 10px;

      min-height: 45px;

      padding:
        10px 12px;

      border:
        1px solid #343a41;

      border-radius:
        10px;

      background:
        #0a0d10;
    }

    .onboarding-check input {
      width: 18px;
      height: 18px;
    }

    .onboarding-section {
      margin-bottom: 24px;
    }

    .onboarding-section + .onboarding-section {
      padding-top: 22px;

      border-top:
        1px solid #292f35;
    }

    .onboarding-note {
      margin-bottom: 18px;

      padding: 12px 14px;

      border:
        1px solid
        rgba(255,120,0,.35);

      border-radius:
        11px;

      background:
        rgba(255,120,0,.07);

      color:
        #c7cdd3;

      font-size:
        13px;
    }

    .onboarding-note strong {
      color:
        #ff982f;
    }

    .onboarding-photo-preview {
      width: 80px;
      height: 80px;

      margin-top: 10px;

      display: flex;
      align-items: center;
      justify-content: center;

      overflow: hidden;

      border:
        1px solid #414850;

      border-radius:
        50%;

      background:
        #11161b;

      color:
        #ff922b;

      font-weight:
        900;

      font-size:
        22px;
    }

    .onboarding-photo-preview img {
      width: 100%;
      height: 100%;

      object-fit: cover;
    }

    .onboarding-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;

      padding:
        18px 24px;

      border-top:
        1px solid #2d333a;
    }

    .onboarding-secondary,
    .onboarding-primary {

      padding:
        10px 15px;

      border-radius:
        10px;

      cursor:
        pointer;

      font-weight:
        850;
    }

    .onboarding-secondary {
      border:
        1px solid #3c434a;

      background:
        #12171c;

      color:
        #fff;
    }

    .onboarding-primary {
      border:
        1px solid #ff7800;

      background:
        #ff7800;

      color:
        #111;
    }

    .onboarding-primary:disabled {
      opacity: .5;
      cursor: wait;
    }

    .onboarding-message {
      display: none;

      margin-top:
        18px;

      padding:
        12px 14px;

      border-radius:
        10px;
    }

    .onboarding-message.error {
      display: block;

      color:
        #ffadad;

      border:
        1px solid
        rgba(224,74,74,.45);

      background:
        rgba(224,74,74,.08);
    }

    .onboarding-message.success {
      display: block;

      color:
        #9adea8;

      border:
        1px solid
        rgba(87,187,109,.40);

      background:
        rgba(87,187,109,.08);
    }

    .onboarding-message.warning {
      display: block;

      color:
        #ffd39e;

      border:
        1px solid
        rgba(255,160,60,.40);

      background:
        rgba(255,160,60,.08);
    }

    @media (max-width: 700px) {

      .onboarding-grid {
        grid-template-columns:
          1fr;
      }

      .onboarding-field.full {
        grid-column:
          auto;
      }

    }

  `;

  document.head.appendChild(
    style
  );


  // ========================================================
  // MODAL
  // ========================================================

  document.body.insertAdjacentHTML(
    "beforeend",
    `

    <div
      id="onboardingOverlay"
      class="onboarding-overlay"
      hidden
    >

      <section
        class="onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboardingTitle"
      >

        <header
          class="onboarding-head"
        >

          <div>

            <div class="eyebrow">
              Personnel Administration
            </div>

            <h2 id="onboardingTitle">
              Add New Officer
            </h2>

            <p
              class="subtle"
              style="margin-bottom:0;"
            >
            Create the officer's personnel profile
and SecureTrack record.
            </p>

          </div>


          <button
            id="onboardingClose"
            class="onboarding-close"
            type="button"
            aria-label="Close"
          >
            ×
          </button>

        </header>


        <div
          class="onboarding-body"
        >


          <div class="onboarding-note">

           <strong>
  Personnel setup:
</strong>

The officer's profile will be saved without
sending an account setup email. When you are
ready, use Account Access to send the officer
their SecureTrack setup invitation.
          </div>


          <!-- ===================================
               IDENTITY
               =================================== -->

          <section
            class="onboarding-section"
          >

            <div class="eyebrow">
              Officer Information
            </div>

            <h3>
              Identity & Contact
            </h3>


            <div
              class="onboarding-grid"
            >


              <div
                class="onboarding-field"
              >

                <label for="newFirstName">
                  First Name *
                </label>

                <input
                  id="newFirstName"
                  type="text"
                  autocomplete="off"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newMiddleInitial">
                  Middle Initial
                </label>

                <input
                  id="newMiddleInitial"
                  type="text"
                  maxlength="1"
                  autocomplete="off"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newLastName">
                  Last Name *
                </label>

                <input
                  id="newLastName"
                  type="text"
                  autocomplete="off"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newNickname">
                  Nickname
                </label>

                <input
                  id="newNickname"
                  type="text"
                  autocomplete="off"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newPhone">
                  Telephone Number *
                </label>

                <input
                  id="newPhone"
                  type="tel"
                  autocomplete="tel"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newEmail">
                  Email Address *
                </label>

                <input
                  id="newEmail"
                  type="email"
                  autocomplete="email"
                >

              </div>


            </div>

          </section>


          <!-- ===================================
               EMPLOYEE IDENTITY
               =================================== -->

          <section
            class="onboarding-section"
          >

            <div class="eyebrow">
              Employee Identification
            </div>

            <h3>
              SecureTrack Credentials
            </h3>


            <div
              class="onboarding-grid"
            >


              <div
                class="onboarding-field"
              >

                <label for="newEmployeeNumber">
                  Employee Number *
                </label>

                <input
                  id="newEmployeeNumber"
                  type="text"
                  autocomplete="off"
                >

              </div>


            </div>

          </section>


          <!-- ===================================
               EMPLOYMENT
               =================================== -->

          <section
            class="onboarding-section"
          >

            <div class="eyebrow">
              Employment
            </div>

            <h3>
              Rank & Assignment
            </h3>


            <div
              class="onboarding-grid"
            >


              <div
                class="onboarding-field"
              >

                <label for="newHireDate">
                  Hire Date *
                </label>

                <input
                  id="newHireDate"
                  type="date"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newBirthDate">
                  Date of Birth
                </label>

                <input
                  id="newBirthDate"
                  type="date"
                >

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newRank">
                  Rank *
                </label>

                <select id="newRank">

                  <option value="officer">
                    Officer
                  </option>

                  <option value="senior_officer">
                    Senior Officer
                  </option>

                  <option value="team_lead">
                    Team Lead
                  </option>

                </select>

              </div>


              <div
                class="onboarding-field"
              >

                <label for="newShift">
                  Normal Shift *
                </label>

                <select id="newShift">

                  <option value="">
                    Select Shift
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

                <small class="subtle">
                  Managers may only onboard
                  personnel into shifts they supervise.
                </small>

              </div>


              <div
                class="onboarding-field full"
              >

                <label>
                  Initial Qualification
                </label>

                <label
                  class="onboarding-check"
                >

                  <input
                    id="newArmed"
                    type="checkbox"
                  >

                  <span>
                    Officer is currently
                    Armed Qualified
                  </span>

                </label>

              </div>


            </div>

          </section>


          <!-- ===================================
               PHOTO
               =================================== -->

          <section
            class="onboarding-section"
          >

            <div class="eyebrow">
              Profile Photo
            </div>

            <h3>
              Optional Officer Photo
            </h3>

            <p class="subtle">
              JPG, PNG or WebP. Maximum 5 MB.
              If no photo is provided, SecureTrack
              will display the officer's initials.
            </p>


            <input
              id="newOfficerPhoto"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            >


            <div
              id="newOfficerPhotoPreview"
              class="onboarding-photo-preview"
            >
              —
            </div>

          </section>


          <div
            id="onboardingMessage"
            class="onboarding-message"
          ></div>


        </div>


        <footer
          class="onboarding-footer"
        >

          <button
            id="onboardingCancel"
            class="onboarding-secondary"
            type="button"
          >
            Cancel
          </button>

          <button
            id="onboardingCreate"
            class="onboarding-primary"
            type="button"
          >
           Save Employee Profile
          </button>

        </footer>

      </section>

    </div>

    `
  );


  // ========================================================
  // DOM
  // ========================================================

  const overlay =
    document.getElementById(
      "onboardingOverlay"
    );

  const addButton =
    document.getElementById(
      "addOfficerButton"
    );

  const firstName =
    document.getElementById(
      "newFirstName"
    );

  const middleInitial =
    document.getElementById(
      "newMiddleInitial"
    );

  const lastName =
    document.getElementById(
      "newLastName"
    );

  const nickname =
    document.getElementById(
      "newNickname"
    );

  const phone =
    document.getElementById(
      "newPhone"
    );

  const email =
    document.getElementById(
      "newEmail"
    );

  const employeeNumber =
    document.getElementById(
      "newEmployeeNumber"
    );

  const hireDate =
    document.getElementById(
      "newHireDate"
    );

  const birthDate =
    document.getElementById(
      "newBirthDate"
    );

  const rank =
    document.getElementById(
      "newRank"
    );

  const shift =
    document.getElementById(
      "newShift"
    );

  const armed =
    document.getElementById(
      "newArmed"
    );

  const photoInput =
    document.getElementById(
      "newOfficerPhoto"
    );

  const photoPreview =
    document.getElementById(
      "newOfficerPhotoPreview"
    );

  const message =
    document.getElementById(
      "onboardingMessage"
    );

  const createButton =
    document.getElementById(
      "onboardingCreate"
    );


  // ========================================================
  // HELPERS
  // ========================================================

  function nullable(value) {

    const clean =
      String(
        value || ""
      ).trim();

    return clean || null;

  }


  function showMessage(
    text,
    type
  ) {

    message.textContent =
      text;

    message.className =
      "onboarding-message " +
      type;

  }


  function clearMessage() {

    message.textContent = "";

    message.className =
      "onboarding-message";

  }


  function resetForm() {

    firstName.value = "";

    middleInitial.value = "";

    lastName.value = "";

    nickname.value = "";

    phone.value = "";

    email.value = "";

    employeeNumber.value = "";

    hireDate.value = "";

    birthDate.value = "";

    rank.value =
      "officer";

    shift.value = "";

    armed.checked =
      false;

    photoInput.value = "";

    selectedPhotoFile =
      null;

    photoPreview.textContent =
      "—";

    clearMessage();

  }


  function closeModal() {

    overlay.hidden =
      true;

    document.body.style.overflow =
      "";

    resetForm();

  }


  function openModal() {

    resetForm();

    overlay.hidden =
      false;

    document.body.style.overflow =
      "hidden";

    firstName.focus();

  }


  async function readFunctionError(
    error
  ) {

    if (!error) {
      return "Officer onboarding failed.";
    }


    try {

      if (
        error.context &&
        typeof error.context.json ===
          "function"
      ) {

        const body =
          await error.context.json();

        return (
          body?.error ||
          body?.message ||
          error.message
        );

      }

    }
    catch (parseError) {

      console.warn(
        "Unable to read Edge Function error body:",
        parseError
      );

    }


    return (
      error.message ||
      "Officer onboarding failed."
    );

  }


  // ========================================================
  // PHOTO PREVIEW
  // ========================================================

  photoInput.addEventListener(
    "change",
    event => {

      clearMessage();

      const file =
        event.target.files?.[0];


      if (!file) {

        selectedPhotoFile =
          null;

        photoPreview.textContent =
          "—";

        return;

      }


      const allowedTypes =
        [
          "image/jpeg",
          "image/png",
          "image/webp"
        ];


      if (
        !allowedTypes.includes(
          file.type
        )
      ) {

        selectedPhotoFile =
          null;

        photoInput.value =
          "";

        showMessage(
          "Photo must be JPG, PNG or WebP.",
          "error"
        );

        return;

      }


      if (
        file.size >
        5 * 1024 * 1024
      ) {

        selectedPhotoFile =
          null;

        photoInput.value =
          "";

        showMessage(
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

          photoPreview.innerHTML =
            "";

          const img =
            document.createElement(
              "img"
            );

          img.src =
            reader.result;

          img.alt =
            "New officer photo";

          photoPreview.appendChild(
            img
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );


  // ========================================================
  // OPTIONAL PHOTO UPLOAD AFTER OFFICER CREATION
  // ========================================================

  async function uploadPhoto(
    userId
  ) {

    if (
      !selectedPhotoFile ||
      !userId
    ) {
      return {
        ok: true
      };
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


    const path =
      userId +
      "/profile-" +
      Date.now() +
      "." +
      extension;


    const {
      error: uploadError
    } =
      await db
        .storage
        .from(
          "officer-profile-photos"
        )
        .upload(
          path,
          selectedPhotoFile,
          {
            cacheControl:
              "3600",

            upsert:
              false
          }
        );


    if (uploadError) {

      console.error(
        "New officer photo upload failed:",
        uploadError
      );

      return {
        ok: false,
        error:
          uploadError.message
      };

    }


    const {
      error: pathError
    } =
      await db.rpc(
        "set_personnel_profile_photo",
        {

          p_user_id:
            userId,

          p_profile_photo_path:
            path

        }
      );


    if (pathError) {

      console.error(
        "New officer photo path save failed:",
        pathError
      );


      await db
        .storage
        .from(
          "officer-profile-photos"
        )
        .remove(
          [path]
        );


      return {
        ok: false,
        error:
          pathError.message
      };

    }


    return {
      ok: true
    };

  }


  // ========================================================
  // CREATE OFFICER
  // ========================================================

  createButton.addEventListener(
    "click",
    async () => {

      clearMessage();


      const first =
        firstName.value.trim();

      const last =
        lastName.value.trim();

      const employeeNo =
        employeeNumber.value.trim();

      const telephone =
        phone.value.trim();

      const emailAddress =
        email.value.trim();

      const selectedShift =
        shift.value;

      const selectedRank =
        rank.value;


      if (
        !first ||
        !last
      ) {

        showMessage(
          "First name and last name are required.",
          "error"
        );

        return;

      }


      if (
        middleInitial.value.trim() &&
        !/^[A-Za-z]$/.test(
          middleInitial.value.trim()
        )
      ) {

        showMessage(
          "Middle initial must contain one letter.",
          "error"
        );

        return;

      }


      if (!employeeNo) {

        showMessage(
          "Employee number is required.",
          "error"
        );

        return;

      }

      if (!telephone) {

        showMessage(
          "Telephone number is required.",
          "error"
        );

        return;

      }


      if (
        !emailAddress ||
        !emailAddress.includes("@")
      ) {

        showMessage(
          "A valid email address is required.",
          "error"
        );

        return;

      }


      if (!hireDate.value) {

        showMessage(
          "Hire date is required.",
          "error"
        );

        return;

      }


      if (!selectedShift) {

        showMessage(
          "Select the officer's normal shift.",
          "error"
        );

        return;

      }


     const confirmed =
  window.confirm(
    "Save this employee profile? No account setup email will be sent."
  );


      if (!confirmed) {
        return;
      }


      createButton.disabled =
        true;

      createButton.textContent =
        "Creating Officer...";


      try {


        // -----------------------------------------
        // CALL PROTECTED EDGE FUNCTION
        // -----------------------------------------

        const {
          data,
          error
        } =
          await db.functions.invoke(
            "personnel-create-officer",
            {

              body: {

                first_name:
                  first,

                middle_initial:
                  nullable(
                    middleInitial.value
                  ),

                last_name:
                  last,

                nickname:
                  nullable(
                    nickname.value
                  ),

                employee_number:
                  employeeNo,

                phone_number:
                  telephone,

                email:
                  emailAddress,

                birth_date:
                  birthDate.value ||
                  null,

                hire_date:
                  hireDate.value,

                rank:
                  selectedRank,

                shift_name:
                  selectedShift,

                is_armed:
                  armed.checked

              }

            }
          );


        if (error) {

          throw new Error(
            await readFunctionError(
              error
            )
          );

        }


        if (
          !data ||
          data.success !== true
        ) {

          throw new Error(
            data?.error ||
            "SecureTrack did not confirm officer creation."
          );

        }


        const userId =
          data?.officer?.user_id;


        if (!userId) {

          throw new Error(
            "Officer account was created, but SecureTrack did not return the new user ID."
          );

        }


        /*
          Clear badge value as soon as the
          account creation succeeds.
        */

        // -----------------------------------------
        // OPTIONAL PHOTO
        // -----------------------------------------

        let photoWarning =
          null;


        if (selectedPhotoFile) {

          const photoResult =
            await uploadPhoto(
              userId
            );


          if (!photoResult.ok) {

            photoWarning =
              photoResult.error ||
              "The photo could not be saved.";

          }

        }


        // -----------------------------------------
        // REFRESH PERSONNEL LIST
        // -----------------------------------------

        const refreshButton =
          document.getElementById(
            "refreshActiveButton"
          );


        if (refreshButton) {

          refreshButton.click();

        }


       if (photoWarning) {

  showMessage(
    "Employee profile saved. No account setup email was sent. The profile photo could not be saved, but it can be added later from Edit Personnel.",
    "warning"
  );

}
else {

  showMessage(
    "Employee profile saved successfully. No account setup email was sent. Account Access will remain Not Set Up until you send an invitation.",
    "success"
  );

}


        /*
          Keep success visible briefly.
        */

        setTimeout(
          () => {

            closeModal();

          },
          2200
        );


      }
      catch (error) {

        console.error(
          "New officer onboarding failed:",
          error
        );


        showMessage(
          error.message ||
          "Officer onboarding could not be completed.",
          "error"
        );

      }
      finally {

        createButton.disabled =
          false;

       createButton.textContent =
  "Save Employee Profile";

      }

    }
  );


  // ========================================================
  // OPEN / CLOSE EVENTS
  // ========================================================

  if (addButton) {

    /*
      The original HTML intentionally shipped with
      this disabled until the secure Edge Function
      was ready. It is ready now.
    */

    addButton.disabled =
      false;

    addButton.removeAttribute(
      "title"
    );


    addButton.addEventListener(
      "click",
      openModal
    );

  }


  document
    .getElementById(
      "onboardingClose"
    )
    .addEventListener(
      "click",
      closeModal
    );


  document
    .getElementById(
      "onboardingCancel"
    )
    .addEventListener(
      "click",
      closeModal
    );


  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        closeModal();

      }

    }
  );


})();
