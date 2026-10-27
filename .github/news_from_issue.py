"""Turn a "News post" issue form into a news.json entry and a resized photo in assets/news/.
Run by .github/workflows/news-from-issue.yml. Reads the issue from environment variables
ISSUE_NUMBER, ISSUE_BODY (and GITHUB_TOKEN for downloading the photo).
On success writes pr-body.md; on a problem writes problem.md (posted back on the issue) and exits 1."""
import datetime
import html
import io
import json
import os
import re
import sys
import urllib.request

from PIL import Image, ImageOps

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
number = os.environ["ISSUE_NUMBER"]
body = os.environ["ISSUE_BODY"].replace("\r\n", "\n")


def fail(message):
    open("problem.md", "w", encoding="utf-8").write(
        "⚠️ I couldn't prepare this news post:\n\n" + message +
        "\n\nEdit the issue (⋯ → *Edit*) to fix it and I'll try again automatically.")
    print(message)
    sys.exit(1)


# ---- read the form: "### Label\n\nvalue" sections ----
fields = {}
for m in re.finditer(r"^### (.+?)\n\n(.*?)(?=\n### |\Z)", body, re.S | re.M):
    value = m.group(2).strip()
    fields[m.group(1).strip()] = "" if value == "_No response_" else value

title = fields.get("Post title", "")
date = fields.get("Date", "")
text = fields.get("Text", "")
link = fields.get("Link (optional)", "")
photo = fields.get("Photo", "")
alt = fields.get("Photo description (optional)", "")
c4c = bool(re.search(r"- \[x\] C4C-Capture project page", fields.get("Also show on", ""), re.I))

problems = []
if not title:
    problems.append("- The **Post title** is empty.")
if not text:
    problems.append("- The **Text** is empty.")
try:
    datetime.date.fromisoformat(date)
except ValueError:
    problems.append(f"- The **Date** `{date}` should look like `2026-10-23` (year-month-day).")
if link and not re.match(r"^(https?://\S+|[\w-]+\.html)$", link):
    problems.append(f"- The **Link** `{link}` should start with `https://`.")
urls = re.findall(r"!\[[^\]]*\]\((https://[^)\s]+)\)", photo) + re.findall(r'<img[^>]+src="(https://[^"]+)"', photo)
if not urls:
    problems.append("- No **Photo** found: drag a JPG or PNG into the Photo box so it shows as an image.")
if problems:
    fail("\n".join(problems))

# Only simple formatting may reach the page (the site inserts title/text as HTML)
ALLOWED = r"</?(?:i|em|b|strong|sub|sup)>"


def clean(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"&lt;(/?(?:i|em|b|strong|sub|sup))&gt;", r"<\1>", s, flags=re.I)
    return re.sub(r"\s*\n\s*", " ", s).strip()


title, text = clean(title), clean(text)

# ---- download and resize the photo ----
def download(url):
    # Uploaded images redirect to a storage server that rejects GitHub tokens, and public repos
    # don't need one: try without first, then with the token (private repos).
    attempts = [{"User-Agent": "schmittlab-website"}]
    if os.environ.get("GITHUB_TOKEN"):
        attempts.append({"User-Agent": "schmittlab-website", "Authorization": "Bearer " + os.environ["GITHUB_TOKEN"]})
    for i, headers in enumerate(attempts):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60).read()
        except Exception:
            if i == len(attempts) - 1:
                raise


try:
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(download(urls[0]))))
except Exception as e:
    fail(f"- I couldn't open the photo ({type(e).__name__}). Please use a JPG or PNG (iPhone HEIC photos need exporting as JPG).")
if img.mode in ("RGBA", "LA", "P"):
    img = img.convert("RGBA")
    flat = Image.new("RGB", img.size, "white")
    flat.paste(img, mask=img.getchannel("A"))
    img = flat
img = img.convert("RGB")
img.thumbnail((1600, 1600), Image.LANCZOS)   # news photos show at most ~450px wide; 2x+ for sharp screens
slug = re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", html.unescape(title)).lower()).strip("-")[:40] or "post"
image_path = f"assets/news/{date}-{slug}.jpg"
os.makedirs("assets/news", exist_ok=True)
img.save(image_path, "JPEG", quality=82, optimize=True, progressive=True)

# ---- add the entry to news.json (replacing an earlier version from this same issue) ----
news = json.load(open("news.json", encoding="utf-8"))
news = [n for n in news if n.get("issue") != int(number)]
entry = {"date": date, "title": title, "text": text, "image": image_path}
if alt:
    entry["alt"] = clean(alt)
if link:
    entry["link"] = link
entry["tags"] = ["general", "c4c"] if c4c else ["general"]
entry["issue"] = int(number)   # lets an edited form replace its own post
news.append(entry)
with open("news.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(news, f, indent=2, ensure_ascii=False)
    f.write("\n")

kb = os.path.getsize(image_path) // 1024
open("pr-body.md", "w", encoding="utf-8").write(
    f"News post from #{number}:\n\n"
    f"> **{date} · {title}**  \n> {text}\n\n"
    f"- Photo: `{image_path}` ({img.width}×{img.height}, {kb} KB)\n"
    + (f"- Link: {link}\n" if link else "")
    + f"- Shown on: home page{' and C4C-Capture page' if c4c else ''}\n\n"
    "Check it reads right, then **Merge** to publish. To change something, edit the issue and this "
    f"pull request updates itself.\n\nCloses #{number}\n")
print(f"Prepared news post: {date} {title} ({image_path}, {kb} KB)")
