// Shared header and footer for every page.
// Edit the navigation, contact links or funder logos here, and all pages update.
//
// Each page has:
//   <div id="site-header"></div>
//   <script src="layout.js"></script>   (straight after it, so the header appears without a flash)
//   ...
//   <div id="site-footer"></div>

(() => {
  const NAV_LINKS = [
    { href: "index.html", label: "Home" },
    { href: "publications.html", label: "Publications" },
    { href: "c4c.html", label: "C4C-Capture" },
    { href: "water-splitting.html", label: "Water Splitting" },
    { href: "air-in-motion.html", label: "Air-in-Motion" },
    { href: "synaergy.html", label: "Synaergy" },
    { href: "members.html", label: "Members" },
  ];

  // Small pre-rendered PNGs: the original SVG logos are 40–330 KB each
  const FUNDERS = [
    { href: "https://www.tcd.ie", img: "assets/footer/trinity.png", alt: "Trinity College Dublin", priority: true },
    { href: "https://www.ambercentre.ie", img: "assets/footer/amber.png", alt: "AMBER research centre", priority: true },
    { href: "https://www.researchireland.ie", img: "assets/footer/research_ireland.png", alt: "Research Ireland" },
    { href: "https://www.epa.ie", img: "assets/footer/epa.png", alt: "Environmental Protection Agency" },
    { href: "https://eic.ec.europa.eu", img: "assets/footer/eic.png", alt: "European Innovation Council" },
    { href: "https://erc.europa.eu/homepage", img: "assets/footer/erc.png", alt: "European Research Council" },
  ];

  const CONTACT_EMAIL = "schmittw@tcd.ie";

  // "" or "/" means the homepage
  const currentPage = location.pathname.split("/").pop() || "index.html";

  const headerHTML = `
  <header>
    <div class="header-top">
      <a href="index.html" class="logo-container">
        <img src="assets/tcd.svg" alt="Trinity College Dublin" class="logo-img">
        <span class="logo-text">Schmitt Group</span>
      </a>

      <button class="nav-toggle"
              aria-label="Toggle navigation menu"
              aria-controls="site-nav"
              aria-expanded="false">☰</button>
    </div>

    <nav class="main-nav" id="site-nav" aria-label="Main navigation">
      ${NAV_LINKS.map(link => {
        const active = link.href === currentPage;
        return `<a href="${link.href}"${active ? ' class="active" aria-current="page"' : ""}>${link.label}</a>`;
      }).join("\n      ")}
    </nav>
  </header>`;

  const footerHTML = `
  <footer class="site-footer">
    <div class="footer-content">

      <div class="footer-contact">
        <div class="footer-contact-label">Contact</div>

        <a href="mailto:${CONTACT_EMAIL}" class="footer-contact-item">
          <span class="icon">
            <img src="assets/email.svg" alt="" loading="lazy">
          </span>
          <span>Email us</span>
        </a>
      </div>

      <div class="footer-funding-block">
        <div class="footer-funding-label">Supported by</div>

        <div class="footer-funding">
          ${FUNDERS.map(f => `<a href="${f.href}" target="_blank" rel="noopener noreferrer">
            <img src="${f.img}"${f.priority ? ' class="priority"' : ""} alt="${f.alt}" loading="lazy">
          </a>`).join("\n          ")}
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      © ${new Date().getFullYear()} Schmitt Group
    </div>
  </footer>`;

  // Header: render now, before the rest of the page is painted
  const headerSlot = document.getElementById("site-header");
  if (headerSlot) headerSlot.outerHTML = headerHTML;

  document.addEventListener("DOMContentLoaded", () => {
    const footerSlot = document.getElementById("site-footer");
    if (footerSlot) footerSlot.outerHTML = footerHTML;

    // Mobile / tablet menu button
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
})();
