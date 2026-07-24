import { NextResponse } from "next/server";
import { resolveFacebookReel } from "../../../lib/facebook";
import { transcribeVideo } from "../../../lib/openai-video";

export const maxDuration = 60;

function errorResponse(error) {
  const code = error?.message || "ANALYZE_FAILED";
  const messages = {
    INVALID_FACEBOOK_URL: "Vui lòng nhập một đường link Facebook hợp lệ.",
    FACEBOOK_BLOCKED: "Facebook không cung cấp video cho link này. Hãy đặt Reel ở chế độ công khai và dùng link Reel trực tiếp.",
    UNSAFE_VIDEO_HOST: "Nguồn video trả về không an toàn.",
    OPENAI_NOT_CONFIGURED: "Backend chưa được cấu hình khóa OpenAI API.",
    OPENAI_BILLING_REQUIRED: "Tài khoản OpenAI API chưa có số dư. Chủ website cần thêm credits trong mục Billing.",
    OPENAI_KEY_INVALID: "Khóa OpenAI API không hợp lệ hoặc đã bị thu hồi.",
    VIDEO_DOWNLOAD_FAILED: "Không thể tải dữ liệu video từ Facebook.",
    VIDEO_TOO_LARGE: "Video vượt quá giới hạn 24 MB. Hãy thử Reel ngắn hơn.",
    TRANSCRIPTION_FAILED: "Không thể nhận dạng lời thoại trong video.",
  };
  const status = code === "INVALID_FACEBOOK_URL" ? 400 : code === "OPENAI_NOT_CONFIGURED" ? 503 : 422;
  return NextResponse.json({ error: messages[code] || "Không thể lấy lời thoại từ video này.", code }, { status });
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    const reel = await resolveFacebookReel(url);
    const transcript = await transcribeVideo(reel.videoUrl);
    if (!transcript) throw new Error("TRANSCRIPTION_FAILED");
    return NextResponse.json({ status: "ready", title: reel.title, transcript });
  } catch (error) {
    console.error("Analyze failed", error?.message);
    return errorResponse(error);
  }
}
