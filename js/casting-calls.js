/**
 * Casting calls list page – loads summary list from casting-calls.json,
 * renders cards that link to casting-call.html?slug=xxx for full details.
 */
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
  const filterLocation = document.getElementById("filter-location");
  const filterPay = document.getElementById("filter-pay");
  const filterType = document.getElementById("filter-type");
  const filterUnion = document.getElementById("filter-union");
  const filterUnder18 = document.getElementById("filter-under18");
  const filterExpiring = document.getElementById("filter-expiring");
  const filterReset = document.getElementById("filter-reset");

  let listItems = [];
  let activeTab = "all";

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

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

  function getPayCategory(entry) {
    var p = (entry.pay || "").toLowerCase();
    if (p.includes("deferred") || p.includes("copy") || p.includes("credit")) return "deferred";
    if (p.includes("volunteer") || p.includes("no pay") || p.includes("unpaid")) return "volunteer";
    if (p.includes("$") || p.includes("scale") || p.includes("paid")) return "paid";
    return "paid";
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  function entryMatchesFilters(entry) {
    if (filterUnder18 && filterUnder18.value === "yes" && !entry.under18) return false;
    if (filterUnder18 && filterUnder18.value === "no" && entry.under18) return false;
    if (filterExpiring && filterExpiring.value === "soon" && !isExpiringWithinWeek(entry)) return false;
    if (filterLocation && filterLocation.value && entry.location !== filterLocation.value) return false;
    if (filterType && filterType.value && entry.type !== filterType.value) return false;
    if (filterUnion && filterUnion.value && entry.union !== filterUnion.value) return false;
    if (filterPay && filterPay.value) {
      var cat = getPayCategory(entry);
      if (filterPay.value === "paid" && cat !== "paid") return false;
      if (filterPay.value === "deferred" && cat !== "deferred") return false;
      if (filterPay.value === "volunteer" && cat !== "volunteer") return false;
    }
    return true;
  }

  function isArchived(entry) {
    return entry.archived === true || entry.archived === "true";
  }

  function renderListCard(entry) {
    var slug = entry.slug || "";
    if (!slug) return null;
    var base = "casting-call.html";
    var url = base + "#" + encodeURIComponent(slug);
    var unionClass = (entry.union || "") === "Union" ? "casting-pill--union" : (entry.union || "") === "Non-Union" ? "casting-pill--nonunion" : "casting-pill--mixed";
    var pills = '<span class="casting-pill ' + unionClass + '">' + escapeHtml(entry.union || "Non-Union") + "</span>";
    if (entry.under18) pills += '<span class="casting-pill casting-pill--under18">Under 18</span>';
    var deadlineHtml = entry.auditionDeadline
      ? '<p class="casting-deadline casting-list-deadline"><strong>Audition by:</strong> ' + formatDeadlineDate(entry.auditionDeadline) + "</p>"
      : "";
    var meta = [];
    if (entry.date) meta.push('<time datetime="' + escapeHtml(entry.date) + '">Posted ' + formatDate(entry.date) + "</time>");
    if (entry.location) meta.push("📍 " + escapeHtml(entry.location));
    if (entry.pay) meta.push("💰 " + escapeHtml(entry.pay));
    if (entry.type) meta.push(escapeHtml(entry.type));
    if (entry.roleCount) meta.push(entry.roleCount + " role" + (entry.roleCount !== 1 ? "s" : ""));
    var metaHtml = meta.length ? '<div class="casting-list-meta">' + meta.join(" · ") + "</div>" : "";
    var shareUrl = window.location.origin + window.location.pathname.replace(/casting-calls\.html$/, "casting-call.html") + "#" + encodeURIComponent(slug);
    var card = document.createElement("article");
    card.className = "casting-list-card";
    card.innerHTML =
      '<a href="' + url + '" class="casting-list-card-link">' +
      '<h2 class="casting-list-card-title">' + escapeHtml(entry.title || "Untitled") + "</h2>" +
      '<div class="casting-pills">' + pills + "</div>" +
      deadlineHtml +
      metaHtml +
      "</a>" +
      '<div class="casting-share-row">' +
      '<button type="button" class="casting-share-btn" aria-label="Share this casting call">Share</button>' +
      "</div>";
    var shareBtn = card.querySelector(".casting-share-btn");
    if (shareBtn) {
      shareBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var title = (entry.title || "Casting call").trim();
        var text = "Casting call: " + title + " – Acting Out OK";
        if (navigator.share) {
          navigator.share({ title: title, text: text, url: shareUrl }).catch(function () { copyUrl(shareUrl); });
        } else {
          copyUrl(shareUrl);
        }
      });
    }
    return card;
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

  function render() {
    var active = listItems.filter(function (e) { return !isArchived(e); });
    var archived = listItems.filter(isArchived).slice().sort(function (a, b) {
      var da = a.date ? new Date(a.date).getTime() : 0;
      var db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });
    var filtered = active.filter(entryMatchesFilters);
    var expiringSoon = filtered.filter(isExpiringWithinWeek).slice().sort(function (a, b) {
      var da = (a.auditionDeadline || "").replace(/-/g, "");
      var db = (b.auditionDeadline || "").replace(/-/g, "");
      return parseInt(da, 10) - parseInt(db, 10);
    });

    if (expiringCountEl) expiringCountEl.textContent = expiringSoon.length;
    if (expiringGrid) {
      expiringGrid.innerHTML = "";
      expiringSoon.forEach(function (entry) {
        var card = renderListCard(entry);
        if (card) expiringGrid.appendChild(card);
      });
    }
    if (noResultsExpiring) noResultsExpiring.hidden = expiringSoon.length > 0;

    if (panelAll) panelAll.hidden = activeTab !== "all";
    if (panelExpiring) panelExpiring.hidden = activeTab !== "expiring";
    if (tabAll) tabAll.setAttribute("aria-selected", activeTab === "all");
    if (tabExpiring) tabExpiring.setAttribute("aria-selected", activeTab === "expiring");

    if (grid) {
      grid.querySelectorAll(".casting-list-card").forEach(function (el) { el.remove(); });
      if (noResults) noResults.hidden = filtered.length > 0;
      filtered.forEach(function (entry) {
        var card = renderListCard(entry);
        if (card) grid.insertBefore(card, noResults);
      });
    }

    if (archivedSection && archivedList && archivedSummary) {
      archivedSection.hidden = archived.length === 0;
      archivedSummary.textContent = "Archived (" + archived.length + ")";
      archivedList.innerHTML = "";
      archived.forEach(function (entry) {
        var li = document.createElement("li");
        li.className = "casting-archived-item";
        li.textContent = entry.title || "Untitled";
        archivedList.appendChild(li);
      });
    }
  }

  function clearFilters() {
    if (filterLocation) filterLocation.value = "";
    if (filterPay) filterPay.value = "";
    if (filterType) filterType.value = "";
    if (filterUnion) filterUnion.value = "";
    if (filterUnder18) filterUnder18.value = "";
    if (filterExpiring) filterExpiring.value = "";
    activeTab = "all";
  }

  function initFilters() {
    [filterLocation, filterPay, filterType, filterUnion, filterUnder18, filterExpiring].forEach(function (el) {
      if (el) el.addEventListener("change", render);
    });
    if (filterReset) filterReset.addEventListener("click", function () { clearFilters(); render(); });
  }

  function initTabs() {
    if (!tabAll || !tabExpiring) return;
    tabAll.addEventListener("click", function () { activeTab = "all"; render(); });
    tabExpiring.addEventListener("click", function () { activeTab = "expiring"; render(); });
  }

  function loadData() {
    var isFileProtocol = typeof window !== "undefined" && window.location && window.location.protocol === "file:";
    fetch("data/casting-calls.json")
      .then(function (r) {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(function (data) {
        listItems = (Array.isArray(data) ? data : []).slice();
        listItems.sort(function (a, b) {
          var da = a.date ? new Date(a.date).getTime() : 0;
          var db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        });
        render();
      })
      .catch(function (err) {
        var msg = "Unable to load casting calls.";
        if (isFileProtocol) msg += " Run a local server (e.g. npx serve .) and open via http://localhost.";
        else if (err && err.message) msg += " " + err.message;
        if (grid) grid.innerHTML = '<p class="no-results casting-load-error">' + msg + "</p>";
      });
  }

  initFilters();
  initTabs();
  loadData();
})();
