(function () {
  const container = document.getElementById("directory-container");
  const noResults = document.getElementById("directory-no-results");
  const filterSearch = document.getElementById("directory-search");
  const filterSection = document.getElementById("filter-section");
  const filterLocation = document.getElementById("filter-location");
  const filterReset = document.getElementById("filter-reset");
  const directoryToolbar = document.getElementById("directory-toolbar");
  const expandAllBtn = document.getElementById("directory-expand-all");
  const collapseAllBtn = document.getElementById("directory-collapse-all");
  const directoryNavList = document.getElementById("directory-nav-list");
  const directoryNav = document.getElementById("directory-nav");
  const directoryNavToggle = document.getElementById("directory-nav-toggle");

  const SECTION_ORDER = [
    "Camera Operators", "Costume", "Directors", "Editors", "Gaffer", "Grips",
    "Hair & Make-Up", "Intimacy Coordinators", "PAs", "Photographers", "Production Design",
    "Props", "Script Supervisor", "Sound", "Stunt Coordinators", "Talent", "Writers",
  ];

  function sectionId(section) {
    return "section-" + (section || "").toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  let bySection = {};

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text == null ? "" : text;
    return div.innerHTML;
  }

  function renderDirectoryCard(entry) {
    const card = document.createElement("article");
    card.className = "resource-card directory-card";
    card.dataset.id = entry.id;
    let html = "";
    html += "<h3>" + escapeHtml(entry.name) + "</h3>";
    if (entry.pronouns) {
      html += '<p class="directory-pronouns">' + escapeHtml(entry.pronouns) + "</p>";
    }
    if (entry.pills && entry.pills.length > 0) {
      html += '<div class="resource-pills">';
      entry.pills.forEach(function (pill) {
        html += '<span class="resource-pill">' + escapeHtml(pill) + "</span>";
      });
      html += "</div>";
    }
    if (entry.location) {
      html += '<p class="resource-desc"><strong>Location: ' + escapeHtml(entry.location) + "</strong></p>";
    }
    if (entry.description) {
      html += '<p class="resource-desc">' + escapeHtml(entry.description) + "</p>";
    }
    const links = [];
    if (entry.link) {
      var linkLabel = entry.link.indexOf("imdb.com") !== -1 ? "IMDb" : "Profile";
      links.push('<a href="' + escapeHtml(entry.link) + '" target="_blank" rel="noopener noreferrer" class="resource-link">' + linkLabel + "</a>");
    }
    if (entry.contactLink && entry.contactLabel) {
      links.push('<a href="' + escapeHtml(entry.contactLink) + '" target="_blank" rel="noopener noreferrer" class="resource-link">' + escapeHtml(entry.contactLabel) + "</a>");
    } else if (entry.contactLink) {
      links.push('<a href="' + escapeHtml(entry.contactLink) + '" target="_blank" rel="noopener noreferrer" class="resource-link">Contact</a>"');
    }
    if (links.length) {
      html += '<div class="directory-links">' + links.join(" ") + "</div>";
    }
    card.innerHTML = html;
    return card;
  }

  function matchesFilters(entry, section) {
    if (filterSection.value && section !== filterSection.value) return false;
    if (filterLocation.value && entry.location !== filterLocation.value) return false;
    const q = filterSearch && filterSearch.value ? filterSearch.value.trim().toLowerCase() : "";
    if (q) {
      const name = (entry.name || "").toLowerCase();
      const desc = (entry.description || "").toLowerCase();
      const sec = (section || "").toLowerCase();
      if (name.indexOf(q) === -1 && desc.indexOf(q) === -1 && sec.indexOf(q) === -1) return false;
    }
    return true;
  }

  function render() {
    if (!container) return;

    const sectionFilter = filterSection.value;
    const locationFilter = filterLocation.value;
    let hasAnyVisible = false;

    container.innerHTML = "";

    SECTION_ORDER.forEach(function (section) {
      const list = (bySection[section] || []).filter(function (entry) {
        return matchesFilters(entry, section);
      });
      const showSection = !sectionFilter || sectionFilter === section;
      if (!showSection) return;

      const sectionEl = document.createElement("section");
      sectionEl.className = "resources-section";
      sectionEl.id = sectionId(section);
      sectionEl.setAttribute("aria-label", section);

      const details = document.createElement("details");
      details.className = "resources-section-details";
      details.setAttribute("open", "");
      const summary = document.createElement("summary");
      summary.className = "resources-section-summary";
      summary.innerHTML = "<span class=\"resources-section-summary-text\">" + escapeHtml(section) + " <span class=\"resources-section-count\">(" + list.length + ")</span></span>";
      details.appendChild(summary);

      const content = document.createElement("div");
      content.className = "resources-section-content";

      if (list.length > 0) {
        hasAnyVisible = true;
        const sorted = list.slice().sort(function (a, b) {
          return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
        });
        const grid = document.createElement("div");
        grid.className = "resource-grid";
        sorted.forEach(function (entry) {
          grid.appendChild(renderDirectoryCard(entry));
        });
        content.appendChild(grid);
      } else {
        const placeholder = document.createElement("p");
        placeholder.className = "directory-placeholder";
        placeholder.innerHTML = "No one listed in this category yet. Know someone who belongs here? <a href=\"submit-resource.html\">Let us know</a>.";
        content.appendChild(placeholder);
      }

      details.appendChild(content);
      sectionEl.appendChild(details);
      container.appendChild(sectionEl);
    });

    if (noResults) {
      noResults.hidden = hasAnyVisible;
      noResults.textContent = (filterSearch && filterSearch.value.trim()) ? "No directory entries match your search or filters." : "No directory entries match your filters.";
    }
    if (directoryToolbar) directoryToolbar.hidden = !hasAnyVisible;

    if (directoryNavList) {
      directoryNavList.innerHTML = "";
      SECTION_ORDER.forEach(function (section) {
        const list = (bySection[section] || []).filter(function (entry) {
          return matchesFilters(entry, section);
        });
        const showSection = !sectionFilter || sectionFilter === section;
        if (!showSection) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + sectionId(section);
        a.textContent = section;
        a.className = "resources-nav-link";
        li.appendChild(a);
        directoryNavList.appendChild(li);
      });
    }
    if (directoryNav) directoryNav.hidden = !directoryNavList || directoryNavList.children.length === 0;
  }

  function expandOrCollapseAll(open) {
    if (!container) return;
    container.querySelectorAll(".resources-section-details").forEach(function (el) {
      if (open) el.setAttribute("open", "");
      else el.removeAttribute("open");
    });
  }

  function loadData() {
    fetch("data/directory.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        bySection = {};
        SECTION_ORDER.forEach(function (section) {
          bySection[section] = (data[section] || []).slice();
        });
        Object.keys(data).forEach(function (section) {
          if (!bySection[section]) bySection[section] = data[section].slice();
        });
        render();
      })
      .catch(function () {
        if (container) container.innerHTML = '<p class="no-results">Unable to load directory.</p>';
      });
  }

  if (filterSection) filterSection.addEventListener("change", render);
  if (filterLocation) filterLocation.addEventListener("change", render);
  if (filterSearch) filterSearch.addEventListener("input", render);
  if (filterReset) {
    filterReset.addEventListener("click", function () {
      if (filterSearch) filterSearch.value = "";
      filterSection.value = "";
      filterLocation.value = "";
      render();
    });
  }
  if (expandAllBtn) expandAllBtn.addEventListener("click", function () { expandOrCollapseAll(true); });
  if (collapseAllBtn) collapseAllBtn.addEventListener("click", function () { expandOrCollapseAll(false); });
  if (directoryNavToggle && directoryNav) {
    directoryNavToggle.addEventListener("click", function () {
      const expanded = directoryNav.getAttribute("aria-expanded") !== "true";
      directoryNav.setAttribute("aria-expanded", expanded ? "true" : "false");
      directoryNav.classList.toggle("resources-nav-collapsed", !expanded);
      directoryNavToggle.setAttribute("aria-expanded", expanded);
    });
  }

  loadData();
})();
