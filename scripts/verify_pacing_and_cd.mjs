import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';

async function verify() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--use-gl=angle', '--use-angle=metal']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://127.0.0.1:5174/woool-survivor-game/');
  await page.waitForTimeout(1500);

  // Click start battle
  const startBtn = await page.waitForSelector('.start-btn-woool');
  await startBtn.click();
  await page.waitForTimeout(1000);

  console.log('Battle started, observing cooldowns and spawns...');

  // Track cooldown UI states over 4 seconds
  const cdReadings = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(200);
    const reading = await page.evaluate(() => {
      const g = window.__wooolGame;
      const slotBox = document.querySelector('.woool-slot-box');
      const timerEl = document.querySelector('.skill-cd-timer');
      const maskEl = document.querySelector('.skill-cd-mask');
      const isReady = slotBox?.classList.contains('is-ready');
      const isCooling = slotBox?.classList.contains('is-cooling');
      return {
        t: Number(g?.clock?.toFixed(2) || 0),
        monsters: g?.monsters?.length || 0,
        skillCd: Number(g?.activeSkills?.[0]?.cdTimer?.toFixed(2) || 0),
        maxCd: Number(g?.activeSkills?.[0]?.maxCd?.toFixed(2) || 0),
        timerText: timerEl?.textContent || null,
        maskHeight: maskEl?.style?.height || null,
        isReady,
        isCooling
      };
    });
    cdReadings.push(reading);
  }

  // Take screenshot of gameplay with cooldown UI visible
  const screenshotPath = '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/pacing_cooldown_verified.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Screenshot saved to ${screenshotPath}`);

  await browser.close();

  console.log('Sample CD readings:');
  for (const r of cdReadings.slice(0, 10)) {
    console.log(`  t=${r.t}s | mobs=${r.monsters} | cdTimer=${r.skillCd}s/${r.maxCd}s | uiText=${r.timerText} | mask=${r.maskHeight} | ready=${r.isReady}`);
  }

  const hasCooldownUi = cdReadings.some(r => r.timerText !== null && r.isCooling);
  const hasReadyState = cdReadings.some(r => r.isReady);
  const reasonableMonsterCount = cdReadings.every(r => r.monsters <= 15);

  console.log(`Cooldown UI working: ${hasCooldownUi}`);
  console.log(`Ready state working: ${hasReadyState}`);
  console.log(`Early monster density controlled (<15): ${reasonableMonsterCount}`);

  if (!hasCooldownUi) {
    throw new Error('Cooldown timer text did not appear in UI');
  }
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
