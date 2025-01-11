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
const projectRoot = process.cwd();
log(`Project root: ${projectRoot}`);

const publicPath = path.resolve(projectRoot, 'public');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  log(`Created public directory at ${publicPath}`);
}

// Copy the headshot image to public directory if it doesn't exist
const sourceImage = path.resolve(projectRoot, '..', 'attached_assets', 'Professional Headshot Rodolfo compressed.jpg');
const targetImage = path.resolve(publicPath, 'rodolfo-headshot.jpg');

try {
  if (fs.existsSync(sourceImage)) {
    fs.copyFileSync(sourceImage, targetImage);
    log(`Copied headshot image from ${sourceImage} to ${targetImage}`);
  } else {
    log(`Source image not found at ${sourceImage}`);
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

  // Log all relevant environment variables for debugging
  log('Environment variables:');
  log(`REPL_ID: ${process.env.REPL_ID || 'not set'}`);
  log(`REPL_SLUG: ${process.env.REPL_SLUG || 'not set'}`);
  log(`REPL_OWNER: ${process.env.REPL_OWNER || 'not set'}`);

  // Get the Replit deployment URL
  const replId = process.env.REPL_ID;
  const replSlug = process.env.REPL_SLUG;
  const replOwner = process.env.REPL_OWNER;

  if (replSlug && replOwner) {
    // Use slug-based URL if available
    const baseUrl = `https://${replSlug}.${replOwner}.repl.co`;
    log(`Replit deployment URL (slug-based): ${baseUrl}`);
    log(`Image URL (slug-based): ${baseUrl}/static/rodolfo-headshot.jpg`);
  } else if (replId) {
    // Fallback to ID-based URL
    const baseUrl = `https://${replId}.id.repl.co`;
    log(`Replit deployment URL (ID-based): ${baseUrl}`);
    log(`Image URL (ID-based): ${baseUrl}/static/rodolfo-headshot.jpg`);
  } else {
    log('Not running on Replit - image will be served locally at http://localhost:3000/static/rodolfo-headshot.jpg');
  }
}).on('error', (error: any) => {
  log(`Server error: ${error.message}`);
  process.exit(1);
});