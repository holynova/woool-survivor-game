import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const outMaps = path.resolve('public/assets/woool/maps');
const outItems = path.resolve('public/assets/woool/items');

if (!fs.existsSync(outMaps)) fs.mkdirSync(outMaps, { recursive: true });
if (!fs.existsSync(outItems)) fs.mkdirSync(outItems, { recursive: true });

// 1. Single Gold Coin (Authentic Woool isometric coin)
const svgCoin1 = `
<svg width="28" height="22" viewBox="0 0 28 22" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd666"/>
      <stop offset="40%" stop-color="#d48806"/>
      <stop offset="100%" stop-color="#874d00"/>
    </linearGradient>
    <linearGradient id="goldFace" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff566"/>
      <stop offset="35%" stop-color="#ffc53d"/>
      <stop offset="80%" stop-color="#d48806"/>
      <stop offset="100%" stop-color="#ad6800"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="14" cy="18" rx="11" ry="3.5" fill="url(#shadow)"/>
  <!-- Coin Body (3D side) -->
  <path d="M 4 12 C 4 16 24 16 24 12 L 24 14 C 24 18 4 18 4 14 Z" fill="url(#goldEdge)"/>
  <!-- Coin Top Face -->
  <ellipse cx="14" cy="12" rx="10" ry="5.5" fill="url(#goldFace)" stroke="#ffe58f" stroke-width="0.8"/>
  <!-- Inner Coin Ring/Rim -->
  <ellipse cx="14" cy="12" rx="7.5" ry="3.8" fill="none" stroke="#ad6800" stroke-width="0.8"/>
  <!-- Square Center Hole (Traditional Chinese coin) -->
  <rect x="12" y="10.5" width="4" height="3" fill="#874d00" stroke="#d48806" stroke-width="0.5"/>
  <!-- Specular Sparkle -->
  <polygon points="7,8 8.5,10 7,12 5.5,10" fill="#ffffff" opacity="0.95"/>
  <circle cx="7" cy="10" r="1.2" fill="#ffffff"/>
</svg>
`;

// 2. Gold Coin Cluster / Pile (3-4 coins)
const svgCoin2 = `
<svg width="40" height="30" viewBox="0 0 40 30" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="shadow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldFace2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffb8f"/>
      <stop offset="30%" stop-color="#ffc53d"/>
      <stop offset="80%" stop-color="#d48806"/>
      <stop offset="100%" stop-color="#874d00"/>
    </linearGradient>
    <linearGradient id="goldEdge2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffd666"/>
      <stop offset="100%" stop-color="#613400"/>
    </linearGradient>
  </defs>
  <!-- Ground Shadow -->
  <ellipse cx="20" cy="24" rx="17" ry="5.5" fill="url(#shadow2)"/>
  
  <!-- Back Left Coin -->
  <g transform="translate(6, 11)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6 C 16 10 0 10 0 6 Z" fill="url(#goldEdge2)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4.2" fill="url(#goldFace2)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>

  <!-- Back Right Coin -->
  <g transform="translate(18, 9)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6 C 16 10 0 10 0 6 Z" fill="url(#goldEdge2)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4.2" fill="url(#goldFace2)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>

  <!-- Front Center Coin -->
  <g transform="translate(11, 16)">
    <path d="M 0 4 C 0 8 18 8 18 4 L 18 6.5 C 18 10.5 0 10.5 0 6.5 Z" fill="url(#goldEdge2)"/>
    <ellipse cx="9" cy="4" rx="9" ry="4.8" fill="url(#goldFace2)" stroke="#ffe58f" stroke-width="0.8"/>
    <ellipse cx="9" cy="4" rx="6.5" ry="3.2" fill="none" stroke="#ad6800" stroke-width="0.7"/>
    <rect x="7.5" y="2.8" width="3" height="2.4" fill="#874d00"/>
  </g>

  <!-- Sparkles -->
  <polygon points="12,14 13.5,15.5 12,17 10.5,15.5" fill="#ffffff" opacity="0.95"/>
  <polygon points="27,8 28.2,9.2 27,10.4 25.8,9.2" fill="#ffffff" opacity="0.9"/>
</svg>
`;

