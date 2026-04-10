"""Facebook / Meta Page Scraper — Selenium + mbasic.facebook.com.

Uses a real Chrome browser (via Selenium) with an optional cookies file
so Facebook accepts the session. mbasic.facebook.com returns plain HTML
which is far easier to parse than the React-heavy main site.

Usage:
    from meta_scraper.page_scraper import MetaPageScraper

    scraper = MetaPageScraper(months=12, cookies="cookies.txt")
    results = scraper.scrape_page("https://www.facebook.com/C3Pay")
    scraper.save_to_csv(results, "c3pay_comments.csv")
    scraper.close()
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

logger = logging.getLogger(__name__)

_MBASIC = "https://mbasic.facebook.com"


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
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
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
    """Load a Netscape cookies.txt file into the browser."""
    jar = MozillaCookieJar()
    try:
        jar.load(cookies_file, ignore_discard=True, ignore_expires=True)
    except Exception as exc:
        logger.warning("Could not load cookies file: %s", exc)
        return

    # Selenium requires a page to be loaded before cookies can be added.
    # Navigate to facebook.com first so the domain matches.
    driver.get("https://www.facebook.com")
    time.sleep(2)

    added = 0
    for cookie in jar:
        if "facebook.com" not in cookie.domain:
            continue
        entry: dict = {
            "name": cookie.name,
            "value": cookie.value,
            "path": cookie.path,
            "secure": bool(cookie.secure),
            # Strip leading dot so Selenium accepts the domain
            "domain": cookie.domain.lstrip("."),
        }
        if cookie.expires:
            entry["expiry"] = cookie.expires
        try:
            driver.add_cookie(entry)
            added += 1
        except Exception:
            pass

    logger.info("Loaded %d cookies from %s", added, cookies_file)


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


class MetaPageScraper:
    """Scrape posts, comments and replies from a public Facebook page.

    Parameters
    ----------
    months : int
        Only include posts from the last *months* months (default 12).
    pages : int
        Max timeline pages to traverse (default 100).
    cookies : str | None
        Path to a Netscape cookies.txt file. Required for most pages.
    headless : bool
        Run Chrome without a visible window (default True).
    pause : float
        Seconds to wait after each page load (default 2.5).
    """

    def __init__(
        self,
        *,
        months: int = 12,
        pages: int = 100,
        cookies: str | None = None,
        headless: bool = True,
        pause: float = 2.5,
    ) -> None:
        self.months = months
        self.pages = pages
        self.pause = pause
        self._cutoff = datetime.now(tz=timezone.utc) - timedelta(days=months * 30)

        self.driver = _make_driver(headless=headless)

        if cookies:
            _load_cookies(self.driver, cookies)
            # Re-navigate to mbasic after setting cookies
            self.driver.get(_MBASIC)
            time.sleep(self.pause)

    def close(self) -> None:
        self.driver.quit()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape_page(self, page_id: str) -> list[PostWithComments]:
        page_id = _normalise_page_id(page_id)
        start_url = f"{_MBASIC}/{page_id}"
        logger.info("Scraping %s (last %d months)", start_url, self.months)

        post_links = self._collect_post_links(start_url)
        logger.info("Found %d post(s) in date window", len(post_links))

        results: list[PostWithComments] = []
        for i, (url, ts) in enumerate(post_links, 1):
            logger.info("[%d/%d] Scraping post: %s", i, len(post_links), url)
            post = self._scrape_post(url, ts)
            results.append(post)
            logger.info("  → %d comment(s)", len(post.comments))

        total_comments = sum(len(p.comments) for p in results)
        total_replies = sum(
            sum(len(c.replies) for c in p.comments) for p in results
        )
        logger.info(
            "Done: %d post(s), %d comment(s), %d reply/replies",
            len(results), total_comments, total_replies,
        )
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
                    w.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "post", "", text, post.post_timestamp, "",
                    ])
                for comment in post.comments:
                    w.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "comment", comment.author, comment.text,
                        comment.timestamp, "",
                    ])
                    for reply in comment.replies:
                        w.writerow([
                            post.post_url, preview, post.post_timestamp,
                            "reply", reply.author, reply.text,
                            reply.timestamp, comment.author,
                        ])
        logger.info("Saved to %s", filepath)

    @staticmethod
    def save_to_json(results: list[PostWithComments], filepath: str) -> None:
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump([asdict(p) for p in results], fh, ensure_ascii=False, indent=2)
        logger.info("Saved to %s", filepath)

    # ------------------------------------------------------------------
    # Timeline crawl
    # ------------------------------------------------------------------

    def _collect_post_links(self, start_url: str) -> list[tuple[str, str]]:
        posts: list[tuple[str, str]] = []
        current_url = start_url

        for page_num in range(self.pages):
            logger.debug("Timeline page %d: %s", page_num + 1, current_url)
            self._get(current_url)

            if self._is_login_page():
                logger.error(
                    "Redirected to login. Your cookies are missing or expired. "
                    "Re-export cookies.txt from a logged-in Chrome session."
                )
                break

            new_posts, hit_cutoff = self._parse_timeline_page()
            posts.extend(new_posts)
            logger.debug("  +%d posts (total %d)", len(new_posts), len(posts))

            if hit_cutoff:
                logger.info("Reached cutoff date at page %d", page_num + 1)
                break

            nxt = self._next_timeline_page()
            if not nxt:
                logger.info("No more timeline pages after page %d", page_num + 1)
                break
            current_url = nxt

        return posts

    def _parse_timeline_page(self) -> tuple[list[tuple[str, str]], bool]:
        posts: list[tuple[str, str]] = []
        hit_cutoff = False

        articles = (
            self.driver.find_elements(By.TAG_NAME, "article")
            or self.driver.find_elements(By.CSS_SELECTOR, "div[data-ft]")
        )

        for art in articles:
            url, ts = self._post_link_from_article(art)
            if not url:
                continue
            if ts and _is_too_old(ts, self._cutoff):
                hit_cutoff = True
                continue
            posts.append((url, ts))

        return posts, hit_cutoff

    def _post_link_from_article(self, article) -> tuple[str, str]:
        url = ""
        ts = ""
        try:
            try:
                ts = article.find_element(By.CSS_SELECTOR, "abbr").text.strip()
            except NoSuchElementException:
                pass

            for link in article.find_elements(By.TAG_NAME, "a"):
                href = link.get_attribute("href") or ""
                text = link.text.strip().lower()
                if "full story" in text or "view post" in text:
                    url = href
                    break
                if any(p in href for p in ("/story.php", "/permalink", "/posts/", "/photos/", "/videos/")):
                    url = href
            if url and not url.startswith("http"):
                url = _MBASIC + url
        except (StaleElementReferenceException, WebDriverException):
            pass
        return url, ts

    def _next_timeline_page(self) -> str | None:
        xpaths = [
            "//a[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'see more post')]",
            "//a[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'show more')]",
            "//a[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'more post')]",
            "//div[@id='m_more_item']//a",
        ]
        for xpath in xpaths:
            for el in self.driver.find_elements(By.XPATH, xpath):
                href = el.get_attribute("href")
                if href:
                    return href if href.startswith("http") else _MBASIC + href
        return None

    # ------------------------------------------------------------------
    # Per-post comment scraping
    # ------------------------------------------------------------------

    def _scrape_post(self, post_url: str, timestamp: str) -> PostWithComments:
        result = PostWithComments(post_url=post_url, post_timestamp=timestamp)
        self._get(post_url)

        result.post_text = self._extract_post_text()

        for _ in range(50):  # up to 50 comment pages
            comments = self._extract_comments()
            result.comments.extend(comments)
            if not self._click_more_comments():
                break
            time.sleep(self.pause)

        return result

    def _extract_post_text(self) -> str:
        for sel in ("div.story_body_container p", "div[data-ft] p", "div.msg p"):
            els = self.driver.find_elements(By.CSS_SELECTOR, sel)
            if els:
                return " ".join(e.text.strip() for e in els if e.text.strip())
        return ""

    def _extract_comments(self) -> list[Comment]:
        comments: list[Comment] = []
        seen: set[str] = set()

        containers = (
            self.driver.find_elements(By.CSS_SELECTOR, "div[id^='ufi_'] > div > div")
            or self.driver.find_elements(By.CSS_SELECTOR, "div.dw")
        )

        for div in containers:
            c = self._parse_comment_div(div)
            if c and c.text and c.text not in seen:
                seen.add(c.text)
                c.replies = self._extract_replies(div)
                comments.append(c)

        return comments

    def _parse_comment_div(self, div) -> Comment | None:
        try:
            author = ""
            try:
                author = div.find_element(By.CSS_SELECTOR, "a").text.strip()
            except NoSuchElementException:
                pass

            raw = div.text.strip()
            if author and raw.startswith(author):
                raw = raw[len(author):].strip()

            ts = ""
            try:
                ts = div.find_element(By.CSS_SELECTOR, "abbr").text.strip()
            except NoSuchElementException:
                pass

            if not raw:
                return None
            return Comment(author=author, text=raw, timestamp=ts)
        except StaleElementReferenceException:
            return None

    def _extract_replies(self, comment_div) -> list[Reply]:
        replies: list[Reply] = []
        seen: set[str] = set()
        try:
            for link in comment_div.find_elements(By.XPATH, ".//a"):
                if "repl" in link.text.lower():
                    link.click()
                    time.sleep(self.pause)
                    break

            for rdiv in comment_div.find_elements(By.CSS_SELECTOR, "div div div"):
                r = self._parse_reply_div(rdiv)
                if r and r.text and r.text not in seen:
                    seen.add(r.text)
                    replies.append(r)
        except (NoSuchElementException, StaleElementReferenceException, TimeoutException):
            pass
        return replies

    def _parse_reply_div(self, div) -> Reply | None:
        try:
            author = ""
            try:
                author = div.find_element(By.CSS_SELECTOR, "a").text.strip()
            except NoSuchElementException:
                pass
            raw = div.text.strip()
            if author and raw.startswith(author):
                raw = raw[len(author):].strip()
            ts = ""
            try:
                ts = div.find_element(By.CSS_SELECTOR, "abbr").text.strip()
            except NoSuchElementException:
                pass
            if not raw:
                return None
            return Reply(author=author, text=raw, timestamp=ts)
        except StaleElementReferenceException:
            return None

    def _click_more_comments(self) -> bool:
        for el in self.driver.find_elements(By.XPATH, "//a"):
            try:
                t = el.text.strip().lower()
                if "more comment" in t or "view previous" in t:
                    el.click()
                    return True
            except (StaleElementReferenceException, WebDriverException):
                continue
        return False

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _get(self, url: str) -> None:
        try:
            self.driver.get(url)
        except TimeoutException:
            logger.warning("Timeout loading %s", url)
        time.sleep(self.pause)

    def _is_login_page(self) -> bool:
        cur = self.driver.current_url
        return any(p in cur for p in ("/login", "/checkpoint", "login.php"))


# ------------------------------------------------------------------
# Module-level helpers
# ------------------------------------------------------------------

def _normalise_page_id(page_id: str) -> str:
    """Return just the slug or numeric ID from any Facebook URL."""
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


def _is_too_old(timestamp_text: str, cutoff: datetime) -> bool:
    """Return True if a relative timestamp string is before *cutoff*."""
    units = {
        "min": 1/1440, "mins": 1/1440,
        "hr": 1/24, "hrs": 1/24, "hour": 1/24, "hours": 1/24,
        "day": 1, "days": 1,
        "wk": 7, "wks": 7, "week": 7, "weeks": 7,
        "mo": 30, "mos": 30, "month": 30, "months": 30,
        "yr": 365, "yrs": 365, "year": 365, "years": 365,
    }
    import re
    text = timestamp_text.lower().strip()
    if text in ("just now", "now"):
        return False
    m = re.match(r"(\d+)\s*(\w+)", text)
    if not m:
        return False
    value, unit = int(m.group(1)), m.group(2).rstrip(".")
    days = value * units.get(unit, 0)
    cutoff_days = (datetime.now(tz=timezone.utc) - cutoff).days
    return days > cutoff_days
