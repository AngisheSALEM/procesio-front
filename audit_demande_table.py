import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        viewports = [
            {'width': 1440, 'height': 900, 'name': '1440px'},
            {'width': 1200, 'height': 800, 'name': '1200px'},
            {'width': 1024, 'height': 768, 'name': '1024px'},
            {'width': 768, 'height': 900, 'name': '768px'},
        ]

        for vp in viewports:
            context = await browser.new_context(viewport={'width': vp['width'], 'height': vp['height']})
            page = await context.new_page()

            await page.goto('http://localhost:5173')
            await page.wait_for_timeout(800)

            login_btn = page.locator('button:has-text("Accéder à PROCEZO")')
            if await login_btn.count() > 0:
                await login_btn.click()
                await page.wait_for_timeout(800)

            # Go to dossier
            dossier_row = page.locator('text=CONGO MINING').first
            await dossier_row.click()
            await page.wait_for_timeout(800)

            # Click tab Demande de communication
            demande_tab = page.locator('button:has-text("Demande de communication")')
            await demande_tab.click()
            await page.wait_for_timeout(800)

            await page.screenshot(path=rf'C:\Users\Salem\.gemini\antigravity-cli\brain\ce346906-6610-4272-af4b-a3532b076a19\audit_demande_table_{vp["name"]}.png')
            await context.close()

        await browser.close()
        print("Audits captured across viewports!")

asyncio.run(main())
