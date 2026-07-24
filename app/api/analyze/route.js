import { NextResponse } from "next/server";
import { createDownloadToken, resolveFacebookReel } from "../../../lib/facebook";
import { createVideoPrompt, transcribeVideo } from "../../../lib/openai-video";

export const maxDuration = 60;

function errorResponse(error) {
  const code = error?.message || "ANALYZE_FAILED";
  const messages = {
    INVALID_FACEBOOK_URL: "Vui lòng nhập một đường link Facebook hợp lệ.",
    FACEBOOK_BLOCKED: "Facebook không cung cấp luồng video cho link này. Hãy đặt Reel ở chế độ công khai và dùng link Reel trực tiếp.",
    UNSAFE_VIDEO_HOST: "Nguồn video trả về không an toàn.",
    OPENAI_NOT_CONFIGURED: "Backend chưa được cấu hình khóa OpenAI API.",
    VIDEO_DOWNLOAD_FAILED: "Không thể tải dữ liệu video từ Facebook.",
    VIDEO_TOO_LARGE: "Video vượt quá giới hạn 24 MB. Hãy thử Reel ngắn hơn.",
    TRANSCRIPTION_FAILED: "Không thể nhận dạng lời thoại trong video.",
    PROMPT_GENERATION_FAILED: "Đã có transcript nhưng chưa thể tạo prompt AI.",
  };
  const status = code === "INVALID_FACEBOOK_URL" ? 400 : code === "OPENAI_NOT_CONFIGURED" ? 503 : 422;
  return NextResponse.json({ error: messages[code] || "Không thể phân tích video này.", code }, { status });
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    const reel = await resolveFacebookReel(url);
    const token = createDownloadToken(reel.videoUrl);
    const videoResult = {
      title: reel.title,
      description: reel.description,
      image: reel.image,
      sourceUrl: reel.sourceUrl,
      videoUrl: `/api/download?token=${encodeURIComponent(token)}&inline=1`,
      downloadUrl: `/api/download?token=${encodeURIComponent(token)}`,
    };
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ...videoResult,
        status: "video_ready",
        transcript: "",
        prompt: "",
        warning: "Đã lấy được MP4 thật. Chủ website cần cấu hình OpenAI API key để trích lời thoại và tạo prompt.",
      });
    }
    const transcript = await transcribeVideo(reel.videoUrl);
    if (!transcript) throw new Error("TRANSCRIPTION_FAILED");
    const prompt = await createVideoPrompt({ ...reel, transcript });
    return NextResponse.json({
      ...videoResult,
      status: "ready",
      transcript,
      prompt,
    });
  } catch (error) {
    console.error("Analyze failed", error?.message);
    return errorResponse(error);
  }
}
