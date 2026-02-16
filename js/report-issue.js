(function () {
  var form = document.getElementById("form-report-issue");
  var thankYou = document.getElementById("report-thank-you");
  var areaSelect = document.getElementById("report-area");
  var areaOtherWrap = document.getElementById("report-area-other-wrap");
  var areaOtherInput = document.getElementById("report-area-other");

  // Show thank-you if redirected after Formspree success
  if (thankYou && form) {
    var params = new URLSearchParams(window.location.search);
    if (params.get("submitted") === "1") {
      thankYou.hidden = false;
      form.hidden = true;
    } else {
      thankYou.hidden = true;
      form.hidden = false;
    }
  }

  // Formspree redirect back to this page with ?submitted=1
  if (form) {
    var nextInput = form.querySelector('input[name="_next"]');
    if (!nextInput) {
      nextInput = document.createElement("input");
      nextInput.type = "hidden";
      nextInput.name = "_next";
      form.appendChild(nextInput);
    }
    nextInput.value = window.location.origin + window.location.pathname + "?submitted=1";
  }

  function toggleAreaOther() {
    if (!areaOtherWrap || !areaSelect) return;
    var val = areaSelect.value;
    areaOtherWrap.hidden = val !== "Other";
    if (areaOtherWrap.hidden) {
      if (areaOtherInput) areaOtherInput.removeAttribute("required");
    } else {
      if (areaOtherInput) areaOtherInput.setAttribute("required", "required");
    }
  }

  if (areaSelect) {
    areaSelect.addEventListener("change", toggleAreaOther);
  }
  toggleAreaOther();
})();