// 3. Giant Sparkling Gold Pile (Heaping Treasure Stack)
const svgCoin3 = `
<svg width="52" height="42" viewBox="0 0 52 42" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="shadow3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffd666" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#d48806" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldFace3" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffb8"/>
      <stop offset="35%" stop-color="#ffd666"/>
      <stop offset="75%" stop-color="#d48806"/>
      <stop offset="100%" stop-color="#613400"/>
    </linearGradient>
    <linearGradient id="goldEdge3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe58f"/>
      <stop offset="100%" stop-color="#4e2700"/>
    </linearGradient>
  </defs>
  <!-- Aura Glow Behind -->
  <circle cx="26" cy="24" r="22" fill="url(#goldGlow)"/>
  <!-- Ground Shadow -->
  <ellipse cx="26" cy="36" rx="23" ry="6" fill="url(#shadow3)"/>

  <!-- Base Layer Coins -->
  <g transform="translate(4, 26)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6.5 C 16 10.5 0 10.5 0 6.5 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4" fill="url(#goldFace3)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>
  <g transform="translate(18, 28)">
    <path d="M 0 4 C 0 8 18 8 18 4 L 18 6.5 C 18 10.5 0 10.5 0 6.5 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="9" cy="4" rx="9" ry="4.5" fill="url(#goldFace3)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>
  <g transform="translate(32, 25)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6.5 C 16 10.5 0 10.5 0 6.5 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4" fill="url(#goldFace3)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>

  <!-- Mid Layer Coins -->
  <g transform="translate(10, 20)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6 C 16 10 0 10 0 6 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4" fill="url(#goldFace3)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>
  <g transform="translate(26, 19)">
    <path d="M 0 4 C 0 8 16 8 16 4 L 16 6 C 16 10 0 10 0 6 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="8" cy="4" rx="8" ry="4" fill="url(#goldFace3)" stroke="#ffe58f" stroke-width="0.6"/>
  </g>

  <!-- Top Crown Coin -->
  <g transform="translate(17, 12)">
    <path d="M 0 4 C 0 8 18 8 18 4 L 18 6.5 C 18 10.5 0 10.5 0 6.5 Z" fill="url(#goldEdge3)"/>
    <ellipse cx="9" cy="4" rx="9" ry="4.5" fill="url(#goldFace3)" stroke="#ffffff" stroke-width="0.9"/>
    <ellipse cx="9" cy="4" rx="6.5" ry="3" fill="none" stroke="#ad6800" stroke-width="0.7"/>
    <rect x="7.5" y="2.8" width="3" height="2.4" fill="#613400"/>
  </g>

  <!-- Starburst Glints -->
  <polygon points="26,6 28,10 32,12 28,14 26,18 24,14 20,12 24,10" fill="#ffffff" opacity="0.95"/>
  <circle cx="26" cy="12" r="1.5" fill="#ffffff"/>
  <polygon points="12,18 13.5,19.5 12,21 10.5,19.5" fill="#ffffff" opacity="0.9"/>
  <polygon points="39,20 40.5,21.5 39,23 37.5,21.5" fill="#ffffff" opacity="0.9"/>
</svg>
`;

// 4. Isometric Peach Blossom Tree (桃花树 - 落霞岛标志建筑/植物)
const svgTreePeach = `
<svg width="220" height="260" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="treeShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#2a1810"/>
      <stop offset="40%" stop-color="#4a2c1d"/>
      <stop offset="80%" stop-color="#6e422c"/>
      <stop offset="100%" stop-color="#2a1810"/>
    </linearGradient>
    <radialGradient id="blossom1" cx="40%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff0f6"/>
      <stop offset="45%" stop-color="#ffadd2"/>
      <stop offset="85%" stop-color="#eb2f96"/>
      <stop offset="100%" stop-color="#780650"/>
    </radialGradient>
    <radialGradient id="blossom2" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#ff85c0"/>
      <stop offset="80%" stop-color="#c41d7f"/>
      <stop offset="100%" stop-color="#53033c"/>
    </radialGradient>
  </defs>

  <!-- Ground Soft Shadow -->
  <ellipse cx="110" cy="242" rx="75" ry="16" fill="url(#treeShadow)"/>

  <!-- Roots & Trunk Base -->
  <path d="M 98 244 Q 92 246 80 248 Q 95 244 100 236 L 104 180 Q 90 150 82 135 Q 92 142 106 165 L 112 180 Q 120 155 138 128 Q 132 142 120 168 L 118 236 Q 128 244 142 247 Q 130 245 120 243 Z" fill="url(#trunkGrad)"/>
  
  <!-- Main Gnarled Branches -->
  <path d="M 106 170 Q 75 140 60 115 Q 70 118 90 135 Z" fill="#3d2216"/>
  <path d="M 116 165 Q 148 135 168 118 Q 155 125 125 145 Z" fill="#3d2216"/>
  <path d="M 110 150 Q 105 110 112 85 Q 115 105 118 130 Z" fill="#4a2c1d"/>

  <!-- Peach Blossom Canopy Layers -->
  <!-- Back / Lower Canopy Puffs -->
  <circle cx="68" cy="118" r="32" fill="url(#blossom1)"/>
  <circle cx="152" cy="118" r="34" fill="url(#blossom1)"/>
  <circle cx="110" cy="85" r="38" fill="url(#blossom1)"/>

  <!-- Mid Canopy Puffs -->
  <circle cx="85" cy="100" r="36" fill="url(#blossom2)"/>
  <circle cx="135" cy="98" r="36" fill="url(#blossom2)"/>
  <circle cx="108" cy="68" r="34" fill="url(#blossom2)"/>

  <!-- Foreground Crisp Highlight Puffs -->
  <circle cx="95" cy="85" r="28" fill="url(#blossom2)"/>
  <circle cx="125" cy="82" r="28" fill="url(#blossom2)"/>
  <circle cx="110" cy="52" r="24" fill="#fff0f6" opacity="0.95"/>

  <!-- Petals Floating / Fallen -->
  <circle cx="65" cy="235" r="2.5" fill="#ffadd2"/>
  <circle cx="75" cy="242" r="2" fill="#eb2f96"/>
  <circle cx="138" cy="238" r="2.5" fill="#ffadd2"/>
  <circle cx="150" cy="244" r="2" fill="#eb2f96"/>
  <circle cx="88" cy="180" r="2.2" fill="#ff85c0"/>
  <circle cx="135" cy="175" r="2.5" fill="#ff85c0"/>
</svg>
`;

