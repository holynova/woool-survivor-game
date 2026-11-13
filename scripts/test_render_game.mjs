import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';
import path from 'path';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

  console.log('Navigating to game...');
  await page.goto('http://127.0.0.1:5174/woool-survivor-game/', { waitUntil: 'networkidle' });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/shot_lobby.png' });
  console.log('Lobby screenshot taken.');

  // Click start battle
  const startBtn = await page.$('.start-btn-woool');
  if (startBtn) {
    console.log('Clicking .start-btn-woool button...');
    await startBtn.click();
  } else {
    console.log('No .start-btn-woool found');
  }

  // Wait 4 seconds for battle and mobs to spawn
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/shot_battle_1.png' });
  console.log('Battle 1 screenshot taken.');

  // Move player around using keyboard W/A/S/D
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyD');

  await page.keyboard.down('KeyS');
  await page.waitForTimeout(2000);
  await page.keyboard.up('KeyS');

  // Check if level-up modal appeared
  const levelUpModal = await page.$('.woool-level-up-modal');
  if (levelUpModal) {
    console.log('Level-up modal detected! Capturing screenshot...');
    await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/shot_levelup.png' });
    // Click first upgrade card
    const firstCard = await page.$('.woool-upgrade-card');
    if (firstCard) await firstCard.click();
    await page.waitForTimeout(1000);
  }

  // Wait another 3 seconds of active combat
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/shot_battle_2.png' });
  console.log('Battle 2 screenshot taken.');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
