import fs from 'node:fs';
import path from 'node:path';

const task = await taskSpace('unrotate skill effects');
const page = task.page('p1');

const baseDir = '/Users/sym/code/woool-survivor-game/public/assets/woool/skills_fx';
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.plist'));

console.log(`Processing ${files.length} skill effect plists...`);

for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const name = f.replace('.plist', '');
  const plistPath = path.join(baseDir, f);
  const pngPath = path.join(baseDir, name + '.png');
  const jsonPath = path.join(baseDir, name + '.json');

  if (!fs.existsSync(pngPath)) {
    console.log(`Skipping ${f}, no matching PNG`);
    continue;
  }

  const plistText = fs.readFileSync(plistPath, 'utf-8');
  const pngB64 = fs.readFileSync(pngPath).toString('base64');

  const result = await page.evaluate(async ({ plist, pngBase64, pngFilename }) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image: ' + pngFilename));
      img.onload = () => {
        const dictMatch = plist.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata<\/key>/);
        const body = dictMatch ? dictMatch[1] : plist;
        const itemRegex = /<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
        let match;
        const frames = [];

        while ((match = itemRegex.exec(body)) !== null) {
          const key = match[1];
          const dictStr = match[2];
          const fm = dictStr.match(/<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/);
          const ssm = dictStr.match(/<key>sourceSize<\/key>\s*<string>\{(\d+),(\d+)\}<\/string>/);
          const scrm = dictStr.match(/<key>sourceColorRect<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/);
          const rotated = /<key>rotated<\/key>\s*<true\/>/.test(dictStr);

          if (fm) {
            const pw = parseInt(fm[3]);
            const ph = parseInt(fm[4]);
            frames.push({
              key,
              srcX: parseInt(fm[1]),
              srcY: parseInt(fm[2]),
              pw,
              ph,
              rotated,
              sourceColorRect: scrm
                ? { x: parseInt(scrm[1]), y: parseInt(scrm[2]), w: parseInt(scrm[3]), h: parseInt(scrm[4]) }
                : { x: 0, y: 0, w: pw, h: ph },
              sourceSize: ssm
                ? { w: parseInt(ssm[1]), h: parseInt(ssm[2]) }
                : { w: pw, h: ph }
            });
          }
        }

        if (frames.length === 0) {
          return resolve(null);
        }

        // Shelf bin packing (max width 2048)
        const atlasWidth = 2048;
        let curX = 2;
        let curY = 2;
        let rowH = 0;

        for (const f of frames) {
          if (curX + f.pw + 2 > atlasWidth) {
            curX = 2;
            curY += rowH + 2;
            rowH = 0;
          }
          f.destX = curX;
          f.destY = curY;
          curX += f.pw + 2;
          if (f.ph > rowH) rowH = f.ph;
        }

        const totalH = curY + rowH + 4;
        const atlasHeight = Math.max(256, 2 ** Math.ceil(Math.log2(totalH)));

        const cvs = document.createElement('canvas');
        cvs.width = atlasWidth;
        cvs.height = atlasHeight;
        const ctx = cvs.getContext('2d');

        const jsonFrames = {};

        for (const f of frames) {
          if (f.rotated) {
            ctx.save();
            ctx.translate(f.destX, f.destY + f.ph);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(img, f.srcX, f.srcY, f.ph, f.pw, 0, 0, f.ph, f.pw);
            ctx.restore();
          } else {
            ctx.drawImage(img, f.srcX, f.srcY, f.pw, f.ph, f.destX, f.destY, f.pw, f.ph);
          }

          jsonFrames[f.key] = {
            frame: {
              x: f.destX,
              y: f.destY,
              w: f.pw,
              h: f.ph
            },
            rotated: false,
            trimmed: true,
            spriteSourceSize: f.sourceColorRect,
            sourceSize: f.sourceSize
          };
        }

        const outPngB64 = cvs.toDataURL('image/png').split(',')[1];
        resolve({
          atlasData: {
            frames: jsonFrames,
            meta: {
              image: pngFilename,
              format: 'RGBA8888',
              size: { w: atlasWidth, h: atlasHeight }
            }
          },
          pngBase64: outPngB64,
          frameCount: frames.length,
          atlasHeight
        });
      };
      img.src = 'data:image/png;base64,' + pngBase64;
    });
  }, { plist: plistText, pngBase64: pngB64, pngFilename: name + '.png' });

  if (result) {
    fs.writeFileSync(pngPath, Buffer.from(result.pngBase64, 'base64'));
    fs.writeFileSync(jsonPath, JSON.stringify(result.atlasData), 'utf-8');
    console.log(`[${i + 1}/${files.length}] ${name}: ${result.frameCount} frames, canvas 2048x${result.atlasHeight}`);
  }
}

console.log('Finished un-rotating all skill effect atlases cleanly!');
process.exit(0);
