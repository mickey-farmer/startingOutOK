(function () {
  var form = document.getElementById("form-submit-resource");
  var thankYou = document.getElementById("submit-thank-you");
  var sectionSelect = document.getElementById("resource-section");
  var sectionOtherWrap = document.getElementById("section-other-wrap");
  var sectionOtherInput = document.getElementById("section-other");
  var subcategoryWrap = document.getElementById("subcategory-wrap");
  var subcategorySelect = document.getElementById("resource-subcategory");
  var subcategoryOtherWrap = document.getElementById("subcategory-other-wrap");
  var subcategoryOtherInput = document.getElementById("subcategory-other");
  var locationSelect = document.getElementById("resource-location");
  var locationOtherWrap = document.getElementById("location-other-wrap");
  var locationOtherInput = document.getElementById("location-other");

  // Show thank-you if redirected after Formspree success
  if (thankYou && form) {
    var params = new URLSearchParams(window.location.search);
    if (params.get("submitted") === "1") {
      thankYou.hidden = false;
      form.hidden = true;
      return;
    }
    thankYou.hidden = true;
    form.hidden = false;
  }

  // Set Formspree _next redirect to this page with ?submitted=1
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

  function toggleSectionOther() {
    var val = sectionSelect ? sectionSelect.value : "";
    sectionOtherWrap.hidden = val !== "Other";
    if (sectionOtherWrap.hidden) sectionOtherInput.removeAttribute("required");
    else sectionOtherInput.setAttribute("required", "required");
  }

  function toggleSubcategory() {
    var sectionVal = sectionSelect ? sectionSelect.value : "";
    var isClasses = sectionVal === "Classes & Workshops";
    subcategoryWrap.hidden = !isClasses;
    if (!isClasses) {
      subcategorySelect.value = "";
      subcategoryOtherWrap.hidden = true;
      subcategoryOtherInput.removeAttribute("required");
    } else {
      toggleSubcategoryOther();
    }
  }

  function toggleSubcategoryOther() {
    var val = subcategorySelect ? subcategorySelect.value : "";
    subcategoryOtherWrap.hidden = val !== "Other";
    if (subcategoryOtherWrap.hidden) subcategoryOtherInput.removeAttribute("required");
    else subcategoryOtherInput.setAttribute("required", "required");
  }

  function toggleLocationOther() {
    var val = locationSelect ? locationSelect.value : "";
    locationOtherWrap.hidden = val !== "Other";
    if (locationOtherWrap.hidden) locationOtherInput.removeAttribute("required");
    else locationOtherInput.setAttribute("required", "required");
  }

  if (sectionSelect) {
    sectionSelect.addEventListener("change", function () {
      toggleSectionOther();
      toggleSubcategory();
    });
  }
  if (subcategorySelect) {
    subcategorySelect.addEventListener("change", toggleSubcategoryOther);
  }
  if (locationSelect) {
    locationSelect.addEventListener("change", toggleLocationOther);
  }

  toggleSectionOther();
  toggleSubcategory();
  toggleLocationOther();
})();
