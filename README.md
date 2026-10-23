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
