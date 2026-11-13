import { chromium } from '/opt/homebrew/lib/node_modules/playwright/index.mjs';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

  await page.goto('http://127.0.0.1:5174/woool-survivor-game/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Start game
  await page.click('.start-btn-woool');
  console.log('Battle entered.');
  await page.waitForTimeout(1000);

  // Upgrade skills to Lv.4, add meteor Lv.4 and wind shield, and spawn Elite + Boss
  await page.evaluate(() => {
    const g = window.game;
    if (!g) return;

    // Set player skills
    if (g.activeSkills[0]) {
      g.activeSkills[0].level = 4;
      g.activeSkills[0].cdTimer = 0.2;
    }

    // Add Meteor Lv.4
    g.activeSkills.push({
      id: 'celestial_meteor',
      level: 4,
      cdTimer: 0.5,
      maxCd: 3.5
    });

    // Add Wind Shield
    g.activeSkills.push({
      id: 'wind_shield',
      level: 4,
      cdTimer: 0,
      maxCd: 12
    });

    // Spawn 5-minute milestone Elite & Supreme Boss near player
    if (g.spawnMilestoneElite) g.spawnMilestoneElite(1);
    if (g.spawnBoss) g.spawnBoss();

    // Place drops
    g.drops.push({
      id: 9991,
      type: 'gold',
      x: g.player.x + 80,
      y: g.player.y + 30,
      value: 10,
      tier: 1
    });
    g.drops.push({
      id: 9992,
      type: 'gold',
      x: g.player.x + 120,
      y: g.player.y - 40,
      value: 35,
      tier: 2
    });
    g.drops.push({
      id: 9993,
      type: 'gold',
      x: g.player.x - 90,
      y: g.player.y + 60,
      value: 100,
      tier: 3
    });
  });

  // Let battle run for 3.5 seconds so skills cast and auras pulse
  await page.waitForTimeout(3500);

  // Take screenshot
  const targetPath = '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/shot_elite_boss_skills.png';
  await page.screenshot({ path: targetPath });
  console.log('Captured shot_elite_boss_skills.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
