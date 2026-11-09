import fs from 'node:fs';
import path from 'node:path';

function parsePlist(content) {
  const frames = {};
  const dictMatch = content.match(/<key>frames<\/key>\s*<dict>([\s\S]*?)<\/dict>\s*<key>metadata<\/key>/);
  if (!dictMatch) return null;
  const body = dictMatch[1];
  const itemRegex = /<key>([^<]+)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let match;
  while ((match = itemRegex.exec(body)) !== null) {
    const key = match[1];
    const dictStr = match[2];
    const frameMatch = dictStr.match(/<key>frame<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/);
    const sourceSizeMatch = dictStr.match(/<key>sourceSize<\/key>\s*<string>\{(\d+),(\d+)\}<\/string>/);
    const sourceColorRectMatch = dictStr.match(/<key>sourceColorRect<\/key>\s*<string>\{\{(\d+),(\d+)\},\{(\d+),(\d+)\}\}<\/string>/);
    const rotated = dictStr.includes('<key>rotated</key>\s*<true/>') || dictStr.includes('<key>rotated</key><true/>');
    if (frameMatch) {
      frames[key] = {
        frame: {
          x: parseInt(frameMatch[1]),
          y: parseInt(frameMatch[2]),
          w: parseInt(frameMatch[3]),
          h: parseInt(frameMatch[4])
        },
        rotated,
        trimmed: true,
        spriteSourceSize: sourceColorRectMatch
          ? {
              x: parseInt(sourceColorRectMatch[1]),
              y: parseInt(sourceColorRectMatch[2]),
              w: parseInt(sourceColorRectMatch[3]),
              h: parseInt(sourceColorRectMatch[4])
            }
          : {
              x: 0,
              y: 0,
              w: parseInt(frameMatch[3]),
              h: parseInt(frameMatch[4])
            },
        sourceSize: sourceSizeMatch
          ? { w: parseInt(sourceSizeMatch[1]), h: parseInt(sourceSizeMatch[2]) }
          : { w: parseInt(frameMatch[3]), h: parseInt(frameMatch[4]) }
      };
    }
  }
  return frames;
}

const baseDir = '/Users/sym/code/woool-survivor-game/public/assets/woool';
const dirs = ['monsters', 'heroes', 'effects'];

let totalConverted = 0;
for (const d of dirs) {
  const fullDir = path.join(baseDir, d);
  if (!fs.existsSync(fullDir)) continue;
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.plist'));
  for (const f of files) {
    const plistPath = path.join(fullDir, f);
    const jsonPath = path.join(fullDir, f.replace('.plist', '.json'));
    const pngName = f.replace('.plist', '.png');
    const content = fs.readFileSync(plistPath, 'utf-8');
    const parsedFrames = parsePlist(content);
    if (parsedFrames) {
      const atlasData = {
        frames: parsedFrames,
        meta: {
          image: pngName,
          format: 'RGBA8888'
        }
      };
      fs.writeFileSync(jsonPath, JSON.stringify(atlasData), 'utf-8');
      totalConverted++;
      console.log(`Converted: ${d}/${f} -> ${path.basename(jsonPath)} (${Object.keys(parsedFrames).length} frames)`);
    }
  }
}

console.log(`Successfully converted ${totalConverted} plists to Phaser JSON atlases!`);
