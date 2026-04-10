"""Debug: print every href on the C3Pay Facebook page."""
import sys, time
from http.cookiejar import MozillaCookieJar
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

cookies_file = sys.argv[1] if len(sys.argv) > 1 else "cookies.txt"
page = sys.argv[2] if len(sys.argv) > 2 else "C3Pay"

options = Options()
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

    driver.get(f"https://www.facebook.com/{page}")
    time.sleep(5)

    print(f"URL: {driver.current_url}")

    # Save full HTML
    with open("debug_fb_source.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("Saved debug_fb_source.html\n")

    # Print ALL unique hrefs
    print("=== ALL HREFS ON PAGE ===")
    hrefs = set()
    for a in driver.find_elements(By.TAG_NAME, "a"):
        try:
            h = a.get_attribute("href") or ""
            if h and h not in hrefs:
                hrefs.add(h)
                print(h)
        except Exception:
            pass

finally:
    input("\nPress Enter to close...")
    driver.quit()
