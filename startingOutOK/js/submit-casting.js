(function () {
  var form = document.getElementById("form-submit-casting");
  var thankYou = document.getElementById("submit-thank-you");

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

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  var ccRolesContainer = document.getElementById("cc-roles-container");
  var ccAddRoleBtn = document.getElementById("cc-add-role");
  var jsonField = document.getElementById("casting-call-json");

  function getRoleBlockHTML(index) {
    return (
      '<div class="role-block" data-role-index="' + index + '">' +
      '<div class="role-block-header">' +
      '<span class="role-block-title">Role ' + (index + 1) + '</span>' +
      '<button type="button" class="role-block-remove" aria-label="Remove role">Remove</button>' +
      "</div>" +
      '<div class="form-row"><label>Role title</label><input type="text" class="role-roleTitle" placeholder="e.g. Lead – Maya" /></div>' +
      '<div class="form-row"><label>Description</label><textarea class="role-description" rows="3" placeholder="Role description"></textarea></div>' +
      '<div class="form-row form-row-pay"><label>Pay (display text – any text)</label><div class="pay-input-wrap"><input type="text" class="role-pay" placeholder="e.g. $500/day or Credit, Pay, and Copy" /><button type="button" class="pay-quick-fill" aria-label="Fill with Credit, Pay, and Copy">Credit, Pay, and Copy</button></div></div>' +
      '<div class="form-row two-cols">' +
      '<div><label>Pay min</label><input type="number" class="role-payMin" min="0" placeholder="optional" /></div>' +
      '<div><label>Pay max</label><input type="number" class="role-payMax" min="0" placeholder="optional" /></div>' +
      "</div>" +
      '<div class="form-row"><label>Age range (display)</label><input type="text" class="role-ageRange" placeholder="e.g. 28-35" /></div>' +
      '<div class="form-row two-cols">' +
      '<div><label>Age min</label><input type="number" class="role-ageMin" min="0" placeholder="optional" /></div>' +
      '<div><label>Age max</label><input type="number" class="role-ageMax" min="0" placeholder="optional" /></div>' +
      "</div>" +
      '<div class="form-row two-cols">' +
      '<div><label>Type</label><select class="role-type"><option value="Feature Film">Feature Film</option><option value="Short Film">Short Film</option><option value="Commercial">Commercial</option><option value="Voice Over">Voice Over</option><option value="Theatre">Theatre</option></select></div>' +
      '<div><label>Union</label><select class="role-union"><option value="Non-Union">Non-Union</option><option value="Union">Union</option></select></div>' +
      "</div>" +
      '<div class="form-row two-cols">' +
      '<div><label>Gender seeking</label><select class="role-gender"><option value="">—</option><option value="Female">Female</option><option value="Male">Male</option><option value="Any">Any</option><option value="All genders">All genders</option><option value="Non-binary">Non-binary</option></select></div>' +
      '<div><label>Ethnicity</label><select class="role-ethnicity"><option value="">—</option><option value="All ethnicities">All ethnicities</option><option value="Open to all">Open to all</option><option value="See listing">See listing</option></select></div>' +
      "</div>" +
      "</div>"
    );
  }

  function addRoleBlock() {
    if (!ccRolesContainer) return;
    var index = ccRolesContainer.querySelectorAll(".role-block").length;
    var wrap = document.createElement("div");
    wrap.innerHTML = getRoleBlockHTML(index);
    var block = wrap.firstElementChild;
    ccRolesContainer.appendChild(block);
    block.querySelector(".role-block-remove").addEventListener("click", function () {
      if (ccRolesContainer.querySelectorAll(".role-block").length > 1) {
        block.remove();
        reindexRoleBlocks();
      }
    });
  }

  function reindexRoleBlocks() {
    if (!ccRolesContainer) return;
    ccRolesContainer.querySelectorAll(".role-block").forEach(function (block, i) {
      block.setAttribute("data-role-index", i);
      block.querySelector(".role-block-title").textContent = "Role " + (i + 1);
    });
  }

  if (ccRolesContainer && ccRolesContainer.children.length === 0) {
    addRoleBlock();
  }
  var multiDate = document.getElementById("cc-multi-date");
  if (multiDate && !multiDate.value) {
    multiDate.value = todayISO();
  }
  if (ccAddRoleBtn) {
    ccAddRoleBtn.addEventListener("click", addRoleBlock);
  }

  form.addEventListener("click", function (e) {
    if (e.target.classList.contains("pay-quick-fill")) {
      var wrap = e.target.closest(".pay-input-wrap");
      if (wrap) {
        var input = wrap.querySelector("input[type=text]");
        if (input) input.value = "Credit, Pay, and Copy";
      }
    }
  });

  function collectRoles() {
    var roles = [];
    if (!ccRolesContainer) return roles;
    ccRolesContainer.querySelectorAll(".role-block").forEach(function (block) {
      var roleTitle = (block.querySelector(".role-roleTitle") && block.querySelector(".role-roleTitle").value) || "";
      var description = (block.querySelector(".role-description") && block.querySelector(".role-description").value) || "";
      var pay = (block.querySelector(".role-pay") && block.querySelector(".role-pay").value) || "";
      var payMinEl = block.querySelector(".role-payMin");
      var payMaxEl = block.querySelector(".role-payMax");
      var payMin = payMinEl && payMinEl.value.trim() !== "" ? parseInt(payMinEl.value, 10) : null;
      var payMax = payMaxEl && payMaxEl.value.trim() !== "" ? parseInt(payMaxEl.value, 10) : null;
      var ageRange = (block.querySelector(".role-ageRange") && block.querySelector(".role-ageRange").value) || "";
      var ageMinEl = block.querySelector(".role-ageMin");
      var ageMaxEl = block.querySelector(".role-ageMax");
      var ageMin = ageMinEl && ageMinEl.value.trim() !== "" ? parseInt(ageMinEl.value, 10) : null;
      var ageMax = ageMaxEl && ageMaxEl.value.trim() !== "" ? parseInt(ageMaxEl.value, 10) : null;
      var typeEl = block.querySelector(".role-type");
      var unionEl = block.querySelector(".role-union");
      var genderEl = block.querySelector(".role-gender");
      var ethnicityEl = block.querySelector(".role-ethnicity");
      var type = typeEl ? typeEl.value : "Short Film";
      var union = unionEl ? unionEl.value : "Non-Union";
      var roleObj = {
        roleTitle: roleTitle,
        description: description,
        pay: pay,
        payMin: payMin,
        payMax: payMax,
        ageRange: ageRange,
        ageMin: ageMin,
        ageMax: ageMax,
        type: type,
        union: union
      };
      if (genderEl && genderEl.value) roleObj.gender = genderEl.value;
      if (ethnicityEl && ethnicityEl.value) roleObj.ethnicity = ethnicityEl.value;
      roles.push(roleObj);
    });
    return roles;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var multiTitle = document.getElementById("cc-multi-title").value.trim();
    var roles = collectRoles();
    if (roles.length === 0) {
      alert("Please add at least one role.");
      return;
    }
    var multiDeadline = document.getElementById("cc-multi-auditionDeadline").value.trim();
    var multiUnder18 = document.getElementById("cc-multi-under18").checked;
    var multiFilming = document.getElementById("cc-multi-filmingDates").value.trim();
    var multiSubmissionDetails = document.getElementById("cc-multi-submissionDetails").value.trim();
    var multiSubmissionLink = document.getElementById("cc-multi-submissionLink").value.trim();
    var obj = {
      id: "new-" + Date.now(),
      date: document.getElementById("cc-multi-date").value || todayISO(),
      auditionDeadline: multiDeadline || undefined,
      under18: multiUnder18 || undefined,
      title: multiTitle || "Untitled project",
      description: document.getElementById("cc-multi-description").value.trim() || "",
      location: document.getElementById("cc-multi-location").value.trim() || "",
      director: document.getElementById("cc-multi-director").value.trim() || "",
      filmingDates: multiFilming || undefined,
      submissionDetails: multiSubmissionDetails || undefined,
      submissionLink: multiSubmissionLink || undefined,
      sourceLink: document.getElementById("cc-multi-sourceLink").value.trim() || "",
      exclusive: document.getElementById("cc-multi-exclusive").checked,
      roles: roles
    };
    if (obj.auditionDeadline === undefined) delete obj.auditionDeadline;
    if (obj.under18 === undefined) delete obj.under18;
    if (obj.filmingDates === undefined) delete obj.filmingDates;
    if (obj.submissionDetails === undefined) delete obj.submissionDetails;
    if (obj.submissionLink === undefined) delete obj.submissionLink;
    if (jsonField) {
      jsonField.value = JSON.stringify(obj, null, 2);
    }
    form.submit();
  });
})();
