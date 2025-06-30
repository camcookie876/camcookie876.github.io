import requests
from bs4 import BeautifulSoup
import json
import os
import time

# CONFIG
start_urls = [
    "https://example.com",
    "https://camcookie.com"  # Add more Camcookie-related URLs
]
headers = {
    "User-Agent": "CamcookieBot/1.0 (+https://camcookie.com/bot)"
}
json_path = "data/crawled_pages.json"
visited = set()

# Create data folder if needed
os.makedirs("data", exist_ok=True)

# Load existing data if available
if os.path.exists(json_path):
    with open(json_path, "r") as f:
        crawled_data = json.load(f)
else:
    crawled_data = []

def crawl(url):
    print(f"🤖 Crawling: {url}")
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')

        title = soup.title.string.strip() if soup.title else "No title"
        text = soup.get_text(strip=True)[:200]  # short preview

        page_data = {
            "url": url,
            "title": title,
            "preview": text
        }

        # Save to JSON
        crawled_data.append(page_data)
        with open(json_path, "w") as f:
            json.dump(crawled_data, f, indent=2)

        print(f"✅ Saved: {title}")

        # Crawl more links (optional)
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith("http") and href not in visited:
                visited.add(href)
                time.sleep(1)  # polite delay
                crawl(href)    # recursive crawl

    except Exception as e:
        print(f"⚠ Failed to crawl {url}: {e}")

# Start crawling
for url in start_urls:
    if url not in visited:
        visited.add(url)
        crawl(url)
