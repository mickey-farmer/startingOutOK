(function () {
  const newsList = document.getElementById("news-list");
  const subscribeForm = document.getElementById("subscribe-form");
  const subscribeMessage = document.getElementById("subscribe-message");

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function renderArticle(entry) {
    const article = document.createElement("article");
    article.className = "news-article";
    var url = "#"; /* Replace with news/[slug].html when you add article pages */
    article.innerHTML =
      '<time class="news-article-date" datetime="' + entry.date + '">' + formatDate(entry.date) + "</time>" +
      '<div>' +
      '<h2><a href="' + url + '">' + escapeHtml(entry.title) + "</a></h2>" +
      '<p class="news-excerpt">' + escapeHtml(entry.excerpt) + "</p>" +
      "</div>";
    return article;
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function loadNews() {
    fetch("data/news.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var list = (data || []).slice();
        list.sort(function (a, b) {
          var da = a.date ? new Date(a.date).getTime() : 0;
          var db = b.date ? new Date(b.date).getTime() : 0;
          return db - da;
        });
        newsList.innerHTML = "";
        list.forEach(function (entry) {
          newsList.appendChild(renderArticle(entry));
        });
      })
      .catch(function () {
        newsList.innerHTML = '<p class="no-results">Unable to load news. Please try again later.</p>';
      });
  }

  subscribeForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("subscribe-email").value;
    subscribeMessage.style.display = "block";
    subscribeMessage.textContent = "Thanks! Once Beehiv is connected, you’ll be added to our list. For now, save this page and we’ll be in touch.";
    subscribeMessage.setAttribute("role", "status");
  });

  loadNews();
})();
