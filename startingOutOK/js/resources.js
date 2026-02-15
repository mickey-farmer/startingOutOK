(function () {
  const resourcesGrid = document.getElementById("resources-grid");
  const vendorsGrid = document.getElementById("vendors-grid");
  const resourcesNoResults = document.getElementById("resources-no-results");
  const vendorsNoResults = document.getElementById("vendors-no-results");
  const filterSection = document.getElementById("filter-section");
  const filterCategory = document.getElementById("filter-category");
  const filterLocation = document.getElementById("filter-location");
  const filterReset = document.getElementById("filter-reset");
  const resourcesSection = document.getElementById("resources-section");
  const vendorsSection = document.getElementById("vendors-section");

  let resources = [];
  let vendors = [];

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function renderResourceCard(entry) {
    const card = document.createElement("article");
    card.className = "resource-card";
    card.dataset.id = entry.id;
    const linkHtml = entry.link
      ? '<a href="' + entry.link + '" target="_blank" rel="noopener noreferrer" class="resource-link">Learn more ↗</a>'
      : "";
    card.innerHTML =
      '<span class="resource-category">' + escapeHtml(entry.category) + " · " + escapeHtml(entry.type) + "</span>" +
      "<h3>" + escapeHtml(entry.title) + "</h3>" +
      (entry.location ? '<p class="resource-desc"><strong>📍 ' + escapeHtml(entry.location) + "</strong></p>" : "") +
      '<p class="resource-desc">' + escapeHtml(entry.description) + "</p>" +
      linkHtml;
    return card;
  }

  function matchesFilters(entry, isVendor) {
    const sectionVal = filterSection.value;
    if (sectionVal === "resources" && isVendor) return false;
    if (sectionVal === "vendors" && !isVendor) return false;
    if (filterCategory.value && entry.category !== filterCategory.value) return false;
    if (filterLocation.value && entry.location !== filterLocation.value) return false;
    return true;
  }

  function render() {
    const filteredResources = resources.filter(function (r) {
      return matchesFilters(r, false);
    });
    const filteredVendors = vendors.filter(function (v) {
      return matchesFilters(v, true);
    });

    resourcesGrid.innerHTML = "";
    resourcesNoResults.hidden = filteredResources.length > 0;
    filteredResources.forEach(function (entry) {
      resourcesGrid.appendChild(renderResourceCard(entry));
    });

    vendorsGrid.innerHTML = "";
    vendorsNoResults.hidden = filteredVendors.length > 0;
    filteredVendors.forEach(function (entry) {
      vendorsGrid.appendChild(renderResourceCard(entry));
    });

    resourcesSection.style.display = filterSection.value === "vendors" ? "none" : "block";
    vendorsSection.style.display = filterSection.value === "resources" ? "none" : "block";
  }

  function initFilters() {
    [filterSection, filterCategory, filterLocation].forEach(function (el) {
      el.addEventListener("change", render);
    });
    filterReset.addEventListener("click", function () {
      filterSection.value = "";
      filterCategory.value = "";
      filterLocation.value = "";
      render();
    });
  }

  function loadData() {
    fetch("data/resources.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        resources = (data.resources || []).slice();
        vendors = (data.vendors || []).slice();
        function bySectionThenAlpha(a, b) {
          var cat = (a.category || "").localeCompare(b.category || "");
          if (cat !== 0) return cat;
          return (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase());
        }
        resources.sort(bySectionThenAlpha);
        vendors.sort(bySectionThenAlpha);
        render();
      })
      .catch(function () {
        resourcesGrid.innerHTML = '<p class="no-results">Unable to load resources.</p>';
        vendorsGrid.innerHTML = '<p class="no-results">Unable to load vendors.</p>';
      });
  }

  initFilters();
  loadData();
})();
