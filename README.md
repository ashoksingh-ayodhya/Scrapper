# Scrapper

A Python-based web scraping toolkit with two bots:

1. **Facebook Comments Scraper** – Scrapes comments and nested replies from public Facebook posts.
2. **Google Maps Reviews Scraper** – Scrapes business reviews from Google Maps.

Both scrapers use [Selenium](https://www.selenium.dev/) with Chrome WebDriver and export results to CSV or JSON.

---

## Requirements

- Python 3.10+
- Google Chrome browser installed

## Installation

```bash
pip install -r requirements.txt
```

The `webdriver-manager` package automatically downloads the correct ChromeDriver for your installed version of Chrome.

---

## Usage

The project provides a unified CLI via `main.py`.

### Facebook Comments Scraper

```bash
# Scrape comments from a public Facebook post (output to CSV)
python main.py facebook "https://www.facebook.com/SomePage/posts/1234567890" \
    -o facebook_comments.csv

# Output as JSON
python main.py facebook "https://www.facebook.com/SomePage/posts/1234567890" \
    -o facebook_comments.json

# Show browser window and enable verbose logging
python main.py -v facebook "https://www.facebook.com/SomePage/posts/1234567890" \
    --no-headless
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output` | Output file (`.csv` or `.json`) | `facebook_comments.csv` |
| `--no-headless` | Show the browser window | off |
| `--scroll-pause` | Seconds between actions | `2.0` |
| `--max-loads` | Max "View more comments" clicks | `50` |

### Facebook Page Scraper

Scrape comments from **all posts** on a Facebook page, filtered by date.

```bash
# Scrape all comments from C3Pay page for the last 12 months
python main.py facebook-page "https://www.facebook.com/C3Pay" \
    --months 12 -o c3pay_comments.csv

# Output as JSON with verbose logging
python main.py -v facebook-page "https://www.facebook.com/C3Pay" \
    --months 6 -o c3pay_comments.json
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output` | Output file (`.csv` or `.json`) | `facebook_page_comments.csv` |
| `--months` | Only include posts from the last N months | `12` |
| `--no-headless` | Show the browser window | off |
| `--scroll-pause` | Seconds between page loads | `3.0` |
| `--max-pages` | Max timeline pages to traverse | `200` |

### Google Maps Reviews Scraper

```bash
# Scrape reviews from a Google Maps place URL
python main.py google-maps "https://www.google.com/maps/place/..." \
    -o reviews.csv

# Search by business name instead of URL
python main.py google-maps "Pizza Hut Times Square New York" \
    -o reviews.json

# Increase scroll limit for businesses with many reviews
python main.py google-maps "https://www.google.com/maps/place/..." \
    --max-scrolls 200 -o reviews.csv
```

**Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `-o, --output` | Output file (`.csv` or `.json`) | `google_maps_reviews.csv` |
| `--no-headless` | Show the browser window | off |
| `--scroll-pause` | Seconds between scroll actions | `2.0` |
| `--max-scrolls` | Max scrolls in the reviews panel | `100` |

---

## Python API

You can also use the scrapers programmatically:

```python
from facebook_scraper.comments_scraper import FacebookCommentsScraper

scraper = FacebookCommentsScraper(headless=True)
comments = scraper.scrape("https://www.facebook.com/SomePage/posts/123")
for comment in comments:
    print(f"{comment.author}: {comment.text}")
    for reply in comment.replies:
        print(f"  ↳ {reply.author}: {reply.text}")
scraper.save_to_csv(comments, "output.csv")
scraper.close()
```

```python
from facebook_scraper.page_scraper import FacebookPageScraper

scraper = FacebookPageScraper(headless=True, months=12)
results = scraper.scrape_page("https://www.facebook.com/C3Pay")
for post in results:
    print(f"Post: {post.post_text[:80]}...")
    for comment in post.comments:
        print(f"  {comment.author}: {comment.text}")
scraper.save_to_csv(results, "c3pay_comments.csv")
scraper.close()
```

```python
from google_maps_scraper.reviews_scraper import GoogleMapsReviewsScraper

scraper = GoogleMapsReviewsScraper(headless=True)
reviews = scraper.scrape("https://www.google.com/maps/place/...")
for review in reviews:
    print(f"{review.reviewer_name} ({review.rating}★): {review.text}")
scraper.save_to_csv(reviews, "reviews.csv")
scraper.close()
```

---

## Output Format

### Facebook Comments CSV

| Column | Description |
|--------|-------------|
| `type` | `comment` or `reply` |
| `author` | Name of the commenter |
| `text` | Comment body |
| `timestamp` | Relative timestamp |
| `parent_author` | Author of parent comment (for replies) |

### Google Maps Reviews CSV

| Column | Description |
|--------|-------------|
| `reviewer_name` | Name of the reviewer |
| `rating` | Star rating (1–5) |
| `relative_date` | e.g. "2 months ago" |
| `text` | Review body |
| `owner_response` | Business owner's reply (if any) |
| `owner_response_date` | Date of owner's reply |

---

## Project Structure

```
Scrapper/
├── main.py                              # CLI entry-point
├── requirements.txt                     # Python dependencies
├── facebook_scraper/
│   ├── __init__.py
│   ├── comments_scraper.py              # Facebook single-post comments bot
│   └── page_scraper.py                  # Facebook page-level scraper
├── google_maps_scraper/
│   ├── __init__.py
│   └── reviews_scraper.py               # Google Maps reviews bot
└── README.md
```

## Notes

- **Facebook:** The scraper converts URLs to their `mbasic.facebook.com` equivalent, which uses lightweight HTML instead of the React-based desktop site. This makes scraping more reliable. Public posts work without login; private/restricted posts require authentication (not supported out of the box).
- **Google Maps:** The scraper automatically scrolls the reviews panel, expands truncated review text, and captures owner responses. Google may change their page structure, so selectors may need periodic updates.
- Both scrapers respect `scroll_pause` delays to avoid overwhelming the target servers.