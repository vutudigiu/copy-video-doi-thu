import { NextResponse } from "next/server";
import { getCredits } from "../../../../lib/credits";
import { readLicenseToken } from "../../../../lib/security";

export async function GET(request) {
  const license = readLicenseToken(request.cookies.get("vutuai_license")?.value);
  const credits = license ? await getCredits(license.email) : 0;
  const trialUsed = request.cookies.get("vutuai_trial_used")?.value === "1";
  return NextResponse.json({
    unlocked: Boolean(license),
    email: license?.email || null,
    plan: license?.plan || null,
    credits,
    trialUsed,
  });
}
