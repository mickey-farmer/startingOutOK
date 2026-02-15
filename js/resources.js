(function () {
  const container = document.getElementById("resources-container");
  const noResults = document.getElementById("resources-no-results");
  const filterSection = document.getElementById("filter-section");
  const filterSubcategory = document.getElementById("filter-subcategory");
  const filterSubcategoryWrap = document.getElementById("filter-subcategory-wrap");
  const filterLocation = document.getElementById("filter-location");
  const filterReset = document.getElementById("filter-reset");

  // Section order (alphabetized) – no "Resources" section
  const SECTION_ORDER = ["Agencies", "Classes & Workshops", "Networking", "Photographers", "Props", "Stunts", "Studios & Sound Stages", "Theaters", "Vendors"];
  const SUBCATEGORY_ORDER = ["Business", "On-Camera Film", "Stage", "Stunts", "Voice Over"];

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
    const linkHtml = entry.link
      ? '<a href="' + escapeHtml(entry.link) + '" target="_blank" rel="noopener noreferrer" class="resource-link">Learn more ↗</a>'
      : "";
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

    filterSubcategoryWrap.hidden = filterSection.value !== "Classes & Workshops";

    container.innerHTML = "";
    noResults.hidden = filtered.length > 0;

    if (filtered.length === 0) {
      return;
    }

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

    SECTION_ORDER.forEach(function (section) {
      const list = bySection[section] || [];
      if (list.length === 0) return;

      const sectionEl = document.createElement("section");
      sectionEl.className = "resources-section";
      sectionEl.setAttribute("aria-label", getSectionLabel(section));

      const details = document.createElement("details");
      details.className = "resources-section-details";
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
        const sorted = list.slice().sort(function (a, b) {
          if (section === "Classes & Workshops" && (a.subcategory || b.subcategory)) {
            const idxA = SUBCATEGORY_ORDER.indexOf(a.subcategory || "");
            const idxB = SUBCATEGORY_ORDER.indexOf(b.subcategory || "");
            if (idxA !== idxB) return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
          }
          return (a.title || "").toLowerCase().localeCompare((b.title || "").toLowerCase());
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
        if (data.items && data.items.length) {
          items = data.items.slice();
        } else {
          const res = (data.resources || []).slice();
          const ven = (data.vendors || []).slice();
          items = res.map(function (r) {
            r.section = r.section || "Resources";
            return r;
          }).concat(ven.map(function (v) {
            v.section = v.section || "Vendors";
            return v;
          }));
        }
        render();
      })
      .catch(function () {
        if (container) container.innerHTML = '<p class="no-results">Unable to load resources.</p>';
      });
  }

  initFilters();
  loadData();
})();
