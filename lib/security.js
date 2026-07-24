import crypto from "node:crypto";

function secret(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function sign(value, secretName) {
  return crypto.createHmac("sha256", secret(secretName)).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(a || "");
  const right = Buffer.from(b || "");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function adminSessionToken() {
  return sign("vutuai-admin-session-v1", "SESSION_SECRET");
}

export function isAdminSession(token) {
  return safeEqual(token, adminSessionToken());
}

export function activationCode(email) {
  return sign(`lifetime:${normalizeEmail(email)}`, "LICENSE_SECRET").slice(0, 24).toUpperCase();
}

export function verifyActivationCode(email, code) {
  return safeEqual((code || "").trim().toUpperCase(), activationCode(email));
}

export function createLicenseToken(email) {
  const payload = Buffer.from(JSON.stringify({
    email: normalizeEmail(email),
    plan: "credits",
    issuedAt: Date.now(),
  })).toString("base64url");
  return `${payload}.${sign(payload, "LICENSE_SECRET")}`;
}

export function readLicenseToken(token = "") {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, "LICENSE_SECRET"))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.plan === "credits" && data.email ? data : null;
  } catch {
    return null;
  }
}
