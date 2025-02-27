import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import path from 'path';
import type { Placeholder } from './models';

export const generateCertificateImage = async (
  templateImageFilename: string,
  placeholders: Placeholder[],
  data: Record<string, string>
) => {
  const templateImagePath = path.join(__dirname, '../public/templates', templateImageFilename);
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  const templateImage = await loadImage(templateImagePath);
  ctx.drawImage(templateImage, 0, 0);

  registerFont(path.join(__dirname, '../public/fonts/arial-regular-font/arial-regular-font'), {
    family: 'Arial',
  });

  for (const placeholder of placeholders) {
    const text = data[placeholder.key];
    if (!text) {
      throw new Error(`Missing data for placeholder ${placeholder.key}`);
    }
    ctx.fillStyle = placeholder.fontColor;
    ctx.font = `${placeholder.fontStyle} ${placeholder.fontVariant} ${placeholder.fontsize}px ${placeholder.fontFamily}`;

    const textWidth = ctx.measureText(text).width;
    const textHeight = placeholder.fontsize;

    const x = placeholder.x + (placeholder.width - textWidth) / 2;
    const y = placeholder.y + (placeholder.height - textHeight) / 2 + textHeight;

    ctx.fillText(text, x, y);
  }

  const buffer = canvas.toBuffer('image/png');
  const filename = `cert-${Date.now()}.png`;
  const filepath = path.join(__dirname, '../public/certifications', filename);
  await sharp(buffer).toFile(filepath);

  return `/certifications/${filename}`;
};