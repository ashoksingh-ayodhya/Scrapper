"""Google Maps Business Reviews Scraper.

Scrapes reviews for a business on Google Maps using Selenium WebDriver.

Usage:
    from google_maps_scraper.reviews_scraper import GoogleMapsReviewsScraper

    scraper = GoogleMapsReviewsScraper(headless=True)
    reviews = scraper.scrape("https://maps.google.com/maps/place/...")
    scraper.save_to_csv(reviews, "reviews.csv")
    scraper.close()
"""

import csv
import json
import logging
import time
from dataclasses import asdict, dataclass

from selenium import webdriver
from selenium.common.exceptions import (
    NoSuchElementException,
    StaleElementReferenceException,
    TimeoutException,
)
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger(__name__)


_CHROMIUM_BINARY = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
_CHROMEDRIVER_PATH = "/root/.wdm/drivers/chromedriver/linux64/141/chromedriver"


def _create_chrome_service() -> Service:
    """Create a Chrome Service, preferring the bundled chromedriver."""
    import os
    import shutil

    if os.path.isfile(_CHROMEDRIVER_PATH):
        return Service(_CHROMEDRIVER_PATH)
    if shutil.which("chromedriver"):
        return Service()
    try:
        from webdriver_manager.chrome import ChromeDriverManager
        return Service(ChromeDriverManager().install())
    except Exception:
        return Service()


@dataclass
class Review:
    """A single Google Maps review."""

    reviewer_name: str = ""
    rating: int = 0
    relative_date: str = ""
    text: str = ""
    owner_response: str = ""
    owner_response_date: str = ""


