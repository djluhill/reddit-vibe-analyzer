# Reddit Vibe Analyzer

Rule-based sentiment for Reddit posts—no ML, no external APIs for scoring. Paste text or fetch live subreddits (hot/new/top), then view results as a table (default), pie, bar, or bell-curve distribution. Tunable via a public dictionary (`data.js`).

## ✨ Features
- Analyze pasted text or live subreddit posts
- Sort: **hot / new / top** (with time window for **top**)
- Adjustable post limits (10 → 500)
- Visualizations: **Table (default)**, **Pie**, **Bar**, **Bell curve**
- Deterministic, offline sentiment dictionary (`data.js`)
- Basic hardening: Helmet, rate limit, CORS, morgan logs
- Startup self-check for Reddit OAuth credentials

## 📦 Tech
- Frontend: HTML + Bootstrap + Chart.js (no framework)
- Backend: Node.js + Express
- Auth: Reddit OAuth (client credentials)
- Dev tooling: nodemon

## 🛠️ Local Install & Run

```bash
# 1) Clone & install
git clone https://github.com/<you>/redvibeanalyzer.git
cd redvibeanalyzer
npm install

# 2) Prepare environment
cp .env.example .env
# Edit .env with your real values (see below)

# 3) Dev mode (auto-restart)
npm run dev

# 4) Open the app
# http://localhost:3000
