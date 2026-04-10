"""Facebook Page Scraper — Selenium + www.facebook.com.

mbasic.facebook.com now redirects to the main site, so this scraper
works directly against www.facebook.com using a logged-in cookies.txt.
"""

import csv
import json
import logging
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from http.cookiejar import MozillaCookieJar

from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
    WebDriverException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)

_FB = "https://www.facebook.com"
_POST_PATTERNS = ("/posts/", "/story.php?", "/permalink/", "/reel/", "/videos/", "/photos/")
_SKIP_PATTERNS = ("action=like", "comment_id", "__mref", "reactioncount", "/shares")


# ---------------------------------------------------------------------------
# Driver setup
# ---------------------------------------------------------------------------

def _make_driver(headless: bool = True) -> webdriver.Chrome:
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
    try:
        import shutil
        if shutil.which("chromedriver"):
            service = Service()
        else:
            from webdriver_manager.chrome import ChromeDriverManager
            service = Service(ChromeDriverManager().install())
    except Exception:
        service = Service()

    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(30)
    return driver


def _load_cookies(driver: webdriver.Chrome, cookies_file: str) -> None:
    jar = MozillaCookieJar()
    try:
        jar.load(cookies_file, ignore_discard=True, ignore_expires=True)
    except Exception as exc:
        logger.warning("Could not load cookies: %s", exc)
        return

    driver.get(_FB)
    time.sleep(3)

    added = 0
    for c in jar:
        if "facebook.com" not in c.domain:
            continue
        entry = {
            "name": c.name, "value": c.value,
            "path": c.path, "secure": bool(c.secure),
            "domain": c.domain.lstrip("."),
        }
        if c.expires:
            entry["expiry"] = c.expires
        try:
            driver.add_cookie(entry)
            added += 1
        except Exception:
            pass
    logger.info("Loaded %d cookies", added)


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Reply:
    author: str = ""
    text: str = ""
    timestamp: str = ""


@dataclass
class Comment:
    author: str = ""
    text: str = ""
    timestamp: str = ""
    replies: list[Reply] = field(default_factory=list)


@dataclass
class PostWithComments:
    post_url: str = ""
    post_text: str = ""
    post_timestamp: str = ""
    comments: list[Comment] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Scraper
# ---------------------------------------------------------------------------

