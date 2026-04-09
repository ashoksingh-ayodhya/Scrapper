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
from webdriver_manager.chrome import ChromeDriverManager

logger = logging.getLogger(__name__)


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

        service = Service(ChromeDriverManager().install())
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
        try:
            wait = WebDriverWait(self.driver, 10)
            reviews_tab = wait.until(
                EC.element_to_be_clickable(
                    (
                        By.XPATH,
                        "//button[contains(@aria-label,'Reviews') or "
                        ".//div[text()='Reviews']]",
                    )
                )
            )
            reviews_tab.click()
            time.sleep(self.scroll_pause)
        except TimeoutException:
            logger.warning(
                "Could not find Reviews tab – page may already show reviews "
                "or the URL points directly to the reviews panel."
            )

    def _get_scrollable_panel(self) -> WebElement | None:
        """Return the scrollable reviews panel element."""
        # The reviews panel is a scrollable <div> inside the side panel.
        # We look for the element with role="main" or the specific class.
        selectors = [
            "div.m6QErb.DxyBCb.kA9KIf.dS8AEf",  # common reviews panel
            "div.m6QErb.DxyBCb.kA9KIf",
            "div.m6QErb",
            "div[role='main']",
        ]
        for sel in selectors:
            try:
                panels = self.driver.find_elements(By.CSS_SELECTOR, sel)
                for panel in panels:
                    if panel.get_attribute("scrollTop") is not None:
                        return panel
            except NoSuchElementException:
                continue
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

        # Google Maps review containers have a data-review-id attribute
        review_elements = self.driver.find_elements(
            By.CSS_SELECTOR, "div[data-review-id]"
        )

        if not review_elements:
            # Fallback: try aria-label based selector
            review_elements = self.driver.find_elements(
                By.CSS_SELECTOR, "div.jftiEf"
            )

        for el in review_elements:
            review = self._parse_review_element(el)
            if review:
                reviews.append(review)

        return reviews

    def _parse_review_element(self, el: WebElement) -> Review | None:
        """Parse a single review element into a :class:`Review`."""
        try:
            # Reviewer name
            name = ""
            try:
                name_el = el.find_element(
                    By.CSS_SELECTOR, "div.d4r55, button[data-review-id] div"
                )
                name = name_el.text.strip()
            except NoSuchElementException:
                try:
                    name_el = el.find_element(By.CSS_SELECTOR, "a[data-review-id]")
                    name = name_el.get_attribute("aria-label") or ""
                    name = name.replace("Photo of ", "").strip()
                except NoSuchElementException:
                    pass

            # Star rating
            rating = 0
            try:
                star_el = el.find_element(
                    By.CSS_SELECTOR, "span.kvMYJc"
                )
                aria = star_el.get_attribute("aria-label") or ""
                # e.g. "5 stars" or "4 stars"
                for part in aria.split():
                    if part.isdigit():
                        rating = int(part)
                        break
            except NoSuchElementException:
                pass

            # Relative date (e.g. "2 months ago")
            relative_date = ""
            try:
                date_el = el.find_element(
                    By.CSS_SELECTOR, "span.rsqaWe"
                )
                relative_date = date_el.text.strip()
            except NoSuchElementException:
                pass

            # Review text
            text = ""
            try:
                text_el = el.find_element(
                    By.CSS_SELECTOR, "span.wiI7pd"
                )
                text = text_el.text.strip()
            except NoSuchElementException:
                pass

            # Owner response
            owner_response = ""
            owner_response_date = ""
            try:
                resp_container = el.find_element(
                    By.CSS_SELECTOR, "div.CDe7pd"
                )
                try:
                    resp_date_el = resp_container.find_element(
                        By.CSS_SELECTOR, "span.DZSIDd"
                    )
                    owner_response_date = resp_date_el.text.strip()
                except NoSuchElementException:
                    pass
                try:
                    resp_text_el = resp_container.find_element(
                        By.CSS_SELECTOR, "div.wiI7pd"
                    )
                    owner_response = resp_text_el.text.strip()
                except NoSuchElementException:
                    pass
            except NoSuchElementException:
                pass

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
