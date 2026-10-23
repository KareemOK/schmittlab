// Home page "Recent Publications": the two newest papers as cards, then the
// "View All Publications" card. Formatting comes from publication-format.js,
// so the cards match the publications page.

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("recent-publications");
  if (!container) return;

  const { authorsHtml, linkedTitleHtml, detailsHtml, doiButtonHtml } = window.PubFormat;
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

      const yearNum = p => parseInt(p.year, 10) || 0;
      const recent = [...items].sort((a, b) => yearNum(b) - yearNum(a)).slice(0, 2); // 2 cards + CTA = 3

      recent.forEach(pub => {
        const card = document.createElement("div");
        card.className = "recent-pub-item";
        const authors = authorsHtml(pub.authors || "");
        const doiButton = doiButtonHtml(pub);

        card.innerHTML = `
          <div>
            <p class="pub-entry-title">${linkedTitleHtml(pub)}</p>
            ${authors ? `<p class="pub-entry-authors">${authors}</p>` : ""}
            <p class="pub-entry-details"><span class="pub-citation">${detailsHtml(pub)}</span></p>
          </div>
          ${doiButton ? `<div class="recent-pub-doi">${doiButton}</div>` : ""}
        `;

        container.appendChild(card);
      });

      if (cta) {
        container.appendChild(cta);
      }
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Unable to load recent publications.</p>";
    });
});
