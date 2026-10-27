"""Check every external link on the site and report the ones that no longer work.
DOIs are checked with the DOI registry itself (publishers often block automated visitors).
Sites that block automated checks (e.g. LinkedIn) are listed as "couldn't check", not as broken.
Writes links-report.md if anything is broken. Run by .github/workflows/links.yml, or locally:
python .github/check_links.py"""
import concurrent.futures
import glob
import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
UA = "Mozilla/5.0 (compatible; schmittlab-link-check; +https://schmittlab.com)"
SKIP = re.compile(r"^https?://(schmittlab\.com|www\.schmittlab\.com|fonts\.|cdn\.|gc\.zgo\.at|[^/]*goatcounter\.com)", re.I)

links = {}   # url -> set of places


def add(url, where):
    url = url.strip()
    if url.startswith("http") and not SKIP.match(url):
        links.setdefault(url, set()).add(where)


for page in glob.glob("*.html") + ["layout.js"]:
    text = re.sub(r"<!--.*?-->", "", open(page, encoding="utf-8").read(), flags=re.S)
    for url in re.findall(r'href="(https?://[^"]+)"', text):
        add(url.replace("&amp;", "&"), page)
for m in json.load(open("members.json", encoding="utf-8")):
    for key in ("orcid", "linkedin", "scholar"):
        if m.get(key):
            add(m[key], f"members.json ({m['name']})")
for n in json.load(open("news.json", encoding="utf-8")):
    if n.get("link", "").startswith("http"):
        add(n["link"], f"news.json ({n['date']})")
dois = {p["doi"]: p["title"] for p in json.load(open("publications.json", encoding="utf-8")) if p.get("doi")}


def check_url(url):
    for method in ("HEAD", "GET"):
        try:
            req = urllib.request.Request(url, method=method, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return "ok", r.status
        except urllib.error.HTTPError as e:
            if e.code in (404, 410):
                return "broken", e.code
            if method == "GET":
                return ("blocked" if e.code in (401, 403, 405, 429, 451, 999) or e.code >= 500 else "broken"), e.code
        except Exception as e:
            if method == "GET":
                return "broken", type(e).__name__
    return "broken", "?"


def check_doi(doi):
    if not doi.startswith("10."):
        return "broken", "written as a link: the doi field should be just 10.xxxx/..."
    try:
        url = "https://doi.org/api/handles/" + urllib.parse.quote(doi, safe="/")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30) as r:
            return ("ok", 200) if json.load(r).get("responseCode") == 1 else ("broken", "not registered")
    except urllib.error.HTTPError as e:
        return ("broken", "not registered") if e.code == 404 else ("blocked", e.code)
    except Exception as e:
        return "blocked", type(e).__name__


with concurrent.futures.ThreadPoolExecutor(8) as pool:
    url_results = dict(zip(links, pool.map(check_url, links)))
    doi_results = dict(zip(dois, pool.map(check_doi, dois)))

broken = [(u, r[1]) for u, r in url_results.items() if r[0] == "broken"]
broken_dois = [(d, r[1]) for d, r in doi_results.items() if r[0] == "broken"]
blocked = [(u, r[1]) for u, r in url_results.items() if r[0] == "blocked"]
print(f"{len(links)} links: {len(links) - len(broken) - len(blocked)} ok, {len(broken)} broken, "
      f"{len(blocked)} couldn't check; {len(dois)} DOIs: {len(broken_dois)} broken")
for u, why in broken:
    print(f"  BROKEN {u} ({why}) in {', '.join(sorted(links[u]))}")
for d, why in broken_dois:
    print(f"  BROKEN DOI {d} ({why})")
for u, why in blocked:
    print(f"  couldn't check {u} ({why})")

if broken or broken_dois:
    lines = ["These links on the website don't work any more:", ""]
    lines += [f"- {u} ({why}) — in {', '.join(sorted(links[u]))}" for u, why in broken]
    lines += [f"- DOI `{d}` ({why}) — in publications.bib, \"{re.sub(r'<[^>]+>', '', dois[d])[:80]}\"" for d, why in broken_dois]
    if blocked:
        lines += ["", f"(Also {len(blocked)} link(s) that block automated checks, e.g. LinkedIn; those weren't checked.)"]
    lines += ["", "Fix them in the file named, and this issue closes itself on the next check."]
    open("links-report.md", "w", encoding="utf-8").write("\n".join(lines) + "\n")
