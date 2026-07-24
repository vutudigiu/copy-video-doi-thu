import { NextResponse } from "next/server";
import { redeemCreditCode } from "../../../../lib/credits";
import { createLicenseToken, normalizeEmail } from "../../../../lib/security";

export async function POST(request) {
  const { email, code } = await request.json();
  const normalized = normalizeEmail(email);
  const redemption = await redeemCreditCode(normalized, code);
  if (!redemption) {
    return NextResponse.json({ error: "Email hoặc mã không đúng, đã được sử dụng hoặc đã hết hạn." }, { status: 401 });
  }
  const response = NextResponse.json({
    ok: true,
    email: normalized,
    plan: "credits",
    addedCredits: redemption.amount,
    credits: redemption.credits,
  });
  response.cookies.set("vutuai_license", createLicenseToken(normalized), {
    httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 10,
  });
  return response;
}