// 5. Isometric Weeping Willow Tree (垂柳 - 中州旷野)
const svgTreeWillow = `
<svg width="220" height="260" viewBox="0 0 220 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="willowShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="willowTrunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1f1610"/>
      <stop offset="45%" stop-color="#3e2a1e"/>
      <stop offset="100%" stop-color="#1f1610"/>
    </linearGradient>
    <radialGradient id="willowFoliage" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#d9f7be"/>
      <stop offset="40%" stop-color="#73d13d"/>
      <stop offset="75%" stop-color="#389e0d"/>
      <stop offset="100%" stop-color="#135200"/>
    </radialGradient>
  </defs>

  <!-- Ground Shadow -->
  <ellipse cx="110" cy="244" rx="80" ry="16" fill="url(#willowShadow)"/>

  <!-- Roots & Trunk -->
  <path d="M 100 244 Q 90 248 76 248 Q 94 244 102 235 L 105 170 Q 95 145 78 125 Q 92 135 107 155 L 112 170 Q 122 145 145 120 Q 135 138 120 158 L 118 235 Q 128 244 144 248 Q 130 245 118 244 Z" fill="url(#willowTrunk)"/>

  <!-- Dome Canopy -->
  <circle cx="110" cy="80" r="46" fill="url(#willowFoliage)"/>
  <circle cx="75" cy="95" r="38" fill="url(#willowFoliage)"/>
  <circle cx="145" cy="95" r="38" fill="url(#willowFoliage)"/>

  <!-- Cascading Willow Vines (Hanging strands) -->
  <path d="M 55 105 Q 48 150 52 195 Q 56 160 62 115 Z" fill="#52c41a" opacity="0.95"/>
  <path d="M 70 110 Q 64 165 68 215 Q 74 170 78 120 Z" fill="#73d13d" opacity="0.95"/>
  <path d="M 88 115 Q 84 175 86 225 Q 92 180 95 125 Z" fill="#95de64" opacity="0.95"/>
  <path d="M 105 120 Q 102 180 104 230 Q 108 185 112 125 Z" fill="#73d13d" opacity="0.95"/>
  <path d="M 125 115 Q 128 175 126 225 Q 122 180 118 125 Z" fill="#95de64" opacity="0.95"/>
  <path d="M 145 110 Q 152 165 148 215 Q 142 170 138 120 Z" fill="#73d13d" opacity="0.95"/>
  <path d="M 165 105 Q 174 150 170 195 Q 164 160 158 115 Z" fill="#52c41a" opacity="0.95"/>
</svg>
`;

