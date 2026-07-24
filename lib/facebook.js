import crypto from "node:crypto";

const FACEBOOK_HOSTS = /(^|\.)facebook\.com$|(^|\.)fb\.watch$/i;
const VIDEO_HOSTS = /(^|\.)fbcdn\.net$|(^|\.)facebook\.com$/i;

export function isFacebookUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && FACEBOOK_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, number) => String.fromCodePoint(parseInt(number, 10)))
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function decodeFacebookUrl(value = "") {
  let result = decodeHtml(value);
  try {
    result = JSON.parse(`"${result.replaceAll('"', '\\"')}"`);
  } catch {
    result = result.replaceAll("\\/", "/").replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  return result;
}

function meta(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }
  return "";
}

function findVideoUrl(html) {
  const og = meta(html, "og:video:secure_url") || meta(html, "og:video:url") || meta(html, "og:video");
  if (og) return decodeFacebookUrl(og);
  for (const key of ["browser_native_hd_url", "playable_url_quality_hd", "browser_native_sd_url", "playable_url", "video_url"]) {
    const match = html.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"])*)"`, "i"));
    if (match?.[1]) return decodeFacebookUrl(match[1]);
  }
  return "";
}

export async function resolveFacebookReel(sourceUrl) {
  if (!isFacebookUrl(sourceUrl)) throw new Error("INVALID_FACEBOOK_URL");
  const response = await fetch(sourceUrl, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1",
      "accept-language": "vi-VN,vi;q=0.9,en;q=0.7",
      accept: "text/html,application/xhtml+xml",
    },
  });
  const html = await response.text();
  const videoUrl = findVideoUrl(html);
  if (!videoUrl) throw new Error("FACEBOOK_BLOCKED");
  const parsedVideo = new URL(videoUrl);
  if (parsedVideo.protocol !== "https:" || !VIDEO_HOSTS.test(parsedVideo.hostname)) throw new Error("UNSAFE_VIDEO_HOST");
  return {
    sourceUrl: response.url,
    videoUrl,
    title: meta(html, "og:title") || "Facebook Reel",
    description: meta(html, "og:description"),
    image: meta(html, "og:image"),
  };
}

function signingSecret() {
  const value = process.env.DOWNLOAD_SECRET || process.env.LICENSE_SECRET || process.env.SESSION_SECRET;
  if (!value) throw new Error("DOWNLOAD_SECRET_MISSING");
  return value;
}

export function createDownloadToken(videoUrl) {
  const payload = Buffer.from(JSON.stringify({ url: videoUrl, exp: Date.now() + 60 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readDownloadToken(token = "") {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const url = new URL(value.url);
    if (value.exp < Date.now() || url.protocol !== "https:" || !VIDEO_HOSTS.test(url.hostname)) return null;
    return value.url;
  } catch {
    return null;
  }
}
