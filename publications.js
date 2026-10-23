// Publications page: every paper from publications.json, grouped by year,
// with a search box, research-area filter chips and a jump-to-year bar.
// The search and area are kept in the address (?q=...&topic=...) so a filtered list can be shared.

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("pub-list");
  const search = document.getElementById("pub-search");
  const countEl = document.getElementById("pub-count");
  const topicBar = document.getElementById("pub-topics");
  const yearNav = document.getElementById("pub-years");
  const errorBox = document.getElementById("pub-error");
  if (!list) return;

  const { TOPICS, escapeHtml, fold, formatAuthors, titleText, entryHtml, newestFirst } =
    window.PubFormat;  // publication-format.js

  let papers = [];
  let topic = new URLSearchParams(location.search).get("topic") || "";

  function renderTopicBar() {
    if (!topicBar) return;
    const counts = {};
    papers.forEach(p => (p.pub.topics || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    const chip = (key, label, n) =>
      `<button type="button" class="pub-topic${key === topic ? " is-active" : ""}" data-topic="${escapeHtml(key)}"
               aria-pressed="${key === topic}">${escapeHtml(label)}${n == null ? "" : ` <span>${n}</span>`}</button>`;
    topicBar.innerHTML = chip("", "All areas") +
      Object.entries(TOPICS).filter(([key]) => counts[key]).map(([key, label]) => chip(key, label, counts[key])).join("");
  }

  function render() {
    const query = fold(search ? search.value.trim() : "");
    const words = query.split(/\s+/).filter(Boolean);
    const matches = papers.filter(p =>
      (!topic || (p.pub.topics || []).includes(topic)) && words.every(w => p.searchText.includes(w)));

    // group by year, newest first
    const byYear = new Map();
    matches.forEach(p => {
      const year = p.pub.year || "Other";
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(p);
    });

    list.innerHTML = [...byYear.entries()].map(([year, group]) => `
      <section class="pub-year" id="year-${escapeHtml(year)}" aria-labelledby="year-heading-${escapeHtml(year)}">
        <h2 id="year-heading-${escapeHtml(year)}">${escapeHtml(year)}
          <span class="pub-year-count">${group.length} ${group.length === 1 ? "paper" : "papers"}</span>
        </h2>
        <ol class="pub-entries">${group.map(p => p.html).join("")}</ol>
      </section>`).join("")
      || `<p class="pub-empty">No publications match${words.length ? ` “${escapeHtml(search.value.trim())}”` : ""}${topic ? ` in ${escapeHtml(TOPICS[topic] || topic)}` : ""}.</p>`;

    if (countEl) {
      countEl.textContent = words.length || topic
        ? `${matches.length} of ${papers.length} publications`
        : `${papers.length} publications`;
    }

    if (yearNav) {
      yearNav.innerHTML = [...byYear.keys()]
        .map(year => `<a href="#year-${escapeHtml(year)}">${escapeHtml(year)}</a>`)
        .join("");
    }
  }

  function syncAddress() {
    const url = new URL(location.href);
    const q = search ? search.value.trim() : "";
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    if (topic) url.searchParams.set("topic", topic); else url.searchParams.delete("topic");
    history.replaceState(null, "", url);
  }

  fetch("publications.json?cb=" + Date.now())
    .then(res => {
      if (!res.ok) throw new Error("Failed to load publications.json");
      return res.json();
    })
    .then(items => {
      papers = newestFirst(items).map(pub => ({
        pub,
        html: entryHtml(pub),
        searchText: fold([titleText(pub.title || ""), pub.authors, formatAuthors(pub.authors || "").join(" "),
                          pub.journal, pub.year, pub.doi].join(" ")),
      }));

      // ignore an unknown ?topic= rather than showing an empty page
      if (!papers.some(p => (p.pub.topics || []).includes(topic))) topic = "";
      renderTopicBar();

      if (search) {
        search.value = new URLSearchParams(location.search).get("q") || "";
        search.addEventListener("input", () => { render(); syncAddress(); });
      }
      if (topicBar) {
        topicBar.addEventListener("click", e => {
          const btn = e.target.closest("[data-topic]");
          if (!btn) return;
          topic = btn.dataset.topic === topic ? "" : btn.dataset.topic;
          renderTopicBar(); render(); syncAddress();
        });
      }
      render();

      // arriving with #year-2020 in the address: jump there once the list exists
      const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
    })
    .catch(err => {
      console.error(err);
      if (errorBox) errorBox.hidden = false;
    });
});