class MetaPageScraper:
    """Scrape posts, comments and replies from a public Facebook page.

    Parameters
    ----------
    months : int
        Only include posts from the last *months* months (default 12).
    pages : int
        Max number of scroll-loads on the timeline (default 100).
    cookies : str | None
        Path to a Netscape cookies.txt file. Required.
    headless : bool
        Run Chrome without a visible window (default True).
    pause : float
        Seconds to wait after each page/scroll action (default 3).
    """

    def __init__(
        self,
        *,
        months: int = 12,
        pages: int = 100,
        cookies: str | None = None,
        headless: bool = True,
        pause: float = 3.0,
    ) -> None:
        self.months = months
        self.pages = pages
        self.pause = pause
        self._cutoff = datetime.now(tz=timezone.utc) - timedelta(days=months * 30)

        self.driver = _make_driver(headless=headless)

        if cookies:
            _load_cookies(self.driver, cookies)

    def close(self) -> None:
        self.driver.quit()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape_page(self, page_id: str) -> list[PostWithComments]:
        page_id = _normalise_page_id(page_id)
        page_url = f"{_FB}/{page_id}"
        logger.info("Loading timeline: %s", page_url)

        self.driver.get(page_url)
        time.sleep(self.pause)

        if self._is_login_page():
            raise RuntimeError(
                "Redirected to login — cookies are missing or expired. "
                "Re-export cookies.txt from a logged-in Chrome session."
            )

        # Dismiss any popups (cookie consent, notifications, etc.)
        self._dismiss_popups()

        # Collect all post URLs by scrolling the timeline
        post_links = self._collect_post_links()
        logger.info("Found %d post(s) in date window", len(post_links))

        results: list[PostWithComments] = []
        for i, (url, ts) in enumerate(post_links, 1):
            logger.info("[%d/%d] %s", i, len(post_links), url)
            post = self._scrape_post(url, ts)
            results.append(post)
            logger.info("  → %d comment(s)", len(post.comments))

        nc = sum(len(p.comments) for p in results)
        nr = sum(sum(len(c.replies) for c in p.comments) for p in results)
        logger.info("Done: %d posts, %d comments, %d replies", len(results), nc, nr)
        return results

    # ------------------------------------------------------------------
    # Output
    # ------------------------------------------------------------------

    @staticmethod
    def save_to_csv(results: list[PostWithComments], filepath: str) -> None:
        with open(filepath, "w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow([
                "post_url", "post_text_preview", "post_timestamp",
                "type", "author", "text", "timestamp", "parent_author",
            ])
            for post in results:
                text = post.post_text or ""
                preview = (text[:100] + "…") if len(text) > 100 else text
                if not post.comments:
                    w.writerow([post.post_url, preview, post.post_timestamp,
                                "post", "", text, post.post_timestamp, ""])
                for comment in post.comments:
                    w.writerow([post.post_url, preview, post.post_timestamp,
                                "comment", comment.author, comment.text,
                                comment.timestamp, ""])
                    for reply in comment.replies:
                        w.writerow([post.post_url, preview, post.post_timestamp,
                                    "reply", reply.author, reply.text,
                                    reply.timestamp, comment.author])
        logger.info("Saved → %s", filepath)

    @staticmethod
    def save_to_json(results: list[PostWithComments], filepath: str) -> None:
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump([asdict(p) for p in results], fh, ensure_ascii=False, indent=2)
        logger.info("Saved → %s", filepath)

    # ------------------------------------------------------------------
    # Timeline scraping
    # ------------------------------------------------------------------

    def _collect_post_links(self) -> list[tuple[str, str]]:
        """Scroll the timeline and collect post URLs."""
        seen: set[str] = set()
        results: list[tuple[str, str]] = []

        for scroll_n in range(self.pages):
            new = self._scrape_links_from_page(seen)
            results.extend(new)
            logger.info("Scroll %d: +%d new posts (total %d)",
                        scroll_n + 1, len(new), len(results))

            prev_h = self.driver.execute_script("return document.body.scrollHeight")
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight)")
            time.sleep(self.pause)
            new_h = self.driver.execute_script("return document.body.scrollHeight")

            if new_h == prev_h:
                logger.info("No more content after scroll %d", scroll_n + 1)
                break

        return results

    def _scrape_links_from_page(self, seen: set[str]) -> list[tuple[str, str]]:
        """Grab every post-pattern link visible on the current page."""
        found: list[tuple[str, str]] = []

        for link in self.driver.find_elements(By.TAG_NAME, "a"):
            try:
                href = link.get_attribute("href") or ""
                if not href:
                    continue
                if not any(p in href for p in _POST_PATTERNS):
                    continue
                if any(s in href for s in _SKIP_PATTERNS):
                    continue

                # Normalise: strip query string for dedup, keep full URL for visiting
                base = href.split("?")[0].rstrip("/")
                if base in seen:
                    continue
                seen.add(base)

                # Try to get a timestamp from a nearby <time> element
                ts = ""
                try:
                    time_el = link.find_element(By.TAG_NAME, "time")
                    ts = (time_el.get_attribute("datetime") or time_el.text or "").strip()
                except NoSuchElementException:
                    pass

                logger.debug("Post link: %s  ts=%s", base, ts or "(none)")
                found.append((href, ts))

            except (StaleElementReferenceException, WebDriverException):
                continue

        return found

    # ------------------------------------------------------------------
    # Per-post comment scraping
    # ------------------------------------------------------------------

    def _scrape_post(self, post_url: str, timestamp: str) -> PostWithComments:
        result = PostWithComments(post_url=post_url, post_timestamp=timestamp)
        try:
            self.driver.get(post_url)
            time.sleep(self.pause)
        except (TimeoutException, WebDriverException) as exc:
            logger.warning("Could not load %s: %s", post_url, exc)
            return result

        self._dismiss_popups()

        result.post_text = self._extract_post_text()

        # Expand all comments
        self._load_all_comments()

        result.comments = self._extract_comments()
        return result

    def _extract_post_text(self) -> str:
        """Get the main post body text."""
        for sel in (
            "div[data-ad-comet-preview='message']",
            "div[data-ad-preview='message']",
            "div[role='article'] div[dir='auto']",
        ):
            els = self.driver.find_elements(By.CSS_SELECTOR, sel)
            if els:
                return " ".join(e.text.strip() for e in els[:3] if e.text.strip())
        return ""

    def _load_all_comments(self) -> None:
        """Click 'View more comments' and reply expanders until exhausted."""
        for _ in range(50):
            clicked = False
            for btn in self.driver.find_elements(By.XPATH, "//div[@role='button']"):
                try:
                    t = btn.text.strip().lower()
                    if any(k in t for k in (
                        "view more comments", "view previous comments",
                        "more comments", "all comments",
                    )):
                        btn.click()
                        time.sleep(self.pause)
                        clicked = True
                        break
                except (StaleElementReferenceException, WebDriverException):
                    continue
            if not clicked:
                break

        # Expand "View more replies" within comment threads
        for btn in self.driver.find_elements(By.XPATH, "//div[@role='button']"):
            try:
                t = btn.text.strip().lower()
                if "repl" in t and ("view" in t or "more" in t):
                    btn.click()
                    time.sleep(1.5)
            except (StaleElementReferenceException, WebDriverException):
                continue

    def _extract_comments(self) -> list[Comment]:
        """Extract all comments from the current post page."""
        comments: list[Comment] = []
        seen: set[str] = set()

        # Comments on www.facebook.com are in nested div[role='article']
        # The outermost article is the post; nested ones are comments/replies.
        try:
            # Find the comments section
            comment_articles = self.driver.find_elements(
                By.XPATH,
                "//div[@role='article']//div[@role='article']",
            )
        except Exception:
            return comments

        for art in comment_articles:
            try:
                c = self._parse_comment_article(art)
                if not c or not c.text:
                    continue
                key = f"{c.author}::{c.text[:50]}"
                if key in seen:
                    continue
                seen.add(key)
                comments.append(c)
            except (StaleElementReferenceException, WebDriverException):
                continue

        return comments

    def _parse_comment_article(self, art) -> Comment | None:
        """Parse a comment article element into a Comment."""
        try:
            # Author: first link inside the article that contains a person name
            author = ""
            links = art.find_elements(By.TAG_NAME, "a")
            for link in links:
                t = link.text.strip()
                href = link.get_attribute("href") or ""
                # Profile links don't have post-pattern paths
                if t and not any(p in href for p in _POST_PATTERNS):
                    author = t
                    break

            # Timestamp: <abbr> or <time> element
            ts = ""
            for sel in ("abbr", "time"):
                els = art.find_elements(By.TAG_NAME, sel)
                if els:
                    ts = (els[0].get_attribute("datetime") or els[0].text or "").strip()
                    break

            # Text: grab all dir='auto' spans/divs, skip the author name
            text_parts = []
            for el in art.find_elements(By.CSS_SELECTOR, "div[dir='auto'], span[dir='auto']"):
                t = el.text.strip()
                if t and t != author:
                    text_parts.append(t)

            # Deduplicate consecutive equal parts
            text = " ".join(dict.fromkeys(text_parts))

            if not text and not author:
                return None

            return Comment(author=author, text=text, timestamp=ts)
        except (StaleElementReferenceException, WebDriverException):
            return None

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _dismiss_popups(self) -> None:
        """Close cookie consent and notification dialogs if present."""
        for xpath in (
            "//div[@aria-label='Close']",
            "//button[contains(text(),'Not now')]",
            "//button[contains(text(),'Allow')]",
            "//button[@data-cookiebanner='accept_button']",
        ):
            try:
                btn = WebDriverWait(self.driver, 2).until(
                    EC.element_to_be_clickable((By.XPATH, xpath))
                )
                btn.click()
                time.sleep(1)
            except (TimeoutException, NoSuchElementException, WebDriverException):
                pass

    def _is_login_page(self) -> bool:
        cur = self.driver.current_url
        return any(p in cur for p in ("/login", "/checkpoint", "login.php"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise_page_id(page_id: str) -> str:
    import urllib.parse
    for prefix in (
        "https://www.facebook.com/",
        "https://m.facebook.com/",
        "https://mbasic.facebook.com/",
        "http://www.facebook.com/",
    ):
        if page_id.startswith(prefix):
            page_id = page_id[len(prefix):]
            break

    if page_id.startswith("profile.php"):
        qs = urllib.parse.parse_qs(page_id.split("?", 1)[-1])
        return qs.get("id", [page_id])[0]

    parts = page_id.strip("/").split("/")
    if parts[0] == "pages" and len(parts) >= 3:
        return parts[-1]

    return parts[0].split("?")[0]
