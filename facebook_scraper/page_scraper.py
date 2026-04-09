"""Facebook Page Scraper.

Scrapes posts from a Facebook page and their comments/replies,
using the mbasic (mobile-basic) version of Facebook.

Usage:
    from facebook_scraper.page_scraper import FacebookPageScraper

    scraper = FacebookPageScraper(headless=True, months=12)
    results = scraper.scrape_page("https://www.facebook.com/C3Pay")
    scraper.save_to_csv(results, "c3pay_comments.csv")
    scraper.close()
"""

import csv
import json
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta

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
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)


def _create_chrome_service() -> Service:
    """Create a Chrome Service, using system chromedriver if available."""
    import shutil

    if shutil.which("chromedriver"):
        return Service()
    # Fall back to webdriver-manager for environments without chromedriver
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        return Service(ChromeDriverManager().install())
    except Exception:
        return Service()  # last resort: let Selenium try to find it


@dataclass
class Reply:
    """A single reply to a Facebook comment."""

    author: str = ""
    text: str = ""
    timestamp: str = ""


@dataclass
class Comment:
    """A top-level Facebook comment with optional nested replies."""

    author: str = ""
    text: str = ""
    timestamp: str = ""
    replies: list[Reply] = field(default_factory=list)


@dataclass
class PostWithComments:
    """A Facebook post together with its scraped comments."""

    post_url: str = ""
    post_text: str = ""
    post_timestamp: str = ""
    comments: list[Comment] = field(default_factory=list)