class GoogleMapsReviewsScraper:
    """Scrape reviews for a business on Google Maps.

    Parameters
    ----------
    headless : bool
        Run Chrome in headless mode (default ``True``).
    page_load_timeout : int
        Maximum seconds to wait for the page to load.
    scroll_pause : float
        Seconds to pause between scroll actions inside the reviews panel.
    max_scrolls : int
        Maximum number of times to scroll the reviews panel to load more
        reviews.
    """

    def __init__(
        self,
        *,
        headless: bool = True,
        page_load_timeout: int = 30,
        scroll_pause: float = 2.0,
        max_scrolls: int = 100,
    ) -> None:
        self.page_load_timeout = page_load_timeout
        self.scroll_pause = scroll_pause
        self.max_scrolls = max_scrolls

        options = Options()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--lang=en-US")
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
        import os
        if os.path.isfile(_CHROMIUM_BINARY):
            options.binary_location = _CHROMIUM_BINARY

        service = _create_chrome_service()
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

    def scrape(self, place_url: str) -> list[Review]:
        """Scrape all reviews from a Google Maps *place_url*.

        The URL should be a direct link to a Google Maps place, e.g.
        ``https://www.google.com/maps/place/...``.

        Returns a list of :class:`Review` objects.
        """
        logger.info("Loading %s", place_url)
        self.driver.get(place_url)
        time.sleep(self.scroll_pause + 1)

        # Dismiss the cookie-consent banner if present
        self._dismiss_consent()

        # Open the reviews tab / panel
        self._open_reviews_tab()

        # Scroll the reviews panel to load all reviews
        self._scroll_reviews_panel()

        # Expand truncated review texts ("More" buttons)
        self._expand_all_reviews()

        # Parse all visible review elements
        reviews = self._extract_reviews()
        logger.info("Scraped %d reviews", len(reviews))
        return reviews

    def scrape_by_search(self, query: str) -> list[Review]:
        """Search for a business on Google Maps by *query* and scrape its reviews.

        This navigates to Google Maps, enters the search query, clicks the
        first result, and then scrapes reviews.

        Returns a list of :class:`Review` objects.
        """
        search_url = (
            "https://www.google.com/maps/search/"
            + query.replace(" ", "+")
        )
        return self.scrape(search_url)

    # ------------------------------------------------------------------
    # Output helpers
    # ------------------------------------------------------------------

    @staticmethod
    def save_to_csv(reviews: list[Review], filepath: str) -> None:
        """Save scraped reviews to a CSV file."""
        with open(filepath, "w", newline="", encoding="utf-8") as fh:
            writer = csv.writer(fh)
            writer.writerow(
                [
                    "reviewer_name",
                    "rating",
                    "relative_date",
                    "text",
                    "owner_response",
                    "owner_response_date",
                ]
            )
            for review in reviews:
                writer.writerow(
                    [
                        review.reviewer_name,
                        review.rating,
                        review.relative_date,
                        review.text,
                        review.owner_response,
                        review.owner_response_date,
                    ]
                )
        logger.info("Saved %d reviews to %s", len(reviews), filepath)

    @staticmethod
    def save_to_json(reviews: list[Review], filepath: str) -> None:
        """Save scraped reviews to a JSON file."""
        data = [asdict(r) for r in reviews]
        with open(filepath, "w", encoding="utf-8") as fh:
            json.dump(data, fh, ensure_ascii=False, indent=2)
        logger.info("Saved %d reviews to %s", len(reviews), filepath)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _dismiss_consent(self) -> None:
        """Dismiss the Google cookie-consent dialog if present."""
        try:
            wait = WebDriverWait(self.driver, 5)
            accept_btn = wait.until(
                EC.element_to_be_clickable(
                    (By.XPATH,
                     "//button[.//span[contains(text(),'Accept all')]]")
                )
            )
            accept_btn.click()
            time.sleep(1)
        except TimeoutException:
            pass

    def _open_reviews_tab(self) -> None:
        """Click the 'Reviews' tab to open the reviews panel."""
        xpaths = [
            "//button[contains(@aria-label,'Reviews')]",
            "//button[.//div[text()='Reviews']]",
            "//button[.//span[text()='Reviews']]",
            # Google Maps uses role=tab for the tab strip
            "//*[@role='tab'][contains(.,'Reviews')]",
        ]
        for xpath in xpaths:
            try:
                wait = WebDriverWait(self.driver, 5)
                tab = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
                tab.click()
                time.sleep(self.scroll_pause + 1)
                return
            except TimeoutException:
                continue
        logger.warning(
            "Could not find Reviews tab – page may already show reviews "
            "or the URL points directly to the reviews panel."
        )

    def _get_scrollable_panel(self) -> WebElement | None:
        """Return the scrollable reviews panel element."""
        # scrollTop is a DOM property, not an HTML attribute — use JS to
        # test scrollability (scrollHeight > clientHeight).
        selectors = [
            "div.m6QErb.DxyBCb.kA9KIf.dS8AEf",  # common reviews panel
            "div.m6QErb.DxyBCb.kA9KIf",
            "div.m6QErb",
            "div[role='feed']",
            "div[aria-label*='Reviews']",
        ]
        for sel in selectors:
            try:
                panels = self.driver.find_elements(By.CSS_SELECTOR, sel)
                for panel in panels:
                    try:
                        scrollable = self.driver.execute_script(
                            "return arguments[0].scrollHeight > arguments[0].clientHeight;",
                            panel,
                        )
                        if scrollable:
                            return panel
                    except Exception:
                        continue
            except NoSuchElementException:
                continue

        # Last resort: any tall div that can be scrolled
        try:
            candidates = self.driver.find_elements(By.CSS_SELECTOR, "div[tabindex]")
            for el in candidates:
                try:
                    scrollable = self.driver.execute_script(
                        "var s=window.getComputedStyle(arguments[0]);"
                        "return (s.overflow==='auto'||s.overflow==='scroll'||"
                        "s.overflowY==='auto'||s.overflowY==='scroll') && "
                        "arguments[0].scrollHeight > arguments[0].clientHeight;",
                        el,
                    )
                    if scrollable:
                        return el
                except Exception:
                    continue
        except Exception:
            pass

        return None

    def _scroll_reviews_panel(self) -> None:
        """Scroll the reviews panel to load more reviews."""
        panel = self._get_scrollable_panel()
        if not panel:
            logger.warning("Could not find scrollable reviews panel")
            return

        last_height = 0
        for i in range(self.max_scrolls):
            self.driver.execute_script(
                "arguments[0].scrollTop = arguments[0].scrollHeight", panel
            )
            time.sleep(self.scroll_pause)
            new_height = self.driver.execute_script(
                "return arguments[0].scrollHeight", panel
            )
            if new_height == last_height:
                logger.debug("No more reviews to load after %d scrolls", i + 1)
                break
            last_height = new_height

    def _expand_all_reviews(self) -> None:
        """Click all 'More' buttons to expand truncated reviews."""
        try:
            more_buttons = self.driver.find_elements(
                By.XPATH,
                "//button[contains(@aria-label,'See more') or "
                "contains(@aria-label,'More') or "
                ".//span[text()='More']]"
            )
            for btn in more_buttons:
                try:
                    self.driver.execute_script(
                        "arguments[0].scrollIntoView(true);", btn
                    )
                    btn.click()
                    time.sleep(0.2)
                except (
                    StaleElementReferenceException,
                    NoSuchElementException,
                ):
                    continue
        except NoSuchElementException:
            pass

    def _extract_reviews(self) -> list[Review]:
        """Parse all review elements currently visible on the page."""
        reviews: list[Review] = []

        # Google Maps review containers: try several known selectors in order
        review_elements = (
            self.driver.find_elements(By.CSS_SELECTOR, "div[data-review-id]")
            or self.driver.find_elements(By.CSS_SELECTOR, "div.jftiEf")
            or self.driver.find_elements(By.CSS_SELECTOR, "div[data-hveid] div[aria-label]")
        )

        for el in review_elements:
            review = self._parse_review_element(el)
            if review and (review.reviewer_name or review.text):
                reviews.append(review)

        return reviews

    def _find_text(self, el: WebElement, *css_selectors: str) -> str:
        """Return text from the first matching CSS selector, or empty string."""
        for sel in css_selectors:
            try:
                found = el.find_element(By.CSS_SELECTOR, sel)
                text = found.text.strip()
                if text:
                    return text
            except (NoSuchElementException, StaleElementReferenceException):
                continue
        return ""

    def _parse_review_element(self, el: WebElement) -> Review | None:
        """Parse a single review element into a :class:`Review`."""
        try:
            # --- Reviewer name ---
            name = self._find_text(
                el,
                "div.d4r55",
                "button[data-review-id] div",
                "div[class*='fontHeadlineSmall']",
            )
            if not name:
                try:
                    a_el = el.find_element(By.CSS_SELECTOR, "a[data-review-id], a[href*='contrib']")
                    name = (a_el.get_attribute("aria-label") or "").replace("Photo of ", "").strip()
                    if not name:
                        name = a_el.text.strip()
                except (NoSuchElementException, StaleElementReferenceException):
                    pass

            # --- Star rating ---
            rating = 0
            star_selectors = ["span.kvMYJc", "span[role='img'][aria-label*='star']", "span[aria-label*='star']"]
            for sel in star_selectors:
                try:
                    star_el = el.find_element(By.CSS_SELECTOR, sel)
                    aria = star_el.get_attribute("aria-label") or ""
                    for part in aria.split():
                        if part.isdigit():
                            rating = int(part)
                            break
                    if rating:
                        break
                except (NoSuchElementException, StaleElementReferenceException):
                    continue

            # --- Relative date ---
            relative_date = self._find_text(el, "span.rsqaWe", "span[class*='fontBodySmall']")

            # --- Review text ---
            text = self._find_text(el, "span.wiI7pd", "span[class*='review-full-text']", "div.MyEned span")

            # --- Owner response ---
            owner_response = ""
            owner_response_date = ""
            for resp_sel in ("div.CDe7pd", "div[class*='owner-response']"):
                try:
                    resp_container = el.find_element(By.CSS_SELECTOR, resp_sel)
                    owner_response_date = self._find_text(resp_container, "span.DZSIDd", "span[class*='fontBodySmall']")
                    owner_response = self._find_text(resp_container, "div.wiI7pd", "span", "div")
                    break
                except (NoSuchElementException, StaleElementReferenceException):
                    continue

            return Review(
                reviewer_name=name,
                rating=rating,
                relative_date=relative_date,
                text=text,
                owner_response=owner_response,
                owner_response_date=owner_response_date,
            )
        except StaleElementReferenceException:
            return None
