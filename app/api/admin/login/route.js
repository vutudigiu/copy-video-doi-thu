import { NextResponse } from "next/server";
import { adminSessionToken } from "../../../../lib/security";

export async function POST(request) {
  const { password } = await request.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Mật khẩu quản trị không đúng." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("vutuai_admin", adminSessionToken(), {
    httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 60 * 60 * 8,
  });
  return response;
}
