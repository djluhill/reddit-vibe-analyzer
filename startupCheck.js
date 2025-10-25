// startupCheck.js
import dotenv from 'dotenv';
import fetch from 'node-fetch';

console.log('[StartupCheck] Booting…');
dotenv.config();

// 1) Presence check
const requiredVars = [
  'REDDIT_CLIENT_ID',
  // SECRET can be blank for installed apps; don't fail presence if it's empty
  'REDDIT_USER_AGENT',
  'REDDIT_REDIRECT_URI',
];

let allGood = true;
for (const k of requiredVars) {
  const v = process.env[k];
  if (v === undefined || String(v).trim() === '') {
    console.error(`[StartupCheck] ❌ Missing ${k}`);
    allGood = false;
  } else {
    console.log(`[StartupCheck] ✅ ${k} = ${k === 'REDDIT_CLIENT_SECRET' ? '*** (hidden)' : v}`);
  }
}
if (process.env.REDDIT_CLIENT_SECRET !== undefined) {
  console.log('[StartupCheck] (info) REDDIT_CLIENT_SECRET is set (hidden).');
} else {
  console.log('[StartupCheck] (info) REDDIT_CLIENT_SECRET is undefined (that is OK if your app is "installed").');
}
if (!allGood) {
  console.error('[StartupCheck] 🚨 Fix your .env and restart.');
  process.exit(1);
}

async function tryToken({ clientId, clientSecret, label }) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const resp = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': process.env.REDDIT_USER_AGENT,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: resp.ok, status: resp.status, body: json, label };
}

(async () => {
  const clientId = (process.env.REDDIT_CLIENT_ID || '').trim();
  const secretFromEnv = process.env.REDDIT_CLIENT_SECRET;
  const secret =
    secretFromEnv === undefined ? '' : String(secretFromEnv).trim();

  console.log('[StartupCheck] 🔐 Validating Reddit credentials…');

  // Try confidential (id + secret)
  const r1 = await tryToken({ clientId, clientSecret: secret, label: 'id+secret' });
  if (r1.ok) {
    console.log(`[StartupCheck] ✅ Auth OK as CONFIDENTIAL client (id+secret). Token expires in ${r1.body.expires_in}s`);
    console.log('[StartupCheck] ✅ Completed. Starting server…');
    return;
  }
  console.warn(`[StartupCheck] ⚠️ Confidential auth failed (${r1.status}).`, r1.body);

  // Try installed app (id + blank secret)
  const r2 = await tryToken({ clientId, clientSecret: '', label: 'installed (id only)' });
  if (r2.ok) {
    console.log(`[StartupCheck] ✅ Auth OK as INSTALLED app (blank secret). Token expires in ${r2.body.expires_in}s`);
    console.log('[StartupCheck] ✅ Completed. Starting server…');
    return;
  }
  console.error(`[StartupCheck] ❌ Installed-app auth failed (${r2.status}).`, r2.body);

  console.error('\n[StartupCheck] 🚨 Both auth modes failed.');
  console.error('• If your app is a **Web App** or **Script**, make sure REDDIT_CLIENT_SECRET is the exact value shown on reddit.com/prefs/apps.');
  console.error('• If your app is **Installed App**, set REDDIT_CLIENT_SECRET empty in .env.');
  console.error('• Re-copy client_id/secret (no quotes, no spaces).');
  console.error('• Ensure USER_AGENT includes your Reddit username.');
  process.exit(1);
})();
