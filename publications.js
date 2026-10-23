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

  // Group leader's name is shown in bold in every author list
  const HIGHLIGHT_AUTHOR = "Schmitt, W.";

  const escapeHtml = (str = "") =>
    String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Lower-case and strip accents, so "gonzalez" finds "González"
  const fold = (str = "") =>
    String(str).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // "Schmitt, Wolfgang and Gearóid Manning" -> ["Schmitt, W.", "Manning, G."]
  function formatAuthors(str = "") {
    return str.split(/\s+and\s+/).map(author => {
      author = author.trim();
      if (!author) return "";

      let last, firsts;
      if (author.includes(",")) {
        const parts = author.split(",");
        last = parts[0].trim();
        firsts = parts.slice(1).join(" ").trim().split(/[\s.]+/).filter(Boolean);
      } else {
        const tokens = author.split(/\s+/).filter(Boolean);
        if (tokens.length === 1) return tokens[0];
        last = tokens[tokens.length - 1];
        firsts = tokens.slice(0, -1);
      }
      // "Jean-Luc" -> "J.-L."
      const initials = firsts
        .map(name => name.split("-").filter(Boolean).map(part => part[0].toUpperCase() + ".").join("-"))
        .filter(Boolean)
        .join(" ");
      return initials ? `${last}, ${initials}` : last;
    }).filter(Boolean);
  }

  // drop stray backslashes left over from BibTeX (braces are kept: they're chemistry, e.g. {Mn6})
  const cleanTitle = (title = "") => title.replace(/\\/g, "").trim();

  // Titles may contain chemistry formatting such as Fe<sub>2</sub> or Fe<sup>III</sup>.
  // Escape everything, then re-allow only these plain tags (no attributes).
  // (Some publishers write subscripts as <inf>.)
  const FORMAT_TAGS = /&lt;(\/?)(sub|sup|inf|i|em|b|strong)&gt;/gi;
  const titleHtml = title => escapeHtml(cleanTitle(title))
    .replace(FORMAT_TAGS, (m, slash, tag) => `<${slash}${tag.toLowerCase() === "inf" ? "sub" : tag}>`);
  const titleText = title => cleanTitle(title).replace(/<\/?(sub|sup|inf|i|em|b|strong)>/gi, "");

  function renderPaper(pub) {
    const authors = formatAuthors(pub.authors || "")
      .map(name => {
        const safe = escapeHtml(name);
        return name === HIGHLIGHT_AUTHOR ? `<strong>${safe}</strong>` : safe;
      })
      .join("; ");

    const title = titleHtml(pub.title || "Untitled");
    const doi = (pub.doi || "").trim();
    const link = pub.link || (doi ? `https://doi.org/${doi}` : "");
    const linkedTitle = link
      ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : title;

    const details = [];
    if (pub.journal) details.push(`<em>${escapeHtml(pub.journal)}</em>`);
    if (pub.year) details.push(`<strong>${escapeHtml(pub.year)}</strong>`);
    if (pub.volume) details.push(escapeHtml(pub.volume));
    if (pub.pages) details.push(escapeHtml(pub.pages).replace(/(\d)\s*-+\s*(\d)/, "$1–$2"));  // en dash in page ranges

    const doiButton = doi
      ? `<a class="pub-doi" href="https://doi.org/${escapeHtml(doi)}" target="_blank" rel="noopener noreferrer"
            aria-label="DOI ${escapeHtml(doi)}">DOI</a>`
      : "";

    return `
      <li class="pub-entry">
        <p class="pub-entry-title">${linkedTitle}</p>
        ${authors ? `<p class="pub-entry-authors">${authors}</p>` : ""}
        <p class="pub-entry-details">
          <span class="pub-citation">${details.join(", ")}</span>
          ${doiButton}
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
