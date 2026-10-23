// Publications page: every paper from publications.json, grouped by year,
// with a search box and a jump-to-year bar.
// The search is kept in the address (?q=...) so a filtered list can be shared.

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("pub-list");
  const search = document.getElementById("pub-search");
  const countEl = document.getElementById("pub-count");
  const yearNav = document.getElementById("pub-years");
  const errorBox = document.getElementById("pub-error");
  if (!list) return;

  const { escapeHtml, fold, formatAuthors, authorsHtml, titleText,
          linkedTitleHtml, detailsHtml, doiButtonHtml } = window.PubFormat;  // publication-format.js

  function renderPaper(pub) {
    const authors = authorsHtml(pub.authors || "");
    return `
      <li class="pub-entry">
        <p class="pub-entry-title">${linkedTitleHtml(pub)}</p>
        ${authors ? `<p class="pub-entry-authors">${authors}</p>` : ""}
        <p class="pub-entry-details">
          <span class="pub-citation">${detailsHtml(pub)}</span>
          ${doiButtonHtml(pub)}
        </p>
      </li>`;
  }

  let papers = [];

  function render() {
    const query = fold(search ? search.value.trim() : "");
    const words = query.split(/\s+/).filter(Boolean);
    const matches = papers.filter(p => words.every(w => p.searchText.includes(w)));

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
      || `<p class="pub-empty">No publications match “${escapeHtml(search.value.trim())}”.</p>`;

    if (countEl) {
      countEl.textContent = words.length
        ? `${matches.length} of ${papers.length} publications match`
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
    const q = search.value.trim();
    if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  fetch("publications.json?cb=" + Date.now())
    .then(res => {
      if (!res.ok) throw new Error("Failed to load publications.json");
      return res.json();
    })
    .then(items => {
      const yearNum = p => parseInt(p.year, 10) || 0;
      papers = [...items]
        .sort((a, b) => yearNum(b) - yearNum(a))
        .map(pub => ({
          pub,
          html: renderPaper(pub),
          searchText: fold([titleText(pub.title || ""), pub.authors, formatAuthors(pub.authors || "").join(" "),
                            pub.journal, pub.year, pub.doi].join(" ")),
        }));

      if (search) {
        search.value = new URLSearchParams(location.search).get("q") || "";
        search.addEventListener("input", () => { render(); syncAddress(); });
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
