document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("news-list");
  if (!container) return;

  const tag = container.dataset.tag || null;
  const limit = 3;

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
               <img src="${item.image}" class="news-image"${imageStyle} alt="">
             </div>`
          : "";

        div.innerHTML = `
          ${imageHtml}
          <div class="news-body">
            <div class="news-date">${new Date(item.date).toLocaleDateString()}</div>
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
});
