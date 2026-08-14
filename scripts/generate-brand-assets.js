const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public', 'nzulogo.jpg');
const iconOut = path.join(root, 'app', 'icon.png');
const faviconOut = path.join(root, 'app', 'favicon.ico');

async function ensureExists(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing file: ${file}`);
  }
}

async function main() {
  await ensureExists(source);

  const img = sharp(source);
  const metadata = await img.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read source image dimensions');
  }

  await sharp(source)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(iconOut);

  await sharp(source)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(faviconOut.replace(/\.ico$/, '.png'));

  const faviconPng = sharp(faviconOut.replace(/\.ico$/, '.png'));
  await faviconPng.ico().toFile(faviconOut);

  fs.unlinkSync(faviconOut.replace(/\.ico$/, '.png'));

  console.log(`Generated ${iconOut} and ${faviconOut}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
