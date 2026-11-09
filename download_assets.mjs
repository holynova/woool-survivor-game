import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const TARGET_DIR = '/Users/sym/code/woool-survivor-game/public/assets/woool';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function downloadFile(giteePath, localRelativePath) {
  const localDest = path.join(TARGET_DIR, localRelativePath);
  fs.mkdirSync(path.dirname(localDest), { recursive: true });

  if (fs.existsSync(localDest) && fs.statSync(localDest).size > 0) {
    console.log(`[Skip] Already exists: ${localRelativePath}`);
    return;
  }

  const rawUrl = `https://gitee.com/ym6745476/ym-woool/raw/master/${giteePath}`;
  try {
    const buf = await fetchUrl(rawUrl);
    fs.writeFileSync(localDest, buf);
    console.log(`[Downloaded] ${localRelativePath} (${(buf.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`[Error] Failed to download ${giteePath}:`, err.message);
  }
}

async function main() {
  const filesToDownload = [];

  // 1. Logo
  filesToDownload.push({ gitee: 'res/logo.png', local: 'logo.png' });

  // 2. Skill Icons
  const skillIds = [
    1001, 1002, 1003, 1004, 1005, 1006, 1008, 1009, 1010, 1102,
    2001, 2002, 2003, 2004, 2005, 2007, 2008, 2009, 2010, 2011, 2202,
    3001, 3002, 3003, 3004, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3303
  ];
  skillIds.forEach(id => {
    filesToDownload.push({ gitee: `res/skill/icon/${id}.png`, local: `skills/${id}.png` });
  });

  // 3. Create Role & Class Assets
  const roleFiles = [
    'job_1.png', 'job_2.png', 'job_3.png',
    'label_1.png', 'label_2.png', 'label_3.png',
    '1_0.png', '2_0.png', '3_0.png',
    'bg.jpg', 'bg_bottom.png', 'bg_dialog.png', 'create_btn.png'
  ];
  roleFiles.forEach(f => {
    filesToDownload.push({ gitee: `res/create_role/${f}`, local: `role/${f}` });
  });

  // 4. Main UI & HUD
  const mainUiFiles = [
    'main_bottom.png', 'hp_progress.png', 'mp_progress.png',
    'blood.png', 'blood_progress_bg.png', 'role_head_bg.png',
    'monster_head_bg.png', 'hp_bar.png', 'hp_bar_monster.png',
    'boss_def.png', 'elite_def.png', 'combat.png', 'rucksack.png'
  ];
  mainUiFiles.forEach(f => {
    filesToDownload.push({ gitee: `res/main/${f}`, local: `ui/${f}` });
  });

  // 5. Loading backgrounds (Sunset Island & Central State)
  const loadingFiles = ['1.jpg', '2100.jpg', '3100.jpg', 'loading_bg.png'];
  loadingFiles.forEach(f => {
    filesToDownload.push({ gitee: `res/loading/${f}`, local: `maps/${f}` });
  });

  // 6. Monster Sprites & Plists
  const monsterIds = ['20081', '20082', '20085', '20112', '20038', '20111', '20046', '20072'];
  monsterIds.forEach(id => {
    filesToDownload.push({ gitee: `res/monster/plist/m_${id}@0.plist`, local: `monsters/m_${id}@0.plist` });
    filesToDownload.push({ gitee: `res/monster/plist/m_${id}@0.png`, local: `monsters/m_${id}@0.png` });
  });

  // 7. Hero Sprites & Plists
  const roleIds = ['5110501', '5120503', '5130503'];
  roleIds.forEach(id => {
    filesToDownload.push({ gitee: `res/role/plist/r_${id}@0.plist`, local: `heroes/r_${id}@0.plist` });
    filesToDownload.push({ gitee: `res/role/plist/r_${id}@0.png`, local: `heroes/r_${id}@0.png` });
  });

  // 8. Visual Effects
  const effectFiles = ['level_up@0.plist', 'level_up@0.png', 'auto_attack@0.plist', 'auto_attack@0.png'];
  effectFiles.forEach(f => {
    filesToDownload.push({ gitee: `res/effect/plist/${f}`, local: `effects/${f}` });
  });

  console.log(`Starting raw download of ${filesToDownload.length} files...`);

  // Concurrency of 3 with small pacing
  const CONCURRENCY = 3;
  for (let i = 0; i < filesToDownload.length; i += CONCURRENCY) {
    const chunk = filesToDownload.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(item => downloadFile(item.gitee, item.local)));
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('Finished downloading core Woool assets!');
}

main().catch(console.error);
