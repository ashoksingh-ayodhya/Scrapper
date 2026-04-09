"""Debug script: saves page source + screenshot at each step of Google Maps scraping."""
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import shutil, os

# ---- driver setup (mirrors reviews_scraper.py) ----
options = Options()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-gpu")
options.add_argument("--window-size=1920,1080")
options.add_argument("--lang=en-US")
options.add_argument(
    "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Detect chromedriver
_CHROMEDRIVER_PATH = "/root/.wdm/drivers/chromedriver/linux64/141/chromedriver"
if os.path.isfile(_CHROMEDRIVER_PATH):
    service = Service(_CHROMEDRIVER_PATH)
elif shutil.which("chromedriver"):
    service = Service()
else:
    from webdriver_manager.chrome import ChromeDriverManager
    service = Service(ChromeDriverManager().install())

driver = webdriver.Chrome(service=service, options=options)
driver.set_page_load_timeout(30)

URL = "https://www.google.com/maps/place/Edenred+UAE+-+Best+WPS+Payroll+Solution/@25.1882233,55.2557997,17z"

try:
    print(f"Loading: {URL}")
    driver.get(URL)
    time.sleep(5)

    print(f"Current URL: {driver.current_url}")
    print(f"Title: {driver.title}")

    # Save initial page source
    with open("debug_step1_initial.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    driver.save_screenshot("debug_step1_initial.png")
    print("Saved debug_step1_initial.html + .png")

    # Try to dismiss consent
    for xpath in [
        "//button[.//span[contains(text(),'Accept all')]]",
        "//button[contains(text(),'Accept')]",
        "//button[@aria-label='Accept all']",
    ]:
        try:
            btn = WebDriverWait(driver, 3).until(
                EC.element_to_be_clickable((By.XPATH, xpath))
            )
            btn.click()
            print(f"Clicked consent button: {xpath}")
            time.sleep(2)
            break
        except Exception:
            pass

    driver.save_screenshot("debug_step2_after_consent.png")
    with open("debug_step2_after_consent.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("Saved debug_step2_after_consent.html + .png")

    # Print all buttons visible on page
    buttons = driver.find_elements(By.TAG_NAME, "button")
    print(f"\nFound {len(buttons)} buttons:")
    for b in buttons[:30]:
        print(f"  aria-label={b.get_attribute('aria-label')!r}  text={b.text[:60]!r}")

    # Try to find and click Reviews tab
    review_xpaths = [
        "//button[contains(@aria-label,'Reviews')]",
        "//button[.//div[text()='Reviews']]",
        "//button[.//span[text()='Reviews']]",
        "//*[@role='tab'][contains(.,'Reviews')]",
    ]
    for xpath in review_xpaths:
        elems = driver.find_elements(By.XPATH, xpath)
        if elems:
            print(f"\nFound Reviews tab via: {xpath}")
            elems[0].click()
            time.sleep(3)
            break
    else:
        print("\nNo Reviews tab found with any known XPath")

    driver.save_screenshot("debug_step3_after_reviews_tab.png")
    with open("debug_step3_after_reviews_tab.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("Saved debug_step3_after_reviews_tab.html + .png")

    # Check for review elements
    for sel in ["div[data-review-id]", "div.jftiEf", "div[data-hveid] div[aria-label]"]:
        els = driver.find_elements(By.CSS_SELECTOR, sel)
        print(f"  Selector {sel!r}: {len(els)} elements")

finally:
    driver.quit()
    print("\nDone. Check the debug_*.png and debug_*.html files.")
