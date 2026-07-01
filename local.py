#!/usr/bin/env python3
import os
import shutil
import time
import requests
from bs4 import BeautifulSoup, NavigableString
from concurrent.futures import ThreadPoolExecutor, as_completed

# ---------------- CONFIG ----------------
SOURCE_FOLDER = "original"

LANGUAGES = {
    "af": "afrikaans", "sq": "albanian", "am": "amharic", "ar": "arabic",
    "hy": "armenian", "az": "azerbaijani", "eu": "basque", "be": "belarusian",
    "bn": "bengali", "bs": "bosnian", "bg": "bulgarian", "ca": "catalan",
    "ceb": "cebuano", "ny": "chichewa", "zh-CN": "chinese_simplified",
    "zh-TW": "chinese_traditional", "co": "corsican", "hr": "croatian",
    "cs": "czech", "da": "danish", "nl": "dutch", "en": "english",
    "eo": "esperanto", "et": "estonian", "tl": "filipino", "fi": "finnish",
    "fr": "french", "fy": "frisian", "gl": "galician", "ka": "georgian",
    "de": "german", "el": "greek", "gu": "gujarati", "ht": "haitian_creole",
    "ha": "hausa", "haw": "hawaiian", "iw": "hebrew", "hi": "hindi",
    "hmn": "hmong", "hu": "hungarian", "is": "icelandic", "ig": "igbo",
    "id": "indonesian", "ga": "irish", "it": "italian", "ja": "japanese",
    "jw": "javanese", "kn": "kannada", "kk": "kazakh", "km": "khmer",
    "rw": "kinyarwanda", "ko": "korean", "ku": "kurdish", "ky": "kyrgyz",
    "lo": "lao", "la": "latin", "lv": "latvian", "lt": "lithuanian",
    "lb": "luxembourgish", "mk": "macedonian", "mg": "malagasy",
    "ms": "malay", "ml": "malayalam", "mt": "maltese", "mi": "maori",
    "mr": "marathi", "mn": "mongolian", "my": "myanmar", "ne": "nepali",
    "no": "norwegian", "or": "odia", "ps": "pashto", "fa": "persian",
    "pl": "polish", "pt": "portuguese", "pa": "punjabi", "ro": "romanian",
    "ru": "russian", "sm": "samoan", "gd": "scots_gaelic", "sr": "serbian",
    "st": "sesotho", "sn": "shona", "sd": "sindhi", "si": "sinhala",
    "sk": "slovak", "sl": "slovenian", "so": "somali", "es": "spanish",
    "su": "sundanese", "sw": "swahili", "sv": "swedish", "tg": "tajik",
    "ta": "tamil", "tt": "tatar", "te": "telugu", "th": "thai",
    "tr": "turkish", "tk": "turkmen", "uk": "ukrainian", "ur": "urdu",
    "ug": "uyghur", "uz": "uzbek", "vi": "vietnamese", "cy": "welsh",
    "xh": "xhosa", "yi": "yiddish", "yo": "yoruba", "zu": "zulu"
}

TEXT_EXTENSIONS = {".html", ".htm", ".txt"}
MAX_WORKERS = 4  # bump this if you want more parallelism

# ---------------- GLOBAL STATE ----------------
session = requests.Session()
translate_cache = {}
request_count = 0

def log(msg):
    print(f"[STATUS] {msg}")

def log_file(src, dest):
    print(f"[FILE] {src} -> {dest}")

def log_lang(lang_code, folder_name, idx, total):
    print(f"[LANG] {idx}/{total} {lang_code} -> {folder_name}")

def log_request(url, params):
    global request_count
    request_count += 1
    print(f"[REQUEST #{request_count}] GET {url} | q={params.get('q','')[:40]}...")

# ---------------- TRANSLATION ----------------
def translate_text(text, lang):
    if lang == "en":
        return text
    key = (text, lang)
    if key in translate_cache:
        return translate_cache[key]

    if not text.strip():
        return text

    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": "en",
        "tl": lang,
        "dt": "t",
        "q": text
    }

    log_request(url, params)
    resp = session.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    translated = data[0][0][0]
    translate_cache[key] = translated
    return translated

# ---------------- LINK REWRITE ----------------
def rewrite_links(html, lang):
    folder = LANGUAGES[lang]
    html = html.replace("/original/", f"/{folder}/")
    html = html.replace("original/", f"{folder}/")
    return html

# ---------------- HTML TRANSLATION ----------------
def translate_html(html, lang):
    html = rewrite_links(html, lang)
    soup = BeautifulSoup(html, "html.parser")

    for element in soup.find_all(string=True):
        if isinstance(element, NavigableString):
            parent = element.parent
            if parent.name in ("script", "style"):
                continue

            text = str(element)
            clean = text.strip()
            if not clean:
                continue

            if any(ch in clean for ch in "{};<>"):
                continue

            try:
                translated = translate_text(clean, lang)
                element.replace_with(text.replace(clean, translated))
            except Exception as e:
                log(f"[WARN] text failed '{clean}': {e}")

    for tag in soup.find_all(True):
        for attr in ("placeholder", "title", "alt"):
            if attr in tag.attrs:
                val = tag.attrs[attr].strip()
                if val:
                    try:
                        tag.attrs[attr] = translate_text(val, lang)
                    except Exception as e:
                        log(f"[WARN] attr {attr} failed '{val}': {e}")

    return str(soup)

# ---------------- FILE PROCESSING ----------------
def is_text_file(path):
    _, ext = os.path.splitext(path)
    return ext.lower() in TEXT_EXTENSIONS

def process_file(src, dest, lang):
    log_file(src, dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)

    _, ext = os.path.splitext(src)

    if not is_text_file(src):
        shutil.copy2(src, dest)
        return

    with open(src, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    if ext.lower() in {".html", ".htm"}:
        content = translate_html(content, lang)
    elif ext.lower() == ".txt":
        content = translate_text(content, lang)
    else:
        content = rewrite_links(content, lang)

    with open(dest, "w", encoding="utf-8") as f:
        f.write(content)

# ---------------- PER-LANGUAGE CLONE ----------------
def clone_language(lang):
    folder = LANGUAGES[lang]
    log(f"Starting language '{lang}' -> folder '{folder}'")

    for root, dirs, files in os.walk(SOURCE_FOLDER):
        rel = os.path.relpath(root, SOURCE_FOLDER)
        if rel == ".":
            rel = ""
        for file in files:
            src = os.path.join(root, file)
            dest = os.path.join(folder, rel, file)
            process_file(src, dest, lang)

    log(f"Finished language '{lang}' -> folder '{folder}'")

# ---------------- MAIN ----------------
def main():
    if not os.path.isdir(SOURCE_FOLDER):
        raise SystemExit(f"Source folder '{SOURCE_FOLDER}' not found.")

    log("Cleaning old language folders...")
    for folder in LANGUAGES.values():
        if os.path.isdir(folder):
            shutil.rmtree(folder)

    total_langs = len(LANGUAGES)
    log(f"Translating into {total_langs} languages...")
    start = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {}
        for idx, (lang, folder) in enumerate(LANGUAGES.items(), start=1):
            log_lang(lang, folder, idx, total_langs)
            futures[executor.submit(clone_language, lang)] = lang

        for future in as_completed(futures):
            lang = futures[future]
            try:
                future.result()
            except Exception as e:
                log(f"[ERROR] language '{lang}' failed: {e}")

    elapsed = time.time() - start
    log(f"DONE — all languages generated in {elapsed:.1f}s, {request_count} translation requests.")

if __name__ == "__main__":
    main()
