#!/usr/bin/env python3
import os
import shutil
import requests
from bs4 import BeautifulSoup, NavigableString

SOURCE_FOLDER = "en-us"

COUNTRIES = {
    "us": ["en", "es"],
    "ca": ["en", "fr"]
}

TEXT_EXTENSIONS = {".html", ".htm", ".txt"}

# -----------------------------
# Logging helpers
# -----------------------------
def log(msg):
    print(f"[STATUS] {msg}")

def log_request(url, params):
    print(f"[REQUEST] GET {url} | params={params}")

def log_file(src, dest):
    print(f"[FILE] {src} -> {dest}")

# -----------------------------
# Google Translate (unofficial)
# -----------------------------
def translate_text(text: str, target_lang: str) -> str:
    if target_lang == "en":
        return text
    if not text.strip():
        return text

    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": target_lang,
        "dt": "t",
        "q": text
    }

    log_request(url, params)

    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    return data[0][0][0]

# -----------------------------
# Link rewriting
# -----------------------------
def rewrite_links_html(html: str, country: str, lang: str) -> str:
    new_prefix = f"/{country}/{lang}/"
    html = html.replace("/en-us/", new_prefix)
    html = html.replace("en-us/", f"{country}/{lang}/")
    return html

# -----------------------------
# HTML translation (safe)
# -----------------------------
def translate_html(html: str, target_lang: str, country: str, lang: str) -> str:
    log("Parsing HTML with BeautifulSoup")

    html = rewrite_links_html(html, country, lang)
    soup = BeautifulSoup(html, "html.parser")

    # Skip script/style blocks
    for tag in soup(["script", "style"]):
        continue

    # Translate text nodes
    for element in soup.find_all(string=True):
        if isinstance(element, NavigableString):
            parent = element.parent
            if parent.name in ("script", "style"):
                continue

            text = str(element)
            clean = text.strip()
            if not clean:
                continue

            # Skip code-like text
            if any(ch in clean for ch in "{};<>"):
                continue

            log(f"Translating text node: '{clean}'")

            try:
                translated = translate_text(clean, target_lang)
                element.replace_with(text.replace(clean, translated))
            except Exception as e:
                log(f"Translation failed for '{clean}': {e}")
                continue

    # Translate attributes
    for tag in soup.find_all(True):
        for attr in ("placeholder", "title", "alt"):
            if attr in tag.attrs:
                val = tag.attrs[attr]
                clean = val.strip()
                if not clean:
                    continue

                log(f"Translating attribute {attr}: '{clean}'")

                try:
                    translated = translate_text(clean, target_lang)
                    tag.attrs[attr] = translated
                except Exception as e:
                    log(f"Attribute translation failed: {e}")
                    continue

    return str(soup)

# -----------------------------
# File processing
# -----------------------------
def is_text_file(path: str) -> bool:
    _, ext = os.path.splitext(path)
    return ext.lower() in TEXT_EXTENSIONS

def process_file(src_path: str, dest_path: str, country: str, lang: str):
    log_file(src_path, dest_path)
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    _, ext = os.path.splitext(src_path)

    if not is_text_file(src_path):
        shutil.copy2(src_path, dest_path)
        return

    with open(src_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    if ext.lower() in {".html", ".htm"}:
        content = translate_html(content, lang, country, lang)
    elif ext.lower() == ".txt":
        log(f"Translating text file: {src_path}")
        content = translate_text(content, lang)
    else:
        content = rewrite_links_html(content, country, lang)

    with open(dest_path, "w", encoding="utf-8") as f:
        f.write(content)

# -----------------------------
# Clone site
# -----------------------------
def clone_site_for_locale(country: str, lang: str):
    log(f"Creating locale {country}/{lang}")
    target_root = os.path.join(country, lang)

    for root, dirs, files in os.walk(SOURCE_FOLDER):
        rel_root = os.path.relpath(root, SOURCE_FOLDER)
        if rel_root == ".":
            rel_root = ""
        for file in files:
            src_path = os.path.join(root, file)
            dest_path = os.path.join(target_root, rel_root, file)
            process_file(src_path, dest_path, country, lang)

# -----------------------------
# Cleanup
# -----------------------------
def delete_old_localized_folders():
    log("Cleaning old locales")
    for country in COUNTRIES.keys():
        if os.path.isdir(country):
            for lang in os.listdir(country):
                lang_path = os.path.join(country, lang)
                if os.path.isdir(lang_path):
                    log(f"Deleting {lang_path}")
                    shutil.rmtree(lang_path)

# -----------------------------
# Main
# -----------------------------
def main():
    if not os.path.isdir(SOURCE_FOLDER):
        raise SystemExit(f"Source folder '{SOURCE_FOLDER}' not found.")

    delete_old_localized_folders()

    for country, langs in COUNTRIES.items():
        for lang in langs:
            clone_site_for_locale(country, lang)

    log("DONE — localized site generated successfully.")

if __name__ == "__main__":
    main()
