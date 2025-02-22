import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, '../client/public/favicon.png');

// Create a simple icon with BSA text
sharp({
  create: {
    width: 32,
    height: 32,
    channels: 4,
    background: { r: 0, g: 82, b: 204, alpha: 1 } // Primary blue color
  }
})
.composite([{
  input: {
    text: {
      text: 'BSA',
      font: 'sans-serif',
      fontSize: 16,
      rgba: true
    }
  },
  blend: 'over',
  top: 8,
  left: 4
}])
.png()
.toFile(outputPath)
.then(() => console.log('Icon generated successfully'))
.catch(err => console.error('Error generating icon:', err));
