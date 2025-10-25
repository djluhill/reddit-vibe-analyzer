// /js/api.js
// Networking + your backend calls
export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 12000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    console.log('[Vibe] Fetch →', url, options);
    const res = await fetch(url, { ...options, signal: ctl.signal });
    console.log('[Vibe] Fetch ←', res.status, res.statusText);
    return res;
  } finally { clearTimeout(t); }
}

export async function fetchSubredditPosts(subreddit, { limit=100, sort='hot', t='' } = {}) {
  const qs = new URLSearchParams({ limit: String(limit), sort });
  if (sort === 'top' && t) qs.set('t', t);
  const url = `/api/posts/${encodeURIComponent(subreddit)}?${qs.toString()}`;
  return fetchJsonWithTimeout(url, {}, 12000);
}
