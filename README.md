This website was created for the Schmitt Group at Trinity College Dublin. A test version can be found at https://kareemok.github.io/schmittlab/

## News images

Every news image box is 4:3 (landscape). For the best result, crop news photos to
4:3 before uploading, ideally **1200 × 900 px**, and put them in `assets/news/`.
Images of other shapes still work: they are shown whole with a blurred fill.

Optional per-post settings in `news.json`:

- `"fit": "cover"` crops the image to fill the box instead of showing it whole
- `"focus": "top"` (or `"center 30%"`, `"left"`, …) picks which part stays visible when cropped

## Header and footer

The navigation bar and footer are shared by every page and live in `layout.js`.
To add a page to the menu, change the contact links, or update the funder logos,
edit the lists at the top of `layout.js` and every page updates.

A new page needs these three lines in its `<body>` (copy them from any existing page):

```html
<div id="site-header"></div>
<script src="layout.js"></script>
<!-- page content -->
<div id="site-footer"></div>
```

## News

The home page shows the newest 3 posts from `news.json`, and `news.html` shows them all.
Project pages show the newest 3 with a matching tag (e.g. `data-tag="c4c"`), and link to
`news.html?tag=c4c` for the rest.

## Publications

`publications.bib` is the master list. To add a paper:

1. Copy its BibTeX (from the journal's "Cite" / "Export citation" button, or Google Scholar).
2. On GitHub, open `publications.bib`, click the pencil icon, paste the entry anywhere, and commit.

A GitHub Action then rebuilds `publications.json` (which the site reads) within a minute or two.
Don't edit `publications.json` by hand: it is overwritten on every rebuild.

If the Action fails (a red ✗ on the Actions tab), an entry in `publications.bib` has a typo,
usually a missing `}`; the site keeps showing the previous list until it's fixed.

## Group members

Everyone on the Members page, the home page's "Meet the Team" and the project pages' team
sections comes from `members.json`. Each person looks like this (only `name`, `role` and
`group` are required):

```json
{
  "name": "Dr. Jane Doe",
  "role": "Postdoctoral Researcher",
  "group": "postdoc",
  "photo": "assets/jane.jpg",
  "email": "doej@tcd.ie",
  "orcid": "https://orcid.org/0000-0000-0000-0000",
  "linkedin": "https://www.linkedin.com/in/janedoe/",
  "scholar": "https://scholar.google.com/citations?user=XXXX",
  "home": "Postdoctoral Researcher",
  "projects": { "c4c": "Postdoctoral Researcher" }
}
```

- `group` is `pi`, `postdoc` or `phd`, which decides the section on the Members page.
- Leave out `photo` and the "?" placeholder is shown.
- `home` (optional) puts the person on the home page, with that role.
- `projects` (optional) puts them in a project page's team, with the role shown there.
  Projects: `c4c`, `water-splitting`, `air-in-motion`, `synaergy`.
- The order in the file is the order on the page.

## Research areas

Each paper in `publications.bib` can have a `topics` line, e.g. `topics = {catalysis, mofs},`.
These drive the filter chips on the Publications page and the "Key Publications" lists on
project pages. Topics: `catalysis`, `co2-capture`, `mofs`, `supramolecular`, `clusters`,
`magnetism`, `luminescence`, `nanomaterials`, plus the project tag `c4c` for papers from
the C4C-Capture project (listed on the C4C page). New topics are added in `publication-format.js`.

## Automatic checks

On every commit, GitHub checks `news.json`, `members.json`, the publication topics and every
image/file link on the site. A red ✗ next to a commit means something would look broken;
click it, then "Site checks", to see exactly what (e.g. a missing comma, or a photo filename
with the wrong capital letters). Fix it and commit again.

## New papers (automatic suggestions)

On the 1st of each month, the "Check for new papers" Action looks at Prof. Schmitt's ORCID record
and Crossref for papers that aren't in `publications.bib` yet. If it finds any, it opens a pull
request called **"New papers to add to the website"** with their BibTeX already added.

To publish them: open the pull request → *Files changed* → edit `publications.bib`, fill in each new
paper's `topics = {...}`, then *Merge*. To reject one, delete its entry and add its DOI to
`.github/ignored-dois.txt` so it isn't suggested again. You can also run the check any time:
Actions tab → "Check for new papers" → *Run workflow*.
