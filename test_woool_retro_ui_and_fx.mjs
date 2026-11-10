import fs from 'node:fs';

const task = await taskSpace('test woool retro ui and skill fx');
const page = task.page('p1');

console.log('Navigating to http://127.0.0.1:5174/ ...');
await page.goto('http://127.0.0.1:5174/');
await page.waitForTimeout(2000);

// 1. Lobby Screenshot
console.log('Capturing Lobby...');
await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/lobby_woool_retro.png' });

// 2. Click Start Game Button
console.log('Clicking Start Button...');
try {
  await page.click('.start-btn-woool');
} catch (err) {
  console.log('Click error:', err.message);
}

await page.waitForTimeout(1500);

// 3. Battle HUD Screenshot
console.log('Capturing Battle HUD...');
await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/hud_woool_retro.png' });

// 4. Move around and fight monsters
console.log('Moving and casting skills...');
await page.keyboard.down('KeyD');
await page.waitForTimeout(1500);
await page.keyboard.up('KeyD');

await page.keyboard.down('KeyS');
await page.waitForTimeout(1500);
await page.keyboard.up('KeyS');

// Wait for monsters and combat
await page.waitForTimeout(3000);
await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/combat_woool_retro.png' });

// Move towards monsters to collect exp
console.log('Collecting exp...');
await page.keyboard.down('KeyA');
await page.waitForTimeout(1200);
await page.keyboard.up('KeyA');

await page.keyboard.down('KeyW');
await page.waitForTimeout(1200);
await page.keyboard.up('KeyW');

// Wait up to 10s for level up modal
for (let i = 0; i < 20; i++) {
  const hasModal = await page.evaluate(() => !!document.querySelector('.upgrade-dialog-woool'));
  if (hasModal) {
    console.log('Level up modal appeared!');
    break;
  }
  await page.waitForTimeout(500);
}

await page.screenshot({ path: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/upgrade_woool_retro.png' });
console.log('Verification script completed!');
process.exit(0);
