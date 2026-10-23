// "Key publications" on research and project pages: the newest papers with a given topic.
//   <div class="related-pubs" data-topic="catalysis" data-limit="5"
//        data-empty="Future articles related to this topic will be listed here."></div>
// Topics come from `topics = {...}` in publications.bib; formatting from publication-format.js.

document.addEventListener("DOMContentLoaded", () => {
  const boxes = document.querySelectorAll(".related-pubs[data-topic]");
  if (!boxes.length) return;

  const { TOPICS, escapeHtml, entryHtml, newestFirst } = window.PubFormat;

  fetch("publications.json?v=1")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load publications.json");
      return res.json();
    })
    .then(items => {
      boxes.forEach(box => {
        const topic = box.dataset.topic;
        const limit = parseInt(box.dataset.limit, 10) || 5;
        const matching = newestFirst(items).filter(p => (p.topics || []).includes(topic));

        if (!matching.length) {
          box.innerHTML = `<p>${escapeHtml(box.dataset.empty || "No publications yet.")}</p>`;
          return;
        }
        const label = TOPICS[topic] || topic;
        box.innerHTML = `
          <ol class="pub-entries">${matching.slice(0, limit).map(entryHtml).join("")}</ol>
          <a class="news-more" href="publications.html?topic=${encodeURIComponent(topic)}">
            ${matching.length > limit ? `All ${matching.length} papers` : "See them"} in ${escapeHtml(label)} →</a>`;
      });
    })
    .catch(err => console.error(err));
});
