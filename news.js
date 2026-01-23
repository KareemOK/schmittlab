document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("news-list");
  if (!container) return;

  fetch("news.json?v=1")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load news.json");
      }
      return response.json();
    })
    .then(items => {
items
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 2)
  .forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "news-item";

    if (index === 0) div.classList.add("news-item-featured");
    if (index === 1) div.classList.add("news-item-secondary");

    div.innerHTML = `
      ${item.image ? `<img src="${item.image}" class="news-image" alt="">` : ""}
      <div class="news-date">${new Date(item.date).toLocaleDateString()}</div>
      <div class="news-title">${item.title}</div>
      <div class="news-text">${item.text}</div>
      ${item.link ? `<a href="${item.link}" class="news-link">Read more →</a>` : ""}
    `;

    container.appendChild(div);
  });
    })
    .catch(error => {
      console.error(error);
      container.innerHTML = "<p>Unable to load news.</p>";
    });
});
