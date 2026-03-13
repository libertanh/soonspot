"""
SoonSpot - Bedford NH Building Permit Scraper
Scrapes all permits from permitlinkonline.com/csp/bedfordnh/
Output: bedford_permits.csv

Usage:
  py scrape_bedford.py
"""

import asyncio
import csv
import time
from playwright.async_api import async_playwright

BASE_URL = "https://www.permitlinkonline.com/csp/bedfordnh/"
SEARCH_URL = BASE_URL + "DocumentLink.PublicSearch.cls"
OUTPUT_FILE = "bedford_permits.csv"

# ── How many properties to scrape (set to None for ALL ~8438) ──
MAX_PROPERTIES = 5  # Change to e.g. 50 to do a test run first


async def get_all_properties(page):
    """Page through the property list and collect every row."""
    print("Loading property search page...")
    await page.goto(SEARCH_URL)
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(1500)

    # Get totals from zenPage
    total_rows = await page.evaluate("parseInt(zenPage.getComponent(49).rowCount)")
    page_size  = await page.evaluate("parseInt(zenPage.getComponent(49).pageSize)")
    total_pages = (total_rows + page_size - 1) // page_size
    print(f"  {total_rows} properties across {total_pages} pages")

    properties = []

    for pg in range(1, total_pages + 1):
        if pg > 1:
            await page.evaluate(f"zenPage.getComponent(49).gotoPage({pg})")
            # Wait until currPage matches
            for _ in range(30):
                curr = await page.evaluate("parseInt(zenPage.getComponent(49).currPage)")
                if curr == pg:
                    break
                await page.wait_for_timeout(300)
            await page.wait_for_timeout(400)

        rows = await page.query_selector_all("tr[onclick]")
        for row in rows:
            cells = await row.query_selector_all("td")
            vals  = [await c.inner_text() for c in cells]
            vals  = [v.strip() for v in vals]
            if len(vals) >= 4 and vals[0]:
                properties.append({
                    "owner":  vals[0],
                    "house":  vals[1] if len(vals) > 1 else "",
                    "street": vals[2] if len(vals) > 2 else "",
                    "map":    vals[3] if len(vals) > 3 else "",
                    "block":  vals[4] if len(vals) > 4 else "",
                    "lot":    vals[5] if len(vals) > 5 else "",
                })

        if pg % 20 == 0 or pg == total_pages:
            print(f"  Properties: page {pg}/{total_pages} — {len(properties)} collected")

        if MAX_PROPERTIES and len(properties) >= MAX_PROPERTIES:
            print(f"  Reached MAX_PROPERTIES limit ({MAX_PROPERTIES}), stopping early.")
            break

    return properties


async def get_permits_for_property(page, prop_index):
    """
    Click property row at given index on the CURRENT search page,
    scrape all permits from the detail page, then navigate back.
    Returns list of permit dicts.
    """
    permits = []

    # Click the row — this navigates to DocumentLink.PublicHome.cls
    rows = await page.query_selector_all("tr[onclick]")
    if prop_index >= len(rows):
        return permits

    row = rows[prop_index]
    address_cells = await row.query_selector_all("td")
    address_vals  = [await c.inner_text() for c in address_cells]
    address_vals  = [v.strip() for v in address_vals]
    address = f"{address_vals[1]} {address_vals[2]}".strip() if len(address_vals) >= 3 else ""

    await row.click()
    try:
        await page.wait_for_url("**/DocumentLink.PublicHome.cls**", timeout=8000)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(800)
    except Exception:
        # Sometimes it stays or errors — go back
        await page.go_back()
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(500)
        return permits

    # Check for error page
    body = await page.inner_text("body")
    if "error occurred" in body.lower():
        await page.go_back()
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(500)
        return permits

    # ── Scrape the Permits & Inspections tab ──
    # Try clicking the Permits tab if it exists
    try:
        permit_tab = page.locator("text=Permits and Inspections").first
        if await permit_tab.count() > 0:
            await permit_tab.click()
            await page.wait_for_timeout(600)
    except Exception:
        pass

    # Find permit rows in tables
    tables = await page.query_selector_all("table")
    for table in tables:
        headers = await table.query_selector_all("th")
        header_texts = [await h.inner_text() for h in headers]
        header_texts = [h.strip().lower() for h in header_texts]

        # Look for tables that have permit-like headers
        permit_keywords = ["permit", "type", "date", "status", "description"]
        if not any(k in " ".join(header_texts) for k in permit_keywords):
            continue

        rows = await table.query_selector_all("tr")
        col_map = {h: i for i, h in enumerate(header_texts)}

        for row in rows[1:]:  # skip header row
            cells = await row.query_selector_all("td")
            vals  = [await c.inner_text() for c in cells]
            vals  = [v.strip() for v in vals]
            if not vals or not any(vals):
                continue

            permit = {
                "address":     address,
                "owner":       address_vals[0] if address_vals else "",
                "permit_num":  "",
                "permit_type": "",
                "description": "",
                "date_issued": "",
                "status":      "",
                "raw":         " | ".join(vals),
            }

            # Map columns if we can identify them
            for key, keywords in [
                ("permit_num",  ["permit", "number", "no"]),
                ("permit_type", ["type"]),
                ("description", ["description", "desc", "work"]),
                ("date_issued", ["date", "issued"]),
                ("status",      ["status"]),
            ]:
                for kw in keywords:
                    for col_name, idx in col_map.items():
                        if kw in col_name and idx < len(vals):
                            permit[key] = vals[idx]
                            break

            if any(permit[k] for k in ["permit_num", "permit_type", "description", "date_issued"]):
                permits.append(permit)

    # Navigate back to search
    await page.go_back()
    try:
        await page.wait_for_url("**/DocumentLink.PublicSearch.cls**", timeout=6000)
    except Exception:
        await page.goto(SEARCH_URL)
    await page.wait_for_load_state("networkidle")
    await page.wait_for_timeout(600)

    return permits