// 6. Isometric Pine Tree (苍松 - 热砂荒漠绿洲 / 苍月极地)
const svgTreePine = `
<svg width="200" height="260" viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pineShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="pineTrunk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1f1610"/>
      <stop offset="50%" stop-color="#3d2a1c"/>
      <stop offset="100%" stop-color="#1f1610"/>
    </linearGradient>
    <linearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5b8c00"/>
      <stop offset="50%" stop-color="#237804"/>
      <stop offset="100%" stop-color="#092b00"/>
    </linearGradient>
  </defs>

  <ellipse cx="100" cy="245" rx="65" ry="14" fill="url(#pineShadow)"/>
  <!-- Trunk -->
  <path d="M 92 245 L 94 150 L 106 150 L 108 245 Z" fill="url(#pineTrunk)"/>

  <!-- Tier 1 (Bottom Tier) -->
  <polygon points="100,120 40,175 75,170 50,195 100,175 150,195 125,170 160,175" fill="url(#needleGrad)"/>

  <!-- Tier 2 (Middle Tier) -->
  <polygon points="100,80 50,135 80,130 65,150 100,135 135,150 120,130 150,135" fill="url(#needleGrad)"/>

  <!-- Tier 3 (Top Tier) -->
  <polygon points="100,35 65,90 85,85 75,100 100,88 125,100 115,85 135,90" fill="url(#needleGrad)"/>

  <!-- Tip -->
  <polygon points="100,15 85,50 115,50" fill="#7cb305"/>
</svg>
`;

// 7. Isometric Mossy Boulder / Rock (山石 / 顽石)
const svgRock = `
<svg width="140" height="95" viewBox="0 0 140 95" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="rockShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rockLit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d9d9d9"/>
      <stop offset="50%" stop-color="#8c8c8c"/>
      <stop offset="100%" stop-color="#434343"/>
    </linearGradient>
    <linearGradient id="rockDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#595959"/>
      <stop offset="100%" stop-color="#1f1f1f"/>
    </linearGradient>
  </defs>

  <ellipse cx="70" cy="78" rx="55" ry="14" fill="url(#rockShadow)"/>

  <!-- Back/Left Dark Facet -->
  <polygon points="20,70 45,35 75,30 65,75 25,75" fill="url(#rockDark)"/>

  <!-- Top Lit Facet -->
  <polygon points="45,35 75,30 105,40 85,55 58,52" fill="url(#rockLit)"/>

  <!-- Front Right Shaded Facet -->
  <polygon points="75,30 105,40 120,68 85,80 65,75 85,55" fill="#434343"/>

  <!-- Front Left Lit Facet -->
  <polygon points="45,35 58,52 85,55 65,75 25,75 20,70" fill="#595959"/>

  <!-- Moss Clumps -->
  <path d="M 55 45 Q 65 38 75 42 Q 70 50 60 50 Z" fill="#389e0d" opacity="0.85"/>
  <circle cx="80" cy="55" r="4.5" fill="#52c41a" opacity="0.8"/>
  <circle cx="88" cy="58" r="3.5" fill="#237804" opacity="0.8"/>
</svg>
`;

// 8. Isometric Wooden Fence (原木栅栏)
const svgFence = `
<svg width="150" height="85" viewBox="0 0 150 85" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="fenceShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="woodPost" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3e2a1e"/>
      <stop offset="50%" stop-color="#614431"/>
      <stop offset="100%" stop-color="#2a1810"/>
    </linearGradient>
    <linearGradient id="woodRail" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a573e"/>
      <stop offset="100%" stop-color="#3e2a1e"/>
    </linearGradient>
  </defs>

  <ellipse cx="75" cy="74" rx="65" ry="8" fill="url(#fenceShadow)"/>

  <!-- Left Post -->
  <rect x="25" y="32" width="12" height="42" rx="2" fill="url(#woodPost)"/>
  <polygon points="25,32 31,24 37,32" fill="#7a573e"/>

  <!-- Center Post -->
  <rect x="70" y="28" width="12" height="46" rx="2" fill="url(#woodPost)"/>
  <polygon points="70,28 76,20 82,28" fill="#7a573e"/>

  <!-- Right Post -->
  <rect x="115" y="24" width="12" height="50" rx="2" fill="url(#woodPost)"/>
  <polygon points="115,24 121,16 127,24" fill="#7a573e"/>

  <!-- Top Horizontal Cross Rail -->
  <polygon points="18,40 135,32 135,40 18,48" fill="url(#woodRail)" stroke="#2a1810" stroke-width="0.8"/>

  <!-- Bottom Horizontal Cross Rail -->
  <polygon points="18,56 135,48 135,56 18,64" fill="url(#woodRail)" stroke="#2a1810" stroke-width="0.8"/>

  <!-- Hemp Rope Bindings -->
  <rect x="29" y="42" width="4" height="4" fill="#d4b106"/>
  <rect x="74" y="38" width="4" height="4" fill="#d4b106"/>
  <rect x="119" y="34" width="4" height="4" fill="#d4b106"/>
</svg>
`;

