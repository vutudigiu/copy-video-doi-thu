import { NextResponse } from "next/server";
import { resolveFacebookReel } from "../../../lib/facebook";
import { transcribeVideo } from "../../../lib/openai-video";
import { refundCredit, reserveCredit } from "../../../lib/credits";
import { readLicenseToken } from "../../../lib/security";

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
    CREDITS_REQUIRED: "Bạn đã dùng hết credit. Hãy mua thêm 100 credit để tiếp tục.",
    TRIAL_USED: "Bạn đã dùng hết 1 video miễn phí. Hãy mua gói 100 credit để tiếp tục.",
  };
  const status = code === "INVALID_FACEBOOK_URL" ? 400
    : code === "OPENAI_NOT_CONFIGURED" ? 503
      : ["CREDITS_REQUIRED", "TRIAL_USED"].includes(code) ? 402 : 422;
  return NextResponse.json({ error: messages[code] || "Không thể lấy lời thoại từ video này.", code }, { status });
}

export async function POST(request) {
  let reservedEmail = null;
  try {
    const { url } = await request.json();
    const license = readLicenseToken(request.cookies.get("vutuai_license")?.value);
    const trialUsed = request.cookies.get("vutuai_trial_used")?.value === "1";

    let creditsRemaining = null;
    if (license) {
      creditsRemaining = await reserveCredit(license.email);
      if (creditsRemaining < 0) throw new Error("CREDITS_REQUIRED");
      reservedEmail = license.email;
    } else if (trialUsed) {
      throw new Error("TRIAL_USED");
    }

    const reel = await resolveFacebookReel(url);
    const transcript = await transcribeVideo(reel.videoUrl);
    if (!transcript) throw new Error("TRANSCRIPTION_FAILED");
    const response = NextResponse.json({
      status: "ready",
      title: reel.title,
      transcript,
      creditsRemaining,
      trialUsed: !license,
    });
    if (!license) {
      response.cookies.set("vutuai_trial_used", "1", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 10,
      });
    }
    return response;
  } catch (error) {
    if (reservedEmail) await refundCredit(reservedEmail);
    console.error("Analyze failed", error?.message);
    return errorResponse(error);
  }
}
