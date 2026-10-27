"""Checks the site's data files and links. Run by .github/workflows/checks.yml on every push.
Run it yourself with:  python .github/check_site.py
Prints every problem found and exits with an error if there are any."""
import datetime
import glob
import json
import os
import re
import sys

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
problems = []


def problem(where, message):
    problems.append(f"{where}: {message}")


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        problem(path, f"not valid JSON (line {e.lineno}, column {e.colno}: {e.msg}). "
                      "Often a missing or extra comma, or a missing quote.")
    except FileNotFoundError:
        problem(path, "file is missing")
    return None


def exists_exactly(path):
    """Like os.path.isfile, but capital letters must match too (the web server is case-sensitive,
    even when your own computer isn't)."""
    folder = "."
    for part in path.replace("\\", "/").split("/"):
        if part in ("", "."):
            continue
        try:
            if part not in os.listdir(folder):
                return False
        except NotADirectoryError:
            return False
        folder = os.path.join(folder, part)
    return os.path.isfile(folder)


def check_file(where, path):
    if path and not re.match(r"^(https?:|mailto:|#|data:)", path) and not exists_exactly(path.split("?")[0].split("#")[0]):
        problem(where, f'"{path}" does not exist (check the spelling and capital letters)')


# ---------- news.json ----------
news = load_json("news.json")
if news is not None:
    if not isinstance(news, list):
        problem("news.json", "should be a list of posts: [ {...}, {...} ]")
    else:
        for i, post in enumerate(news, 1):
            where = f'news.json post {i} ("{str(post.get("title", ""))[:40]}")'
            for field in ("date", "title", "text"):
                if not str(post.get(field, "")).strip():
                    problem(where, f'missing "{field}"')
            try:
                datetime.date.fromisoformat(str(post.get("date", "")))
            except ValueError:
                problem(where, f'date "{post.get("date")}" should look like 2026-10-21 (year-month-day)')
            check_file(where, post.get("image"))
            if "tags" in post and not (isinstance(post["tags"], list) and all(isinstance(t, str) for t in post["tags"])):
                problem(where, 'tags should be a list like ["c4c", "general"]')

# ---------- members.json ----------
PROJECTS = {"c4c", "water-splitting", "air-in-motion", "synaergy"}
members = load_json("members.json")
if members is not None:
    if not isinstance(members, list):
        problem("members.json", "should be a list of people: [ {...}, {...} ]")
    else:
        for i, m in enumerate(members, 1):
            where = f'members.json person {i} ("{m.get("name", "")}")'
            for field in ("name", "role", "group"):
                if not str(m.get(field, "")).strip():
                    problem(where, f'missing "{field}"')
            if m.get("group") not in ("pi", "postdoc", "phd"):
                problem(where, f'group "{m.get("group")}" should be "pi", "postdoc" or "phd"')
            check_file(where, m.get("photo"))
            if m.get("email") and not re.fullmatch(r"[^@\s]+@[^@\s]+\.[a-z]{2,}", m["email"], re.I):
                problem(where, f'email "{m["email"]}" doesn\'t look like an email address')
            for link in ("orcid", "linkedin", "scholar"):
                if m.get(link) and not m[link].startswith("https://"):
                    problem(where, f'{link} link should start with https://')
            for project in (m.get("projects") or {}):
                if project not in PROJECTS:
                    problem(where, f'unknown project "{project}" (use one of: {", ".join(sorted(PROJECTS))})')

# ---------- publications.json (built from publications.bib) ----------
known_topics = set(re.findall(r'^\s*"([a-z0-9-]+)":', open("publication-format.js", encoding="utf-8").read().split("const TOPICS")[1].split("};")[0], re.M))
pubs = load_json("publications.json")
for pub in pubs or []:
    doi = pub.get("doi", "")
    if doi and not re.match(r"^10\.\d{4,9}/\S+$", doi):
        problem(f'publications.bib "{pub.get("title", "")[:50]}"',
                f'doi "{doi}" should be just the DOI, like 10.1039/d3sc04002j (no https://doi.org/ in front)')
    for t in pub.get("topics", []):
        if t not in known_topics:
            problem(f'publications.bib "{pub.get("title", "")[:50]}"',
                    f'unknown topic "{t}" (use one of: {", ".join(sorted(known_topics))})')

# ---------- files referenced by pages and scripts ----------
for page in sorted(glob.glob("*.html")) + ["layout.js", "styles.css"]:
    text = open(page, encoding="utf-8").read()
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)  # ignore commented-out markup
    refs = re.findall(r'(?:src|href)="([^"]+)"', text) + re.findall(r'"(assets/[^"]+)"', text) \
        + re.findall(r'url\("?([^")]+)"?\)', text)
    for ref in set(refs):
        if "${" in ref or ref.startswith(("var(", "/")) or not re.search(r"\.(png|jpe?g|svg|webp|gif|ico|css|js|json|html|pdf|woff2?)$", ref.split("?")[0], re.I):
            continue
        check_file(page, ref)

if problems:
    print(f"Found {len(problems)} problem(s):")
    for p in problems:
        print("  - " + p)
    sys.exit(1)
print("All checks passed.")
