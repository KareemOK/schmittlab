document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("news-list");
  if (!container) return;

  // data-tag="c4c" filters by tag; the archive page also accepts ?tag=c4c in the URL.
  // data-limit="all" (archive page) shows every post; otherwise the newest 3.
  const showAll = container.dataset.limit === "all";
  const tag = container.dataset.tag
    || (showAll ? new URLSearchParams(location.search).get("tag") : null)
    || null;
  const limit = showAll ? Infinity : 3;

  const tagNote = document.getElementById("news-tag-note");
  if (tagNote && tag) {
    // textContent, not innerHTML: the tag can come from the URL
    tagNote.textContent = `Showing posts tagged “${tag}” · `;
    const allLink = document.createElement("a");
    allLink.href = "news.html";
    allLink.textContent = "Show all news";
    tagNote.appendChild(allLink);
    tagNote.hidden = false;
  }

  fetch("news.json?v=1")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load news.json");
      }
      return response.json();
    })
    .then(items => {
      let filtered = items
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (tag) {
        filtered = filtered.filter(item => item.tags && item.tags.includes(tag));
      }

      filtered = filtered.slice(0, limit);

      if (filtered.length === 0) {
        container.innerHTML = `<p class="news-empty">No updates yet — check back soon.</p>`;
        return;
      }

      filtered.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "news-item";

        if (index === 0) div.classList.add("news-item-featured");
        else div.classList.add("news-item-stacked");

        // The whole image is shown by default, over a blurred copy of itself.
        // Optional per-item image controls in news.json:
        //   "fit": "cover" to crop the image so it fills the box instead
        //   "focus": which part stays visible when cropped, e.g. "top", "center 30%", "left"
        const wrapClass = item.fit === "cover" ? "news-image-wrap news-image-cover" : "news-image-wrap";
        const imageStyle = item.focus ? ` style="object-position: ${item.focus}"` : "";
        const imageHtml = item.image
          ? `<div class="${wrapClass}" style="--news-image: url('${item.image}')">
               <img src="${item.image}" class="news-image"${imageStyle} alt="${altText(item)}"${index === 0 ? "" : ' loading="lazy"'}>
             </div>`
          : "";

        div.innerHTML = `
          ${imageHtml}
          <div class="news-body">
            <div class="news-date">${formatDate(item.date)}</div>
            <div class="news-title">${item.title}</div>
            <div class="news-text">${item.text}</div>
            ${item.link ? `<a href="${item.link}" class="news-link">Read more →</a>` : ""}
          </div>
        `;

        container.appendChild(div);
      });
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = "<p>Unable to load news.</p>";
    });

  // Same date format for every visitor, e.g. "21 Oct 2026"
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
    });
  }

  // Screen-reader text: the optional "alt" field, otherwise the title without HTML tags
  function altText(item) {
    const text = item.alt || item.title.replace(/<[^>]*>/g, "");
    return text.replace(/"/g, "&quot;");
  }
});
