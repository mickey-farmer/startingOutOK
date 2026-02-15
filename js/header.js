(function () {
  "use strict";

  var currentPath = window.location.pathname.split("/").pop() || "index.html";
  var currentNav = document.body.getAttribute("data-current-nav") || "Casting Calls";

  function setCurrentPage() {
    document.querySelectorAll(".nav-dropdown-menu a, .nav-drawer-nav a, .nav-drawer-footer a").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      if (href === currentPath || href.endsWith("/" + currentPath)) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    var label = document.querySelector(".nav-dropdown-label");
    if (label) label.textContent = currentNav;
  }

  function setupDropdown() {
    var trigger = document.getElementById("nav-dropdown-trigger");
    var menu = document.getElementById("nav-dropdown-menu");
    if (!trigger || !menu) return;

    function open() {
      trigger.setAttribute("aria-expanded", "true");
      menu.removeAttribute("hidden");
    }
    function close() {
      trigger.setAttribute("aria-expanded", "false");
      menu.setAttribute("hidden", "");
    }
    function toggle() {
      if (trigger.getAttribute("aria-expanded") === "true") close();
      else open();
    }

    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });

    document.addEventListener("click", function () {
      close();
    });
    menu.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function setupDrawer() {
    var toggleBtn = document.getElementById("nav-mobile-toggle");
    var drawer = document.getElementById("nav-drawer");
    var backdrop = document.getElementById("nav-drawer-backdrop");
    if (!toggleBtn || !drawer || !backdrop) return;

    function open() {
      drawer.classList.add("is-open");
      backdrop.classList.add("is-open");
      backdrop.setAttribute("aria-hidden", "false");
      toggleBtn.setAttribute("aria-expanded", "true");
      toggleBtn.setAttribute("aria-label", "Close menu");
    }
    function close() {
      drawer.classList.remove("is-open");
      backdrop.classList.remove("is-open");
      backdrop.setAttribute("aria-hidden", "true");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Open menu");
    }

    toggleBtn.addEventListener("click", function () {
      if (drawer.classList.contains("is-open")) close();
      else open();
    });
    backdrop.addEventListener("click", close);
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("is-open")) close();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setCurrentPage();
      setupDropdown();
      setupDrawer();
    });
  } else {
    setCurrentPage();
    setupDropdown();
    setupDrawer();
  }
})();
