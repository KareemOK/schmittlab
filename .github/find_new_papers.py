"""Find Prof. Schmitt's papers that aren't in publications.bib yet, and add their BibTeX.

Looks at his ORCID record and at Crossref (each can miss papers the other has), keeps journal
articles, book chapters and conference papers, skips DOIs already in publications.bib or listed in
.github/ignored-dois.txt, and adds each new paper to the top of publications.bib with an empty
`topics = {}` for a person to fill in. Writes a summary to new-papers.md (used as the pull request
text). Run by .github/workflows/new-papers.yml, or locally:  python .github/find_new_papers.py"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ORCID = "0000-0002-0058-9404"          # Prof. Wolfgang Schmitt
KEEP_TYPES = {"journal-article", "book-chapter", "proceedings-article"}
HEADERS = {"User-Agent": "schmittlab-website (https://schmittlab.com; new-paper check)"}

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))


def get(url, accept="application/json", tries=4):
    for attempt in range(tries):
        try:
            req = urllib.request.Request(url, headers={**HEADERS, "Accept": accept})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt == tries - 1:
                raise
        except urllib.error.URLError:
            if attempt == tries - 1:
                raise
        time.sleep(5 * (attempt + 1))


norm = lambda doi: doi.strip().lower().removeprefix("https://doi.org/").removeprefix("http://dx.doi.org/")

bib = open("publications.bib", encoding="utf-8").read()
known = {norm(d) for d in re.findall(r"\bdoi\s*=\s*\{([^}]+)\}", bib, re.I)}
# Titles too: the same paper can have more than one DOI (e.g. Angewandte's German and
# International editions), and a title already on the list means it isn't new.
plain = lambda t: re.sub(r"[^a-z0-9]", "", re.sub(r"<[^>]+>|\\[a-zA-Z]+|[{}]", "", t or "").lower())
known_titles = {plain(t) for t in re.findall(r"\btitle\s*=\s*\{((?:[^{}]|\{[^{}]*\})*)\}", bib, re.I)}
ignored = set()
if os.path.exists(".github/ignored-dois.txt"):
    ignored = {norm(l.split("#")[0]) for l in open(".github/ignored-dois.txt", encoding="utf-8") if l.split("#")[0].strip()}

# ---- candidate DOIs from ORCID and Crossref ----
candidates = set()
works = json.loads(get(f"https://pub.orcid.org/v3.0/{ORCID}/works"))
for group in works.get("group", []):
    for summary in group.get("work-summary", []):
        for ext in (summary.get("external-ids") or {}).get("external-id", []):
            if ext.get("external-id-type") == "doi" and ext.get("external-id-value"):
                candidates.add(norm(ext["external-id-value"]))
orcid_count = len(candidates)

cursor = "*"
while cursor:
    page = json.loads(get("https://api.crossref.org/works?" + urllib.parse.urlencode(
        {"filter": f"orcid:{ORCID}", "rows": 200, "cursor": cursor, "select": "DOI"})))["message"]
    candidates |= {norm(i["DOI"]) for i in page["items"]}
    cursor = page.get("next-cursor") if page["items"] else None
print(f"ORCID: {orcid_count} DOIs; ORCID + Crossref: {len(candidates)}; already listed: {len(known)}")

# ---- check each unknown DOI and fetch its BibTeX ----
new_entries, summary = [], []
for doi in sorted(candidates - known - ignored):
    meta = get(f"https://api.crossref.org/works/{urllib.parse.quote(doi, safe='')}")
    if not meta:
        continue
    m = json.loads(meta)["message"]
    if m.get("type") not in KEEP_TYPES:
        print(f"  skip {doi} ({m.get('type')})")
        continue
    title = " ".join((m.get("title") or [""])[0].split())
    if plain(title) in known_titles:
        print(f"  skip {doi} (same title already listed, under another DOI)")
        continue
    journal = (m.get("container-title") or [""])[0]
    year = ((m.get("issued") or {}).get("date-parts") or [[None]])[0][0]
    bibtex = get(f"https://api.crossref.org/works/{urllib.parse.quote(doi, safe='')}/transform/application/x-bibtex",
                 accept="application/x-bibtex")
    if not bibtex or not bibtex.lstrip().startswith("@"):
        print(f"  no BibTeX for {doi}")
        continue
    bibtex = bibtex.strip()
    # drop Crossref's old-style "url={http://dx.doi.org/...}"; the site links the DOI itself
    bibtex = re.sub(r"\s*\burl\s*=\s*\{http://dx\.doi\.org/[^}]*\},", "", bibtex, flags=re.I)
    # add an empty topics line right after "@article{key,"
    bibtex = re.sub(r"^(@\w+\{[^,]*,)", r"\1\n  topics = {},", bibtex, count=1)
    new_entries.append(bibtex)
    summary.append(f"- **{year}** · {title} · *{journal}* · [{doi}](https://doi.org/{doi})")
    print(f"  NEW {year} {doi} {title[:70]}")
    time.sleep(0.3)

if not new_entries:
    print("No new papers.")
    sys.exit(0)

open("publications.bib", "w", encoding="utf-8").write("\n\n".join(new_entries) + "\n\n" + bib)
open("new-papers.md", "w", encoding="utf-8").write(
    f"Found {len(new_entries)} paper(s) on Prof. Schmitt's ORCID record / Crossref that aren't on the website yet:\n\n"
    + "\n".join(summary) + "\n\n"
    "**Before merging:** in *Files changed*, click the ⋯ → *Edit file* on `publications.bib` and, for each new entry,\n"
    "fill in `topics = {...}` (e.g. `{catalysis, mofs}`; see the README for the list) and check the title looks right.\n\n"
    "**Not ours / not wanted?** Delete that entry, and add its DOI to `.github/ignored-dois.txt` so it isn't suggested again.\n\n"
    "Merging publishes them: the publications list rebuilds automatically.\n")
print(f"Added {len(new_entries)} new paper(s) to publications.bib")
