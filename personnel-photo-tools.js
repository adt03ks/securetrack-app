(function () {

  "use strict";


  // ========================================================
  // SECURETRACK PERSONNEL PHOTO TOOLS
  //
  // Provides:
  // 1. Interactive circular photo cropping
  // 2. Zoom + drag positioning
  // 3. 600 x 600 optimized profile image
  // 4. Automatic personnel-card photos
  //
  // Works with:
  // - Add New Officer
  // - Edit Personnel
  // - Active Personnel cards
  // ========================================================


  const CROP_SIZE =
    320;

  const OUTPUT_SIZE =
    600;


  let cropState =
    null;

  let cropResolve =
    null;


  // ========================================================
  // STYLES
  // ========================================================

  const style =
    document.createElement(
      "style"
    );


  style.textContent = `
.st-personnel-rank-line {

  display: flex;

  align-items: center;

  gap: 6px;

  margin-top: 4px;

  color: #aeb6be;

  font-size: 12px;

  font-weight: 800;
}


.st-personnel-rank-line .st-rank-shield {

  width: 16px;

  height: 18px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  flex: 0 0 auto;
}


.st-personnel-rank-line .st-rank-shield svg {

  width: 16px;

  height: 18px;

  display: block;

  fill: #d84b4b;

  stroke: #ff9292;

  stroke-width: 1;
}


.st-personnel-rank-line .st-rank-text {

  color: #c4cbd1;

  letter-spacing: .02em;
}
    .st-crop-overlay[hidden] {
      display: none !important;
    }

    .st-crop-overlay {
      position: fixed;
      inset: 0;
      z-index: 20000;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 20px;

      background:
        rgba(0,0,0,.88);

      backdrop-filter:
        blur(5px);
    }


    .st-crop-modal {
      width:
        min(520px, 100%);

      border:
        1px solid #3c434a;

      border-radius:
        18px;

      overflow: hidden;

      background:
        linear-gradient(
          145deg,
          #0b0e11,
          #11151a
        );

      box-shadow:
        0 24px 80px
        rgba(0,0,0,.65);
    }


    .st-crop-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 18px;

      padding:
        21px 22px;

      border-bottom:
        1px solid #2c3238;
    }


    .st-crop-header h2 {
      margin:
        5px 0 4px;

      font-size:
        21px;
    }


    .st-crop-close {
      width: 38px;
      height: 38px;

      border:
        1px solid #40474f;

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


    .st-crop-body {
      padding:
        22px;
    }


    .st-crop-instructions {
      margin:
        0 0 18px;

      color:
        #aeb5bc;

      font-size:
        13px;

      line-height:
        1.5;

      text-align:
        center;
    }


    .st-crop-stage {
      position: relative;

      width:
        min(320px, 82vw);

      aspect-ratio:
        1 / 1;

      margin:
        0 auto;

      border-radius:
        50%;

      overflow:
        hidden;

      background:
        #050709;

      border:
        3px solid #ff7800;

      box-shadow:
        0 0 0 8px
        rgba(255,120,0,.08);

      touch-action:
        none;

      cursor:
        grab;
    }


    .st-crop-stage.dragging {
      cursor:
        grabbing;
    }


    .st-crop-stage canvas {
      display:
        block;

      width:
        100%;

      height:
        100%;

      touch-action:
        none;
    }


    .st-crop-guide {
      position:
        absolute;

      inset:
        0;

      pointer-events:
        none;

      border-radius:
        50%;

      box-shadow:
        inset 0 0 0 1px
        rgba(255,255,255,.35);
    }


    .st-crop-guide::before,
    .st-crop-guide::after {
      content: "";

      position:
        absolute;

      background:
        rgba(255,255,255,.20);
    }


    .st-crop-guide::before {
      left:
        33.333%;

      top:
        0;

      bottom:
        0;

      width:
        1px;

      box-shadow:
        106px 0
        rgba(255,255,255,.20);
    }


    .st-crop-guide::after {
      top:
        33.333%;

      left:
        0;

      right:
        0;

      height:
        1px;

      box-shadow:
        0 106px
        rgba(255,255,255,.20);
    }


    .st-crop-controls {
      max-width:
        360px;

      margin:
        24px auto 0;
    }


    .st-crop-control-row {
      display:
        flex;

      align-items:
        center;

      gap:
        12px;
    }


    .st-crop-control-row span {
      min-width:
        38px;

      color:
        #aeb5bc;

      font-size:
        12px;

      font-weight:
        800;
    }


    .st-crop-control-row input[type="range"] {
      width:
        100%;

      accent-color:
        #ff7800;
    }


    .st-crop-helper {
      margin-top:
        11px;

      color:
        #818991;

      font-size:
        11px;

      text-align:
        center;
    }


    .st-crop-footer {
      display:
        flex;

      justify-content:
        flex-end;

      gap:
        10px;

      padding:
        17px 22px;

      border-top:
        1px solid #2c3238;
    }


    .st-crop-cancel,
    .st-crop-use {

      padding:
        10px 15px;

      border-radius:
        10px;

      font-weight:
        850;

      cursor:
        pointer;
    }


    .st-crop-cancel {
      border:
        1px solid #414850;

      background:
        #13181d;

      color:
        #fff;
    }


    .st-crop-use {
      border:
        1px solid #ff7800;

      background:
        #ff7800;

      color:
        #111;
    }


    /*
      ======================================================
      EMPLOYEE CARD AVATAR
      ======================================================
    */

    .st-personnel-card-avatar {

      width:
        70px;

      height:
        70px;

      min-width:
        70px;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      float:
        left;

      margin:
        0 14px 10px 0;

      overflow:
        hidden;

      border:
        2px solid #3f474f;

      border-radius:
        50%;

      background:
        linear-gradient(
          145deg,
          #252c32,
          #101419
        );

      color:
        #ff922b;

      font-size:
        21px;

      font-weight:
        900;

      box-shadow:
        0 5px 16px
        rgba(0,0,0,.25);
    }


    .st-personnel-card-avatar img {

      width:
        100%;

      height:
        100%;

      display:
        block;

      object-fit:
        cover;

      object-position:
        center;
    }


    .st-personnel-card-avatar::after {
      content:
        "";

      display:
        block;

      clear:
        both;
    }


    @media (max-width: 500px) {

      .st-crop-body {
        padding:
          18px 14px;
      }

      .st-crop-stage {
        width:
          min(290px, 82vw);
      }

    }

  `;


  document.head.appendChild(
    style
  );



  // ========================================================
  // CREATE CROPPER HTML
  // ========================================================

  document.body.insertAdjacentHTML(
    "beforeend",
    `

    <div
      id="stCropOverlay"
      class="st-crop-overlay"
      hidden
    >

      <section
        class="st-crop-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stCropTitle"
      >

        <header
          class="st-crop-header"
        >

          <div>

            <div class="eyebrow">
              Profile Photo
            </div>

            <h2 id="stCropTitle">
              Position Officer Photo
            </h2>

            <div class="subtle">
              Adjust how the image will appear
              throughout SecureTrack.
            </div>

          </div>


          <button
            id="stCropClose"
            class="st-crop-close"
            type="button"
            aria-label="Close"
          >
            ×
          </button>

        </header>


        <div
          class="st-crop-body"
        >

          <p
            class="st-crop-instructions"
          >
            Drag the photo to position the officer
            inside the frame. Use the zoom control
            to adjust the size.
          </p>


          <div
            id="stCropStage"
            class="st-crop-stage"
          >

            <canvas
              id="stCropCanvas"
              width="${CROP_SIZE}"
              height="${CROP_SIZE}"
            ></canvas>

            <div
              class="st-crop-guide"
            ></div>

          </div>


          <div
            class="st-crop-controls"
          >

            <div
              class="st-crop-control-row"
            >

              <span>
                Zoom
              </span>

              <input
                id="stCropZoom"
                type="range"
                min="1"
                max="3"
                step="0.01"
                value="1"
              >

            </div>


            <div
              class="st-crop-helper"
            >
              The saved profile photo will use
              exactly the positioning shown above.
            </div>

          </div>

        </div>


        <footer
          class="st-crop-footer"
        >

          <button
            id="stCropCancel"
            class="st-crop-cancel"
            type="button"
          >
            Cancel
          </button>


          <button
            id="stCropUse"
            class="st-crop-use"
            type="button"
          >
            Use Photo
          </button>

        </footer>

      </section>

    </div>

    `
  );



  // ========================================================
  // CROPPER DOM
  // ========================================================

  const overlay =
    document.getElementById(
      "stCropOverlay"
    );


  const stage =
    document.getElementById(
      "stCropStage"
    );


  const canvas =
    document.getElementById(
      "stCropCanvas"
    );


  const ctx =
    canvas.getContext(
      "2d"
    );


  const zoomSlider =
    document.getElementById(
      "stCropZoom"
    );


  const useButton =
    document.getElementById(
      "stCropUse"
    );



  // ========================================================
  // DRAW CROPPER
  // ========================================================

  function clampPosition() {

    if (!cropState) {
      return;
    }


    const totalScale =
      cropState.baseScale *
      cropState.zoom;


    const drawWidth =
      cropState.image.naturalWidth *
      totalScale;


    const drawHeight =
      cropState.image.naturalHeight *
      totalScale;


    const maxX =
      Math.max(
        0,
        (
          drawWidth -
          CROP_SIZE
        ) / 2
      );


    const maxY =
      Math.max(
        0,
        (
          drawHeight -
          CROP_SIZE
        ) / 2
      );


    cropState.offsetX =
      Math.max(
        -maxX,
        Math.min(
          maxX,
          cropState.offsetX
        )
      );


    cropState.offsetY =
      Math.max(
        -maxY,
        Math.min(
          maxY,
          cropState.offsetY
        )
      );

  }



  function drawCrop() {

    if (!cropState) {
      return;
    }


    clampPosition();


    ctx.clearRect(
      0,
      0,
      CROP_SIZE,
      CROP_SIZE
    );


    const totalScale =
      cropState.baseScale *
      cropState.zoom;


    const drawWidth =
      cropState.image.naturalWidth *
      totalScale;


    const drawHeight =
      cropState.image.naturalHeight *
      totalScale;


    const x =
      (
        CROP_SIZE -
        drawWidth
      ) / 2 +
      cropState.offsetX;


    const y =
      (
        CROP_SIZE -
        drawHeight
      ) / 2 +
      cropState.offsetY;


    ctx.drawImage(
      cropState.image,
      x,
      y,
      drawWidth,
      drawHeight
    );

  }



  // ========================================================
  // DRAG POSITION
  // ========================================================

  stage.addEventListener(
    "pointerdown",
    event => {

      if (!cropState) {
        return;
      }


      cropState.dragging =
        true;


      cropState.pointerX =
        event.clientX;

      cropState.pointerY =
        event.clientY;


      stage.classList.add(
        "dragging"
      );


      stage.setPointerCapture(
        event.pointerId
      );

    }
  );


  stage.addEventListener(
    "pointermove",
    event => {

      if (
        !cropState ||
        !cropState.dragging
      ) {
        return;
      }


      const rect =
        stage.getBoundingClientRect();


      const factor =
        CROP_SIZE /
        rect.width;


      const dx =
        (
          event.clientX -
          cropState.pointerX
        ) *
        factor;


      const dy =
        (
          event.clientY -
          cropState.pointerY
        ) *
        factor;


      cropState.pointerX =
        event.clientX;

      cropState.pointerY =
        event.clientY;


      cropState.offsetX +=
        dx;

      cropState.offsetY +=
        dy;


      drawCrop();

    }
  );


  function stopDragging() {

    if (!cropState) {
      return;
    }


    cropState.dragging =
      false;


    stage.classList.remove(
      "dragging"
    );

  }


  stage.addEventListener(
    "pointerup",
    stopDragging
  );


  stage.addEventListener(
    "pointercancel",
    stopDragging
  );



  // ========================================================
  // ZOOM
  // ========================================================

  zoomSlider.addEventListener(
    "input",
    () => {

      if (!cropState) {
        return;
      }


      cropState.zoom =
        Number(
          zoomSlider.value
        );


      drawCrop();

    }
  );



  // ========================================================
  // CREATE FINAL 600 X 600 IMAGE
  // ========================================================

  async function createOutputBlob() {

    if (!cropState) {
      return null;
    }


    clampPosition();


    const image =
      cropState.image;


    const totalScale =
      cropState.baseScale *
      cropState.zoom;


    const drawWidth =
      image.naturalWidth *
      totalScale;


    const drawHeight =
      image.naturalHeight *
      totalScale;


    const drawX =
      (
        CROP_SIZE -
        drawWidth
      ) / 2 +
      cropState.offsetX;


    const drawY =
      (
        CROP_SIZE -
        drawHeight
      ) / 2 +
      cropState.offsetY;


    /*
      Convert the visible crop window
      back into original-image coordinates.
    */

    const sourceX =
      (
        0 -
        drawX
      ) /
      totalScale;


    const sourceY =
      (
        0 -
        drawY
      ) /
      totalScale;


    const sourceWidth =
      CROP_SIZE /
      totalScale;


    const sourceHeight =
      CROP_SIZE /
      totalScale;


    const output =
      document.createElement(
        "canvas"
      );


    output.width =
      OUTPUT_SIZE;

    output.height =
      OUTPUT_SIZE;


    const outputCtx =
      output.getContext(
        "2d"
      );


    outputCtx.drawImage(

      image,

      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,

      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE

    );


    /*
      WebP provides good quality at a
      much smaller profile-photo size.
    */

    let blob =
      await new Promise(
        resolve => {

          output.toBlob(
            resolve,
            "image/webp",
            0.92
          );

        }
      );


    /*
      Fallback for browsers that cannot
      create WebP from canvas.
    */

    if (!blob) {

      blob =
        await new Promise(
          resolve => {

            output.toBlob(
              resolve,
              "image/jpeg",
              0.92
            );

          }
        );

    }


    return blob;

  }



  // ========================================================
  // CLOSE CROPPER
  // ========================================================

  function finishCrop(
    result
  ) {

    overlay.hidden =
      true;


    document.body.style.overflow =
      cropState?.previousOverflow ||
      "";


    if (
      cropState?.objectUrl
    ) {

      URL.revokeObjectURL(
        cropState.objectUrl
      );

    }


    cropState =
      null;


    if (cropResolve) {

      const resolve =
        cropResolve;

      cropResolve =
        null;

      resolve(
        result
      );

    }

  }



  // ========================================================
  // OPEN CROPPER
  // ========================================================

  async function openCropper(
    file
  ) {

    return new Promise(
      async resolve => {

        cropResolve =
          resolve;


        const objectUrl =
          URL.createObjectURL(
            file
          );


        const image =
          new Image();


        image.src =
          objectUrl;


        try {

          await image.decode();

        }
        catch (error) {

          console.error(
            "Unable to load profile image:",
            error
          );


          URL.revokeObjectURL(
            objectUrl
          );


          cropResolve =
            null;


          resolve(
            null
          );


          return;

        }


        const baseScale =
          Math.max(

            CROP_SIZE /
            image.naturalWidth,

            CROP_SIZE /
            image.naturalHeight

          );


        cropState = {

          image,

          objectUrl,

          baseScale,

          zoom:
            1,

          offsetX:
            0,

          offsetY:
            0,

          dragging:
            false,

          pointerX:
            0,

          pointerY:
            0,

          previousOverflow:
            document.body.style.overflow

        };


        zoomSlider.value =
          "1";


        overlay.hidden =
          false;


        document.body.style.overflow =
          "hidden";


        drawCrop();

      }
    );

  }



  // ========================================================
  // CROPPER BUTTONS
  // ========================================================

  document
    .getElementById(
      "stCropCancel"
    )
    .addEventListener(
      "click",
      () => {

        finishCrop(
          null
        );

      }
    );


  document
    .getElementById(
      "stCropClose"
    )
    .addEventListener(
      "click",
      () => {

        finishCrop(
          null
        );

      }
    );


  useButton.addEventListener(
    "click",
    async () => {

      useButton.disabled =
        true;

      useButton.textContent =
        "Preparing...";


      try {

        const blob =
          await createOutputBlob();


        finishCrop(
          blob
        );

      }
      finally {

        useButton.disabled =
          false;

        useButton.textContent =
          "Use Photo";

      }

    }
  );



  // ========================================================
  // INTERCEPT PROFILE PHOTO INPUTS
  //
  // This allows your EXISTING onboarding and
  // personnel-editor scripts to remain unchanged.
  //
  // We capture the original file BEFORE their
  // existing change handlers receive it.
  // ========================================================

  const cropInputs =
    new Set([
      "newOfficerPhoto",
      "personnelEditorPhotoInput"
    ]);


  document.addEventListener(
    "change",
    async event => {

      const input =
        event.target;


      if (
        !input ||
        input.tagName !==
          "INPUT" ||
        input.type !==
          "file" ||
        !cropInputs.has(
          input.id
        )
      ) {
        return;
      }


      /*
        The replacement event should pass through
        to the original SecureTrack handler.
      */

      if (
        input.dataset
          .securetrackCropReady ===
        "1"
      ) {

        delete input.dataset
          .securetrackCropReady;

        return;

      }


      const originalFile =
        input.files?.[0];


      if (!originalFile) {
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
          originalFile.type
        )
      ) {
        return;
      }


      /*
        Prevent the original handler from uploading/
        previewing the un-cropped image.
      */

      event.preventDefault();

      event.stopImmediatePropagation();


      const croppedBlob =
        await openCropper(
          originalFile
        );


      if (!croppedBlob) {

        input.value =
          "";


        /*
          Let the original script learn that
          no file is currently selected.
        */

        input.dispatchEvent(
          new Event(
            "change",
            {
              bubbles: true
            }
          )
        );


        return;

      }


      const extension =
        croppedBlob.type ===
          "image/jpeg"
          ? "jpg"
          : "webp";


      const croppedFile =
        new File(
          [croppedBlob],
          "securetrack-profile-" +
            Date.now() +
            "." +
            extension,
          {
            type:
              croppedBlob.type
          }
        );


      /*
        Replace the browser input's original file
        with the actual cropped image.
      */

      const transfer =
        new DataTransfer();


      transfer.items.add(
        croppedFile
      );


      input.files =
        transfer.files;


      /*
        Mark the next change event so this cropper
        does not intercept its own replacement file.
      */

      input.dataset
        .securetrackCropReady =
          "1";


      input.dispatchEvent(
        new Event(
          "change",
          {
            bubbles: true
          }
        )
      );

    },

    true
  );



    // ========================================================
  // EMPLOYEE CARD PHOTOS + RANK DISPLAY
  // ========================================================

  const personnelCache =
    new Map();

  let personnelScanTimer =
    null;


  // ========================================================
  // RANK LABEL
  // ========================================================

  function rankLabel(
    rank
  ) {

    const labels = {

      officer:
        "Officer",

      senior_officer:
        "Senior Officer",

      team_lead:
        "Team Lead",

      manager:
        "Manager",

      director:
        "Director",

      admin:
        "Administrator"

    };


    return (
      labels[rank] ||
      "Rank Unavailable"
    );

  }


  // ========================================================
  // INITIALS
  // ========================================================

  function initialsFor(
    person
  ) {

    let first =
      String(
        person?.first_name ||
        ""
      ).trim();


    let last =
      String(
        person?.last_name ||
        ""
      ).trim();


    /*
      Some of the older Test Officer records may
      not have structured first/last names yet.

      Fall back to display_name in those cases.
    */

    if (
      !first ||
      !last
    ) {

      const parts =
        String(
          person?.display_name ||
          ""
        )
          .replace(
            /"[^"]*"/g,
            ""
          )
          .trim()
          .split(
            /\s+/
          )
          .filter(
            Boolean
          );


      if (!first) {

        first =
          parts[0] ||
          "";

      }


      if (!last) {

        last =
          parts.length > 1
            ? parts[
                parts.length - 1
              ]
            : "";

      }

    }


    return (
      (
        (first[0] || "") +
        (last[0] || "")
      )
        .toUpperCase() ||
      "?"
    );

  }


  // ========================================================
  // FIND THE CARD FOR AN EDIT BUTTON
  // ========================================================

  function findPersonnelCard(
    button
  ) {

    const direct =
      button.closest(
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


    if (direct) {

      return direct;

    }


    /*
      Fallback for the current Personnel
      Administration card structure.
    */

    let node =
      button.parentElement;


    let candidate =
      null;


    while (
      node &&
      node !== document.body
    ) {

      const editButtons =
        node.querySelectorAll(
          'button[data-action="edit"][data-id]'
        );


      if (
        editButtons.length ===
        1
      ) {

        candidate =
          node;

      }
      else if (
        editButtons.length >
        1
      ) {

        break;

      }


      node =
        node.parentElement;

    }


    return candidate;

  }


  // ========================================================
  // GET COMPLETE PERSONNEL RECORD
  // ========================================================

  async function getPersonnel(
    userId
  ) {

    if (
      personnelCache.has(
        userId
      )
    ) {

      return personnelCache.get(
        userId
      );

    }


    const STM =
      window.SecureTrackManager;


    if (
      !STM ||
      !STM.db
    ) {

      return null;

    }


    const {
      data,
      error
    } =
      await STM.db.rpc(
        "get_personnel_admin_record",
        {
          p_user_id:
            userId
        }
      );


    if (error) {

      console.warn(
        "Unable to load personnel record:",
        error
      );


      return null;

    }


    personnelCache.set(
      userId,
      data
    );


    return data;

  }


  // ========================================================
  // PRIVATE PROFILE PHOTO URL
  // ========================================================

  async function getSignedPhoto(
    path
  ) {

    if (!path) {

      return null;

    }


    const STM =
      window.SecureTrackManager;


    if (
      !STM ||
      !STM.db
    ) {

      return null;

    }


    const {
      data,
      error
    } =
      await STM.db
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
        "Unable to create employee photo URL:",
        error
      );


      return null;

    }


    return (
      data?.signedUrl ||
      null
    );

  }


  // ========================================================
  // FIND OFFICER NAME ON CARD
  // ========================================================

  function findNameElement(
    card,
    person
  ) {

    const displayName =
      String(
        person?.display_name ||
        ""
      ).trim();


    const selector =
      [
        ".personnel-name",
        ".employee-name",
        ".staff-name",
        ".card-title",
        "h1",
        "h2",
        "h3",
        "h4",
        "strong"
      ].join(",");


    const candidates =
      [
        ...card.querySelectorAll(
          selector
        )
      ];


    /*
      Prefer the element whose text exactly
      matches this employee.
    */

    if (displayName) {

      const exact =
        candidates.find(
          element =>
            element.textContent
              .trim() ===
            displayName
        );


      if (exact) {

        return exact;

      }

    }


    return (
      candidates[0] ||
      null
    );

  }


  // ========================================================
  // RENDER ACTUAL RANK + ARMED SHIELD
  // ========================================================

  function renderPersonnelRank(
    card,
    person
  ) {

    /*
      Remove only rank lines created by this
      SecureTrack enhancement.
    */

    card
      .querySelectorAll(
        ".st-personnel-rank-line"
      )
      .forEach(
        element =>
          element.remove()
      );


    const nameElement =
      findNameElement(
        card,
        person
      );


    /*
      Remove the OLD generic OFFICER label
      generated by the base Personnel page.

      This only removes elements whose entire
      text is exactly "Officer".

      It will NOT remove names such as:
      "Officer Test 03"
    */

    [
      ...card.querySelectorAll(
        [
          ".role",
          ".rank",
          ".personnel-role",
          ".employee-role",
          ".subtle",
          "small",
          "span",
          "p",
          "div"
        ].join(",")
      )
    ].forEach(
      element => {

        if (
          element ===
          nameElement
        ) {

          return;

        }


        if (
          element.closest(
            "button"
          )
        ) {

          return;

        }


        if (
          element.children.length !==
          0
        ) {

          return;

        }


        if (
          element.textContent
            .trim()
            .toLowerCase() ===
          "officer"
        ) {

          element.remove();

        }

      }
    );


    const rankLine =
      document.createElement(
        "div"
      );


    rankLine.className =
      "st-personnel-rank-line";


    // ------------------------------------------------------
    // ARMED SHIELD
    // ------------------------------------------------------

    if (
      person.is_armed ===
      true
    ) {

      const shield =
        document.createElement(
          "span"
        );


      shield.className =
        "st-rank-shield";


      shield.title =
        "Armed Qualified";


      shield.setAttribute(
        "aria-label",
        "Armed Qualified"
      );


      shield.innerHTML = `
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
      `;


      rankLine.appendChild(
        shield
      );

    }


    // ------------------------------------------------------
    // ACTUAL RANK
    // ------------------------------------------------------

    const rankText =
      document.createElement(
        "span"
      );


    rankText.className =
      "st-rank-text";


    rankText.textContent =
      rankLabel(
        person.rank
      );


    rankLine.appendChild(
      rankText
    );


    /*
      Place rank immediately below the
      employee name.
    */

    if (
      nameElement
    ) {

      nameElement.insertAdjacentElement(
        "afterend",
        rankLine
      );

    }

  }


  // ========================================================
  // DETECT EXISTING INITIALS CIRCLE
  // ========================================================

  function isCircularAvatarCandidate(
    element,
    expectedInitials
  ) {

    if (
      !element ||
      element.children.length >
      0
    ) {

      return false;

    }


    const text =
      element.textContent
        .trim()
        .toUpperCase();


    if (
      text !==
        expectedInitials &&
      text !==
        "?"
    ) {

      return false;

    }


    const rect =
      element.getBoundingClientRect();


    /*
      Must look like one of the avatar circles.
    */

    if (
      rect.width < 40 ||
      rect.width > 130 ||
      rect.height < 40 ||
      rect.height > 130 ||
      Math.abs(
        rect.width -
        rect.height
      ) > 18
    ) {

      return false;

    }


    const radius =
      parseFloat(
        window
          .getComputedStyle(
            element
          )
          .borderRadius
      );


    return (
      Number.isFinite(
        radius
      ) &&
      radius >=
        Math.min(
          rect.width,
          rect.height
        ) *
        0.25
    );

  }


  // ========================================================
  // FIND CURRENT AVATAR
  // ========================================================

  function findExistingAvatar(
    card,
    person
  ) {

    /*
      First try known avatar class names.
    */

    const known =
      card.querySelector(
        [
          "[data-personnel-avatar]",
          ".personnel-avatar",
          ".employee-avatar",
          ".staff-avatar",
          ".avatar"
        ].join(",")
      );


    if (known) {

      return known;

    }


    /*
      If the base Personnel page has no
      avatar class, identify the initials circle.
    */

    const expectedInitials =
      initialsFor(
        person
      );


    return (
      [
        ...card.querySelectorAll(
          "div, span"
        )
      ]
        .find(
          element =>
            isCircularAvatarCandidate(
              element,
              expectedInitials
            )
        ) ||
      null
    );

  }


  // ========================================================
  // REMOVE OLD HELPER DUPLICATES
  // ========================================================

  function removeHelperAvatarDuplicates(
    card,
    keepElement = null
  ) {

    card
      .querySelectorAll(
        [
          ".st-personnel-card-avatar",
          ".st-personnel-photo-slot",
          ".st-personnel-avatar",
          ".st-card-avatar",
          ".st-photo-avatar"
        ].join(",")
      )
      .forEach(
        element => {

          if (
            element !==
            keepElement
          ) {

            element.remove();

          }

        }
      );

  }


  // ========================================================
  // INSTALL REAL IMAGE IN AVATAR
  // ========================================================

  function installPhotoInAvatar(
    avatar,
    image,
    person
  ) {

    /*
      This is where the initials disappear.
    */

    avatar.innerHTML =
      "";


    avatar.classList.add(
      "st-photo-active"
    );


    avatar.style.overflow =
      "hidden";


    avatar.style.borderRadius =
      "50%";


    image.alt =
      (
        person.display_name ||
        "Officer"
      ) +
      " profile photo";


    image.style.width =
      "100%";


    image.style.height =
      "100%";


    image.style.display =
      "block";


    image.style.objectFit =
      "cover";


    image.style.objectPosition =
      "center";


    image.style.borderRadius =
      "50%";


    avatar.appendChild(
      image
    );

  }


  // ========================================================
  // RENDER PROFILE PHOTO
  // ========================================================

  async function renderPersonnelPhoto(
    card,
    person
  ) {

    const existingAvatar =
      findExistingAvatar(
        card,
        person
      );


    // ------------------------------------------------------
    // NO PHOTO SAVED
    //
    // Leave original initials in place.
    // ------------------------------------------------------

    if (
      !person.profile_photo_path
    ) {

      removeHelperAvatarDuplicates(
        card,
        existingAvatar
      );


      return;

    }


    // ------------------------------------------------------
    // GET PRIVATE SIGNED URL
    // ------------------------------------------------------

    const signedUrl =
      await getSignedPhoto(
        person.profile_photo_path
      );


    if (!signedUrl) {

      console.warn(
        "SecureTrack photo path exists but no signed URL was returned for:",
        person.display_name
      );


      /*
        Leave initials visible if Storage
        cannot provide the image.
      */

      removeHelperAvatarDuplicates(
        card,
        existingAvatar
      );


      return;

    }


    // ------------------------------------------------------
    // PRELOAD IMAGE BEFORE REMOVING INITIALS
    // ------------------------------------------------------

    const image =
      new Image();


    image.decoding =
      "async";


    const loaded =
      await new Promise(
        resolve => {

          image.onload =
            () => {

              resolve(
                true
              );

            };


          image.onerror =
            () => {

              resolve(
                false
              );

            };


          image.src =
            signedUrl;

        }
      );


    if (!loaded) {

      console.warn(
        "SecureTrack signed profile photo failed to load for:",
        person.display_name
      );


      /*
        Preserve initials on failure.
      */

      removeHelperAvatarDuplicates(
        card,
        existingAvatar
      );


      return;

    }


    // ------------------------------------------------------
    // REUSE EXISTING INITIALS CIRCLE
    // ------------------------------------------------------

    let avatar =
      existingAvatar;


    /*
      If the base page somehow has no avatar,
      create ONE new avatar.
    */

    if (!avatar) {

      avatar =
        document.createElement(
          "div"
        );


      avatar.className =
        "st-personnel-card-avatar";


      avatar.dataset
        .stPersonnelAvatar =
          person.user_id ||
          "photo";


      const nameElement =
        findNameElement(
          card,
          person
        );


      if (
        nameElement &&
        nameElement.parentElement
      ) {

        nameElement
          .parentElement
          .insertBefore(
            avatar,
            nameElement
          );

      }
      else {

        card.prepend(
          avatar
        );

      }

    }


    /*
      Replace initials with the photo.
    */

    installPhotoInAvatar(
      avatar,
      image,
      person
    );


    /*
      Remove any leftover avatars created by
      older versions of this script.
    */

    removeHelperAvatarDuplicates(
      card,
      avatar
    );

  }


  // ========================================================
  // DECORATE ONE PERSONNEL CARD
  // ========================================================

  async function decoratePersonnelCard(
    button
  ) {

    const userId =
      button.dataset.id;


    if (!userId) {

      return;

    }


    const card =
      findPersonnelCard(
        button
      );


    if (!card) {

      return;

    }


    /*
      Prevent the MutationObserver from repeatedly
      decorating its own DOM changes.
    */

    if (
      card.dataset
        .securetrackDecoratedUser ===
        userId ||
      card.dataset
        .securetrackDecoratingUser ===
        userId
    ) {

      return;

    }


    card.dataset
      .securetrackDecoratingUser =
        userId;


    try {

      const person =
        await getPersonnel(
          userId
        );


      if (!person) {

        return;

      }


      /*
        First correct rank.
      */

      renderPersonnelRank(
        card,
        person
      );


      /*
        Then install photo / initials.
      */

      await renderPersonnelPhoto(
        card,
        person
      );


      card.dataset
        .securetrackDecoratedUser =
          userId;

    }
    catch (
      error
    ) {

      console.error(
        "SecureTrack personnel card decoration failed:",
        error
      );

    }
    finally {

      delete card.dataset
        .securetrackDecoratingUser;

    }

  }


  // ========================================================
  // SCAN CURRENT PERSONNEL CARDS
  // ========================================================

  function scanPersonnelCards() {

    document
      .querySelectorAll(
        'button[data-action="edit"][data-id]'
      )
      .forEach(
        button => {

          decoratePersonnelCard(
            button
          );

        }
      );

  }


  // ========================================================
  // DEBOUNCED SCAN
  // ========================================================

  function schedulePersonnelScan() {

    clearTimeout(
      personnelScanTimer
    );


    personnelScanTimer =
      setTimeout(
        scanPersonnelCards,
        80
      );

  }


  // ========================================================
  // WATCH PERSONNEL LIST FOR RERENDER
  // ========================================================

  const personnelObserver =
    new MutationObserver(
      schedulePersonnelScan
    );


  personnelObserver.observe(
    document.body,
    {

      childList:
        true,

      subtree:
        true

    }
  );


  // ========================================================
  // INITIAL PAGE SCAN
  // ========================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      schedulePersonnelScan,
      {
        once:
          true
      }
    );

  }
  else {

    schedulePersonnelScan();

  }


  // ========================================================
  // PUBLIC REFRESH
  //
  // personnel-editor.js and personnel-onboarding.js
  // can call this after a photo or rank change.
  // ========================================================

  window.SecureTrackPersonnelPhotos = {

    refresh() {

      /*
        Force fresh information from Supabase.
      */

      personnelCache.clear();


      /*
        Allow every currently visible card
        to be decorated again.
      */

      document
        .querySelectorAll(
          [
            "[data-securetrack-decorated-user]",
            "[data-securetrack-decorating-user]"
          ].join(",")
        )
        .forEach(
          card => {

            delete card.dataset
              .securetrackDecoratedUser;


            delete card.dataset
              .securetrackDecoratingUser;

          }
        );


      schedulePersonnelScan();

    }

  };


})();
