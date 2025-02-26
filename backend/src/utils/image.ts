import { createCanvas, loadImage, registerFont } from 'canvas';
import sharp from 'sharp';
import path from 'path';

export const generateCertificateImage = async (
  templateImagePath: string,
  name: string,
  issueDate: string
) => {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  const templateImage = await loadImage(templateImagePath);
  ctx.drawImage(templateImage, 0, 0);

  registerFont(path.join(__dirname, '../public/fonts/arial-regular-font/arial-regular-font'), {
    family: 'Arial',
  });
  ctx.fillStyle = 'black';
  ctx.font = '24px Arial';

  ctx.fillText(name, 100, 100);
  ctx.fillText(issueDate, 100, 150);

  const buffer = canvas.toBuffer('image/png');
  const filename = `cert-${Date.now()}.png`;
  const filepath = path.join(__dirname, '../public/certifications', filename);
  await sharp(buffer).toFile(filepath);

  return `/certifications/${filename}`;
};