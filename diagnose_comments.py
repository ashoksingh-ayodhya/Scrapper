"""Diagnose Facebook comment DOM structure on a specific post URL."""
import sys
import time
from http.cookiejar import MozillaCookieJar
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

cookies_file = sys.argv[1] if len(sys.argv) > 1 else "cookies.txt"
# Use the first reel URL from the log
url = sys.argv[2] if len(sys.argv) > 2 else (
    "https://www.facebook.com/reel/2335821146903990/"
)

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

    print(f"Loading: {url}")
    driver.get(url)
    time.sleep(8)
    print(f"Final URL: {driver.current_url}\n")

    # ── Element counts ──────────────────────────────────────────────────────
    checks = [
        ("//div[@role='article']",            "div[role='article']"),
        ("//div[@role='list']",               "div[role='list']"),
        ("//div[@role='listitem']",           "div[role='listitem']"),
        ("//ul",                              "ul elements"),
        ("//li",                              "li elements"),
        ("//div[@dir='auto']",               "div[dir='auto']"),
        ("//span[@dir='auto']",              "span[dir='auto']"),
        ("//div[@data-comment-id]",          "div[data-comment-id]"),
        ("//li[@data-comment-id]",           "li[data-comment-id]"),
        ("//*[contains(@aria-label,'Comment')]", "aria-label*=Comment"),
        ("//div[@data-pagelet]",             "div[data-pagelet]"),
        ("//div[@data-testid]",              "div[data-testid]"),
    ]
    print("=== ELEMENT COUNTS ===")
    for xpath, label in checks:
        try:
            n = len(driver.find_elements(By.XPATH, xpath))
        except Exception:
            n = "ERR"
        print(f"  {label}: {n}")

    # ── Pagelets ────────────────────────────────────────────────────────────
    print("\n=== PAGELETS ===")
    seen = set()
    for el in driver.find_elements(By.XPATH, "//div[@data-pagelet]"):
        try:
            name = el.get_attribute("data-pagelet") or ""
            if name and name not in seen:
                seen.add(name)
                print(f"  {name}")
        except Exception:
            pass

    # ── data-testid values ──────────────────────────────────────────────────
    print("\n=== DATA-TESTID VALUES ===")
    seen2 = set()
    for el in driver.find_elements(By.XPATH, "//div[@data-testid]"):
        try:
            v = el.get_attribute("data-testid") or ""
            if v and v not in seen2:
                seen2.add(v)
                print(f"  {v}")
        except Exception:
            pass

    # ── role values ─────────────────────────────────────────────────────────
    print("\n=== ROLE COUNTS ===")
    counts: dict[str, int] = {}
    for el in driver.find_elements(By.XPATH, "//*[@role]"):
        try:
            r = el.get_attribute("role") or ""
            if r:
                counts[r] = counts.get(r, 0) + 1
        except Exception:
            pass
    for role, cnt in sorted(counts.items(), key=lambda x: -x[1]):
        print(f"  role={role}: {cnt}")

    # ── aria-label with Comment ──────────────────────────────────────────────
    print("\n=== ARIA-LABEL CONTAINING 'COMMENT' ===")
    for el in driver.find_elements(By.XPATH,
            "//*[contains(translate(@aria-label,'ABCDEFGHIJKLMNOPQRSTUVWXYZ',"
            "'abcdefghijklmnopqrstuvwxyz'),'comment')]")[:20]:
        try:
            print(f"  <{el.tag_name}> aria-label={el.get_attribute('aria-label')!r:.100}")
        except Exception:
            pass

    # ── dir='auto' text samples ──────────────────────────────────────────────
    print("\n=== FIRST 15 dir='auto' TEXT SAMPLES ===")
    for el in driver.find_elements(By.XPATH, "//div[@dir='auto'] | //span[@dir='auto']")[:15]:
        try:
            t = el.text.strip()
            if t:
                print(f"  <{el.tag_name}>: {t[:120]!r}")
        except Exception:
            pass

    # ── Save HTML ────────────────────────────────────────────────────────────
    with open("debug_post_page.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("\nSaved debug_post_page.html")

finally:
    input("\nPress Enter to close browser...")
    driver.quit()