async def main():
    start = time.time()
    all_permits = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=False)  # visible so you can watch
        context = await browser.new_context()
        page    = await context.new_page()

        # ── Phase 1: collect all properties ──
        properties = await get_all_properties(page)
        limit = MAX_PROPERTIES or len(properties)
        print(f"\nCollected {len(properties)} properties. Now scraping permits for up to {limit}...\n")

        # ── Phase 2: scrape permits for each property ──
        # We need to navigate back to the search page each time and find the row
        # Strategy: work through pages sequentially; for each page scrape all rows on it

        await page.goto(SEARCH_URL)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1200)

        total_rows = await page.evaluate("parseInt(zenPage.getComponent(49).rowCount)")
        page_size  = await page.evaluate("parseInt(zenPage.getComponent(49).pageSize)")
        total_pages = (total_rows + page_size - 1) // page_size

        props_done = 0

        for pg in range(1, total_pages + 1):
            # Navigate to this page of results
            if pg > 1:
                await page.evaluate(f"zenPage.getComponent(49).gotoPage({pg})")
                for _ in range(30):
                    curr = await page.evaluate("parseInt(zenPage.getComponent(49).currPage)")
                    if curr == pg:
                        break
                    await page.wait_for_timeout(300)
                await page.wait_for_timeout(500)

            # Count rows on this page
            rows = await page.query_selector_all("tr[onclick]")
            n_rows = len(rows)

            for row_idx in range(n_rows):
                if MAX_PROPERTIES and props_done >= MAX_PROPERTIES:
                    break

                # Re-navigate to the correct page (going back may reset it)
                curr_pg = await page.evaluate("parseInt(zenPage.getComponent(49).currPage)")
                if curr_pg != pg:
                    await page.evaluate(f"zenPage.getComponent(49).gotoPage({pg})")
                    for _ in range(30):
                        c = await page.evaluate("parseInt(zenPage.getComponent(49).currPage)")
                        if c == pg:
                            break
                        await page.wait_for_timeout(300)
                    await page.wait_for_timeout(400)

                permits = await get_permits_for_property(page, row_idx)
                all_permits.extend(permits)
                props_done += 1

                if props_done % 10 == 0:
                    elapsed = time.time() - start
                    rate = props_done / elapsed if elapsed > 0 else 0
                    remaining = (limit - props_done) / rate if rate > 0 else 0
                    print(f"  [{props_done}/{limit}] {len(all_permits)} permits found | "
                          f"{elapsed:.0f}s elapsed | ~{remaining:.0f}s remaining")

            if MAX_PROPERTIES and props_done >= MAX_PROPERTIES:
                break

        await browser.close()

    # ── Write CSV ──
    if all_permits:
        fields = ["address", "owner", "permit_num", "permit_type",
                  "description", "date_issued", "status", "raw"]
        with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(all_permits)
        print(f"\n✅ Done! {len(all_permits)} permit records saved to {OUTPUT_FILE}")
    else:
        print("\n⚠️  No permits found. The site structure may need adjustment.")
        print("   Try running with MAX_PROPERTIES = 5 first to debug.")

    elapsed = time.time() - start
    print(f"   Total time: {elapsed:.0f}s")


if __name__ == "__main__":
    asyncio.run(main())
