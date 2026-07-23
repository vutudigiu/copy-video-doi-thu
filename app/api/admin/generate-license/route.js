import { NextResponse } from "next/server";
import { activationCode, isAdminSession, normalizeEmail } from "../../../../lib/security";

export async function POST(request) {
  if (!isAdminSession(request.cookies.get("vutuai_admin")?.value)) {
    return NextResponse.json({ error: "Phiên quản trị đã hết hạn." }, { status: 401 });
  }
  const { email } = await request.json();
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ error: "Email khách hàng không hợp lệ." }, { status: 400 });
  }
  return NextResponse.json({ email: normalized, code: activationCode(normalized), plan: "Trọn đời" });
}
