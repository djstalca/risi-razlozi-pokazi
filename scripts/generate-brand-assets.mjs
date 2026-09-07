import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const yellow = '#FFD447';
const dark = '#101114';
const panel = '#1B1E25';
const white = '#F8FAFC';
const blue = '#59A8FF';
const pink = '#FF77B7';

fs.mkdirSync('assets', { recursive: true });
fs.mkdirSync('store-assets', { recursive: true });

const iconSvg = (size = 1024) => `
<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${dark}"/>
  <circle cx="512" cy="512" r="360" fill="${panel}" stroke="${yellow}" stroke-width="36"/>
  <g transform="translate(212 298)">
    <rect x="0" y="0" width="180" height="180" rx="42" fill="${blue}"/>
    <path d="M48 54h84a24 24 0 0 1 24 24v34a24 24 0 0 1-24 24H92l-30 26 8-26H48a24 24 0 0 1-24-24V78a24 24 0 0 1 24-24z" fill="${dark}"/>
  </g>
  <g transform="translate(422 298)">
    <rect x="0" y="0" width="180" height="180" rx="42" fill="${yellow}"/>
    <path d="M48 128l18-52 62-62 34 34-62 62-52 18z" fill="${dark}"/>
    <path d="M124 18l18-18 34 34-18 18z" fill="${white}" opacity=".9"/>
  </g>
  <g transform="translate(632 298)">
    <rect x="0" y="0" width="180" height="180" rx="42" fill="${pink}"/>
    <g fill="${dark}">
      <rect x="48" y="50" width="24" height="72" rx="12"/>
      <rect x="78" y="34" width="24" height="88" rx="12"/>
      <rect x="108" y="46" width="24" height="76" rx="12"/>
      <path d="M46 110c0-18 14-32 32-32h44c18 0 32 14 32 32v10c0 34-26 60-60 60h-4c-26 0-44-12-54-34l-14-30c-5-11 1-24 13-27 9-2 18 2 23 10l9 16z"/>
    </g>
  </g>
  <text x="512" y="650" text-anchor="middle" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="900" letter-spacing="4">AKCIJA</text>
  <text x="512" y="724" text-anchor="middle" fill="${yellow}" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" letter-spacing="5">RIŠI · RAZLOŽI · POKAŽI</text>
</svg>`;

const foregroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(152 152)">
    <circle cx="360" cy="360" r="330" fill="${panel}" stroke="${yellow}" stroke-width="34"/>
    <text x="360" y="330" text-anchor="middle" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="210" font-weight="900">A</text>
    <g transform="translate(155 430)">
      <circle cx="45" cy="45" r="45" fill="${blue}"/>
      <circle cx="205" cy="45" r="45" fill="${yellow}"/>
      <circle cx="365" cy="45" r="45" fill="${pink}"/>
    </g>
  </g>
</svg>`;

const backgroundSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="${dark}"/></svg>`;

const splashSvg = (background, accent) => `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="${background}"/>
  <circle cx="1366" cy="1250" r="460" fill="${panel}" stroke="${accent}" stroke-width="54"/>
  <text x="1366" y="1315" text-anchor="middle" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="310" font-weight="900">AKCIJA</text>
  <text x="1366" y="1485" text-anchor="middle" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="82" font-weight="700" letter-spacing="7">RIŠI · RAZLOŽI · POKAŽI</text>
  <text x="1366" y="1610" text-anchor="middle" fill="${white}" opacity=".72" font-family="Arial, Helvetica, sans-serif" font-size="58">Slovenska družabna igra</text>
</svg>`;

const featureSvg = `
<svg width="1024" height="500" viewBox="0 0 1024 500" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="500" fill="${dark}"/>
  <circle cx="160" cy="250" r="112" fill="${panel}" stroke="${yellow}" stroke-width="14"/>
  <text x="160" y="284" text-anchor="middle" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="900">A</text>
  <text x="328" y="175" fill="${white}" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">RIŠI.</text>
  <text x="328" y="255" fill="${yellow}" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">RAZLOŽI.</text>
  <text x="328" y="335" fill="${pink}" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">POKAŽI.</text>
  <text x="330" y="405" fill="${white}" opacity=".82" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="600">Slovenska družabna igra za prijatelje in družino</text>
</svg>`;

await sharp(Buffer.from(iconSvg())).png().toFile('assets/icon-only.png');
await sharp(Buffer.from(foregroundSvg)).png().toFile('assets/icon-foreground.png');
await sharp(Buffer.from(backgroundSvg)).png().toFile('assets/icon-background.png');
await sharp(Buffer.from(splashSvg('#F7F3E8', yellow))).png().toFile('assets/splash.png');
await sharp(Buffer.from(splashSvg(dark, yellow))).png().toFile('assets/splash-dark.png');
await sharp(Buffer.from(iconSvg(512))).resize(512, 512).png().toFile('store-assets/icon-512.png');
await sharp(Buffer.from(featureSvg)).png().toFile('store-assets/feature-graphic-1024x500.png');

console.log('Brand assets generated: Android sources + Play Store icon/feature graphic.');
