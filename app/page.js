"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, Check, ChevronDown, Clipboard, Download, ExternalLink,
  FileText, Film, Link2, LoaderCircle, Play, Search, Sparkles, WandSparkles
} from "lucide-react";

const SAMPLE_URL = "https://www.facebook.com/share/r/1DgHrgNvWv/";

const sampleTranscript = `[00:00–00:03] HOOK
“Bạn có đang làm nội dung mỗi ngày nhưng video vẫn không có người xem?”

[00:04–00:11] NỖI ĐAU
“Vấn đề không nằm ở việc bạn thiếu ý tưởng. Vấn đề là bạn chưa có một cấu trúc đủ mạnh để giữ người xem lại.”

[00:12–00:22] GIẢI PHÁP
“Hãy bắt đầu bằng một câu hỏi chạm đúng nỗi đau, sau đó đưa ra một góc nhìn bất ngờ và kết thúc bằng một hành động thật đơn giản.”

[00:23–00:30] CTA
“Lưu video này lại và thử công thức đó cho video tiếp theo của bạn.”`;

const samplePrompt = `TỶ LỆ & PHONG CÁCH
Video dọc 9:16, 1080×1920, 30 giây. Phong cách social-first, nhịp nhanh, chân thực, ánh sáng mềm, tương phản cao.

NHÂN VẬT
Một creator Việt Nam 28–35 tuổi, trang phục tối giản màu trung tính, năng lượng tự tin và gần gũi. Nhìn thẳng vào camera, cử chỉ tay tự nhiên.

BỐI CẢNH & HÌNH ẢNH
• 0–3s: Cận cảnh khuôn mặt, zoom-in nhẹ. Text lớn: “VIDEO KHÔNG CÓ VIEW?”
• 4–11s: Trung cảnh tại bàn làm việc, màn hình phía sau có biểu đồ lượt xem thấp.
• 12–22s: Chuyển sang 3 cut nhanh minh họa: Hook → Góc nhìn → Hành động.
• 23–30s: Trở về cận cảnh; nhân vật chỉ vào nút lưu ở cạnh màn hình.

LỜI THOẠI
“Bạn có đang làm nội dung mỗi ngày nhưng video vẫn không có người xem? Vấn đề không nằm ở việc bạn thiếu ý tưởng. Vấn đề là bạn chưa có một cấu trúc đủ mạnh để giữ người xem lại. Hãy bắt đầu bằng một câu hỏi chạm đúng nỗi đau, sau đó đưa ra một góc nhìn bất ngờ và kết thúc bằng một hành động thật đơn giản. Lưu video này lại và thử công thức đó cho video tiếp theo của bạn.”

ÂM THANH & HIỆU ỨNG
Nhạc nền electronic tối giản 105 BPM, giảm -16 dB dưới giọng nói. Whoosh ở mỗi chuyển cảnh; pop sound khi text xuất hiện. Auto-caption chữ trắng, từ khóa màu vàng chanh.

CTA
Khung cuối 2 giây: “LƯU LẠI • ÁP DỤNG NGAY”. Thêm animation bookmark nảy nhẹ.

NEGATIVE PROMPT
Không watermark, không logo thương hiệu, không méo tay, không text lỗi, không chuyển động giật, không sao chép khuôn mặt hoặc nhận diện cá nhân từ video tham chiếu.`;

