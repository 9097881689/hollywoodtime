#!/usr/bin/env node

/**
 * Hollywood Time - Automated Background Publishing Engine
 * Similar to thedailyjob-cloudflare automated ingestion pipeline.
 *
 * Usage:
 *   node scripts/auto-poster.js --once
 *   node scripts/auto-poster.js --interval 15 (runs every 15 minutes)
 */

const TARGET_URL = process.env.SITE_URL
  ? `${process.env.SITE_URL.replace(/\/$/, '')}/api/sync`
  : 'http://localhost:4321/api/sync';

const API_SECRET = process.env.API_SECRET || 'hollywoodtime_secret_key_2026';

async function executeSync() {
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`[${timestamp}] 🎬 HOLLYWOOD TIME AUTO-POST RUNNER TRIGGERED`);
  console.log(`Target Endpoint: ${TARGET_URL}`);
  console.log(`======================================================`);

  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        geminiApiKey: process.env.GEMINI_API_KEY,
        serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Sync Completed Successfully!`);
      console.log(`📊 Stories Created: ${result.createdCount || 0}`);
      if (result.createdPosts && result.createdPosts.length > 0) {
        console.log(`\n📰 Published Stories:`);
        result.createdPosts.forEach((p, idx) => {
          console.log(`  ${idx + 1}. [${p.category}] ${p.title} -> /news/${p.slug} (${p.source})`);
        });
      }
      if (result.indexingSubmissions && result.indexingSubmissions.length > 0) {
        console.log(`\n🚀 Google Indexing Submissions:`);
        result.indexingSubmissions.forEach((idx) => {
          console.log(`  - ${idx.url}: ${idx.indexed ? '✅ SUBMITTED' : '⚠️ ' + idx.message}`);
        });
      }
    } else {
      console.error(`❌ Sync responded with error:`, result.error || result);
    }
  } catch (err) {
    console.error(`❌ Auto-poster network/execution error:`, err.message);
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const intervalIdx = args.indexOf('--interval');
const intervalMinutes = intervalIdx !== -1 && args[intervalIdx + 1] ? parseInt(args[intervalIdx + 1], 10) : 15;

if (isOnce) {
  executeSync().then(() => process.exit(0));
} else {
  console.log(`[Hollywood Time] Starting daemon loop every ${intervalMinutes} minutes.`);
  executeSync();
  setInterval(executeSync, intervalMinutes * 60 * 1000);
}
