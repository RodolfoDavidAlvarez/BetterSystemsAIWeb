import express from "express";
import path from "path";
import fs from "fs";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

const app = express();

// Set up static file serving for public assets
const projectRoot = path.resolve(process.cwd(), '..');
log(`Project root: ${projectRoot}`);

const publicPath = path.resolve(projectRoot, 'server', 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  log(`Created public directory at ${publicPath}`);
}

// Copy the headshot image to public directory if it doesn't exist
const sourceImage = path.resolve(projectRoot, 'Professional Headshot Rodolfo compressed.jpg');
const targetImage = path.resolve(publicPath, 'rodolfo-headshot.jpg');

try {
  if (fs.existsSync(sourceImage)) {
    fs.copyFileSync(sourceImage, targetImage);
    log(`Copied headshot image from ${sourceImage} to ${targetImage}`);
  } else {
    log(`Source image not found at ${sourceImage}, trying alternative location...`);
    const altSourceImage = path.resolve(projectRoot, 'attached_assets', 'Professional Headshot Rodolfo compressed.jpg');
    if (fs.existsSync(altSourceImage)) {
      fs.copyFileSync(altSourceImage, targetImage);
      log(`Copied headshot image from ${altSourceImage} to ${targetImage}`);
    } else {
      log(`Image not found in either location: ${sourceImage} or ${altSourceImage}`);
    }
  }
} catch (error) {
  log(`Error copying image: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Configure static file serving with caching
app.use('/static', express.static(publicPath, {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

const port = parseInt(process.env.PORT || '3000', 10);

app.listen(port, '0.0.0.0', () => {
  log(`Server running on port ${port}`);
  if (process.env.REPLIT_SLUG) {
    const imageUrl = `https://${process.env.REPLIT_SLUG}.replit.dev/static/rodolfo-headshot.jpg`;
    log(`Replit deployment URL: https://${process.env.REPLIT_SLUG}.replit.dev`);
    log(`Image URL: ${imageUrl}`);
  }
}).on('error', (error: any) => {
  log(`Server error: ${error.message}`);
  process.exit(1);
});