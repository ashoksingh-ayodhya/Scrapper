"""Debug: loads cookies, opens mbasic Facebook page, saves source + screenshot."""
import sys, time
from http.cookiejar import MozillaCookieJar
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

cookies_file = sys.argv[1] if len(sys.argv) > 1 else "cookies.txt"
page = sys.argv[2] if len(sys.argv) > 2 else "C3Pay"

options = Options()
# Run visible so you can see exactly what Chrome shows
# options.add_argument("--headless=new")
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

try:
    # Load cookies
    jar = MozillaCookieJar()
    jar.load(cookies_file, ignore_discard=True, ignore_expires=True)
    driver.get("https://www.facebook.com")
    time.sleep(3)
    for c in jar:
        if "facebook.com" in c.domain:
            try:
                driver.add_cookie({
                    "name": c.name, "value": c.value,
                    "path": c.path, "secure": bool(c.secure),
                    "domain": c.domain.lstrip("."),
                })
            except Exception:
                pass
    print("Cookies loaded.")

    # Navigate to mbasic page
    url = f"https://mbasic.facebook.com/{page}"
    print(f"Loading: {url}")
    driver.get(url)
    time.sleep(4)

    print(f"Current URL: {driver.current_url}")
    print(f"Title: {driver.title}")

    # Save source
    src = driver.page_source
    with open("debug_fb_source.html", "w", encoding="utf-8") as f:
        f.write(src)
    driver.save_screenshot("debug_fb_screenshot.png")
    print("Saved: debug_fb_source.html, debug_fb_screenshot.png")

    # Print element counts
    for sel in ["article", "div[data-ft]", "div[data-store]", "div[role='article']"]:
        els = driver.find_elements(By.CSS_SELECTOR, sel)
        print(f"  {sel}: {len(els)} elements")

    # Print first 3000 chars of body text
    body = driver.find_element(By.TAG_NAME, "body").text
    print("\n--- PAGE TEXT (first 2000 chars) ---")
    print(body[:2000])

finally:
    input("\nPress Enter to close browser...")
    driver.quit()
