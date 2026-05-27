import json
import os
import re
import sys
import time
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.rspb.org.uk"
START_URL = "https://www.rspb.org.uk/birds-and-wildlife/a-z"


def clean_bird_code(name):
    """Converts a bird name into a clean, lowercase snake_case code for image filenames.

    Example: "Black-headed Gull" -> "black_headed_gull"
    """
    clean = re.sub(r"[-/\s]+", "_", name.lower())
    clean = re.sub(r"[^a-z0-9_]", "", clean)
    return re.sub(r"__+", "_", clean).strip("_")


def scrape_rspb_birds():
    print(f"Connecting to RSPB directory: {START_URL}...")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # 1. DEFENSIVE STEP: Load existing json file to preserve your checklist progress
    existing_birds = {}
    output_filename = "birds.json"

    if os.path.exists(output_filename):
        try:
            with open(output_filename, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                if isinstance(old_data, list):
                    for bird in old_data:
                        code = bird.get("code") or clean_bird_code(
                            bird.get("name", "")
                        )
                        if code:
                            existing_birds[code] = bird
            print(
                f" Found existing '{output_filename}'. Your logged sightings will be preserved."
            )
        except Exception as e:
            print(
                f" Warning: Could not parse old '{output_filename}' safely ({e}). Proceeding clean."
            )

    bird_list = []
    seen_urls = set()

    # Blacklist administrative matching terms under the birds-and-wildlife directory
    blacklist_slugs = {
        "a-z",
        "find-a-bird",
        "search",
        "filter",
        "schedules",
        "advice",
        "news",
        "identifying-birds",
    }

    # 2. PAGINATION TRAVERSAL LOOP (Handles pages 1 through 24 systematically)
    for page_num in range(1, 25):
        print(f"Scraping directory page {page_num}...")
        page_url = f"{START_URL}?page={page_num}"

        try:
            response = requests.get(page_url, headers=headers, timeout=15)
            if response.status_code == 404:
                print("Reached the end of directory pagination.")
                break
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            print(f"Traverse broke on page {page_num} or completed early: {e}")
            break

        soup = BeautifulSoup(response.text, "html.parser")
        links = soup.find_all("a", href=True)
        page_birds_found = 0

        for link in links:
            relative_url = link["href"]

            # Normalize and strip out query strings/anchor tags
            clean_path = relative_url.split("?")[0].split("#")[0].strip("/")
            path_parts = clean_path.split("/")

            # Direct bird profiles have a clear two-part signature structure: ['birds-and-wildlife', 'slug']
            if len(path_parts) == 2 and path_parts[0] == "birds-and-wildlife":
                slug = path_parts[1]

                if slug in blacklist_slugs:
                    continue

                full_url = urljoin(BASE_URL, relative_url.split("?")[0])

                if full_url in seen_urls:
                    continue

                # 3. TEXT ISOLATION LOGIC
                # Extract inner content using custom separators to catch nested scientific spans
                text_nodes = [
                    t.strip()
                    for t in link.get_text(separator="|||").split("|||")
                    if t.strip()
                ]
                if not text_nodes:
                    continue

                raw_name = text_nodes[0]

                # Fallback Regex Fix: If common text and Latin are fused in a single node ("Blue TitCyanistes caeruleus")
                # Split along the implicit lowercase-to-uppercase transition boundary
                split_match = re.search(r"([a-z])([A-Z])", raw_name)
                if split_match:
                    name = raw_name[: split_match.start() + 1].strip()
                else:
                    name = raw_name.strip()

                # Filter residual layout strings or control labels
                name = re.sub(r"^Bird:\s+", "", name, flags=re.IGNORECASE)
                if (
                    not name
                    or name.lower()
                    in {
                        "read more",
                        "view bird",
                        "filter",
                        "search",
                        "next",
                        "previous",
                    }
                ):
                    continue

                seen_urls.add(full_url)
                bird_code = clean_bird_code(name)

                # 4. DATA MERGE PROGRESS PROTECTION
                seen_status = False
                where_seen = ""
                photos = []

                if bird_code in existing_birds:
                    seen_status = existing_birds[bird_code].get("seen", False)
                    where_seen = existing_birds[bird_code].get(
                        "where_seen", ""
                    )
                    photos = existing_birds[bird_code].get("photos", [])

                bird_list.append(
                    {
                        "name": name,
                        "code": bird_code,
                        "seen": seen_status,
                        "where_seen": where_seen,
                        "photos": photos,
                        "url": full_url,
                    }
                )
                page_birds_found += 1

        print(f" -> Processed {page_birds_found} species card links.")
        # Polite courtesy throttle to respect web server capacity
        time.sleep(1)

    if not bird_list:
        print("\nError: No birds matched. Layout rules may require adjustments.")
        sys.exit(1)

    # Alphabetize everything dynamically prior to exporting
    bird_list.sort(key=lambda x: x["name"])

    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(bird_list, f, indent=2, ensure_ascii=False)

    print("\nScraping complete!")
    print(
        f"Successfully written {len(bird_list)} species records to '{output_filename}' with direct documentation links!"
    )


if __name__ == "__main__":
    scrape_rspb_birds()