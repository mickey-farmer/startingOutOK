(function () {
  var form = document.getElementById("form-submit-news");
  var thankYou = document.getElementById("submit-thank-you");
  var typeSelect = document.getElementById("news-type");
  var typeOtherWrap = document.getElementById("news-type-other-wrap");
  var typeOtherInput = document.getElementById("news-type-other");
  var tosCheckbox = document.getElementById("news-tos");

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

  // Formspree _next redirect to this page with ?submitted=1
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

  function toggleTypeOther() {
    if (!typeOtherWrap || !typeSelect) return;
    var val = typeSelect.value;
    typeOtherWrap.hidden = val !== "Other";
    if (typeOtherWrap.hidden) {
      if (typeOtherInput) {
        typeOtherInput.removeAttribute("required");
        typeOtherInput.value = "";
      }
    } else {
      if (typeOtherInput) typeOtherInput.setAttribute("required", "required");
    }
  }

  if (typeSelect) {
    typeSelect.addEventListener("change", toggleTypeOther);
  }
  toggleTypeOther();

  // TOS check on submit (in addition to required attribute)
  if (form && tosCheckbox) {
    form.addEventListener("submit", function (e) {
      if (!tosCheckbox.checked) {
        e.preventDefault();
        alert("You must agree to the Terms of Service to submit.");
        tosCheckbox.focus();
      }
    });
  }
})();
