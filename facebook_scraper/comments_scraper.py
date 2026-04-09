"""Facebook Comments & Replies Scraper.

Scrapes comments and their nested replies from a public Facebook post
using Selenium WebDriver.

Usage:
    from facebook_scraper.comments_scraper import FacebookCommentsScraper

    scraper = FacebookCommentsScraper(headless=True)
    comments = scraper.scrape("https://www.facebook.com/some_page/posts/123")
    scraper.save_to_csv(comments, "fb_comments.csv")
    scraper.close()
"""

import csv
import json
import logging
import time
from dataclasses import asdict, dataclass, field

from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)


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


class FacebookCommentsScraper:
    """Scrape comments and replies from a public Facebook post.

    Parameters
    ----------
    headless : bool
        Run Chrome in headless mode (default ``True``).
    page_load_timeout : int
        Maximum seconds to wait for the page to load.
    scroll_pause : float
        Seconds to pause between scroll / click actions.
    max_comment_loads : int
        Maximum number of times to click "View more comments".
    max_reply_loads : int
        Maximum number of times to click "View replies" per comment.
    """

    # CSS / XPath selectors – Facebook changes these frequently.  The values
    # below target the *mbasic* (mobile-basic) version of Facebook which uses
    # semantic HTML and is far more stable than the React-based desktop site.
    _MBASIC_PREFIX = "https://mbasic.facebook.com"

    def __init__(
        self,
        *,
        headless: bool = True,
        page_load_timeout: int = 30,
        scroll_pause: float = 2.0,
        max_comment_loads: int = 50,
        max_reply_loads: int = 20,
    ) -> None:
        self.page_load_timeout = page_load_timeout
        self.scroll_pause = scroll_pause
        self.max_comment_loads = max_comment_loads
        self.max_reply_loads = max_reply_loads

        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        # Use a common mobile user-agent so mbasic.facebook.com works well
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Linux; Android 12; Pixel 6) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Mobile Safari/537.36"
        )

        service = Service()  # uses chromedriver from PATH
        self.driver = webdriver.Chrome(service=service, options=options)
        self.driver.set_page_load_timeout(self.page_load_timeout)

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def close(self) -> None:
        """Quit the browser and free resources."""
        self.driver.quit()

    # ------------------------------------------------------------------
    # Scraping entry-point
    # ------------------------------------------------------------------

    def scrape(self, post_url: str) -> list[Comment]:
        """Scrape all comments and replies from *post_url*.

        The URL is automatically converted to its *mbasic* equivalent so
        that the lightweight HTML version of the page is loaded.

        Returns a list of :class:`Comment` objects.
        """
        url = self._to_mbasic_url(post_url)
        logger.info("Loading %s", url)
        self.driver.get(url)
        time.sleep(self.scroll_pause)

        comments: list[Comment] = []
        self._load_all_comments(comments)
        logger.info("Scraped %d top-level comments", len(comments))
        return comments

    # ------------------------------------------------------------------
    # Output helpers
    # ------------------------------------------------------------------

    @staticmethod
    def save_to_csv(comments: list[Comment], filepath: str) -> None:
        """Save scraped comments to a CSV file.

        Each reply is written as a separate row with the parent comment
        author noted in a ``parent_author`` column.
        """
        with open(filepath, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(
                ["type", "author", "text", "timestamp", "parent_author"]
            )
            for comment in comments:
                writer.writerow(
                    ["comment", comment.author, comment.text,
                     comment.timestamp, ""]
                )
                for reply in comment.replies:
                    writer.writerow(
                        ["reply", reply.author, reply.text,
                         reply.timestamp, comment.author]
                    )
        logger.info("Saved %d comments to %s", len(comments), filepath)

    @staticmethod
    def save_to_json(comments: list[Comment], filepath: str) -> None:
        """Save scraped comments to a JSON file."""
        data = [asdict(c) for c in comments]
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        logger.info("Saved %d comments to %s", len(comments), filepath)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @classmethod
    def _to_mbasic_url(cls, url: str) -> str:
        """Convert any facebook.com URL to its mbasic equivalent."""
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
        # Fallback: just prepend the mbasic prefix to the path
        return cls._MBASIC_PREFIX + "/" + url.lstrip("/")

    def _load_all_comments(self, comments: list[Comment]) -> None:
        """Iterate through comment pages on mbasic and collect comments."""
        for page_num in range(self.max_comment_loads):
            new_comments = self._extract_comments_from_page()
            comments.extend(new_comments)
            logger.debug(
                "Page %d: found %d comments", page_num + 1, len(new_comments)
            )

            # Look for "View more comments" link to load next page
            if not self._click_more_comments_link():
                break
            time.sleep(self.scroll_pause)

    def _extract_comments_from_page(self) -> list[Comment]:
        """Extract comments visible on the current mbasic page."""
        comments: list[Comment] = []
        # On mbasic, comments are rendered inside <div> elements.
        # We look for the comment section by its known structure.
        try:
            comment_divs = self.driver.find_elements(
                By.CSS_SELECTOR, "div[id^='ufi_'] > div > div"
            )
        except NoSuchElementException:
            # Fallback: try a broader selector
            comment_divs = self.driver.find_elements(
                By.CSS_SELECTOR, "div.dw"
            )

        if not comment_divs:
            # Try another common mbasic pattern
            comment_divs = self.driver.find_elements(
                By.XPATH,
                "//div[contains(@id,'ufi')]//div[@class]"
            )

        seen_texts: set[str] = set()
        for div in comment_divs:
            comment = self._parse_comment_div(div)
            if comment and comment.text and comment.text not in seen_texts:
                seen_texts.add(comment.text)
                # Attempt to load replies for this comment
                self._load_replies(div, comment)
                comments.append(comment)

        return comments

    def _parse_comment_div(self, div: WebElement) -> Comment | None:
        """Parse a single comment <div> into a :class:`Comment`."""
        try:
            text_parts: list[str] = []
            author = ""

            # Try to find the author link
            try:
                author_el = div.find_element(By.CSS_SELECTOR, "a")
                author = author_el.text.strip()
            except NoSuchElementException:
                pass

            # Comment body text – varies by page structure
            raw_text = div.text.strip()
            if raw_text:
                # Remove the author name from the beginning if present
                if author and raw_text.startswith(author):
                    raw_text = raw_text[len(author):].strip()
                text_parts.append(raw_text)

            # Timestamp
            timestamp = ""
            try:
                time_el = div.find_element(By.CSS_SELECTOR, "abbr")
                timestamp = time_el.text.strip()
            except NoSuchElementException:
                pass

            body = " ".join(text_parts).strip()
            if not body:
                return None

            return Comment(author=author, text=body, timestamp=timestamp)

        except StaleElementReferenceException:
            return None

    def _load_replies(self, comment_div: WebElement, comment: Comment) -> None:
        """Expand and scrape replies nested under a comment."""
        for _ in range(self.max_reply_loads):
            try:
                reply_links = comment_div.find_elements(
                    By.XPATH,
                    ".//a[contains(text(),'repl') or "
                    "contains(text(),'Repl')]"
                )
                if not reply_links:
                    break

                reply_links[0].click()
                time.sleep(self.scroll_pause)

                # After clicking, the page may reload (mbasic pattern).
                # Re-extract replies from the current page.
                reply_divs = self.driver.find_elements(
                    By.CSS_SELECTOR,
                    "div[id^='ufi_'] div div div"
                )

                seen_reply_texts: set[str] = set()
                for rdiv in reply_divs:
                    reply = self._parse_reply_div(rdiv)
                    if (
                        reply
                        and reply.text
                        and reply.text not in seen_reply_texts
                    ):
                        seen_reply_texts.add(reply.text)
                        comment.replies.append(reply)

                break  # replies loaded successfully
            except (
                NoSuchElementException,
                StaleElementReferenceException,
                TimeoutException,
            ):
                break

    def _parse_reply_div(self, div: WebElement) -> Reply | None:
        """Parse a reply <div> into a :class:`Reply`."""
        try:
            author = ""
            try:
                author_el = div.find_element(By.CSS_SELECTOR, "a")
                author = author_el.text.strip()
            except NoSuchElementException:
                pass

            raw_text = div.text.strip()
            if author and raw_text.startswith(author):
                raw_text = raw_text[len(author):].strip()

            timestamp = ""
            try:
                time_el = div.find_element(By.CSS_SELECTOR, "abbr")
                timestamp = time_el.text.strip()
            except NoSuchElementException:
                pass

            if not raw_text:
                return None

            return Reply(author=author, text=raw_text, timestamp=timestamp)
        except StaleElementReferenceException:
            return None

    def _click_more_comments_link(self) -> bool:
        """Click the 'View more comments' link on mbasic. Return True if found."""
        try:
            more_links = self.driver.find_elements(
                By.XPATH,
                "//a[contains(text(),'View more comments') or "
                "contains(text(),'more comments') or "
                "contains(text(),'View previous comments')]"
            )
            if more_links:
                more_links[0].click()
                return True
        except (
            NoSuchElementException,
            StaleElementReferenceException,
            TimeoutException,
        ):
            pass
        return False
