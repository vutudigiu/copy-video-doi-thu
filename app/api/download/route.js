export const runtime = "edge";

export async function GET(request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !/^https?:\/\//i.test(url)) return new Response("Thiếu URL video", { status: 400 });
  try {
    const video = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!video.ok || !video.body) return new Response("Không thể tải video", { status: 502 });
    return new Response(video.body, {
      headers: {
        "content-type": video.headers.get("content-type") || "video/mp4",
        "content-disposition": 'attachment; filename="facebook-reel.mp4"',
        "cache-control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Facebook đã chặn yêu cầu tải video", { status: 502 });
  }
}
