import { NextResponse } from "next/server";
import { createLicenseToken, normalizeEmail, verifyActivationCode } from "../../../../lib/security";

export async function POST(request) {
  const { email, code } = await request.json();
  const normalized = normalizeEmail(email);
  if (!verifyActivationCode(normalized, code)) {
    return NextResponse.json({ error: "Email hoặc mã kích hoạt không đúng." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, email: normalized, plan: "lifetime" });
  response.cookies.set("vutuai_license", createLicenseToken(normalized), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 10,
  });
  return response;
}