function CopyButton({ text, label = "Sao chép" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return <button className="copy-btn" onClick={copy}>{done ? <Check size={15}/> : <Clipboard size={15}/>} {done ? "Đã chép" : label}</button>;
}

export default function Home() {
  const [url, setUrl] = useState(SAMPLE_URL);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tab, setTab] = useState("transcript");

  const ready = useMemo(() => Boolean(result), [result]);

  async function analyze() {
    setLoading(true); setError(""); setResult(null); setTranscript(""); setPrompt("");
    try {
      if (!/^https?:\/\/(www\.)?(facebook\.com|fb\.watch)\//i.test(url)) {
        throw new Error("Vui lòng nhập một đường link Facebook hợp lệ.");
      }
      await new Promise(resolve => setTimeout(resolve, 1200));
      setResult({
        status: "blocked",
        title: "Facebook Reel — bản phân tích mẫu",
        message: "Facebook yêu cầu phiên đăng nhập để đọc video từ đường link chia sẻ này.",
        sourceUrl: url,
      });
      setTranscript(sampleTranscript);
      setPrompt(samplePrompt);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <main>
      <header>
        <a className="brand" href="#"><span className="brand-mark"><Play fill="currentColor" size={15}/></span><span>Copy<span>Video</span></span></a>
        <nav><a href="#tool">Công cụ</a><a href="#workflow">Cách hoạt động</a><a href="#faq">Lưu ý</a></nav>
        <div className="status-pill"><i/> AI Studio</div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={14}/> Video Intelligence Workspace</div>
        <h1>Biến video đối thủ thành<br/><em>công thức sáng tạo.</em></h1>
        <p>Dán link Facebook Reel. Nhận video MP4, toàn bộ lời thoại và prompt tái tạo chi tiết — trong một workspace duy nhất.</p>
        <div className="trust-row"><span><Check/> Không watermark thêm</span><span><Check/> Prompt tiếng Việt</span><span><Check/> Tối ưu video dọc 9:16</span></div>
      </section>

      <section id="tool" className="workspace">
        <div className="workspace-head">
          <div><span className="step">01</span><div><h2>Phân tích Facebook Reel</h2><p>Dán đường link công khai để bắt đầu</p></div></div>
          <span className="secure"><i/> Xử lý bảo mật</span>
        </div>
        <div className="input-wrap">
          <Link2 size={21}/>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.facebook.com/reel/..." />
          <button onClick={analyze} disabled={loading || !url}>{loading ? <LoaderCircle className="spin" size={18}/> : <Search size={18}/>} {loading ? "Đang đọc video..." : "Phân tích video"} <ArrowRight size={17}/></button>
        </div>
        <div className="sample"><span>LINK MẪU</span><button onClick={() => setUrl(SAMPLE_URL)}>facebook.com/share/r/1DgHrgNvWv/ <ExternalLink size={12}/></button></div>
        {error && <div className="error">{error}</div>}

        {!ready ? (
          <div className="empty">
            <div className="empty-icon"><Film/></div>
            <h3>Kết quả phân tích sẽ xuất hiện ở đây</h3>
            <p>Hệ thống sẽ tách video, lời thoại và cấu trúc kịch bản theo từng cảnh.</p>
            <div className="mini-flow"><span><Download/> MP4</span><b/><span><FileText/> Transcript</span><b/><span><WandSparkles/> AI Prompt</span></div>
          </div>
        ) : (
          <div className="results">
            {result.status === "blocked" && <div className="notice"><strong>Facebook giới hạn truy cập tự động.</strong> Bản mẫu bên dưới minh họa chính xác trải nghiệm sản phẩm; để lấy nội dung thật, Reel cần ở chế độ công khai và cho phép xem không đăng nhập.</div>}
            <div className="video-card">
              <div className="preview" style={result.image ? {backgroundImage:`url(${result.image})`} : {}}>
                {!result.image && <><div className="noise"/><div className="play"><Play fill="currentColor"/></div><span>VIDEO PREVIEW</span></>}
              </div>
              <div className="video-info">
                <span className="tag">FACEBOOK REEL</span>
                <h3>{result.title || "Video tham chiếu"}</h3>
                <p>{result.status === "ready" ? "Đã tìm thấy luồng video công khai." : "Đang dùng chế độ trình diễn do Facebook yêu cầu đăng nhập."}</p>
                {result.videoUrl ? <a className="download" href={result.videoUrl} download><Download size={17}/> Tải video MP4</a> : <a className="download" href={result.sourceUrl || url} target="_blank" rel="noreferrer"><ExternalLink size={17}/> Mở video gốc</a>}
              </div>
            </div>

            <div className="content-card">
              <div className="tabs">
                <button className={tab === "transcript" ? "active" : ""} onClick={()=>setTab("transcript")}><FileText size={16}/> Lời thoại</button>
                <button className={tab === "prompt" ? "active" : ""} onClick={()=>setTab("prompt")}><WandSparkles size={16}/> Prompt tái tạo</button>
                <span>{tab === "transcript" ? transcript.length : prompt.length} ký tự</span>
              </div>
              <div className="editor-head"><div><i/>{tab === "transcript" ? "TRANSCRIPT • TIẾNG VIỆT" : "MASTER PROMPT • VIDEO 9:16"}</div><CopyButton text={tab === "transcript" ? transcript : prompt}/></div>
              <textarea value={tab === "transcript" ? transcript : prompt} onChange={e => tab === "transcript" ? setTranscript(e.target.value) : setPrompt(e.target.value)} />
              <div className="editor-foot"><span>Có thể chỉnh sửa trực tiếp</span><button onClick={()=>setTab(tab === "transcript" ? "prompt" : "transcript")}>{tab === "transcript" ? "Xem prompt tái tạo" : "Xem lời thoại"} <ArrowRight size={14}/></button></div>
            </div>
          </div>
        )}
      </section>

      <section id="workflow" className="workflow">
        <span className="section-kicker">WORKFLOW</span><h2>Một link. Ba tài sản sáng tạo.</h2>
        <div className="cards">
          <article><span>01</span><div className="icon"><Download/></div><h3>Video MP4</h3><p>Tải bản video công khai về máy để nghiên cứu nhịp dựng và bố cục.</p></article>
          <article><span>02</span><div className="icon"><FileText/></div><h3>Toàn bộ lời thoại</h3><p>Transcript có mốc thời gian, chia rõ Hook, nội dung chính và CTA.</p></article>
          <article><span>03</span><div className="icon"><WandSparkles/></div><h3>Prompt tái tạo</h3><p>Mô tả nhân vật, cảnh quay, thoại, hiệu ứng, âm thanh và CTA.</p></article>
        </div>
      </section>

      <section id="faq" className="ethics">
        <div><Sparkles/><span>CREATOR NOTE</span></div>
        <h2>Phân tích công thức.<br/>Tạo phiên bản nguyên bản của bạn.</h2>
        <p>Công cụ được thiết kế để nghiên cứu cấu trúc nội dung công khai. Hãy thay đổi nhân vật, góc nhìn, hình ảnh và thông điệp; chỉ tải hoặc sử dụng nội dung khi bạn có quyền.</p>
      </section>

      <footer><div className="brand"><span className="brand-mark"><Play fill="currentColor" size={14}/></span><span>Copy<span>Video</span></span></div><p>© 2026 Video Intelligence Studio</p><button>Tiếng Việt <ChevronDown size={13}/></button></footer>
    </main>
  );
}
