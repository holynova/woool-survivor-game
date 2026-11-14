import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assets = [
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/tree_peach_1794661628096.jpg',
    dst: 'public/assets/woool/maps/tree_peach.png',
    maxW: 240,
    maxH: 280
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/tree_willow_1794661646478.jpg',
    dst: 'public/assets/woool/maps/tree_willow.png',
    maxW: 240,
    maxH: 280
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/tree_pine_1794661663152.jpg',
    dst: 'public/assets/woool/maps/tree_pine.png',
    maxW: 220,
    maxH: 260
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/stone_lantern_1794661679499.jpg',
    dst: 'public/assets/woool/maps/stone_lantern.png',
    maxW: 100,
    maxH: 150
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/rock_boulder_1794661633843.jpg',
    dst: 'public/assets/woool/maps/rock_boulder.png',
    maxW: 160,
    maxH: 140
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/wood_fence_1794661650890.jpg',
    dst: 'public/assets/woool/maps/wood_fence.png',
    maxW: 180,
    maxH: 130
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/ancient_well_1794661667653.jpg',
    dst: 'public/assets/woool/maps/ancient_well.png',
    maxW: 150,
    maxH: 170
  },
  {
    src: '/Users/sym/.gemini/antigravity/brain/2e8ba5fb-0066-44fa-8c5f-83675e296b19/ancient_pavilion_1794661685560.jpg',
    dst: 'public/assets/woool/maps/ancient_pavilion.png',
    maxW: 280,
    maxH: 260
  }
];

async function processImage(item) {
  console.log('Processing:', item.src);
  const image = sharp(item.src);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // BFS Flood Fill from edges to identify external white/near-white background
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isWhite(x, y) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Background is near white (r,g,b all > 235 or high luminance with low saturation)
    return r > 232 && g > 232 && b > 232;
  }

  // Seed borders
  for (let x = 0; x < width; x++) {
    if (isWhite(x, 0)) { visited[x] = 1; queue.push(x, 0); }
    const bIdx = (height - 1) * width + x;
    if (isWhite(x, height - 1)) { visited[bIdx] = 1; queue.push(x, height - 1); }
  }
  for (let y = 0; y < height; y++) {
    const lIdx = y * width;
    if (!visited[lIdx] && isWhite(0, y)) { visited[lIdx] = 1; queue.push(0, y); }
    const rIdx = y * width + (width - 1);
    if (!visited[rIdx] && isWhite(width - 1, y)) { visited[rIdx] = 1; queue.push(width - 1, y); }
  }

  let head = 0;
  while (head < queue.length) {
    const qx = queue[head++];
    const qy = queue[head++];

    const neighbors = [
      [qx + 1, qy],
      [qx - 1, qy],
      [qx, qy + 1],
      [qx, qy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx] && isWhite(nx, ny)) {
          visited[nIdx] = 1;
          queue.push(nx, ny);
        }
      }
    }
  }

  // Apply transparency to visited background
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const dIdx = pIdx * 4;
      if (visited[pIdx]) {
        data[dIdx + 3] = 0; // Transparent
      } else {
        const r = data[dIdx];
        const g = data[dIdx + 1];
        const b = data[dIdx + 2];
        // Soft fringe edge smoothing
        if (r > 225 && g > 225 && b > 225) {
          const lum = (r + g + b) / 3;
          data[dIdx + 3] = Math.max(0, Math.min(255, Math.round((255 - lum) * 8)));
        }
        if (data[dIdx + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    minX = 0; maxX = width - 1; minY = 0; maxY = height - 1;
  }

  const cropW = Math.max(10, maxX - minX + 1);
  const cropH = Math.max(10, maxY - minY + 1);

  // Crop & resize to game prop scale
  const croppedBuf = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract({ left: minX, top: minY, width: cropW, height: cropH })
    .resize({ width: item.maxW, height: item.maxH, fit: 'inside' })
    .png()
    .toBuffer();

  const outPath = path.resolve(item.dst);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, croppedBuf);
  console.log(`Saved transparent sprite -> ${outPath}`);
}

async function main() {
  for (const item of assets) {
    await processImage(item);
  }
  console.log('All 8 AI assets processed and saved successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
