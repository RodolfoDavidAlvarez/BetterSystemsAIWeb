/**
 * Better Systems AI Marketing Image Generator
 * Uses Gemini Nano Banana Pro for high-quality image generation
 *
 * Usage:
 *   node scripts/generate-marketing-images.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// API Key from Soil Seed protocols folder
const API_KEY = "AIzaSyATOgXFjiCP3YMWRxM5OmTVmIngeoylJa8";
const MODEL = "nano-banana-pro-preview";

const OUT_DIR = path.join(__dirname, "..", "client", "public", "marketing");

// Marketing images for Better Systems AI cold outreach
const IMAGES = [
  {
    filename: "hero-automation.png",
    prompt:
      "Sleek, modern abstract visualization of AI automation and workflow optimization. " +
      "Flowing lines connecting geometric nodes, gradient from deep blue to teal, " +
      "subtle circuit patterns, premium tech aesthetic, clean minimalist design, " +
      "dark background with glowing accent elements, no text, 16:9 aspect ratio, " +
      "professional SaaS marketing banner style.",
  },
  {
    filename: "dashboard-preview.png",
    prompt:
      "Ultra-clean modern dashboard interface mockup showing business analytics. " +
      "Dark mode UI with subtle gradients, charts and metrics visualization, " +
      "premium enterprise software aesthetic, glass-morphism cards, " +
      "blue and teal accent colors, professional SaaS product screenshot style, " +
      "no text visible, cinematic lighting, 16:9 aspect ratio.",
  },
  {
    filename: "team-productivity.png",
    prompt:
      "Abstract representation of team productivity and efficiency. " +
      "Interconnected nodes forming a network, ascending graph visualization, " +
      "warm gradient from orange to gold, modern geometric style, " +
      "clean corporate aesthetic, subtle glow effects, dark background, " +
      "no text, premium business presentation style.",
  },
  {
    filename: "ai-integration.png",
    prompt:
      "Futuristic visualization of AI systems integration and data flow. " +
      "Neural network patterns, flowing data streams, " +
      "gradient from purple to blue, premium tech visualization, " +
      "abstract geometric shapes, glowing connection points, " +
      "dark elegant background, no text, enterprise AI aesthetic.",
  },
  {
    filename: "time-savings.png",
    prompt:
      "Abstract clock or time visualization with efficiency theme. " +
      "Minimalist circular design, gradient from emerald green to teal, " +
      "flowing motion lines suggesting speed and optimization, " +
      "modern geometric style, dark background with subtle glow, " +
      "no text, premium business infographic style.",
  },
];

async function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function generateImage(prompt, filename) {
  console.log(`  Prompt: ${prompt.slice(0, 80)}...`);

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
  });

  const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${API_KEY}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
  };

  const response = await makeRequest(
    `https://${options.hostname}${options.path}`,
    options,
    requestBody
  );

  if (response.status !== 200) {
    throw new Error(
      `API error ${response.status}: ${JSON.stringify(response.data).slice(0, 500)}`
    );
  }

  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  const inline = parts.find((p) => p.inlineData?.data)?.inlineData;
  if (!inline?.data) {
    console.log("Response:", JSON.stringify(response.data, null, 2).slice(0, 1000));
    throw new Error("No image returned from model.");
  }

  const imageBuffer = Buffer.from(inline.data, "base64");
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, imageBuffer);
  return { outPath, mimeType: inline.mimeType, bytes: imageBuffer.length };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Better Systems AI Marketing Image Generator");
  console.log("============================================");
  console.log(`Model: ${MODEL}`);
  console.log(`Output: ${OUT_DIR}\n`);

  const results = [];

  for (const { filename, prompt } of IMAGES) {
    console.log(`\nGenerating ${filename}...`);
    try {
      const result = await generateImage(prompt, filename);
      console.log(`  ✓ Saved ${path.basename(result.outPath)} (${(result.bytes / 1024).toFixed(1)} KB)`);
      results.push({ filename, success: true, size: result.bytes });
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}`);
      results.push({ filename, success: false, error: err.message });
    }
    // Rate limiting - wait between requests
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("\n============================================");
  console.log("Summary:");
  results.forEach(r => {
    if (r.success) {
      console.log(`  ✓ ${r.filename} - ${(r.size / 1024).toFixed(1)} KB`);
    } else {
      console.log(`  ✗ ${r.filename} - FAILED`);
    }
  });
  console.log("\nDone. Images saved to:", OUT_DIR);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
