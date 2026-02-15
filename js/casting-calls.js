(function () {
  const grid = document.getElementById("casting-grid");
  const noResults = document.getElementById("no-results");
  const expiringGrid = document.getElementById("expiring-soon-grid");
  const expiringCountEl = document.getElementById("expiring-count");
  const noResultsExpiring = document.getElementById("no-results-expiring");
  const tabAll = document.getElementById("tab-all");
  const tabExpiring = document.getElementById("tab-expiring");
  const panelAll = document.getElementById("panel-all");
  const panelExpiring = document.getElementById("panel-expiring");
  const archivedSection = document.getElementById("archived-section");
  const archivedList = document.getElementById("archived-list");
  const archivedSummary = document.getElementById("archived-summary");
  const filterAge = document.getElementById("filter-age");
  const filterLocation = document.getElementById("filter-location");
  const filterPay = document.getElementById("filter-pay");
  const filterType = document.getElementById("filter-type");
  const filterUnion = document.getElementById("filter-union");
  const filterUnder18 = document.getElementById("filter-under18");
  const filterGender = document.getElementById("filter-gender");
  const filterEthnicity = document.getElementById("filter-ethnicity");
  const filterExpiring = document.getElementById("filter-expiring");
  const filterReset = document.getElementById("filter-reset");

  let castingCalls = [];
  let activeTab = "all";

  function formatDeadlineDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function isExpiringWithinWeek(entry) {
    var deadline = entry.auditionDeadline;
    if (!deadline) return false;
    var deadlineTime = new Date(deadline + "T23:59:59").getTime();
    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;
    return deadlineTime >= todayStart && deadlineTime <= weekEnd;
  }

  function getPayCategory(roleOrEntry) {
    if (roleOrEntry.payMin != null && roleOrEntry.payMax != null) {
      if (roleOrEntry.payMin === 0 && roleOrEntry.payMax === 0) return "volunteer";
      if (roleOrEntry.payMin > 0 || roleOrEntry.payMax > 0) return "paid";
    }
    const p = (roleOrEntry.pay || "").toLowerCase();
    if (p.includes("deferred") || p.includes("copy")) return "deferred";
    if (p.includes("volunteer") || p.includes("no pay")) return "volunteer";
    if (p.includes("$") || p.includes("scale") || p.includes("paid")) return "paid";
    return "paid";
  }

  function roleMatchesAge(role, ageVal) {
    if (!ageVal) return true;
    const parts = ageVal.split("-").map(Number);
    const min = parts[0];
    const max = parts[1];
    const roleMin = role.ageMin != null ? role.ageMin : (role.ageRange ? parseInt(role.ageRange.split("-")[0], 10) : null);
    const roleMax = role.ageMax != null ? role.ageMax : (role.ageRange ? parseInt(role.ageRange.split("-")[1], 10) : null);
    if (roleMin == null || roleMax == null) return role.ageRange === ageVal;
    if (max === undefined) return roleMax >= min;
    return roleMax >= min && roleMin <= max;
  }

  function deadlineHtml(entry) {
    if (!entry.auditionDeadline) return "";
    return '<p class="casting-deadline"><strong>Audition by:</strong> ' + formatDeadlineDate(entry.auditionDeadline) + "</p>";
  }

  function filmingHtml(entry) {
    if (!entry.filmingDates) return "";
    return '<p class="casting-filming"><strong>Filming:</strong> ' + escapeHtml(entry.filmingDates) + "</p>";
  }

  function submissionHtml(entry) {
    var details = (entry.submissionDetails || "").trim();
    var link = (entry.submissionLink || "").trim();
    if (!details && !link) return "";
    var out = '<div class="casting-submission">';
    out += '<h4 class="casting-submission-title">How to submit</h4>';
    if (details) {
      out += '<p class="casting-submission-details">' + escapeHtml(details) + "</p>";
    }
    if (link) {
      out += '<p class="casting-submission-link"><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Apply or submit here ↗</a></p>';
    }
    out += "</div>";
    return out;
  }

  function pillsHtml(entry) {
    var union = entry.union || "";
    var unionClass = union === "Union" ? "casting-pill--union" : union === "Non-Union" ? "casting-pill--nonunion" : "casting-pill--mixed";
    var unionLabel = union === "Union" ? "Union" : union === "Non-Union" ? "Non-Union" : "Union status varies";
    var unionPill = '<span class="casting-pill ' + unionClass + '" aria-label="Union status">' + escapeHtml(unionLabel) + "</span>";
    var under18Pill = entry.under18
      ? '<span class="casting-pill casting-pill--under18" aria-label="May involve performers under 18">Under 18</span>'
      : "";
    return '<div class="casting-pills">' + unionPill + (under18Pill ? under18Pill : "") + "</div>";
  }

  function multiPillsHtml(entry) {
    var unions = {};
    (entry.roles || []).forEach(function (r) {
      unions[r.union || "Non-Union"] = true;
    });
    var keys = Object.keys(unions);
    var unionClass = keys.length > 1 ? "casting-pill--mixed" : keys[0] === "Union" ? "casting-pill--union" : "casting-pill--nonunion";
    var unionLabel = keys.length > 1 ? "Mixed" : keys[0] || "Non-Union";
    var unionPill = '<span class="casting-pill ' + unionClass + '" aria-label="Union status">' + escapeHtml(unionLabel) + "</span>";
    var under18Pill = entry.under18
      ? '<span class="casting-pill casting-pill--under18" aria-label="May involve performers under 18">Under 18</span>'
      : "";
    return '<div class="casting-pills">' + unionPill + (under18Pill ? under18Pill : "") + "</div>";
  }

  function renderSingleCard(entry) {
    const exclusiveBadge = entry.exclusive
      ? '<span class="casting-exclusive">Acting Out OK Exclusive</span>'
      : "";
    const sourceLinkHtml =
      !entry.exclusive && entry.sourceLink
        ? '<div class="casting-source"><a href="' + entry.sourceLink + '" target="_blank" rel="noopener noreferrer">View original source ↗</a></div>'
        : "";
    const deadlineLine = deadlineHtml(entry);
    const filmingLine = filmingHtml(entry);
    const submissionBlock = submissionHtml(entry);
    const pills = pillsHtml(entry);
    return (
      exclusiveBadge +
      "<h3>" + escapeHtml(entry.title) + "</h3>" +
      pills +
      '<div class="casting-meta">' +
      '<span>💰 ' + escapeHtml(entry.pay) + "</span>" +
      '<span>📍 ' + escapeHtml(entry.location) + "</span>" +
      '<span>👤 ' + escapeHtml(entry.director) + "</span>" +
      '<span>📅 ' + escapeHtml(entry.ageRange) + "</span>" +
      '<span>' + escapeHtml(entry.type) + "</span>" +
      (entry.gender ? '<span>Seeking: ' + escapeHtml(entry.gender) + "</span>" : "") +
      (entry.ethnicity ? '<span>' + escapeHtml(entry.ethnicity) + "</span>" : "") +
      "</div>" +
      deadlineLine +
      filmingLine +
      '<details class="casting-desc-details">' +
      '<summary class="casting-desc-summary">Description</summary>' +
      '<p class="casting-desc">' + escapeHtml(entry.description) + "</p>" +
      "</details>" +
      submissionBlock +
      sourceLinkHtml
    );
  }

  function renderMultiRoleCard(entry) {
    const exclusiveBadge = entry.exclusive
      ? '<span class="casting-exclusive">Acting Out OK Exclusive</span>'
      : "";
    const sourceLinkHtml =
      !entry.exclusive && entry.sourceLink
        ? '<div class="casting-source"><a href="' + entry.sourceLink + '" target="_blank" rel="noopener noreferrer">View original source ↗</a></div>'
        : "";
    const roleCount = entry.roles.length;
    const pills = multiPillsHtml(entry);
    let meta =
      '<span>📍 ' + escapeHtml(entry.location) + "</span>" +
      '<span>👤 ' + escapeHtml(entry.director) + "</span>" +
      '<span>' + roleCount + " role" + (roleCount !== 1 ? "s" : "") + "</span>";
    let rolesHtml = '<div class="casting-roles">';
    entry.roles.forEach(function (role) {
      var roleDesc = (role.description || "").trim();
      var roleDescHtml = roleDesc
        ? '<details class="casting-role-desc-details">' +
          '<summary class="casting-role-desc-summary">Details</summary>' +
          '<p class="casting-role-desc">' + escapeHtml(role.description) + "</p>" +
          "</details>"
        : "";
      rolesHtml +=
        '<div class="casting-role">' +
        '<h4 class="casting-role-title">' + escapeHtml(role.roleTitle) + "</h4>" +
        '<div class="casting-role-meta">' +
        '<span>💰 ' + escapeHtml(role.pay || "") + "</span>" +
        '<span>📅 ' + escapeHtml(role.ageRange || "") + "</span>" +
        '<span>' + escapeHtml(role.type || "") + " · " + escapeHtml(role.union || "") + "</span>" +
        (role.gender ? '<span>Seeking: ' + escapeHtml(role.gender) + "</span>" : "") +
        (role.ethnicity ? '<span>' + escapeHtml(role.ethnicity) + "</span>" : "") +
        "</div>" +
        roleDescHtml +
        "</div>";
    });
    rolesHtml += "</div>";
    const projectDesc = entry.description
      ? '<details class="casting-desc-details casting-project-desc-details">' +
        '<summary class="casting-desc-summary">Project description</summary>' +
        '<p class="casting-desc casting-project-desc">' + escapeHtml(entry.description) + "</p>" +
        "</details>"
      : "";
    const deadlineLine = deadlineHtml(entry);
    const filmingLine = filmingHtml(entry);
    const submissionBlock = submissionHtml(entry);
    return (
      exclusiveBadge +
      "<h3>" + escapeHtml(entry.title) + "</h3>" +
      pills +
      '<div class="casting-meta">' + meta + "</div>" +
      deadlineLine +
      filmingLine +
      projectDesc +
      rolesHtml +
      submissionBlock +
      sourceLinkHtml
    );
  }

  function renderCard(entry) {
    const card = document.createElement("article");
    card.className = "casting-card" + (entry.roles && entry.roles.length > 0 ? " casting-card--multi" : "");
    card.dataset.id = entry.id;
    card.innerHTML =
      entry.roles && entry.roles.length > 0
        ? renderMultiRoleCard(entry)
        : renderSingleCard(entry);
    return card;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  function entryMatchesFilters(entry) {
    const under18Val = filterUnder18 && filterUnder18.value;
    if (under18Val === "yes" && !entry.under18) return false;
    if (under18Val === "no" && entry.under18) return false;

    const expiringVal = filterExpiring && filterExpiring.value;
    if (expiringVal === "soon" && !isExpiringWithinWeek(entry)) return false;

    const genderVal = filterGender && filterGender.value;
    const ethnicityVal = filterEthnicity && filterEthnicity.value;

    if (entry.roles && entry.roles.length > 0) {
      if (genderVal) {
        var roleGenderMatch = entry.roles.some(function (r) {
          return (r.gender || "").toLowerCase() === genderVal.toLowerCase();
        });
        if (!roleGenderMatch) return false;
      }
      if (ethnicityVal === "all") {
        var roleEthnicityMatch = entry.roles.some(function (r) {
          var e = (r.ethnicity || "").toLowerCase();
          return !e || e.indexOf("all") !== -1 || e.indexOf("any") !== -1 || e.indexOf("open") !== -1;
        });
        if (!roleEthnicityMatch) return false;
      }
    } else {
      if (genderVal && (entry.gender || "").toLowerCase() !== genderVal.toLowerCase()) return false;
      if (ethnicityVal === "all") {
        var e = (entry.ethnicity || "").toLowerCase();
        if (e && e.indexOf("all") === -1 && e.indexOf("any") === -1 && e.indexOf("open") === -1) return false;
      }
    }

    const locationVal = filterLocation.value;
    if (locationVal && entry.location !== locationVal) return false;

    if (entry.roles && entry.roles.length > 0) {
      const ageVal = filterAge.value;
      const payVal = filterPay.value;
      const typeVal = filterType.value;
      const unionVal = filterUnion.value;
      const anyRoleMatches = entry.roles.some(function (role) {
        if (ageVal && !roleMatchesAge(role, ageVal)) return false;
        if (typeVal && role.type !== typeVal) return false;
        if (unionVal && role.union !== unionVal) return false;
        if (payVal) {
          const cat = getPayCategory(role);
          if (payVal === "paid" && cat !== "paid") return false;
          if (payVal === "deferred" && cat !== "deferred") return false;
          if (payVal === "volunteer" && cat !== "volunteer") return false;
        }
        return true;
      });
      return anyRoleMatches;
    }

    const ageVal = filterAge.value;
    if (ageVal) {
      const [min, max] = ageVal.split("-").map(Number);
      if (max === undefined) {
        if (entry.ageMax == null || entry.ageMax < min) return false;
      } else if (entry.ageMin == null || entry.ageMax == null) {
        if (entry.ageRange !== ageVal) return false;
      } else {
        if (entry.ageMax < min || entry.ageMin > max) return false;
      }
    }
    if (filterType.value && entry.type !== filterType.value) return false;
    if (filterUnion.value && entry.union !== filterUnion.value) return false;
    const payVal = filterPay.value;
    if (payVal) {
      const cat = getPayCategory(entry);
      if (payVal === "paid" && cat !== "paid") return false;
      if (payVal === "deferred" && cat !== "deferred") return false;
      if (payVal === "volunteer" && cat !== "volunteer") return false;
    }
    return true;
  }

  function isArchived(entry) {
    return entry.archived === true || entry.archived === "true";
  }

  function isDeleted(entry) {
    return entry.deleted === "yes" || entry.deleted === true;
  }

  function render() {
    const active = castingCalls.filter(function (e) { return !isArchived(e) && !isDeleted(e); });
    const archived = castingCalls.filter(function (e) { return isArchived(e) && !isDeleted(e); }).slice().sort(function (a, b) {
      var da = a.date ? new Date(a.date).getTime() : 0;
      var db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
    const filtered = active.filter(entryMatchesFilters);
    const expiringSoon = filtered.filter(isExpiringWithinWeek).slice().sort(function (a, b) {
      var da = (a.auditionDeadline || "").replace(/-/g, "");
      var db = (b.auditionDeadline || "").replace(/-/g, "");
      return parseInt(da, 10) - parseInt(db, 10);
    });

    if (expiringCountEl) expiringCountEl.textContent = expiringSoon.length;
    if (expiringGrid) {
      expiringGrid.innerHTML = "";
      expiringSoon.forEach(function (entry) {
        expiringGrid.appendChild(renderCard(entry));
      });
    }
    if (noResultsExpiring) noResultsExpiring.hidden = expiringSoon.length > 0;

    if (panelAll) panelAll.hidden = activeTab !== "all";
    if (panelExpiring) panelExpiring.hidden = activeTab !== "expiring";
    if (tabAll) tabAll.setAttribute("aria-selected", activeTab === "all");
    if (tabExpiring) tabExpiring.setAttribute("aria-selected", activeTab === "expiring");

    grid.querySelectorAll(".casting-card").forEach((el) => el.remove());
    noResults.hidden = filtered.length > 0;
    filtered.forEach((entry) => grid.insertBefore(renderCard(entry), noResults));

    if (archivedSection && archivedList && archivedSummary) {
      archivedSection.hidden = archived.length === 0;
      archivedSummary.textContent = "Archived (" + archived.length + ")";
      archivedList.innerHTML = "";
      archived.forEach(function (entry) {
        const li = document.createElement("li");
        li.className = "casting-archived-item";
        li.textContent = entry.title || "Untitled";
        archivedList.appendChild(li);
      });
    }
  }

  function initFilters() {
    var filterEls = [filterAge, filterLocation, filterPay, filterType, filterUnion];
    if (filterUnder18) filterEls.push(filterUnder18);
    if (filterGender) filterEls.push(filterGender);
    if (filterEthnicity) filterEls.push(filterEthnicity);
    if (filterExpiring) filterEls.push(filterExpiring);
    filterEls.forEach(function (el) {
      if (el) el.addEventListener("change", render);
    });
    filterReset.addEventListener("click", function () {
      filterAge.value = "";
      filterLocation.value = "";
      filterPay.value = "";
      filterType.value = "";
      filterUnion.value = "";
      if (filterUnder18) filterUnder18.value = "";
      if (filterGender) filterGender.value = "";
      if (filterEthnicity) filterEthnicity.value = "";
      if (filterExpiring) filterExpiring.value = "";
      render();
    });
  }

  function loadData() {
    var isFileProtocol = typeof window !== "undefined" && window.location && window.location.protocol === "file:";
    fetch("data/casting-calls.json")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        castingCalls = (Array.isArray(data) ? data : []).slice();
        // Newest first (reverse chronological by date)
        castingCalls.sort(function (a, b) {
          var da = a.date ? new Date(a.date).getTime() : 0;
          var db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        });
        render();
      })
      .catch(function (err) {
        var msg = "Unable to load casting calls.";
        if (isFileProtocol) {
          msg += " Browsers block loading local JSON when the page is opened via file://. Run a local server (e.g. <code>npx serve .</code> or <code>python3 -m http.server 8000</code>) and open the site via http://localhost.";
        } else {
          msg += " " + (err && err.message ? err.message : "Please try again later.");
        }
        grid.innerHTML = '<p class="no-results casting-load-error">' + msg + "</p>";
      });
  }

  function initTabs() {
    if (!tabAll || !tabExpiring) return;
    function switchTo(tab) {
      activeTab = tab;
      render();
    }
    tabAll.addEventListener("click", function () { switchTo("all"); });
    tabExpiring.addEventListener("click", function () { switchTo("expiring"); });
    tabAll.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "End") { e.preventDefault(); tabExpiring.focus(); tabExpiring.click(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); tabAll.focus(); }
    });
    tabExpiring.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "Home") { e.preventDefault(); tabAll.focus(); tabAll.click(); }
      if (e.key === "ArrowRight") { e.preventDefault(); tabExpiring.focus(); }
    });
  }

  initFilters();
  initTabs();
  loadData();
})();