class FacebookPageScraper:
    """Scrape posts and their comments from a public Facebook page.

    This scraper navigates to the mbasic version of a Facebook page,
    discovers posts, and then visits each post to scrape comments and
    replies. Posts can be filtered by age (``months`` parameter).

    Parameters
    ----------
    headless : bool
        Run Chrome in headless mode (default ``True``).
    page_load_timeout : int
        Maximum seconds to wait for the page to load.
    scroll_pause : float
        Seconds to pause between page loads / clicks.
    months : int
        Only include posts from the last *months* months (default 12).
    max_pages : int
        Maximum number of "See more posts" pages to traverse.
    max_comment_pages : int
        Maximum number of comment pagination pages per post.
    max_reply_loads : int
        Maximum number of reply expansion clicks per comment.
    """

    _MBASIC_PREFIX = "https://mbasic.facebook.com"

    # Patterns Facebook's mbasic uses for relative timestamps
    _TIME_UNITS = {
        "min": "minutes",
        "mins": "minutes",
        "hr": "hours",
        "hrs": "hours",
        "hour": "hours",
        "hours": "hours",
        "day": "days",
        "days": "days",
        "wk": "weeks",
        "wks": "weeks",
        "week": "weeks",
        "weeks": "weeks",
        "mo": "months",
        "mos": "months",
        "month": "months",
        "months": "months",
        "yr": "years",
        "yrs": "years",
        "year": "years",
        "years": "years",
    }

    def __init__(
        self,
        *,
        headless: bool = True,
        page_load_timeout: int = 30,
        scroll_pause: float = 3.0,
        months: int = 12,
        max_pages: int = 200,
        max_comment_pages: int = 50,
        max_reply_loads: int = 10,
    ) -> None:
        self.page_load_timeout = page_load_timeout
        self.scroll_pause = scroll_pause
        self.months = months
        self.max_pages = max_pages
        self.max_comment_pages = max_comment_pages
        self.max_reply_loads = max_reply_loads
        self._cutoff = datetime.utcnow() - timedelta(days=months * 30)

        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Linux; Android 12; Pixel 6) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Mobile Safari/537.36"
        )

        service = _create_chrome_service()
        self.driver = webdriver.Chrome(service=service, options=options)
        self.driver.set_page_load_timeout(self.page_load_timeout)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Quit the browser and free resources."""
        self.driver.quit()

    def scrape_page(self, page_url: str) -> list[PostWithComments]:
        """Scrape posts and comments from a Facebook page.

        Returns a list of :class:`PostWithComments` objects for posts
        within the configured time window (last *months* months).
        """
        base_url = self._to_mbasic_url(page_url)
        logger.info("Starting page scrape: %s (last %d months)", base_url, self.months)

        # Step 1: collect post URLs from the page timeline
        post_urls = self._discover_posts(base_url)
        logger.info("Discovered %d post(s) within the time window", len(post_urls))

        # Step 2: visit each post and scrape comments
        results: list[PostWithComments] = []
        for i, (url, ts) in enumerate(post_urls, 1):
            logger.info("Scraping post %d/%d: %s", i, len(post_urls), url)
            post_data = self._scrape_single_post(url, ts)
            results.append(post_data)
            logger.info(
                "  -> %d comment(s) collected", len(post_data.comments)
            )

        return results

    # ------------------------------------------------------------------
    # Output helpers
    # ------------------------------------------------------------------

    @staticmethod
    def save_to_csv(results: list[PostWithComments], filepath: str) -> None:
        """Save all posts and comments to a flat CSV."""
        with open(filepath, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow([
                "post_url", "post_text_preview", "post_timestamp",
                "type", "author", "text", "timestamp", "parent_author",
            ])
            for post in results:
                preview = (post.post_text[:100] + "…") if len(post.post_text) > 100 else post.post_text
                if not post.comments:
                    # Write the post row even if there are no comments
                    writer.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "post", "", post.post_text, post.post_timestamp, "",
                    ])
                for comment in post.comments:
                    writer.writerow([
                        post.post_url, preview, post.post_timestamp,
                        "comment", comment.author, comment.text,
                        comment.timestamp, "",
                    ])
                    for reply in comment.replies:
                        writer.writerow([
                            post.post_url, preview, post.post_timestamp,
                            "reply", reply.author, reply.text,
                            reply.timestamp, comment.author,
                        ])
        logger.info("Saved results to %s", filepath)

    @staticmethod
    def save_to_json(results: list[PostWithComments], filepath: str) -> None:
        """Save all posts and comments to a JSON file."""
        data = [asdict(p) for p in results]
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        logger.info("Saved results to %s", filepath)

    # ------------------------------------------------------------------
    # URL helpers
    # ------------------------------------------------------------------

    @classmethod
    def _to_mbasic_url(cls, url: str) -> str:
        """Convert any facebook.com URL to mbasic equivalent."""
        for prefix in (
            "https://www.facebook.com",
            "https://m.facebook.com",
            "https://web.facebook.com",
            "http://www.facebook.com",
            "http://m.facebook.com",
        ):
            if url.startswith(prefix):
                return cls._MBASIC_PREFIX + url[len(prefix):]
        if url.startswith(cls._MBASIC_PREFIX):
            return url
        return cls._MBASIC_PREFIX + "/" + url.lstrip("/")

    # ------------------------------------------------------------------
    # Post discovery
    # ------------------------------------------------------------------

    def _discover_posts(self, page_url: str) -> list[tuple[str, str]]:
        """Return a list of (post_url, timestamp_text) from the page timeline.

        Paginates through the mbasic timeline until the cutoff date is
        reached or ``max_pages`` pages have been visited.
        """
        posts: list[tuple[str, str]] = []
        current_url = page_url

        for page_num in range(self.max_pages):
            logger.debug("Timeline page %d: %s", page_num + 1, current_url)
            try:
                self.driver.get(current_url)
            except TimeoutException:
                logger.warning("Timeout loading timeline page %d", page_num + 1)
                break
            except WebDriverException as exc:
                logger.error(
                    "Failed to load timeline page %d: %s", page_num + 1, exc
                )
                break
            time.sleep(self.scroll_pause)

            # On mbasic, each post is in an <article> or a div with
            # data-ft attribute containing story information.
            page_posts, hit_cutoff = self._extract_post_links()
            posts.extend(page_posts)
            logger.debug(
                "  Found %d post(s) on this page (total %d)",
                len(page_posts), len(posts),
            )

            if hit_cutoff:
                logger.info("Reached the date cutoff on page %d", page_num + 1)
                break

            # Find the "See more posts" / "Show more" link
            next_url = self._find_next_page_link()
            if not next_url:
                logger.info("No more timeline pages found after page %d", page_num + 1)
                break
            current_url = next_url

        return posts

    def _extract_post_links(self) -> tuple[list[tuple[str, str]], bool]:
        """Extract post links and timestamps from the current mbasic page.

        Returns ``(posts, hit_cutoff)`` where *hit_cutoff* is True if a
        post older than the configured window was encountered.
        """
        posts: list[tuple[str, str]] = []
        hit_cutoff = False

        # mbasic renders posts inside <article> tags or divs with role="article"
        articles = self.driver.find_elements(By.CSS_SELECTOR, "article")
        if not articles:
            articles = self.driver.find_elements(
                By.CSS_SELECTOR, "div[role='article'], div[data-ft]"
            )
        if not articles:
            # Broader fallback: story divs on mbasic
            articles = self.driver.find_elements(
                By.XPATH,
                "//div[contains(@class,'story_body_container') or "
                "contains(@id,'u_0')]"
            )

        for article in articles:
            # Find the "Full Story" or timestamp link that leads to the post
            post_url, timestamp_text = self._find_post_link(article)
            if not post_url:
                continue

            # Check if this post is within the time window
            if timestamp_text and self._is_too_old(timestamp_text):
                hit_cutoff = True
                continue

            posts.append((post_url, timestamp_text))

        return posts, hit_cutoff

    def _find_post_link(self, article: WebElement) -> tuple[str, str]:
        """Find the permalink and timestamp text for a post article element."""
        timestamp_text = ""
        post_url = ""

        try:
            # Look for timestamp elements (abbr or links with timestamp text)
            try:
                abbr = article.find_element(By.CSS_SELECTOR, "abbr")
                timestamp_text = abbr.text.strip()
            except NoSuchElementException:
                pass

            # Find links - look for "Full Story" link or the post permalink
            links = article.find_elements(By.CSS_SELECTOR, "a")
            for link in links:
                href = link.get_attribute("href") or ""
                link_text = link.text.strip().lower()

                # "Full Story" link is the canonical way to get to a post
                if "full story" in link_text:
                    post_url = href
                    break

                # Permalink patterns on mbasic
                if (
                    "/story.php" in href
                    or "/permalink" in href
                    or "/posts/" in href
                    or "/photos/" in href
                    or "/videos/" in href
                ):
                    post_url = href
                    # If the link itself has a timestamp-like text, use it
                    if not timestamp_text and link_text:
                        timestamp_text = link_text

            # Ensure the URL is absolute
            if post_url and not post_url.startswith("http"):
                post_url = self._MBASIC_PREFIX + post_url

        except (StaleElementReferenceException, WebDriverException):
            pass

        return post_url, timestamp_text

    def _find_next_page_link(self) -> str | None:
        """Find the 'See more posts' / 'Show more' pagination link."""
        try:
            patterns = [
                "//a[contains(text(),'See more posts')]",
                "//a[contains(text(),'Show more')]",
                "//a[contains(text(),'See More Posts')]",
                "//a[contains(text(),'more posts')]",
                "//a[contains(@id,'see_more')]",
                "//div[contains(@id,'structured_composer_async')]//a",
            ]
            for xpath in patterns:
                links = self.driver.find_elements(By.XPATH, xpath)
                for link in links:
                    href = link.get_attribute("href")
                    if href:
                        if not href.startswith("http"):
                            href = self._MBASIC_PREFIX + href
                        return href
        except (NoSuchElementException, StaleElementReferenceException):
            pass
        return None

    # ------------------------------------------------------------------
    # Timestamp parsing
    # ------------------------------------------------------------------

    def _is_too_old(self, timestamp_text: str) -> bool:
        """Return True if the relative timestamp is older than the cutoff."""
        text = timestamp_text.lower().strip()

        # "Just now", "X mins", "X hrs" → very recent
        if text in ("just now", "now"):
            return False

        # Try to parse relative times like "3 hrs", "2 days", "5 mos"
        match = re.match(r"(\d+)\s*(\w+)", text)
        if not match:
            # Can't parse; assume it's recent enough
            return False

        value = int(match.group(1))
        unit_raw = match.group(2).rstrip(".")

        unit = self._TIME_UNITS.get(unit_raw)
        if not unit:
            return False

        # Convert to approximate days
        days_map = {
            "minutes": 1 / 1440,
            "hours": 1 / 24,
            "days": 1,
            "weeks": 7,
            "months": 30,
            "years": 365,
        }
        approx_days = value * days_map.get(unit, 0)
        cutoff_days = self.months * 30

        return approx_days > cutoff_days

    # ------------------------------------------------------------------
    # Single-post comment scraping
    # ------------------------------------------------------------------

    def _scrape_single_post(self, post_url: str, timestamp: str) -> PostWithComments:
        """Navigate to a single post and scrape its comments."""
        result = PostWithComments(
            post_url=post_url, post_timestamp=timestamp
        )

        try:
            self.driver.get(post_url)
        except TimeoutException:
            logger.warning("Timeout loading post: %s", post_url)
            return result
        except WebDriverException as exc:
            logger.error("Failed to load post %s: %s", post_url, exc)
            return result
        time.sleep(self.scroll_pause)

        # Extract post text
        result.post_text = self._extract_post_text()

        # Extract comments with pagination
        self._load_all_comments(result)

        return result

    def _extract_post_text(self) -> str:
        """Extract the main post body text from the current page."""
        selectors = [
            "div.story_body_container p",
            "div[data-ft] p",
            "div.msg p",
            "div.bx p",
        ]
        for sel in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, sel)
                if elements:
                    return " ".join(
                        el.text.strip() for el in elements if el.text.strip()
                    )
            except NoSuchElementException:
                continue
        return ""

    def _load_all_comments(self, result: PostWithComments) -> None:
        """Load and extract all comments on the post, paginating as needed."""
        for page_num in range(self.max_comment_pages):
            new_comments = self._extract_comments_from_page()
            result.comments.extend(new_comments)
            logger.debug(
                "  Comment page %d: %d new comments",
                page_num + 1, len(new_comments),
            )

            if not self._click_more_comments():
                break
            time.sleep(self.scroll_pause)

    def _extract_comments_from_page(self) -> list[Comment]:
        """Extract comment elements from the current mbasic post page."""
        comments: list[Comment] = []

        # mbasic comment containers
        comment_divs = self.driver.find_elements(
            By.CSS_SELECTOR, "div[id^='ufi_'] > div > div"
        )
        if not comment_divs:
            comment_divs = self.driver.find_elements(
                By.CSS_SELECTOR, "div.dw"
            )
        if not comment_divs:
            comment_divs = self.driver.find_elements(
                By.XPATH,
                "//div[contains(@id,'ufi')]//div[@class]"
            )

        seen: set[str] = set()
        for div in comment_divs:
            comment = self._parse_comment(div)
            if comment and comment.text and comment.text not in seen:
                seen.add(comment.text)
                self._load_replies(div, comment)
                comments.append(comment)

        return comments

    def _parse_comment(self, div: WebElement) -> Comment | None:
        """Parse a comment div into a Comment dataclass."""
        try:
            author = ""
            try:
                author_el = div.find_element(By.CSS_SELECTOR, "a")
                author = author_el.text.strip()
            except NoSuchElementException:
                pass

            raw = div.text.strip()
            if author and raw.startswith(author):
                raw = raw[len(author):].strip()

            timestamp = ""
            try:
                abbr = div.find_element(By.CSS_SELECTOR, "abbr")
                timestamp = abbr.text.strip()
            except NoSuchElementException:
                pass

            if not raw:
                return None

            return Comment(author=author, text=raw, timestamp=timestamp)
        except StaleElementReferenceException:
            return None

    def _load_replies(self, comment_div: WebElement, comment: Comment) -> None:
        """Click reply expansion links and scrape nested replies."""
        for _ in range(self.max_reply_loads):
            try:
                reply_links = comment_div.find_elements(
                    By.XPATH,
                    ".//a[contains(text(),'repl') or "
                    "contains(text(),'Repl')]",
                )
                if not reply_links:
                    break

                reply_links[0].click()
                time.sleep(self.scroll_pause)

                reply_divs = self.driver.find_elements(
                    By.CSS_SELECTOR, "div[id^='ufi_'] div div div"
                )
                seen: set[str] = set()
                for rdiv in reply_divs:
                    reply = self._parse_reply(rdiv)
                    if reply and reply.text and reply.text not in seen:
                        seen.add(reply.text)
                        comment.replies.append(reply)
                break
            except (NoSuchElementException, StaleElementReferenceException, TimeoutException):
                break

    def _parse_reply(self, div: WebElement) -> Reply | None:
        """Parse a reply div into a Reply dataclass."""
        try:
            author = ""
            try:
                author_el = div.find_element(By.CSS_SELECTOR, "a")
                author = author_el.text.strip()
            except NoSuchElementException:
                pass

            raw = div.text.strip()
            if author and raw.startswith(author):
                raw = raw[len(author):].strip()

            timestamp = ""
            try:
                abbr = div.find_element(By.CSS_SELECTOR, "abbr")
                timestamp = abbr.text.strip()
            except NoSuchElementException:
                pass

            if not raw:
                return None
            return Reply(author=author, text=raw, timestamp=timestamp)
        except StaleElementReferenceException:
            return None

    def _click_more_comments(self) -> bool:
        """Click 'View more comments' link. Return True if found."""
        try:
            links = self.driver.find_elements(
                By.XPATH,
                "//a[contains(text(),'View more comments') or "
                "contains(text(),'more comments') or "
                "contains(text(),'View previous comments')]",
            )
            if links:
                links[0].click()
                return True
        except (NoSuchElementException, StaleElementReferenceException, TimeoutException):
            pass
        return False
