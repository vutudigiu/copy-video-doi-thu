import { NextResponse } from "next/server";
import { readLicenseToken } from "../../../../lib/security";

export async function GET(request) {
  const license = readLicenseToken(request.cookies.get("vutuai_license")?.value);
  return NextResponse.json({
    unlocked: Boolean(license),
    email: license?.email || null,
    plan: license?.plan || null,
  });
}
