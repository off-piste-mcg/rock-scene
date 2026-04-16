#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import sharp from 'sharp';
import { encodeToKTX2 } from 'ktx2-encoder';

const textureDir = join(process.cwd(), 'public/textures');
const pngs = readdirSync(textureDir).filter(f => f.endsWith('.png'));

// Custom image decoder using sharp (required for Node.js)
const imageDecoder = async (buffer) => {
  const img = sharp(buffer);
  const { width, height } = await img.metadata();
  const data = await img.ensureAlpha().raw().toBuffer();
  return { width, height, data: new Uint8Array(data) };
};

for (const png of pngs) {
  const name = basename(png, '.png');
  const inputPath = join(textureDir, png);
  const outputPath = join(textureDir, `${name}.ktx2`);

  console.log(`Converting ${png}...`);

  try {
    const inputBuffer = readFileSync(inputPath);

    const ktx2Data = await encodeToKTX2(inputBuffer, {
      imageDecoder,
      srgb: true,
      mipmaps: true,
      uastc: true,
      uastcLevel: 3,
      yFlip: false,
    });

    writeFileSync(outputPath, Buffer.from(ktx2Data));
    const reduction = ((1 - ktx2Data.byteLength / inputBuffer.length) * 100).toFixed(0);
    console.log(`  ✓ ${name}.ktx2 (${(ktx2Data.byteLength / 1024).toFixed(0)} KB, -${reduction}%)`);
  } catch (err) {
    console.log(`  ✗ ${err.stack || err}`);
  }
}

console.log('\nDone!');
