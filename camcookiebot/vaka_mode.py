import requests
from bs4 import BeautifulSoup
import os
import json
import hashlib

start_urls = [
    "https://example.com",  # Replace/add Camcookie-related sites
]

output_folder = "data/vaka_dump"
json_index = "data/vaka_index.json"
visited = set()
pages = []

os.makedirs(output_folder, exist_ok=True)

def filename_from_url(url):
    hashed = hashlib.md5(url.encode()).hexdigest()
    return f"{hashed}.html"

def crawl_deep(url):
    print(f"🌐 VAKA downloading: {url}")
    try:
        res = requests.get(url, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        filename = filename_from_url(url)
        filepath = os.path.join(output_folder, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(res.text)

        title = soup.title.string.strip() if soup.title else "No Title"
        text = soup.get_text(strip=True)[:300]

        pages.append({
            "url": url,
            "file": filename,
            "title": title,
            "preview": text
        })

        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('http') and href not in visited:
                visited.add(href)
                crawl_deep(href)

    except Exception as e:
        print(f"⚠️ Error: {e}")

# Start crawl
for url in start_urls:
    visited.add(url)
    crawl_deep(url)

# Save index
with open(json_index, 'w') as f:
    json.dump(pages, f, indent=2)

print(f"✅ VAKA Mode finished. {len(pages)} pages downloaded.")
