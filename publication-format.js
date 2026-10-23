// How a publication is displayed, shared by the publications page (publications.js)
// and the home page's Recent Publications cards (recent-publications.js),
// so both always look the same. Load this file before either of them.

window.PubFormat = (() => {
  // Group leader's name is shown in bold in every author list
  const HIGHLIGHT_AUTHOR = "Schmitt, W.";

  // Research areas, used as `topics = {catalysis, mofs}` in publications.bib.
  // Project tags (like c4c) list a paper on that project's page.
  const TOPICS = {
    "catalysis": "Catalysis & water splitting",
    "co2-capture": "CO₂ capture",
    "mofs": "MOFs & coordination polymers",
    "supramolecular": "Supramolecular chemistry",
    "clusters": "Clusters & polyoxometalates",
    "magnetism": "Molecular magnetism",
    "luminescence": "Luminescence & sensing",
    "nanomaterials": "Nanomaterials",
    "c4c": "C4C-Capture project",
  };

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

  // "Manning, G.; Whelan, É.; <strong>Schmitt, W.</strong>"
  const authorsHtml = (str = "") =>
    formatAuthors(str)
      .map(name => name === HIGHLIGHT_AUTHOR ? `<strong>${escapeHtml(name)}</strong>` : escapeHtml(name))
      .join("; ");

  // drop stray backslashes left over from BibTeX (braces are kept: they're chemistry, e.g. {Mn6})
  const cleanTitle = (title = "") => title.replace(/\\/g, "").trim();

  // Titles may contain chemistry formatting such as Fe<sub>2</sub> or Fe<sup>III</sup>.
  // Escape everything, then re-allow only these plain tags (no attributes).
  // (Some publishers write subscripts as <inf>.)
  const FORMAT_TAGS = /&lt;(\/?)(sub|sup|inf|i|em|b|strong)&gt;/gi;
  const titleHtml = title => escapeHtml(cleanTitle(title))
    .replace(FORMAT_TAGS, (m, slash, tag) => `<${slash}${tag.toLowerCase() === "inf" ? "sub" : tag}>`);
  const titleText = title => cleanTitle(title).replace(/<\/?(sub|sup|inf|i|em|b|strong)>/gi, "");

  const doiOf = pub => (pub.doi || "").trim();
  const linkOf = pub => pub.link || (doiOf(pub) ? `https://doi.org/${doiOf(pub)}` : "");

  // Title, linked to the paper when there's a DOI or URL
  function linkedTitleHtml(pub) {
    const title = titleHtml(pub.title || "Untitled");
    const link = linkOf(pub);
    return link
      ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : title;
  }

  // "<em>Journal</em>, <strong>2026</strong>, 27, 2694962"
  function detailsHtml(pub) {
    const details = [];
    if (pub.journal) details.push(`<em>${escapeHtml(pub.journal)}</em>`);
    if (pub.year) details.push(`<strong>${escapeHtml(pub.year)}</strong>`);
    if (pub.volume) details.push(escapeHtml(pub.volume));
    if (pub.pages) details.push(escapeHtml(pub.pages).replace(/(\d)\s*-+\s*(\d)/, "$1–$2"));  // en dash in page ranges
    return details.join(", ");
  }

  // Small outlined "DOI" pill
  function doiButtonHtml(pub) {
    const doi = doiOf(pub);
    return doi
      ? `<a class="pub-doi" href="https://doi.org/${escapeHtml(doi)}" target="_blank" rel="noopener noreferrer"
            aria-label="DOI ${escapeHtml(doi)}">DOI</a>`
      : "";
  }

  // One <li> in a list of papers (publications page and project pages)
  function entryHtml(pub) {
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

  const yearNum = pub => parseInt(pub.year, 10) || 0;
  const newestFirst = pubs => [...pubs].sort((a, b) => yearNum(b) - yearNum(a));

  return { TOPICS, escapeHtml, fold, formatAuthors, authorsHtml, titleText, linkedTitleHtml,
           detailsHtml, doiButtonHtml, entryHtml, newestFirst };
})();
