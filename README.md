# Hollywood Time (`hollywoodtime.com`)

An authoritative, high-performance entertainment news publication platform rebranded from **The Hollywood Reporter**, built with **Astro**, **Tailwind CSS**, and **Cloudflare Pages / Workers**.

Includes an automated **4-source news ingestion & AI rewriter pipeline**, strict **3 latest posts per category** presentation, **Google News Schema (`NewsArticle` JSON-LD)**, dynamic **Google News XML Sitemap**, and instant **Google Indexing API / Google Search Console** auto-submission.

---

## 🌟 Key Features

1. **Hollywood Reporter Rebranding & Design:**
   - Iconic editorial typography ("Playfair Display", "Cinzel", "Inter").
   - Red accent badges (`EXCLUSIVE`, `BREAKING`, `BOX OFFICE`, `AWARDS RACE`).
   - Los Angeles edition header bar with real-time news ticker.
   - Lead story spotlight + numbered breaking stories sidebar.
   - **Strict 3 Posts Per Category Constraint:** Every department (Movies, TV, Music, Awards, Business, Style, Culture) strictly highlights its latest 3 stories.

2. **Automated Multi-Source Feed Pipeline:**
   - Ingests from 4 premier sources:
     - **The Hollywood Reporter:** `https://www.hollywoodreporter.com/feed/` & category feeds.
     - **LAist:** `https://laist.com/news-sitemap-content.xml` (Culture & Arts).
     - **NDTV:** `https://feeds.feedburner.com/ndtvnews-entertainment`.
     - **Hindustan Times:** `https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml`.
   - Automatic deduplication & entertainment keyword relevance filter.
   - Journalistic AI Rewriter (Google Gemini API or built-in AP-style rule engine).

3. **Google News SEO & Instant Search Console Indexing:**
   - Standard Schema.org `NewsArticle` JSON-LD embedded on every article.
   - Dynamic Google News Sitemap at `/sitemap-news.xml`.
   - Dynamic Standard Sitemap at `/sitemap.xml`.
   - Standard `/robots.txt` allowing `Googlebot` & `Googlebot-News`.
   - Instant submission to Google Indexing API (`URL_UPDATED`) upon story creation.

4. **Operations Hub (`/admin`):**
   - Live feed monitor status.
   - One-click `⚡ Sync & Auto-Rewrite Now` trigger.
   - Real-time audit logs of submitted URLs with HTTP status codes and timestamps.
   - Direct manual URL submission testing tool.

---

## 🚀 Running Locally

```bash
cd /Users/aksingh/.gemini/antigravity/scratch/hollywood-time
npm run dev
```

Visit:
- **Homepage:** [http://localhost:4321/](http://localhost:4321/)
- **Control Hub:** [http://localhost:4321/admin](http://localhost:4321/admin)
- **Google News Sitemap:** [http://localhost:4321/sitemap-news.xml](http://localhost:4321/sitemap-news.xml)
- **RSS Feed:** [http://localhost:4321/feed.xml](http://localhost:4321/feed.xml)

---

## ☁️ Deploying to Cloudflare (Cloudflare Pages)

### Method 1: Git Integration (Recommended)
1. Push this repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select this repo and configure build settings:
   - **Framework preset:** `Astro`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Set Environment Variables in Cloudflare Pages:
   - `SITE_URL`: `https://www.hollywoodtime.com`
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API Key for AI rewriting.
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: *(Optional)* Service account JSON for direct Indexing API.
5. Click **Save and Deploy**.

### Method 2: Direct Wrangler CLI Deployment
```bash
npx wrangler pages deploy dist --project-name hollywoodtime
```

---

## ⚡ Google Search Console & Indexing API Setup

To enable direct instant indexing into Google Search:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Web Search Indexing API**.
3. Create a **Service Account** and download its JSON key.
4. Go to [Google Search Console](https://search.google.com/search-console).
5. Add your domain property (`https://www.hollywoodtime.com`).
6. Go to **Settings > Users and permissions > Add user**.
7. Enter the Service Account email address and set permission to **Owner**.
8. Paste the Service Account JSON into the `/admin` dashboard or set it as `GOOGLE_SERVICE_ACCOUNT_JSON` in your Cloudflare environment variables.

---

## ⏰ Automated Ingestion Cron Setup

To run automated news ingestion every 15 minutes:

### Option A: Cloudflare Workers Cron Trigger
Add to `wrangler.toml`:
```toml
[triggers]
crons = ["*/15 * * * *"]
```

### Option B: Free External Cron (Cron-job.org / GitHub Actions)
Ping the endpoint via HTTP POST every 10–15 minutes:
```bash
curl -X POST https://www.hollywoodtime.com/api/sync
```
