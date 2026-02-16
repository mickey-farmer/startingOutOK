/**
 * Casting call detail page – loads full call from data/casting-calls/{slug}.json
 * and renders it (same structure as former full card on list page).
 */
(function () {
  const root = document.getElementById("casting-call-root");
  const loadingEl = document.getElementById("casting-call-loading");

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("slug");
    if (fromQuery) return fromQuery;
    var hash = (window.location.hash || "").slice(1).trim();
    if (hash) return decodeURIComponent(hash);
    return "";
  }

  function getDataBase() {
    try {
      var script = document.currentScript || document.querySelector('script[src*="casting-call.js"]');
      if (script && script.src) {
        var url = new URL(script.src);
        var path = url.pathname.replace(/\/js\/casting-call\.js$/i, "") || "/";
        if (!path.endsWith("/")) path += "/";
        return url.origin + path;
      }
    } catch (e) {}
    return "";
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  function formatDeadlineDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
    if (details) out += '<p class="casting-submission-details">' + escapeHtml(details) + "</p>";
    if (link) out += '<p class="casting-submission-link"><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener noreferrer">Apply or submit here ↗</a></p>';
    out += "</div>";
    return out;
  }

  function pillsHtml(entry) {
    var union = entry.union || "";
    var unionClass = union === "Union" ? "casting-pill--union" : union === "Non-Union" ? "casting-pill--nonunion" : "casting-pill--mixed";
    var unionLabel = union || "Non-Union";
    var unionPill = '<span class="casting-pill ' + unionClass + '">' + escapeHtml(unionLabel) + "</span>";
    var under18Pill = entry.under18 ? '<span class="casting-pill casting-pill--under18">Under 18</span>' : "";
    return '<div class="casting-pills">' + unionPill + under18Pill + "</div>";
  }

  function multiPillsHtml(entry) {
    var unions = {};
    (entry.roles || []).forEach(function (r) { unions[r.union || "Non-Union"] = true; });
    var keys = Object.keys(unions);
    var unionClass = keys.length > 1 ? "casting-pill--mixed" : keys[0] === "Union" ? "casting-pill--union" : "casting-pill--nonunion";
    var unionLabel = keys.length > 1 ? "Mixed" : keys[0] || "Non-Union";
    var unionPill = '<span class="casting-pill ' + unionClass + '">' + escapeHtml(unionLabel) + "</span>";
    var under18Pill = entry.under18 ? '<span class="casting-pill casting-pill--under18">Under 18</span>' : "";
    return '<div class="casting-pills">' + unionPill + under18Pill + "</div>";
  }

  function renderSingleCard(entry) {
    var role = (entry.roles && entry.roles[0]) || {};
    var exclusiveBadge = entry.exclusive ? '<span class="casting-exclusive">Acting Out OK Exclusive</span>' : "";
    var sourceLinkHtml = !entry.exclusive && entry.sourceLink
      ? '<div class="casting-source"><a href="' + escapeHtml(entry.sourceLink) + '" target="_blank" rel="noopener noreferrer">View original source ↗</a></div>'
      : "";
    var deadlineLine = deadlineHtml(entry);
    var filmingLine = filmingHtml(entry);
    var submissionBlock = submissionHtml(entry);
    var pillsEntry = { union: role.union || entry.union || "Non-Union", under18: entry.under18 };
    var pills = pillsHtml(pillsEntry);
    var meta = '<span>💰 ' + escapeHtml(role.pay || entry.pay || "") + "</span>" +
      '<span>📍 ' + escapeHtml(entry.location || "") + "</span>" +
      '<span>👤 ' + escapeHtml(entry.director || "") + "</span>" +
      '<span>📅 ' + escapeHtml(role.ageRange || "") + "</span>" +
      '<span>' + escapeHtml(role.type || entry.type || "") + "</span>" +
      (role.gender ? '<span>Seeking: ' + escapeHtml(role.gender) + "</span>" : "") +
      (role.ethnicity ? '<span>' + escapeHtml(role.ethnicity) + "</span>" : "");
    var projectDesc = entry.description
      ? '<details class="casting-desc-details casting-project-desc-details" open><summary class="casting-desc-summary">Project description</summary><p class="casting-desc casting-project-desc">' + escapeHtml(entry.description) + "</p></details>"
      : "";
    var roleDesc = (role.description || "").trim();
    var roleDescHtml = roleDesc
      ? '<details class="casting-role-desc-details" open><summary class="casting-role-desc-summary">Details</summary><p class="casting-role-desc">' + escapeHtml(role.description) + "</p></details>"
      : "";
    var roleBlock = '<div class="casting-roles">' +
      '<div class="casting-role">' +
      '<h4 class="casting-role-title">' + escapeHtml(role.roleTitle || "") + "</h4>" +
      '<div class="casting-role-meta">' +
      '<span>💰 ' + escapeHtml(role.pay || "") + "</span>" +
      '<span>📅 ' + escapeHtml(role.ageRange || "") + "</span>" +
      '<span>' + escapeHtml(role.type || "") + " · " + escapeHtml(role.union || "") + "</span>" +
      (role.gender ? '<span>Seeking: ' + escapeHtml(role.gender) + "</span>" : "") +
      (role.ethnicity ? '<span>' + escapeHtml(role.ethnicity) + "</span>" : "") +
      "</div>" + roleDescHtml + "</div></div>";
    return exclusiveBadge +
      "<h1 class=\"casting-detail-title\">" + escapeHtml(entry.title || "Untitled") + "</h1>" +
      pills +
      '<div class="casting-meta">' + meta + "</div>" +
      deadlineLine + filmingLine +
      projectDesc + roleBlock +
      submissionBlock + sourceLinkHtml;
  }

  function renderMultiRoleCard(entry) {
    var exclusiveBadge = entry.exclusive ? '<span class="casting-exclusive">Acting Out OK Exclusive</span>' : "";
    var sourceLinkHtml = !entry.exclusive && entry.sourceLink
      ? '<div class="casting-source"><a href="' + escapeHtml(entry.sourceLink) + '" target="_blank" rel="noopener noreferrer">View original source ↗</a></div>'
      : "";
    var roleCount = (entry.roles || []).length;
    var pills = multiPillsHtml(entry);
    var meta = '<span>📍 ' + escapeHtml(entry.location || "") + "</span>" +
      '<span>👤 ' + escapeHtml(entry.director || "") + "</span>" +
      '<span>' + roleCount + " role" + (roleCount !== 1 ? "s" : "") + "</span>";
    var rolesHtml = '<div class="casting-roles">';
    (entry.roles || []).forEach(function (role) {
      var roleDesc = (role.description || "").trim();
      var roleDescHtml = roleDesc
        ? '<details class="casting-role-desc-details" open><summary class="casting-role-desc-summary">Details</summary><p class="casting-role-desc">' + escapeHtml(role.description) + "</p></details>"
        : "";
      rolesHtml += '<div class="casting-role">' +
        '<h4 class="casting-role-title">' + escapeHtml(role.roleTitle || "") + "</h4>" +
        '<div class="casting-role-meta">' +
        '<span>💰 ' + escapeHtml(role.pay || "") + "</span>" +
        '<span>📅 ' + escapeHtml(role.ageRange || "") + "</span>" +
        '<span>' + escapeHtml(role.type || "") + " · " + escapeHtml(role.union || "") + "</span>" +
        (role.gender ? '<span>Seeking: ' + escapeHtml(role.gender) + "</span>" : "") +
        (role.ethnicity ? '<span>' + escapeHtml(role.ethnicity) + "</span>" : "") +
        "</div>" + roleDescHtml + "</div>";
    });
    rolesHtml += "</div>";
    var projectDesc = entry.description
      ? '<details class="casting-desc-details casting-project-desc-details" open><summary class="casting-desc-summary">Project description</summary><p class="casting-desc casting-project-desc">' + escapeHtml(entry.description) + "</p></details>"
      : "";
    var deadlineLine = deadlineHtml(entry);
    var filmingLine = filmingHtml(entry);
    var submissionBlock = submissionHtml(entry);
    return exclusiveBadge +
      "<h1 class=\"casting-detail-title\">" + escapeHtml(entry.title || "Untitled") + "</h1>" +
      pills +
      '<div class="casting-meta">' + meta + "</div>" +
      deadlineLine + filmingLine +
      projectDesc + rolesHtml +
      submissionBlock + sourceLinkHtml;
  }

  function showError(message) {
    if (!root) return;
    root.innerHTML =
      "<p class=\"casting-call-message\">" + (message || "Casting call not found.") + "</p>" +
      "<p><a href=\"casting-calls.html\">&larr; Back to Casting Calls</a></p>";
  }

  function showShareFeedback() {
    var el = document.querySelector(".casting-share-feedback");
    if (el) el.remove();
    el = document.createElement("span");
    el.className = "casting-share-feedback";
    el.setAttribute("aria-live", "polite");
    el.textContent = "Link copied!";
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
  }

  function copyUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(showShareFeedback).catch(function () { fallbackCopy(url); });
    } else {
      fallbackCopy(url);
    }
  }

  function fallbackCopy(url) {
    var ta = document.createElement("textarea");
    ta.value = url;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      showShareFeedback();
    } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  function render(entry) {
    if (!root || !entry) return;
    var title = entry.title || "Untitled";
    document.title = title + " – Acting Out OK";
    var isMulti = entry.roles && entry.roles.length > 0;
    var cardHtml = isMulti && entry.roles.length > 1
      ? renderMultiRoleCard(entry)
      : renderSingleCard(entry);
    var shareUrl = window.location.href;
    root.innerHTML =
      '<p class="casting-call-back"><a href="casting-calls.html">&larr; Back to Casting Calls</a></p>' +
      '<div class="casting-card casting-card--detail' + (isMulti && entry.roles.length > 1 ? " casting-card--multi" : "") + '">' +
      cardHtml +
      '<div class="casting-share-row">' +
      '<button type="button" class="casting-share-btn" aria-label="Share this casting call">Share</button>' +
      "</div></div>";
    var shareBtn = root.querySelector(".casting-share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function () {
        var text = "Casting call: " + title + " – Acting Out OK";
        if (navigator.share) {
          navigator.share({ title: title, text: text, url: shareUrl }).catch(function () { copyUrl(shareUrl); });
        } else {
          copyUrl(shareUrl);
        }
      });
    }
  }

  var slug = getSlug();
  if (!slug) {
    if (loadingEl) loadingEl.remove();
    showError("No casting call specified.");
    return;
  }

  var base = getDataBase();
  var dataUrl = (base ? base + "data/casting-calls/" : "data/casting-calls/") + encodeURIComponent(slug) + ".json";

  var settled = false;
  function done() {
    if (settled) return;
    settled = true;
    if (loadingEl) loadingEl.remove();
  }

  var timeoutId = setTimeout(function () {
    if (settled) return;
    done();
    showError("Casting call not found or unable to load.");
  }, 10000);

  fetch(dataUrl)
    .then(function (r) {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    })
    .then(function (data) {
      if (settled) return;
      if (data.deleted === "yes" || data.deleted === true) {
        done();
        clearTimeout(timeoutId);
        showError("This casting call is no longer available.");
        return;
      }
      done();
      clearTimeout(timeoutId);
      render(data);
    })
    .catch(function () {
      if (!settled) {
        done();
        clearTimeout(timeoutId);
        showError("Casting call not found or unable to load.");
      }
    });
})();
