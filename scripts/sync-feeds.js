/**
 * Hollywood Time - Automated Feed Sync & Ingestion Runner
 * Can be run locally, via crontab, or invoked as a webhook.
 */

async function runSync() {
  console.log('[Hollywood Time] Starting automated news ingestion...');
  const targetUrl = process.env.SYNC_ENDPOINT || 'http://localhost:4321/api/sync';

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        geminiApiKey: process.env.GEMINI_API_KEY,
        serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      }),
    });

    const data = await res.json();
    console.log('[Hollywood Time] Sync Result:', data);
  } catch (error) {
    console.error('[Hollywood Time] Sync failed:', error);
  }
}

runSync();