// 9. Isometric Ancient Stone Lantern (石灯笼 / 古石碣)
const svgLantern = `
<svg width="80" height="150" viewBox="0 0 80 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="lanternShadow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffe58f"/>
      <stop offset="40%" stop-color="#fa8c16" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#fa8c16" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="stoneGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#595959"/>
      <stop offset="50%" stop-color="#8c8c8c"/>
      <stop offset="100%" stop-color="#434343"/>
    </linearGradient>
  </defs>

  <ellipse cx="40" cy="140" rx="32" ry="9" fill="url(#lanternShadow)"/>

  <!-- Pedestal Base -->
  <polygon points="16,140 64,140 58,128 22,128" fill="url(#stoneGrad)"/>
  <rect x="32" y="95" width="16" height="33" fill="url(#stoneGrad)"/>

  <!-- Mid Platform -->
  <polygon points="20,95 60,95 54,88 26,88" fill="url(#stoneGrad)"/>

  <!-- Fire Chamber (Inner Glow) -->
  <circle cx="40" cy="74" r="16" fill="url(#fireGlow)"/>
  <circle cx="40" cy="74" r="6" fill="#fffbe6"/>

  <!-- Stone Pillars around chamber -->
  <rect x="25" y="62" width="6" height="26" fill="#434343"/>
  <rect x="49" y="62" width="6" height="26" fill="#434343"/>

  <!-- Pagoda Roof / Eaves -->
  <polygon points="10,62 70,62 60,45 20,45" fill="url(#stoneGrad)"/>
  <!-- Curved roof corners -->
  <path d="M 10 62 Q 8 58 14 56 L 66 56 Q 72 58 70 62 Z" fill="#8c8c8c"/>

  <!-- Jewel Finial on Top -->
  <circle cx="40" cy="40" r="7" fill="url(#stoneGrad)"/>
  <polygon points="40,28 36,36 44,36" fill="#d9d9d9"/>
</svg>
`;

async function main() {
  console.log('Rendering authentic Woool gold coins and decor sprites...');
  
  // Render Coins
  await sharp(Buffer.from(svgCoin1)).png().toFile(path.join(outItems, 'gold_coin_1.png'));
  await sharp(Buffer.from(svgCoin2)).png().toFile(path.join(outItems, 'gold_coin_2.png'));
  await sharp(Buffer.from(svgCoin3)).png().toFile(path.join(outItems, 'gold_coin_3.png'));

  // Also write to dist/assets/woool/items if dist exists
  const distItems = path.resolve('dist/assets/woool/items');
  if (fs.existsSync(distItems)) {
    await sharp(Buffer.from(svgCoin1)).png().toFile(path.join(distItems, 'gold_coin_1.png'));
    await sharp(Buffer.from(svgCoin2)).png().toFile(path.join(distItems, 'gold_coin_2.png'));
    await sharp(Buffer.from(svgCoin3)).png().toFile(path.join(distItems, 'gold_coin_3.png'));
  }

  // Render Decor
  await sharp(Buffer.from(svgTreePeach)).png().toFile(path.join(outMaps, 'tree_peach.png'));
  await sharp(Buffer.from(svgTreeWillow)).png().toFile(path.join(outMaps, 'tree_willow.png'));
  await sharp(Buffer.from(svgTreePine)).png().toFile(path.join(outMaps, 'tree_pine.png'));
  await sharp(Buffer.from(svgRock)).png().toFile(path.join(outMaps, 'rock_boulder.png'));
  await sharp(Buffer.from(svgFence)).png().toFile(path.join(outMaps, 'wood_fence.png'));
  await sharp(Buffer.from(svgLantern)).png().toFile(path.join(outMaps, 'stone_lantern.png'));

  const distMaps = path.resolve('dist/assets/woool/maps');
  if (fs.existsSync(distMaps)) {
    await sharp(Buffer.from(svgTreePeach)).png().toFile(path.join(distMaps, 'tree_peach.png'));
    await sharp(Buffer.from(svgTreeWillow)).png().toFile(path.join(distMaps, 'tree_willow.png'));
    await sharp(Buffer.from(svgTreePine)).png().toFile(path.join(distMaps, 'tree_pine.png'));
    await sharp(Buffer.from(svgRock)).png().toFile(path.join(distMaps, 'rock_boulder.png'));
    await sharp(Buffer.from(svgFence)).png().toFile(path.join(distMaps, 'wood_fence.png'));
    await sharp(Buffer.from(svgLantern)).png().toFile(path.join(distMaps, 'stone_lantern.png'));
  }

  console.log('Successfully created all gold coins and modular decor sprites!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
