/**
 * Spotlight – announcements modal. Same data on every page.
 * Loads data/spotlight.json; shows a floating button that opens a slide-up modal.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var base = script && script.src ? script.src.replace(/\/js\/spotlight\.js.*$/, "") : "";
  var dataUrl = base + "/data/spotlight.json";

  var button = null;
  var overlay = null;
  var modal = null;
  var tray = null;
  var items = [];

  function escapeHtml(text) {
    if (text == null) return "";
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function createDOM() {
    overlay = document.createElement("div");
    overlay.className = "spotlight-overlay";
    overlay.setAttribute("aria-hidden", "true");

    tray = document.createElement("div");
    tray.className = "spotlight-tray";
    tray.hidden = true;

    modal = document.createElement("div");
    modal.className = "spotlight-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "spotlight-title");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="spotlight-modal-inner">' +
      '<h2 id="spotlight-title">Spotlight</h2>' +
      '<ul class="spotlight-list" id="spotlight-list"></ul>' +
      '<div class="spotlight-close-wrap">' +
      '<button type="button" class="spotlight-close" id="spotlight-close">Close</button>' +
      "</div>" +
      "</div>";

    button = document.createElement("button");
    button.type = "button";
    button.className = "spotlight-button";
    button.setAttribute("aria-label", "View spotlight announcements");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "dialog");
    button.textContent = "✦";
    button.hidden = true;

    tray.appendChild(button);
    tray.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.appendChild(tray);

    button.addEventListener("click", function () {
      if (overlay.classList.contains("is-open")) close();
      else open();
    });
    overlay.addEventListener("click", close);
    var closeBtn = document.getElementById("spotlight-close");
    if (closeBtn) closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });
  }

  function render() {
    var list = document.getElementById("spotlight-list");
    if (!list) return;
    list.innerHTML = "";
    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "spotlight-item";
      var msg = escapeHtml(item.message || "");
      var link = (item.link || "").trim();
      var linkText = (item.linkText || "Learn more").trim();
      if (link) {
        li.innerHTML =
          "<p>" + msg + " <a href=\"" + escapeHtml(link) + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + escapeHtml(linkText) + "</a></p>";
      } else {
        li.innerHTML = "<p>" + msg + "</p>";
      }
      list.appendChild(li);
    });
  }

  function open() {
    if (!overlay || !button || !tray) return;
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    if (tray) tray.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function close() {
    if (!overlay || !button || !tray) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    if (tray) tray.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function load() {
    fetch(dataUrl)
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("Not found"));
      })
      .then(function (data) {
        items = Array.isArray(data) ? data : (data && data.items) ? data.items : [];
        items = items.filter(function (item) {
          return item && (item.message || "").trim();
        });
        if (tray) tray.hidden = items.length === 0;
        if (button) {
          button.hidden = items.length === 0;
          if (items.length === 0) button.setAttribute("aria-hidden", "true");
          else button.removeAttribute("aria-hidden");
        }
        render();
      })
      .catch(function () {
        if (tray) tray.hidden = true;
        if (button) {
          button.hidden = true;
          button.setAttribute("aria-hidden", "true");
        }
      });
  }

  createDOM();
  load();
})();
