"use client";

import { useState } from "react";
import { Check, Clipboard, KeyRound, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import "../admin.css";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [license, setLicense] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function login(e) {
    e.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error);
    setLoggedIn(true); setPassword("");
  }

  async function generate(e) {
    e.preventDefault(); setLoading(true); setError(""); setLicense(null);
    const response = await fetch("/api/admin/generate-license", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error);
      if (response.status === 401) setLoggedIn(false);
      return;
    }
    setLicense(data);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(license.code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="admin-shell">
      <section className="admin-card">
        <div className="admin-brand"><span><ShieldCheck /></span><div><strong>VŨ TƯ AI</strong><small>TRANG QUẢN TRỊ VIÊN</small></div></div>
        {!loggedIn ? (
          <>
            <div className="admin-heading"><LockKeyhole/><h1>Đăng nhập quản trị</h1><p>Chỉ chủ website mới có quyền tạo mã kích hoạt.</p></div>
            <form onSubmit={login}>
              <label>Mật khẩu quản trị</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus placeholder="Nhập mật khẩu bảo mật" />
              {error && <div className="admin-error">{error}</div>}
              <button disabled={loading}><LogIn/> {loading ? "Đang kiểm tra..." : "Đăng nhập"}</button>
            </form>
          </>
        ) : (
          <>
            <div className="admin-heading"><KeyRound/><h1>Cộng credit khách hàng</h1><p>Nhập đúng email khách đã thanh toán để tạo mã cộng 100 credit.</p></div>
            <form onSubmit={generate}>
              <label>Email khách hàng</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="khachhang@gmail.com" />
              {error && <div className="admin-error">{error}</div>}
              <button disabled={loading}><KeyRound/> {loading ? "Đang tạo..." : "Tạo mã 100 credit"}</button>
            </form>
            {license && <div className="license-result">
              <span>MÃ CỘNG 100 CREDIT • DÙNG MỘT LẦN</span>
              <strong>{license.code}</strong>
              <small>Cấp cho: {license.email}</small>
              <button onClick={copyCode}>{copied ? <Check/> : <Clipboard/>} {copied ? "Đã sao chép" : "Sao chép mã"}</button>
              <p>Gửi email và mã này cho khách qua Zalo. Mã chỉ dùng một lần, đúng email và hết hạn sau 30 ngày.</p>
            </div>}
          </>
        )}
      </section>
    </main>
  );
}
