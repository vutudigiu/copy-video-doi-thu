const OPENAI_BASE = "https://api.openai.com/v1";
const MAX_VIDEO_BYTES = 24 * 1024 * 1024;

function apiKey() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_NOT_CONFIGURED");
  return process.env.OPENAI_API_KEY;
}

async function downloadVideo(videoUrl) {
  const response = await fetch(videoUrl, { cache: "no-store", headers: { "user-agent": "Mozilla/5.0", accept: "video/mp4,video/*" } });
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
  form.append("prompt", "Chép chính xác lời thoại tiếng Việt. Giữ nguyên tên riêng, số liệu, thương hiệu và lời kêu gọi hành động.");
  const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST", headers: { authorization: `Bearer ${apiKey()}` }, body: form,
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI transcription error", data?.error?.code || response.status);
    throw new Error("TRANSCRIPTION_FAILED");
  }
  return (data.text || "").trim();
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  return (response.output || []).flatMap(item => item.content || []).filter(item => item.type === "output_text").map(item => item.text).join("");
}

export async function createVideoPrompt({ transcript, title, description }) {
  const response = await fetch(`${OPENAI_BASE}/responses`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5.6-sol",
      input: `Bạn là chuyên gia reverse-engineering video ngắn. Hãy tạo prompt sản xuất video NGUYÊN BẢN dựa trên cấu trúc tham chiếu, không sao chép nhận diện cá nhân, thương hiệu hay câu chữ độc quyền.

TIÊU ĐỀ: ${title || ""}
MÔ TẢ: ${description || ""}
TRANSCRIPT:
${transcript}

Viết bằng tiếng Việt và bắt buộc có: TỶ LỆ & PHONG CÁCH; NHÂN VẬT; BỐI CẢNH & HÌNH ẢNH THEO TIMECODE; LỜI THOẠI; ÂM THANH & HIỆU ỨNG; CTA; NEGATIVE PROMPT.`,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI responses error", data?.error?.code || response.status);
    throw new Error("PROMPT_GENERATION_FAILED");
  }
  return outputText(data).trim();
}
