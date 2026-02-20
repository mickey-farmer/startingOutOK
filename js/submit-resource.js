(function () {
  var form = document.getElementById("form-submit-resource");
  var thankYou = document.getElementById("submit-thank-you");
  var jsonField = document.getElementById("resource-json");
  var directoryJsonField = document.getElementById("directory-json");
  var formSubject = document.getElementById("form-subject");
  var resourceFieldsWrap = document.getElementById("resource-fields-wrap");
  var directoryFieldsWrap = document.getElementById("directory-fields-wrap");
  var submitTypeResource = document.getElementById("submit-type-resource");
  var submitTypeDirectory = document.getElementById("submit-type-directory");
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

  function isDirectory() {
    return submitTypeDirectory && submitTypeDirectory.checked;
  }

  function toggleSubmitType() {
    var dir = isDirectory();
    if (resourceFieldsWrap) resourceFieldsWrap.hidden = dir;
    if (directoryFieldsWrap) directoryFieldsWrap.hidden = !dir;
    if (sectionSelect) sectionSelect.required = !dir;
    var titleEl = document.getElementById("resource-title");
    if (titleEl) titleEl.required = !dir;
    var nameEl = document.getElementById("directory-name");
    var specialtyEl = document.getElementById("directory-specialty");
    if (nameEl) nameEl.required = dir;
    if (specialtyEl) specialtyEl.required = dir;
  }

  if (submitTypeResource) submitTypeResource.addEventListener("change", toggleSubmitType);
  if (submitTypeDirectory) submitTypeDirectory.addEventListener("change", toggleSubmitType);
  toggleSubmitType();

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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var tosCheckbox = document.getElementById("resource-tos");
    if (!tosCheckbox || !tosCheckbox.checked) {
      alert("You must accept the Terms of Service to submit.");
      if (tosCheckbox) tosCheckbox.focus();
      return;
    }

    if (isDirectory()) {
      var dirName = (document.getElementById("directory-name") && document.getElementById("directory-name").value) || "";
      var dirSpecialty = (document.getElementById("directory-specialty") && document.getElementById("directory-specialty").value) || "";
      var dirDesc = (document.getElementById("directory-description") && document.getElementById("directory-description").value) || "";
      var dirLocation = (document.getElementById("directory-location") && document.getElementById("directory-location").value) || "";
      var dirImdb = (document.getElementById("directory-imdb") && document.getElementById("directory-imdb").value) || "";
      var dirIg = (document.getElementById("directory-contact-instagram") && document.getElementById("directory-contact-instagram").value) || "";
      var dirEmail = (document.getElementById("directory-contact-email") && document.getElementById("directory-contact-email").value) || "";
      var dirOther = (document.getElementById("directory-contact-other") && document.getElementById("directory-contact-other").value) || "";

      if (!dirName.trim()) {
        alert("Please enter the person's full name.");
        if (document.getElementById("directory-name")) document.getElementById("directory-name").focus();
        return;
      }
      if (!dirSpecialty) {
        alert("Please select a specialty / category.");
        if (document.getElementById("directory-specialty")) document.getElementById("directory-specialty").focus();
        return;
      }
      if (!dirIg.trim() && !dirEmail.trim() && !dirOther.trim()) {
        alert("Please provide at least one contact (Instagram, Email, or Other).");
        return;
      }

      var primaryLink = (dirImdb && dirImdb.trim()) ? dirImdb.trim() : (dirIg.trim() || dirOther.trim() || null);
      var contactLinkVal = dirIg.trim() ? dirIg.trim() : (dirEmail.trim() ? "mailto:" + dirEmail.trim() : (dirOther.trim() || null));
      var contactLabelVal = dirIg.trim() ? "Instagram" : (dirEmail.trim() ? "Email" : (dirOther.trim() ? "Contact" : null));

      var dirObj = {
        name: dirName.trim(),
        sections: [dirSpecialty],
        description: (dirDesc || "").trim() || null,
        location: (dirLocation || "").trim() || null,
        link: primaryLink,
        contactLink: contactLinkVal,
        contactLabel: contactLabelVal
      };

      if (formSubject) formSubject.value = "Acting Out OK – New directory submission";
      if (document.getElementById("add-to-section")) document.getElementById("add-to-section").value = "Add to Directory (content/directory). Verify consent before listing.";
      if (jsonField) jsonField.value = "";
      if (directoryJsonField) directoryJsonField.value = JSON.stringify(dirObj, null, 2);
      form.submit();
      return;
    }

    var section = sectionSelect ? sectionSelect.value : "";
    var sectionResolved = section === "Other" && sectionOtherInput ? (sectionOtherInput.value || "").trim() : section;
    var subcategoryVal = "";
    if (section === "Classes & Workshops" && subcategorySelect) {
      subcategoryVal = subcategorySelect.value === "Other" && subcategoryOtherInput
        ? (subcategoryOtherInput.value || "").trim()
        : (subcategorySelect.value || "").trim();
    }
    var locationVal = (locationSelect && locationSelect.value) || "";
    if (locationVal === "Other" && locationOtherInput) {
      locationVal = (locationOtherInput.value || "").trim();
    }
    var titleVal = (document.getElementById("resource-title") && document.getElementById("resource-title").value) || "";
    var typeVal = (document.getElementById("resource-type") && document.getElementById("resource-type").value) || "";
    var descVal = (document.getElementById("resource-description") && document.getElementById("resource-description").value) || "";
    var linkVal = (document.getElementById("resource-link") && document.getElementById("resource-link").value) || "";
    var scheduleVal = (document.getElementById("resource-schedule") && document.getElementById("resource-schedule").value) || "";
    var notesVal = (document.getElementById("resource-notes") && document.getElementById("resource-notes").value) || "";

    var obj = {
      id: "res-" + Date.now(),
      subcategory: subcategoryVal || null,
      title: titleVal.trim() || "Untitled",
      type: typeVal.trim() || null,
      description: (descVal || "").trim(),
      location: (locationVal || "").trim() || null,
      link: (linkVal || "").trim() || "",
      vendor: sectionResolved === "Vendors"
    };
    if (scheduleVal.trim()) obj.schedule = scheduleVal.trim();
    var pills = (notesVal || "")
      .split(/[\n,]+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (pills.length) obj.pills = pills;

    if (formSubject) formSubject.value = "Acting Out OK – New resource submission";
    var addToSectionEl = document.getElementById("add-to-section");
    if (addToSectionEl) addToSectionEl.value = "Add the Resource JSON below to the \"" + sectionResolved + "\" array in data/resources.json";
    if (jsonField) jsonField.value = JSON.stringify(obj, null, 2);
    if (directoryJsonField) directoryJsonField.value = "";
    form.submit();
  });
})();
