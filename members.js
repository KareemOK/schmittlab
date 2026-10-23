// Group members, built from members.json. Edit members.json to add, remove or update people.
//   members.html:   <div id="members-page"></div>                       full list, grouped
//   project pages:  <div class="members-grid" data-project="c4c"></div>  people with that project
//   home page:      <div class="homepage-team" data-home>...</div>       people with "home" set
//                   (anything already inside, like the "Meet the Full Team" card, stays at the end)

document.addEventListener("DOMContentLoaded", () => {
  const membersPage = document.getElementById("members-page");
  const projectGrids = document.querySelectorAll("[data-project]");
  const homeTeam = document.querySelector("[data-home]");
  if (!membersPage && !projectGrids.length && !homeTeam) return;

  const PLACEHOLDER_PHOTO = "assets/q.png";
  const SECTIONS = [
    { group: "postdoc", heading: "Postdoctoral Researchers" },
    { group: "phd", heading: "Postgraduate Researchers" },
  ];

  const esc = (str = "") =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  function linksHtml(m) {
    const links = [
      [m.linkedin, "LinkedIn profile", "assets/linkedin.svg", "LinkedIn"],
      [m.orcid, "ORCID profile", "assets/orcid.svg", "ORCID"],
      [m.scholar, "Google Scholar profile", "assets/scholar.svg", "Scholar"],
    ].filter(([url]) => url);
    if (!links.length) return "";
    return `<div class="member-links">${links.map(([url, label, icon, alt]) =>
      `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${label}: ${esc(m.name)}">` +
      `<img loading="lazy" src="${icon}" alt="${alt}"></a>`).join("")}</div>`;
  }

  const photoHtml = (m, cls) =>
    `<img loading="lazy" src="${esc(m.photo || PLACEHOLDER_PHOTO)}" class="${cls}" alt="${esc(m.name)}">`;

  const emailHtml = (m, linkClass = "") => m.email
    ? `<div class="member-affiliation"><a href="mailto:${esc(m.email)}"${linkClass ? ` class="${linkClass}"` : ""}>${esc(m.email)}</a></div>`
    : "";

  function memberCard(m, role = m.role) {
    return `
      <div class="member-card">
        ${photoHtml(m, "member-photo")}
        <div class="member-name">${esc(m.name)}</div>
        ${linksHtml(m)}
        <div class="member-role">${esc(role)}</div>
        ${emailHtml(m)}
      </div>`;
  }

  // The bio is written by the group in members.json and may contain simple HTML (e.g. CO<sub>2</sub>)
  function piCard(m) {
    return `
      <div class="member-card pi-profile pi-featured">
        <div class="pi-left">
          ${photoHtml(m, "member-photo")}
          <div class="member-name">${esc(m.name)}</div>
          ${linksHtml(m)}
          <div class="member-role">${esc(m.role)}</div>
          ${emailHtml(m, "email-link")}
        </div>
        <div class="pi-right"><p>${m.bio || ""}</p></div>
      </div><br>`;
  }

  const homeCard = m => `
      <div class="team-card">
        ${photoHtml(m, "team-photo")}
        <div class="team-name">${esc(m.name)}</div>
        <div class="team-role">${esc(m.home)}</div>
      </div>`;

  fetch("members.json?v=1")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load members.json");
      return res.json();
    })
    .then(members => {
      if (membersPage) {
        membersPage.innerHTML =
          members.filter(m => m.group === "pi").map(piCard).join("") +
          SECTIONS.map(({ group, heading }) => {
            const people = members.filter(m => m.group === group);
            return people.length
              ? `<h2>${heading}</h2><div class="members-grid">${people.map(m => memberCard(m)).join("")}</div><br>`
              : "";
          }).join("");
      }

      projectGrids.forEach(grid => {
        const project = grid.dataset.project;
        grid.innerHTML = members
          .filter(m => m.projects && m.projects[project])
          .map(m => memberCard(m, m.projects[project]))
          .join("");
      });

      if (homeTeam) {
        homeTeam.insertAdjacentHTML("afterbegin", members.filter(m => m.home).map(homeCard).join(""));
      }
    })
    .catch(err => {
      console.error(err);
      if (membersPage) membersPage.innerHTML = "<p>Unable to load group members.</p>";
    });
});
