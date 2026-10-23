import json
import re
import sys
import bibtexparser
from bibtexparser.bparser import BibTexParser
from bibtexparser.customization import convert_to_unicode

with open("publications.bib", encoding="utf-8") as f:
    bib_text = f.read()

parser = BibTexParser(common_strings=True)
parser.customization = convert_to_unicode
bib_db = bibtexparser.loads(bib_text, parser=parser)

# A typo in the .bib (e.g. a missing brace) can make the parser silently skip
# entries. Stop rather than publish a shorter list.
expected = len(re.findall(r"^\s*@(?!comment|string|preamble)\w+\s*\{", bib_text, re.I | re.M))
if len(bib_db.entries) != expected:
    sys.exit(f"Read {len(bib_db.entries)} of {expected} entries in publications.bib; "
             "check the entries around the last one that was read. publications.json was not changed.")

publications = []

for entry in bib_db.entries:
    year    = entry.get("year", "")
    title   = entry.get("title", "").strip("{}")
    authors = entry.get("author", "")
    journal = entry.get("journal") or entry.get("booktitle") or ""
    volume  = entry.get("volume", "")
    pages   = entry.get("pages", "")
    doi     = entry.get("doi", "")
    url     = entry.get("url", "")

    pub_obj = {
        "year": year,
        "title": title,
        "authors": authors,
        "journal": journal,
        "volume": volume,
        "pages": pages,
        "doi": doi,
        "link": url or (f"https://doi.org/{doi}" if doi else "")
    }

    publications.append(pub_obj)

def year_key(p):
    try:
        return int(p["year"])
    except (ValueError, TypeError):
        return 0

publications.sort(key=year_key, reverse=True)

with open("publications.json", "w", encoding="utf-8") as f:
    json.dump(publications, f, indent=2, ensure_ascii=False)

print(f"Wrote {len(publications)} publications to publications.json")


