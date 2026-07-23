import { NextResponse } from "next/server";

export const runtime = "edge";

function decodeEntities(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("\\u0025", "%")
    .replaceAll("\\/", "/");
}

function findMeta(html, property) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]);
  }
  return "";
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!/^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i.test(url || "")) {
      return NextResponse.json({ error: "Vui lòng nhập một đường link Facebook hợp lệ." }, { status: 400 });
    }

    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Version/17.2 Mobile/15E148 Safari/604.1",
        "accept-language": "vi-VN,vi;q=0.9,en;q=0.8",
      },
    });
    const html = await response.text();
    const videoUrl = findMeta(html, "og:video") || findMeta(html, "og:video:url") || findMeta(html, "og:video:secure_url");
    const description = findMeta(html, "og:description");
    const title = findMeta(html, "og:title");
    const image = findMeta(html, "og:image");

    if (!videoUrl) {
      return NextResponse.json({
        status: "blocked",
        title: title || "Facebook Reel",
        message: "Facebook đang yêu cầu đăng nhập hoặc giới hạn quyền truy cập video này.",
        sourceUrl: url,
      });
    }

    return NextResponse.json({
      status: "ready",
      title: title || "Facebook Reel",
      description,
      image,
      videoUrl,
      sourceUrl: response.url,
    });
  } catch {
    return NextResponse.json({
      status: "blocked",
      message: "Chưa thể đọc video từ Facebook. Hãy kiểm tra quyền công khai của Reel.",
    });
  }
}
