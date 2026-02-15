(function () {
  const root = document.getElementById("news-article-root");
  const loadingEl = document.getElementById("news-article-loading");

  function getSlug() {
    var params = new URLSearchParams(window.location.search);
    var fromQuery = params.get("slug");
    if (fromQuery) return fromQuery;
    var hash = window.location.hash.slice(1).trim();
    if (hash) return decodeURIComponent(hash);
    return "";
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function showError(message) {
    if (!root) return;
    root.innerHTML =
      '<p class="news-article-message">' + (message || "Story not found.") + '</p>' +
      '<p><a href="../news.html">← Back to News</a></p>';
  }

  function render(story) {
    if (!root || !story) return;
    var title = story.title || "Untitled";
    var date = story.date ? formatDate(story.date) : "";
    var body = story.body || "<p>No content.</p>";

    document.title = title + " – Acting Out OK";

    root.innerHTML =
      '<p class="news-article-back"><a href="../news.html">← Back to News</a></p>' +
      '<header class="news-article-header">' +
        (date ? '<time class="news-article-date" datetime="' + (story.date || "") + '">' + date + "</time>" : "") +
        '<h1 class="news-article-title">' + escapeHtml(title) + "</h1>" +
      "</header>" +
      '<div class="prose news-article-body">' + body + "</div>";
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  var slug = getSlug();
  if (!slug) {
    showError("No story specified.");
    return;
  }

  fetch("../data/news/" + encodeURIComponent(slug) + ".json")
    .then(function (r) {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    })
    .then(function (data) {
      if (data.deleted === "yes" || data.deleted === true) {
        showError("This story is no longer available.");
        return;
      }
      render(data);
    })
    .catch(function () {
      showError("Story not found or unable to load.");
    });
})();
