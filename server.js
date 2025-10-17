// ===============================
// server.js - Reddit Vibe Analyzer
// ===============================

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
app.use(helmet());


// Load .env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const USER_AGENT =
  process.env.REDDIT_USER_AGENT || "vibe-analyzer/0.1 by yourusername";

// ===============================
// 1. Middleware
// ===============================
app.use(cors());              // Allow cross-origin (useful during local dev)
app.use(morgan("dev"));       // Log all requests in terminal
app.use(express.static("./"));// Serve frontend files (index.html, app.js, etc.)

// ===============================
// 2. Helper: Get OAuth Token
// ===============================
async function getAppToken() {
  const auth = Buffer.from(
    `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
  ).toString("base64");

  const resp = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token error ${resp.status}: ${text}`);
  }

  return resp.json(); // { access_token, token_type, expires_in, ... }
}

// ===============================
// 3. API Routes
// ===============================

// ✅ Check token
app.get("/api/token", async (_req, res) => {
  try {
    const data = await getAppToken();
    res.json({ ok: true, expires_in: data.expires_in });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// 🔥 Get hot posts from a subreddit
app.get("/api/posts/:subreddit", async (req, res) => {
  try {
    const { access_token } = await getAppToken();
    const url = `https://oauth.reddit.com/r/${encodeURIComponent(
      req.params.subreddit
    )}/hot?limit=10`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": USER_AGENT,
      },
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Reddit posts error ${r.status}: ${text}`);
    }

    const json = await r.json();
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// 💬 Get comments for a given permalink
app.get("/api/comments", async (req, res) => {
  const permalink = req.query.permalink;
  if (!permalink) {
    return res.status(400).json({
      ok: false,
      error: "Missing ?permalink=/r/... path",
    });
  }

  try {
    const { access_token } = await getAppToken();
    const url = `https://oauth.reddit.com${permalink}.json?limit=100`;

    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": USER_AGENT,
      },
    });

    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Reddit comments error ${r.status}: ${text}`);
    }

    const json = await r.json();
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// ===============================
// 4. Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
