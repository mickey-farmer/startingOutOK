(function () {
  // Set your contributor password here (or leave default and change after first use).
  // This is not secure – anyone with the page source can see it. It only keeps casual visitors out.
  var CONTRIBUTOR_PASSWORD = "actingoutok";

  var STORAGE_KEY = "actingoutok-contributor";

  var gate = document.getElementById("contributor-gate");
  var panel = document.getElementById("contributor-panel");
  var gateForm = document.getElementById("gate-form");
  var gatePassword = document.getElementById("gate-password");
  var gateError = document.getElementById("gate-error");
  var logoutBtn = document.getElementById("contributor-logout");
  var outputBlock = document.getElementById("contributor-output");
  var outputHint = document.getElementById("output-hint");
  var outputJson = document.getElementById("output-json");
  var outputCopy = document.getElementById("output-copy");

  function unlock() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
    gate.hidden = true;
    panel.hidden = false;
  }

  function lock() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    panel.hidden = true;
    gate.hidden = false;
    gatePassword.value = "";
    gateError.hidden = true;
  }

  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  gateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var pwd = gatePassword.value;
    gateError.hidden = true;
    if (pwd === CONTRIBUTOR_PASSWORD) {
      unlock();
    } else {
      gateError.hidden = false;
      gateError.setAttribute("aria-live", "polite");
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", lock);
  }

  if (isUnlocked()) {
    unlock();
  } else {
    lock();
  }

  // Tabs
  var tabs = document.querySelectorAll(".contributor-tabs [role=tab]");
  var panels = document.querySelectorAll(".contributor-panel-content");

  function showPanel(id) {
    panels.forEach(function (p) {
      p.hidden = p.id !== id;
    });
    tabs.forEach(function (t) {
      var selected = t.getAttribute("aria-controls") === id;
      t.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      showPanel(tab.getAttribute("aria-controls"));
    });
  });

  function slugify(text) {
    return (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // Casting: one form with project fields + role blocks (one or more)
  var ccRolesContainer = document.getElementById("cc-roles-container");
  var ccAddRoleBtn = document.getElementById("cc-add-role");

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
    ccRolesContainer.querySelectorAll(".role-block").forEach(function (block, i) {
      block.setAttribute("data-role-index", i);
      block.querySelector(".role-block-title").textContent = "Role " + (i + 1);
    });
  }

  if (ccAddRoleBtn) {
    ccAddRoleBtn.addEventListener("click", addRoleBlock);
  }

  // Quick-fill "Credit, Pay, and Copy" for any pay field (single or role block)
  var formCasting = document.getElementById("form-casting");
  if (formCasting) {
    formCasting.addEventListener("click", function (e) {
      if (e.target.classList.contains("pay-quick-fill")) {
        var wrap = e.target.closest(".pay-input-wrap");
        if (wrap) {
          var input = wrap.querySelector("input[type=text]");
          if (input) {
            input.value = "Credit, Pay, and Copy";
          }
        }
      }
    });
  }

  function collectRoles() {
    var roles = [];
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

  // Casting call form submit (always project + roles array; one role = one role block)
  document.getElementById("form-casting").addEventListener("submit", function (e) {
    e.preventDefault();
    var multiTitle = document.getElementById("cc-multi-title").value.trim();
    var roles = collectRoles();
    if (roles.length === 0) {
      outputHint.textContent = "Add at least one role.";
      outputBlock.hidden = false;
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
    outputHint.textContent = "Add this object to the top of the array in data/casting-calls.json (newest first). " + (roles.length === 1 ? "One role." : roles.length + " roles.") + " You can change the id.";
    outputJson.value = JSON.stringify(obj, null, 2);
    outputBlock.hidden = false;
    outputBlock.scrollIntoView({ behavior: "smooth" });
  });

  // Ensure one role block when Casting panel is shown; set default date
  function ensureCastingHasOneRole() {
    if (ccRolesContainer && ccRolesContainer.children.length === 0) {
      addRoleBlock();
    }
    var multiDate = document.getElementById("cc-multi-date");
    if (multiDate && !multiDate.value) {
      multiDate.value = todayISO();
    }
  }
  ensureCastingHasOneRole();
  tabs.forEach(function (tab) {
    var originalClick = tab.onclick || function () {};
    tab.addEventListener("click", function () {
      if (tab.getAttribute("aria-controls") === "panel-casting") {
        ensureCastingHasOneRole();
      }
    });
  });

  // News form
  document.getElementById("form-news").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var title = form.title.value.trim();
    var slug = form.slug.value.trim() || slugify(title);
    var obj = {
      id: "n" + Date.now(),
      date: form.date.value || todayISO(),
      title: title,
      excerpt: form.excerpt.value.trim(),
      slug: slug
    };
    outputHint.textContent = "Add this object to the top of the array in data/news.json (newest first). You can change the id and slug.";
    outputJson.value = JSON.stringify(obj, null, 2);
    outputBlock.hidden = false;
    outputBlock.scrollIntoView({ behavior: "smooth" });
  });

  var newsDate = document.getElementById("news-date");
  if (newsDate && !newsDate.value) {
    newsDate.value = todayISO();
  }

  // Resource form
  document.getElementById("form-resource").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target;
    var obj = {
      id: "r" + Date.now(),
      title: form.title.value.trim(),
      category: form.category.value,
      type: form.type.value.trim() || form.category.value,
      description: form.description.value.trim(),
      location: form.location.value.trim() || "",
      link: form.link.value.trim() || "",
      vendor: form.vendor.checked
    };
    var target = obj.vendor ? "data/resources.json → vendors array" : "data/resources.json → resources array";
    outputHint.textContent = "Add this object to " + target + ". Resources are sorted by section then alphabetically by title.";
    outputJson.value = JSON.stringify(obj, null, 2);
    outputBlock.hidden = false;
    outputBlock.scrollIntoView({ behavior: "smooth" });
  });

  // Copy button
  outputCopy.addEventListener("click", function () {
    outputJson.select();
    outputJson.setSelectionRange(0, 99999);
    try {
      document.execCommand("copy");
      outputCopy.textContent = "Copied";
      setTimeout(function () {
        outputCopy.textContent = "Copy to clipboard";
      }, 2000);
    } catch (err) {
      outputCopy.textContent = "Select and copy manually";
    }
  });
})();
