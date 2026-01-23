document.addEventListener("DOMContentLoaded", () => { 
  const container = document.getElementById("recent-publications");
  if (!container) return;

  const cta = container.querySelector(".recent-pub-cta");

  fetch("publications.json?v=1")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load publications.json");
      return res.json();
    })
    .then(items => {
      if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = "<p>No publications found.</p>";
        return;
      }

      container.innerHTML = "";

      const sorted = [...items].sort((a, b) => (b.year || 0) - (a.year || 0));
      const recent = sorted.slice(0, 2); // 2 cards + CTA = 3

      recent.forEach(pub => {
        const div = document.createElement("div");
        div.className = "recent-pub-item";

        const title = pub.title || "Untitled";

        const rawAuthors = pub.authors || pub.Authors || "";
        const authorsACS = formatAuthorsACS(rawAuthors); // new helper

        const journal = pub.journal || pub.venue || "";
        const year = pub.year || "";
        const volume = pub.volume || "";
        const pages = pub.pages || "";
        const doi = (pub.doi || "").trim();

        const infoBits = [];
        if (journal) infoBits.push(`<em>${journal}</em>`);
        if (year) infoBits.push(year);
        if (volume) infoBits.push(`<strong>${volume}</strong>`);
        if (pages) infoBits.push(pages);

        const infoLine = infoBits.join(", ");

        const cleanInfo = infoLine.replace(/\.*$/, "");

        let doiButtonHTML = "";
        if (doi) {
          const doiUrl = `https://doi.org/${encodeURIComponent(doi)}`;
          doiButtonHTML = `
            <div class="pub-doi-wrap">
              <a href="${doiUrl}" target="_blank" rel="noopener" class="pub-doi-button">
                <img src="assets/doi.svg" alt="" aria-hidden="true">
                <span class="pub-doi-text">DOI</span>
              </a>
            </div>`;
        }

        div.innerHTML = `
          <div class="pub-title">${title}</div>
          ${authorsACS
          ? `<div class="pub-authors">${authorsACS.replace(/\.*$/, "")}.</div>`
          : ""
     }
          ${cleanInfo ? `<div class="pub-info">${cleanInfo}.</div>` : ""}
          ${doiButtonHTML}
        `;

        container.appendChild(div);
      });

      if (cta) {
        container.appendChild(cta);
      }
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Unable to load recent publications.</p>";
    });

  function formatAuthorsACS(raw) {
    if (!raw) return "";

    let parts;
    if (raw.includes(";")) {
      parts = raw.split(";").map(p => p.trim()).filter(Boolean);
    } else {
      parts = raw.split(/\s+and\s+/i).map(p => p.trim()).filter(Boolean);
    }

    if (!parts.length) return "";

    const formatted = parts.map(formatSingleAuthorACS).filter(Boolean);
    return formatted.join("; ");
  }

  function formatSingleAuthorACS(author) {
    if (!author) return "";

    if (author.includes(",")) {
      const chunks = author.split(",");
      const surname = chunks[0].trim();
      const givenNames = chunks.slice(1).join(" ").trim();
      if (!surname || !givenNames) return author.trim();

      const nameTokens = givenNames.split(/\s+/).filter(Boolean);
      const allInitialLike = nameTokens.every(
        n => n.length <= 2 || /^[A-Za-z]\.$/.test(n)
      );
      if (allInitialLike) {
        return `${surname}, ${givenNames}`;
      }

      const initials = nameTokens
        .map(n => n[0].toUpperCase() + ".")
        .join(" ");
      return `${surname}, ${initials}`;
    }

    const bits = author.split(/\s+/).filter(Boolean);
    if (bits.length === 1) return author.trim();

    const surname = bits[bits.length - 1];
    const givenNames = bits.slice(0, -1);

    const allInitialLike = givenNames.every(
      n => n.length <= 2 || /^[A-Za-z]\.$/.test(n)
    );
    if (allInitialLike) {
      return `${surname}, ${givenNames.join(" ")}`;
    }

    const initials = givenNames
      .map(n => n[0].toUpperCase() + ".")
      .join(" ");

    return `${surname}, ${initials}`;
  }
});













