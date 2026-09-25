(async function () {

  "use strict";


  const params =
    new URLSearchParams(
      window.location.search
    );


  const shiftInstanceId =
    params.get(
      "shiftInstanceId"
    );


  const shiftDate =
    params.get(
      "shiftDate"
    );


  const shiftName =
    params.get(
      "shiftName"
    );


  const returnTo =
    params.get(
      "returnTo"
    );


  document
    .getElementById(
      "shiftInstanceId"
    )
    .textContent =

      shiftInstanceId
      ||
      "Not provided";


  document
    .getElementById(
      "shiftDate"
    )
    .textContent =

      shiftDate
      ||
      "Not provided";


  document
    .getElementById(
      "shiftName"
    )
    .textContent =

      shiftName
      ||
      "Not provided";


  const returnLink =
    document.getElementById(
      "returnToAssignments"
    );


  if (
    returnTo
  ) {

    returnLink.href =
      returnTo;

  }

  else {

    returnLink.href =
      "./";

  }

})();
