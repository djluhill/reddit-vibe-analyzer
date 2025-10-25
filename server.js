// ===============================
// server.js - Reddit Vibe Analyzer
// ===============================

import './startupCheck.js';
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Load .env variables ASAP
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const USER_AGENT =
  process.env.REDDIT_USER_AGENT || "vibe-analyzer/0.1 by yourusername";

// ===============================
// 1) Middleware
// ===============================
app.use(
  helmet({
    contentSecurityPolicy: false, // keep CDN scripts working; tighten later
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.static("./"));

// Global rate limit (adjust as needed)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Health
app.get("/health", (_req, res) => {
  res.json({ ok: true, port: PORT, ua: USER_AGENT });
});

// ===============================
// 2) OAuth Token (with tiny cache)
// ===============================
let cachedToken = null; // { access_token, expires_at }

async function getAppToken() {
  const now = Date.now();
  if (cachedToken && cachedToken.expires_at > now + 5000) {
    return { access_token: cachedToken.access_token };
  }

  const clientId = process.env.REDDIT_CLIENT_ID || "";
  const clientSecret =
    process.env.REDDIT_CLIENT_SECRET === undefined ? "" : process.env.REDDIT_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token error ${resp.status}: ${text}`);
  }

  const json = await resp.json(); // { access_token, expires_in, ... }
  cachedToken = {
    access_token: json.access_token,
    expires_at: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
    return { access_token: cachedToken.access_token };
}

// ===============================
// 3) Helpers
// ===============================

// Allow only letters, numbers, underscore (Reddit sub rules)
function sanitizeSubreddit(name) {
  return String(name || "").replace(/[^\w]/g, "");
}

// Permalink must start with /r/ and not be a full URL
function isValidPermalink(p) {
  return typeof p === "string" && p.startsWith("/r/") && !p.startsWith("http");
}

// Clamp helper
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

// ===============================
// 4) API Routes
// ===============================

// Token sanity
app.get("/api/token", async (_req, res) => {
  try {
    const { access_token } = await getAppToken();
    res.json({ ok: true, haveToken: Boolean(access_token) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// Posts: supports limit/sort/t (t only for top)
app.get("/api/posts/:subreddit", async (req, res) => {
  try {
    const subreddit = sanitizeSubreddit(req.params.subreddit);
    if (!subreddit) {
      return res.status(400).json({ ok: false, error: "Invalid subreddit" });
    }

    // Read & validate query params
    const rawLimit = parseInt(req.query.limit ?? "100", 10);
    const limit = clamp(isNaN(rawLimit) ? 100 : rawLimit, 1, 500);

    const allowedSorts = new Set(["hot", "new", "top"]);
    const sort = String(req.query.sort ?? "hot").toLowerCase();
    const finalSort = allowedSorts.has(sort) ? sort : "hot";

    const allowedT = new Set(["hour", "day", "week", "month", "year", "all"]);
    const t = String(req.query.t ?? "").toLowerCase();
    const topParam = finalSort === "top" && allowedT.has(t) ? `&t=${t}` : "";

    const { access_token } = await getAppToken();

    const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/${finalSort}?limit=${limit}${topParam}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "User-Agent": USER_AGENT,
      },
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("[RedditError posts]", r.status, text);
      throw new Error(`Reddit posts error ${r.status}: ${text}`);
    }

    const json = await r.json();
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

// Comments by permalink (optional: you can add limit here later too)
app.get("/api/comments", async (req, res) => {
  try {
    const permalink = req.query.permalink;
    if (!isValidPermalink(permalink)) {
      return res.status(400).json({
        ok: false,
        error: "Missing or invalid ?permalink=/r/... path",
      });
    }

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
      console.error("[RedditError comments]", r.status, text);
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
// 5) Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
