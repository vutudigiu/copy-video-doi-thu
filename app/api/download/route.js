import { readDownloadToken } from "../../../lib/facebook";

export const maxDuration = 60;

export async function GET(request) {
  const url = new URL(request.url);
  const videoUrl = readDownloadToken(url.searchParams.get("token"));
  if (!videoUrl) return new Response("Liên kết tải không hợp lệ hoặc đã hết hạn.", { status: 401 });
  const headers = { "user-agent": "Mozilla/5.0", accept: "video/mp4,video/*" };
  const range = request.headers.get("range");
  if (range) headers.range = range;
  const video = await fetch(videoUrl, { headers, cache: "no-store" });
  if (!video.ok || !video.body) return new Response("Không thể tải video.", { status: 502 });
  const responseHeaders = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = video.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }
  const inline = url.searchParams.get("inline") === "1";
  responseHeaders.set("content-disposition", `${inline ? "inline" : "attachment"}; filename="facebook-reel.mp4"`);
  responseHeaders.set("cache-control", "private, max-age=300");
  return new Response(video.body, { status: video.status, headers: responseHeaders });
}
