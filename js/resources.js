(function () {
  const container = document.getElementById("resources-container");
  const noResults = document.getElementById("resources-no-results");
  const filterSection = document.getElementById("filter-section");
  const filterSubcategory = document.getElementById("filter-subcategory");
  const filterSubcategoryWrap = document.getElementById("filter-subcategory-wrap");
  const filterLocation = document.getElementById("filter-location");
  const filterReset = document.getElementById("filter-reset");
  const resourcesContainer = document.getElementById("resources-container");
  const resourcesToolbar = document.getElementById("resources-toolbar");
  const expandAllBtn = document.getElementById("resources-expand-all");
  const collapseAllBtn = document.getElementById("resources-collapse-all");
  const resourcesNavList = document.getElementById("resources-nav-list");
  const resourcesNav = document.getElementById("resources-nav");
  const resourcesNavToggle = document.getElementById("resources-nav-toggle");

  // Section order (alphabetized)
  const SECTION_ORDER = ["Agencies", "Casting", "Classes & Workshops", "Networking", "Photographers", "Props", "Studios & Sound Stages", "Stunts", "Theaters", "Vendors", "Voice", "Writing"];
  const SUBCATEGORY_ORDER = ["Business", "Improv", "On-Camera Film", "Stage", "Stunts", "Voice Over"];

  function sectionId(section) {
    return "section-" + (section || "").toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  let items = [];

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  function renderResourceCard(entry) {
    const card = document.createElement("article");
    card.className = "resource-card";
    card.dataset.id = entry.id;
    let linkHtml = "";
    if (entry.imdbLink) {
      linkHtml += '<a href="' + escapeHtml(entry.imdbLink) + '" target="_blank" rel="noopener noreferrer" class="resource-link">IMDb ↗</a>';
    }
    if (entry.link) {
      linkHtml += (linkHtml ? " " : "") + '<a href="' + escapeHtml(entry.link) + '" target="_blank" rel="noopener noreferrer" class="resource-link">Learn more ↗</a>';
    }
    const categoryLine = entry.section === "Classes & Workshops" && entry.subcategory
      ? escapeHtml(entry.subcategory) + " · " + (entry.type || "")
      : (entry.category || "") + (entry.type ? " · " + entry.type : "");
    let html = "";
    if (categoryLine) {
      html += '<span class="resource-category">' + categoryLine + "</span>";
    }
    html += "<h3>" + escapeHtml(entry.title) + "</h3>";
    if (entry.pills && entry.pills.length > 0) {
      html += '<div class="resource-pills">';
      entry.pills.forEach(function (pill) {
        html += '<span class="resource-pill">' + escapeHtml(pill) + "</span>";
      });
      html += "</div>";
    }
    if (entry.schedule) {
      html += '<p class="resource-schedule"><strong>📅 ' + escapeHtml(entry.schedule) + "</strong></p>";
    }
    if (entry.location) {
      html += '<p class="resource-desc"><strong>📍 ' + escapeHtml(entry.location) + "</strong></p>";
    }
    html += '<p class="resource-desc">' + escapeHtml(entry.description) + "</p>" + linkHtml;
    card.innerHTML = html;
    return card;
  }

  function matchesFilters(entry) {
    const sectionVal = filterSection.value;
    if (sectionVal && entry.section !== sectionVal) return false;
    if (filterSection.value === "Classes & Workshops" && filterSubcategory.value && entry.subcategory !== filterSubcategory.value) return false;
    if (filterLocation.value && entry.location !== filterLocation.value) return false;
    return true;
  }

  function getSectionLabel(section) {
    return section;
  }

  function render() {
    const filtered = items.filter(matchesFilters);

    if (filterSubcategoryWrap) filterSubcategoryWrap.hidden = filterSection.value !== "Classes & Workshops";

    if (!container) return;
    container.innerHTML = "";
    if (noResults) noResults.hidden = filtered.length > 0;
    if (resourcesToolbar) resourcesToolbar.hidden = filtered.length === 0;

    // Group by section (alphabetical order)
    const bySection = {};
    SECTION_ORDER.forEach(function (sec) {
      bySection[sec] = [];
    });
    filtered.forEach(function (entry) {
      const sec = entry.section || (entry.vendor ? "Vendors" : "Resources");
      if (!bySection[sec]) bySection[sec] = [];
      bySection[sec].push(entry);
    });

    if (filtered.length === 0) {
      if (resourcesNavList) resourcesNavList.innerHTML = "";
      if (resourcesNav) resourcesNav.hidden = true;
      return;
    }

    SECTION_ORDER.forEach(function (section) {
      const list = bySection[section] || [];
      if (list.length === 0) return;

      const sectionEl = document.createElement("section");
      sectionEl.className = "resources-section";
      sectionEl.id = sectionId(section);
      sectionEl.setAttribute("aria-label", getSectionLabel(section));

      const details = document.createElement("details");
      details.className = "resources-section-details";
      details.setAttribute("open", ""); // Start expanded so content is visible without clicking
      const summary = document.createElement("summary");
      summary.className = "resources-section-summary";
      summary.innerHTML = "<span class=\"resources-section-summary-text\">" + escapeHtml(getSectionLabel(section)) + " <span class=\"resources-section-count\">(" + list.length + ")</span></span>";
      details.appendChild(summary);

      const content = document.createElement("div");
      content.className = "resources-section-content";

      if (section === "Agencies") {
        const byCity = {};
        list.forEach(function (entry) {
          const city = entry.location || "Other";
          if (!byCity[city]) byCity[city] = [];
          byCity[city].push(entry);
        });
        const cities = Object.keys(byCity).sort();
        cities.forEach(function (city) {
          const cityItems = byCity[city].slice().sort(function (a, b) {
            return (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase());
          });
          const cityHeading = document.createElement("h3");
          cityHeading.className = "resources-city-title";
          cityHeading.textContent = city;
          content.appendChild(cityHeading);
          const grid = document.createElement("div");
          grid.className = "resource-grid";
          cityItems.forEach(function (entry) {
            grid.appendChild(renderResourceCard(entry));
          });
          content.appendChild(grid);
        });
      } else {
        // Within section: alphabetical by title. Strip leading "The " for sort so "The Actor Factory" sorts under A.
        function titleSortKey(title) {
          var t = (title || "").trim();
          if (/^the\s+/i.test(t)) return t.replace(/^the\s+/i, "").toLowerCase();
          return t.toLowerCase();
        }
        const sorted = list.slice().sort(function (a, b) {
          return titleSortKey(a.title).localeCompare(titleSortKey(b.title));
        });
        const grid = document.createElement("div");
        grid.className = "resource-grid";
        sorted.forEach(function (entry) {
          grid.appendChild(renderResourceCard(entry));
        });
        content.appendChild(grid);
      }

      details.appendChild(content);
      sectionEl.appendChild(details);
      container.appendChild(sectionEl);
    });

    // Update sidebar nav with links to visible sections
    if (resourcesNavList) {
      resourcesNavList.innerHTML = "";
      SECTION_ORDER.forEach(function (section) {
        const list = bySection[section] || [];
        if (list.length === 0) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + sectionId(section);
        a.textContent = section;
        a.className = "resources-nav-link";
        li.appendChild(a);
        resourcesNavList.appendChild(li);
      });
    }
    if (resourcesNav) resourcesNav.hidden = !resourcesNavList || resourcesNavList.children.length === 0;
  }

  function expandOrCollapseAll(open) {
    if (!resourcesContainer) return;
    resourcesContainer.querySelectorAll(".resources-section-details").forEach(function (el) {
      if (open) el.setAttribute("open", "");
      else el.removeAttribute("open");
    });
  }

  function initFilters() {
    [filterSection, filterSubcategory, filterLocation].forEach(function (el) {
      if (el) el.addEventListener("change", render);
    });
    if (filterReset) {
      filterReset.addEventListener("click", function () {
        filterSection.value = "";
        filterSubcategory.value = "";
        filterLocation.value = "";
        render();
      });
    }
  }

  function loadData() {
    fetch("data/resources.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        function notDeleted(entry) {
          return entry.deleted !== "yes" && entry.deleted !== true;
        }
        // Section-grouped format: { "Agencies": [...], "Classes & Workshops": [...], ... }
        const sectionKeys = SECTION_ORDER.slice();
        const hasSections = sectionKeys.some(function (sec) { return Array.isArray(data[sec]); });
        if (hasSections) {
          items = [];
          sectionKeys.forEach(function (sectionName) {
            const list = data[sectionName];
            if (!Array.isArray(list)) return;
            list.forEach(function (entry) {
              if (notDeleted(entry)) {
                entry.section = sectionName;
                items.push(entry);
              }
            });
          });
        } else if (data.items && data.items.length) {
          items = data.items.filter(notDeleted);
        } else {
          const res = (data.resources || []).slice();
          const ven = (data.vendors || []).slice();
          items = res.map(function (r) {
            r.section = r.section || "Resources";
            return r;
          }).concat(ven.map(function (v) {
            v.section = v.section || "Vendors";
            return v;
          })).filter(notDeleted);
        }
        render();
      })
      .catch(function () {
        if (container) container.innerHTML = '<p class="no-results">Unable to load resources.</p>';
      });
  }

  function initExpandCollapse() {
    if (expandAllBtn) expandAllBtn.addEventListener("click", function () { expandOrCollapseAll(true); });
    if (collapseAllBtn) collapseAllBtn.addEventListener("click", function () { expandOrCollapseAll(false); });
  }

  function initResourcesNav() {
    if (!resourcesNavToggle || !resourcesNav) return;
    resourcesNavToggle.addEventListener("click", function () {
      const expanded = resourcesNav.getAttribute("aria-expanded") !== "true";
      resourcesNav.setAttribute("aria-expanded", expanded ? "true" : "false");
      resourcesNav.classList.toggle("resources-nav-collapsed", !expanded);
      resourcesNavToggle.setAttribute("aria-expanded", expanded);
    });
  }

  initFilters();
  initExpandCollapse();
  initResourcesNav();
  loadData();
})();
