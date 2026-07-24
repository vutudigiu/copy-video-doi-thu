const OPENAI_BASE = "https://api.openai.com/v1";
const MAX_VIDEO_BYTES = 24 * 1024 * 1024;

function apiKey() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
  return process.env.OPENAI_API_KEY;
}

async function downloadVideo(videoUrl) {
  const response = await fetch(videoUrl, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0", accept: "video/mp4,video/*" },
  });
  if (!response.ok) throw new Error("VIDEO_DOWNLOAD_FAILED");
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_VIDEO_BYTES) throw new Error("VIDEO_TOO_LARGE");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_VIDEO_BYTES) throw new Error("VIDEO_TOO_LARGE");
  return new Blob([buffer], { type: response.headers.get("content-type") || "video/mp4" });
}

export async function transcribeVideo(videoUrl) {
  const form = new FormData();
  form.append("file", await downloadVideo(videoUrl), "facebook-reel.mp4");
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe");
  form.append("language", "vi");
  form.append("response_format", "json");
  form.append("prompt", "Chép chính xác toàn bộ lời thoại tiếng Việt. Giữ nguyên tên riêng, số liệu, thương hiệu và lời kêu gọi hành động.");

  const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey()}` },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) {
    const code = data?.error?.code;
    console.error("OpenAI transcription error", code || response.status);
    if (code === "insufficient_quota") throw new Error("OPENAI_BILLING_REQUIRED");
    if (code === "invalid_api_key") throw new Error("OPENAI_KEY_INVALID");
    throw new Error("TRANSCRIPTION_FAILED");
  }
  return (data.text || "").trim();
}
